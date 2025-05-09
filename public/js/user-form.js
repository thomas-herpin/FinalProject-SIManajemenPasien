// Check authentication
if (!AuthHandler.isAuthenticated()) {
  window.location.href = "/auth.html";
}

const appointmentSummary = document.getElementById('appointmentSummary');
const appointmentForm = document.getElementById('appointmentForm');
const userIdField = document.getElementById('userId');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const phoneField = document.getElementById('phone');
const messageField = document.getElementById('message');
const submitButton = document.getElementById('submitAppointment');
const backButton = document.getElementById('backButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const popup = document.getElementById('popup');
const errorPopup = document.getElementById('errorPopup');
const errorMessage = document.getElementById('errorMessage');

const profileBtn = document.querySelector('.profile-btn');
const dropdownMenu = document.querySelector('.dropdown-menu');

if (profileBtn && dropdownMenu) {
  profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
  });
  
  document.addEventListener('click', function() {
    if (dropdownMenu.style.display === 'flex') {
      dropdownMenu.style.display = 'none';
    }
  });
  
  dropdownMenu.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

const params = new URLSearchParams(window.location.search);
const doctorId = params.get('doctorId') || params.get('id');
const doctorName = params.get('doctorName');
const specialty = params.get('specialty');
const date = params.get('date');
const time = params.get('time');

if (!doctorId || !doctorName || !date || !time) {
  window.location.href = '/dokter';
}

document.addEventListener('DOMContentLoaded', function() {
  setAppointmentSummary();
  getUserProfile();
  appointmentForm.addEventListener('submit', submitAppointment);
  backButton.addEventListener('click', goBack);
});

function setAppointmentSummary() {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  
  appointmentSummary.innerHTML = `
    <h3>Ringkasan Janji Temu</h3>
    <p><strong>Dokter:</strong> ${doctorName}</p>
    <p><strong>Spesialisasi:</strong> ${specialty || 'Umum'}</p>
    <p><strong>Tanggal:</strong> ${formattedDate}</p>
    <p><strong>Waktu:</strong> ${formattedTime}</p>
  `;
}

function formatDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}
async function getUserProfile() {
  try {
    showLoading(true);
    const userData = await AuthHandler.getUserData();
    
    if (!userData || !userData.id) {
      showLoading(false);
      AuthHandler.redirectToLogin();
      return;
    }
    
    userIdField.value = userData.id;
    nameField.value = userData.name || '';
    emailField.value = userData.email || '';
    phoneField.value = userData.phone || userData.id; 
    
    showLoading(false);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    showLoading(false);
    showErrorPopup('Terjadi kesalahan saat memuat data pengguna. Silakan coba lagi.');
  }
}

async function submitAppointment(event) {
  event.preventDefault();
  
  if (!userIdField.value) {
    showErrorPopup('Anda harus login untuk membuat janji temu.');
    return;
  }
  
  try {
    showLoading(true);
    
    const appointmentData = {
      userId: userIdField.value,
      doctorId: doctorId,
      patientName: nameField.value,
      patientEmail: emailField.value,
      patientPhone: phoneField.value,
      appointmentDate: date,
      appointmentTime: time,
      notes: messageField.value,
      status: 'pending'
    };
    
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Server error');
    }
    
    const result = await response.json();
    
    showLoading(false);
    showSuccessPopup();
  } catch (error) {
    console.error('Error booking appointment:', error);
    showLoading(false);
    showErrorPopup(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
  }
}

function showSuccessPopup() {
  popup.style.display = 'flex';
}

function closePopup() {
  popup.style.display = 'none';
  window.location.href = '/dashboard';
}

function showErrorPopup(message) {
  errorMessage.textContent = message || 'Terjadi kesalahan. Silakan coba lagi.';
  errorPopup.style.display = 'flex';
}

function closeErrorPopup() {
  errorPopup.style.display = 'none';
}

function goBack() {
  window.history.back();
}

function showLoading(show) {
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
  }
}

window.onclick = function(event) {
  if (event.target === popup) {
    closePopup();
  }
  if (event.target === errorPopup) {
    closeErrorPopup();
  }
};