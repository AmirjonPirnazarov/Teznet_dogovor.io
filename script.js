document.addEventListener('DOMContentLoaded', function() {
  let currentStep = 1;
  const totalSteps = 4;
  let signaturePad;
  const formData = {
    documents: {
      front: null,
      back: null
    },
    contractNumber: null,
    personalData: {},
    address: {},
    signature: null
  };

  // Initialize signature pad
  function initSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
  }

  // Handle window resize for signature pad
  window.addEventListener('resize', function() {
    if (signaturePad) {
      const canvas = document.getElementById('signaturePad');
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      signaturePad.clear();
    }
  });

  // Clear signature button
  document.getElementById('clearSignature').addEventListener('click', function() {
    signaturePad.clear();
  });

  // Initialize phone input mask
  const phoneInput = document.getElementById('phone');
  phoneInput.addEventListener('input', function(e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
  });

  // Handle file uploads and previews
  function handleFileUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.style.backgroundImage = `url(${e.target.result})`;
          formData.documents[inputId === 'passportFront' ? 'front' : 'back'] = file;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  handleFileUpload('passportFront', 'previewFront');
  handleFileUpload('passportBack', 'previewBack');

  // Navigation functions
  function updateSteps() {
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNum = index + 1;
      if (stepNum === currentStep) {
        step.classList.add('active');
      } else if (stepNum < currentStep) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else {
        step.classList.remove('active', 'completed');
      }
    });

    document.querySelectorAll('.form-step').forEach((form, index) => {
      if (index + 1 === currentStep) {
        form.classList.add('active');
      } else {
        form.classList.remove('active');
      }
    });
  }

  function validateStep() {
    switch(currentStep) {
      case 1:
        return formData.documents.front && formData.documents.back;

      case 2:
        const contractNumber = document.getElementById('contractNumber').value;
        const agentName = document.getElementById('agentName').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        
        if (!contractNumber || !agentName || !phone || !email) return false;
        
        formData.contractNumber = contractNumber;
        formData.personalData = { agentName, phone, email };
        return true;

      case 3:
        const city = document.getElementById('city').value;
        const street = document.getElementById('street').value;
        const house = document.getElementById('house').value;
        const apartment = document.getElementById('apartment').value;
        
        if (!city || !street || !house || !apartment) return false;
        
        formData.address = { city, street, house, apartment };
        return true;

      case 4:
        if (signaturePad.isEmpty()) {
          alert('Пожалуйста, поставьте подпись');
          return false;
        }
        formData.signature = signaturePad.toDataURL();
        return document.getElementById('agreementCheckbox').checked;

      default:
        return false;
    }
  }

  function updateReviewPage() {
    document.getElementById('reviewContractNumber').textContent = `Номер договора: ${formData.contractNumber}`;
    document.getElementById('reviewAgentName').textContent = `ФИО торгового агента: ${formData.personalData.agentName}`;
    document.getElementById('reviewPhone').textContent = `Телефон: ${formData.personalData.phone}`;
    document.getElementById('reviewEmail').textContent = `Email: ${formData.personalData.email}`;
    document.getElementById('reviewAddress').textContent = 
      `Адрес: г. ${formData.address.city}, ул. ${formData.address.street}, д. ${formData.address.house}, кв. ${formData.address.apartment}`;
  }

  // Handle next/prev navigation
  document.querySelectorAll('.btn-next').forEach(button => {
    button.addEventListener('click', function() {
      if (validateStep()) {
        currentStep++;
        updateSteps();
        if (currentStep === 4) {
          updateReviewPage();
          if (!signaturePad) {
            initSignaturePad();
          }
        }
      } else {
        alert('Пожалуйста, заполните все обязательные поля');
      }
    });
  });

  document.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', function() {
      currentStep--;
      updateSteps();
    });
  });

  // Handle agreement checkbox
  document.getElementById('agreementCheckbox').addEventListener('change', function() {
    document.getElementById('submitContract').disabled = !this.checked;
  });

  // Handle final submission
  document.getElementById('submitContract').addEventListener('click', async function(e) {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('contractNumber', formData.contractNumber);
      formDataToSend.append('personalData', JSON.stringify(formData.personalData));
      formDataToSend.append('address', JSON.stringify(formData.address));
      formDataToSend.append('passportFront', formData.documents.front);
      formDataToSend.append('passportBack', formData.documents.back);
      formDataToSend.append('signature', formData.signature);

      // Example API call (replace with your actual endpoint)
      const response = await fetch('https://api.teznet.com/create-contract', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Договор успешно создан! Мы свяжемся с вами в ближайшее время.');
        window.location.href = 'https://teznet.com/success';
      } else {
        throw new Error('Ошибка при создании договора');
      }

    } catch (error) {
      alert('Произошла ошибка при создании договора. Пожалуйста, попробуйте позже.');
      console.error('Error:', error);
    }
  });

  // Initialize the first step
  updateSteps();
});