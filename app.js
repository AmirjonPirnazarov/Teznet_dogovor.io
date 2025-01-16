let stream;
let currentPhotoSide = 'front'; // Track which photo we're taking

// Login functionality
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (username && password) {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('contract-container').classList.remove('hidden');
    initializeCamera('front'); // Start with front photo
  }
}

// Camera initialization
async function initializeCamera(side) {
  try {
    // Stop previous stream if exists
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: 'environment', // This requests the rear camera
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Show only the current video element
    document.getElementById('frontVideo').parentElement.classList.add('hidden');
    document.getElementById('backVideo').parentElement.classList.add('hidden');
    document.getElementById(`${side}Video`).parentElement.classList.remove('hidden');
    
    const videoElement = document.getElementById(`${side}Video`);
    videoElement.srcObject = stream;
    videoElement.play();

    // Update instructions based on current side
    const instructions = document.getElementById('photoInstructions');
    instructions.textContent = `Please take a photo of the ${side} side of the passport`;
    
    currentPhotoSide = side;
  } catch (err) {
    console.error('Error accessing camera:', err);
    alert('Unable to access camera. Please ensure camera permissions are granted and you are using a secure (HTTPS) connection.');
    
    // Try fallback to any available camera
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      const videoElement = document.getElementById(`${side}Video`);
      videoElement.srcObject = stream;
      videoElement.play();
    } catch (fallbackErr) {
      console.error('Fallback camera error:', fallbackErr);
      alert('Could not access any camera. Please check your device settings.');
    }
  }
}

// Photo capture
function takePhoto() {
  const video = document.getElementById(`${currentPhotoSide}Video`);
  const canvas = document.getElementById(`${currentPhotoSide}Canvas`);
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Show canvas, hide video
  canvas.classList.remove('hidden');
  video.classList.add('hidden');

  // If front photo was taken, switch to back
  if (currentPhotoSide === 'front') {
    currentPhotoSide = 'back';
    initializeCamera('back');
  } else {
    // Both photos taken, enable contract creation
    document.getElementById('createContract').disabled = false;
    // Stop the camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
}

// Process contract creation
async function processContract() {
  // Gather all contract data
  const contractData = {
    phoneNumber: document.getElementById('phoneNumber').value,
    address: document.getElementById('address').value,
    tariff: document.getElementById('tariff').value,
    router: document.getElementById('router').value,
    contractNumber: document.getElementById('contractNumber').value,
    photos: {
      front: document.getElementById('frontCanvas').toDataURL('image/jpeg'),
      back: document.getElementById('backCanvas').toDataURL('image/jpeg')
    }
  };

  // Validate contract number
  if (!contractData.contractNumber) {
    alert('Please enter a contract number');
    return;
  }

  try {
    // Create JSON file and trigger download
    const jsonData = JSON.stringify(contractData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${contractData.contractNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Create photo files and trigger downloads
    ['front', 'back'].forEach(side => {
      const photoBlob = dataURLtoBlob(contractData.photos[side]);
      const photoUrl = window.URL.createObjectURL(photoBlob);
      const photoLink = document.createElement('a');
      photoLink.href = photoUrl;
      photoLink.download = `${contractData.contractNumber}-${side}.jpg`;
      document.body.appendChild(photoLink);
      photoLink.click();
      document.body.removeChild(photoLink);
      window.URL.revokeObjectURL(photoUrl);
    });

    alert('Contract and photos saved successfully!');
    
  } catch (error) {
    console.error('Error processing contract:', error);
    alert('Error saving contract. Please try again.');
  }
}

// Utility function to convert base64 to blob
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Cleanup function
window.onbeforeunload = function() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}