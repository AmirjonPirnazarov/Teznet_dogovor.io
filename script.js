document.addEventListener('DOMContentLoaded', function() {
  let currentStep = 1;
  const totalSteps = 5;
  const formData = {
    personalData: {},
    tariff: null,
    address: {},
    documents: {
      front: null,
      back: null
    }
  };

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

  // Handle tariff selection
  const tariffButtons = document.querySelectorAll('.btn-select-tariff');
  tariffButtons.forEach(button => {
    button.addEventListener('click', function() {
      const selectedTariff = this.dataset.tariff;
      formData.tariff = selectedTariff;
      
      // Update UI
      document.querySelectorAll('.tariff-card').forEach(card => {
        card.classList.remove('selected');
      });
      this.closest('.tariff-card').classList.add('selected');
      
      // Enable next button
      document.querySelector('#step2 .btn-next').disabled = false;
    });
  });

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
        const fullName = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        
        if (!fullName || !phone || !email) return false;
        
        formData.personalData = { fullName, phone, email };
        return true;

      case 2:
        return formData.tariff !== null;

      case 3:
        const city = document.getElementById('city').value;
        const street = document.getElementById('street').value;
        const house = document.getElementById('house').value;
        const apartment = document.getElementById('apartment').value;
        
        if (!city || !street || !house || !apartment) return false;
        
        formData.address = { city, street, house, apartment };
        return true;

      case 4:
        return formData.documents.front && formData.documents.back;

      case 5:
        return document.getElementById('agreementCheckbox').checked;

      default:
        return false;
    }
  }

  // Handle next/prev navigation
  document.querySelectorAll('.btn-next').forEach(button => {
    button.addEventListener('click', function() {
      if (validateStep()) {
        currentStep++;
        updateSteps();
        if (currentStep === 5) {
          updateReviewPage();
        }
      }
    });
  });

  document.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', function() {
      currentStep--;
      updateSteps();
    });
  });

  function updateReviewPage() {
    document.getElementById('reviewName').textContent = `ФИО: ${formData.personalData.fullName}`;
    document.getElementById('reviewPhone').textContent = `Телефон: ${formData.personalData.phone}`;
    document.getElementById('reviewEmail').textContent = `Email: ${formData.personalData.email}`;
    document.getElementById('reviewTariff').textContent = `Тариф: ${formData.tariff}`;
    document.getElementById('reviewAddress').textContent = 
      `Адрес: г. ${formData.address.city}, ул. ${formData.address.street}, д. ${formData.address.house}, кв. ${formData.address.apartment}`;
  }

  // Handle agreement checkbox
  document.getElementById('agreementCheckbox').addEventListener('change', function() {
    document.getElementById('submitContract').disabled = !this.checked;
  });

  // Handle final submission
  document.getElementById('submitContract').addEventListener('click', async function(e) {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      // Here you would typically send the data to your server
      const formDataToSend = new FormData();
      formDataToSend.append('personalData', JSON.stringify(formData.personalData));
      formDataToSend.append('tariff', formData.tariff);
      formDataToSend.append('address', JSON.stringify(formData.address));
      formDataToSend.append('passportFront', formData.documents.front);
      formDataToSend.append('passportBack', formData.documents.back);

      // Example API call (replace with your actual endpoint)
      const response = await fetch('https://api.teznet.com/submit-contract', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Договор успешно отправлен! Мы свяжемся с вами в ближайшее время.');
        // Reset form or redirect to success page
        window.location.href = 'https://teznet.com/success';
      } else {
        throw new Error('Ошибка при отправке договора');
      }

    } catch (error) {
      alert('Произошла ошибка при отправке договора. Пожалуйста, попробуйте позже.');
      console.error('Error:', error);
    }
  });

  // Initialize the first step
  updateSteps();
});