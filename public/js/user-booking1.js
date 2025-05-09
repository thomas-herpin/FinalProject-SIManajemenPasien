document.addEventListener('DOMContentLoaded', function() {
  if (!AuthHandler.isAuthenticated()) {
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
    return;
  }
  initializeBookingPage();
});

let selectedDoctorId = null;
let selectedDoctor = null;
let selectedDate = null;
let selectedTime = null;
let confirmButton = null;

function initializeBookingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  selectedDoctorId = urlParams.get('id') || urlParams.get('doctorId');
  if (!selectedDoctorId) {
    alert('No doctor selected. Redirecting to doctors list.');
    window.location.href = '/dokter';
    return;
  }
  confirmButton = document.getElementById('confirmAppointment');
  setupInfoTabs();
  setupProfileDropdown();
  fetchDoctorDetails(selectedDoctorId);
}

function setupProfileDropdown() {
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
}

async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    if (response.status === 401) {
      AuthHandler.clearAuth();
      window.location.href = '/auth';
      return null;
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
      return await response.json();
    }
    return response;
  } catch (error) {
    throw error;
  }
}

function setupInfoTabs() {
  const tabs = document.querySelectorAll('.info-tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      contents.forEach(content => content.style.display = 'none');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId + 'Content').style.display = 'block';
    });
  });
}

async function fetchDoctorDetails(doctorId) {
  try {
    const loading = document.getElementById('loading');
    const doctorDetails = document.getElementById('doctorDetails');
    const doctorAdditionalInfo = document.getElementById('doctorAdditionalInfo');
    if (loading) loading.style.display = 'flex';
    if (doctorDetails) doctorDetails.style.display = 'none';
    if (doctorAdditionalInfo) doctorAdditionalInfo.style.display = 'none';
    
    let response = await fetch(`/api/doctors/${doctorId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn(`Doctor-specific endpoint failed with status ${response.status}. Trying fallback...`);
      response = await fetch(`/api/doctors/${doctorId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch doctor: ${response.status} ${response.statusText}`);
    }
    
    const doctor = await response.json();
    if (!doctor || Object.keys(doctor).length === 0 || doctor.message === 'Doctor not found') {
      throw new Error('Doctor not found or empty data');
    }
    
    console.log('Doctor data received:', doctor);
    
    const mockDoctorData = getMockDoctorData(doctorId);
    if (!doctor.education && mockDoctorData && mockDoctorData.education) {
      doctor.education = mockDoctorData.education;
    }
    if (!doctor.experience && mockDoctorData && mockDoctorData.experience) {
      doctor.experience = mockDoctorData.experience;
    }
    if (!doctor.specialties && mockDoctorData && mockDoctorData.specialties) {
      doctor.specialties = mockDoctorData.specialties;
    }
    
    selectedDoctor = doctor;
    updateDoctorInfo(selectedDoctor);
    
    try {
      const schedules = await fetchDoctorSchedules(doctorId);
      const formattedSchedules = formatSchedulesForCalendar(schedules || []);
      initializeCalendar(formattedSchedules);
    } catch (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      const formattedSchedules = formatSchedulesForCalendar(doctor.schedules || []);
      initializeCalendar(formattedSchedules);
    }
    
    if (loading) loading.style.display = 'none';
    if (doctorDetails) doctorDetails.style.display = 'flex';
    if (doctorAdditionalInfo) doctorAdditionalInfo.style.display = 'block';
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    const mockDoctor = getMockDoctorData(doctorId);
    if (mockDoctor) {
      selectedDoctor = mockDoctor;
      updateDoctorInfo(mockDoctor);
      const loading = document.getElementById('loading');
      const doctorDetails = document.getElementById('doctorDetails');
      const doctorAdditionalInfo = document.getElementById('doctorAdditionalInfo');
      if (loading) loading.style.display = 'none';
      if (doctorDetails) doctorDetails.style.display = 'flex';
      if (doctorAdditionalInfo) doctorAdditionalInfo.style.display = 'block';
      const mockSchedules = formatSchedulesForCalendar(mockDoctor.schedules?.availableTimes ? mockDoctor.schedules : { availableTimes: {}, dayAvailability: {} });
      initializeCalendar(mockSchedules);
      return;
    } else {
      alert('Failed to load doctor details. Please try again later.');
      window.location.href = '/dokter';
    }
  }
}

function updateDoctorInfo(doctor) {
  const doctorNameEl = document.getElementById('doctorName');
  const doctorSpecialtyEl = document.getElementById('doctorSpecialty');
  const doctorImageEl = document.getElementById('doctorImage');
  const ratingValueEl = document.getElementById('ratingValue');
  const reviewsCountEl = document.getElementById('reviewsCount');
  
  if (!doctor) {
    if (doctorNameEl) doctorNameEl.textContent = 'Doctor Data Unavailable';
    if (doctorSpecialtyEl) doctorSpecialtyEl.textContent = 'N/A';
    return;
  }
  
  let doctorName = '';
  if (doctor.name) {
    doctorName = doctor.name;
  } else if (doctor.full_name) {
    doctorName = doctor.full_name;
  } else if (doctor.firstName && doctor.lastName) {
    doctorName = `${doctor.firstName} ${doctor.lastName}`;
  } else if (doctor.user && doctor.user.name) {
    doctorName = doctor.user.name;
  }
  
  if (doctorName && !doctorName.startsWith('dr.') && !doctorName.startsWith('Dr.')) {
    doctorName = 'dr. ' + doctorName;
  }
  
  if (doctorNameEl) {
    doctorNameEl.textContent = doctorName || 'Unknown Doctor';
  }
  
  if (doctorSpecialtyEl) {
    doctorSpecialtyEl.textContent = doctor.specialty || 'Dokter Umum';
  }
  
  if (doctorImageEl) {
    if (doctor.image_url) {
      doctorImageEl.src = doctor.image_url;
      doctorImageEl.onerror = function() {
        this.src = '../assets/doctor-placeholder.jpg';
      };
    } else {
      doctorImageEl.src = '../assets/doctor-placeholder.jpg';
    }
  }
  
  if (ratingValueEl && reviewsCountEl) {
    const rating = parseFloat(doctor.rating) || 4.5;
    const reviews = parseInt(doctor.review_count, 10) || 120;
    ratingValueEl.textContent = rating.toFixed(1);
    reviewsCountEl.textContent = `(${reviews} ulasan)`;
    updateStarIcons(rating);
  }
  
  populateAdditionalInfo(doctor);
}

function updateStarIcons(rating) {
  const starsContainer = document.getElementById('starRating');
  if (!starsContainer) return;
  starsContainer.innerHTML = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < fullStars; i++) {
    const star = document.createElement('i');
    star.className = 'fas fa-star';
    starsContainer.appendChild(star);
  }
  if (hasHalfStar) {
    const halfStar = document.createElement('i');
    halfStar.className = 'fas fa-star-half-alt';
    starsContainer.appendChild(halfStar);
  }
  for (let i = 0; i < emptyStars; i++) {
    const emptyStar = document.createElement('i');
    emptyStar.className = 'far fa-star';
    starsContainer.appendChild(emptyStar);
  }
}

async function fetchDoctorSchedules(doctorId) {
  try {
    const endpoint = `/api/doctors/${doctorId}/schedules`;
    const response = await fetch(endpoint, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data) {
      throw new Error('Failed to fetch doctor schedules (empty data from API)');
    }
    return formatSchedulesForCalendar(data);
  } catch (error) {
    return { availableTimes: {}, dayAvailability: {} };
  }
}

function formatSchedulesForCalendar(dbSchedules) {
  const result = {
    availableTimes: {},
    dayAvailability: {}
  };
  const today = new Date();
  if (!Array.isArray(dbSchedules) || dbSchedules.length === 0) {
    for (let i = 0; i < 30; i++) {
      const dateLoop = new Date();
      dateLoop.setDate(today.getDate() + i);
      const formattedDate = formatDateForAPI(dateLoop);
      result.dayAvailability[formattedDate] = "unavailable";
    }
    return result;
  }
  const schedulesByConcreteDate = {};
  dbSchedules.forEach(schedule => {
    if (typeof schedule.day_of_week === 'undefined') {
        return;
    }
    for (let i = 0; i < 30; i++) {
        const currentDateInLoop = new Date();
        currentDateInLoop.setDate(today.getDate() + i);
        const currentJSDayOfWeek = currentDateInLoop.getDay();
        let dbDayOfWeek = parseInt(schedule.day_of_week, 10);
        let effectiveJSDayOfWeek = dbDayOfWeek % 7;
        if (currentJSDayOfWeek === effectiveJSDayOfWeek) {
            const formattedDateStr = formatDateForAPI(currentDateInLoop);
            if (!schedulesByConcreteDate[formattedDateStr]) {
                schedulesByConcreteDate[formattedDateStr] = [];
            }
            schedulesByConcreteDate[formattedDateStr].push(schedule); 
        }
    }
  });
  for (let i = 0; i < 30; i++) {
    const dateLoop = new Date();
    dateLoop.setDate(today.getDate() + i);
    const formattedDateStr = formatDateForAPI(dateLoop);
    const daySchedulesFromMap = schedulesByConcreteDate[formattedDateStr] || [];
    if (daySchedulesFromMap.length > 0) {
      const timeSlots = [];
      daySchedulesFromMap.forEach(schedule => {
        const startTime = schedule.start_time;
        const endTime = schedule.end_time;
        if (!startTime || !endTime) {
            return; 
        }
        try {
          const startDateTime = new Date(`${formattedDateStr}T${startTime}`);
          const endDateTime = new Date(`${formattedDateStr}T${endTime}`);
          const intervalMinutes = 30;
          for (let time = new Date(startDateTime); time < endDateTime; time.setMinutes(time.getMinutes() + intervalMinutes)) {
            timeSlots.push(formatTimeForDisplay(time));
          }
        } catch (error) {
        }
      });
      if (timeSlots.length > 0) {
        result.availableTimes[formattedDateStr] = timeSlots;
        result.dayAvailability[formattedDateStr] = timeSlots.length > 5 ? "available" : "limited";
      } else {
        result.dayAvailability[formattedDateStr] = "unavailable";
      }
    } else {
      result.dayAvailability[formattedDateStr] = "unavailable";
    }
  }
  return result;
}

function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeForDisplay(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function populateAdditionalInfo(doctor) {
  const doctorBio = document.getElementById('doctorBio');
  const specialtiesList = document.getElementById('specialtiesList');
  const educationList = document.getElementById('educationList');
  const experienceList = document.getElementById('experienceList');
  
  if (doctorBio) {
    doctorBio.textContent = doctor.bio || 'Dokter ini belum menambahkan biografi.';
  }
  
  if (specialtiesList) {
    specialtiesList.innerHTML = '';
    if (doctor.specializations && Array.isArray(doctor.specializations)) {
      doctor.specializations.forEach(spec => {
        const li = document.createElement('li');
        li.textContent = spec.specialization;
        specialtiesList.appendChild(li);
      });
    } else if (doctor.specialties && Array.isArray(doctor.specialties)) {
      doctor.specialties.forEach(spec => {
        const li = document.createElement('li');
        li.textContent = spec;
        specialtiesList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = doctor.specialty || 'Konsultasi Umum';
      specialtiesList.appendChild(li);
    }
  }
  
  if (educationList) {
    educationList.innerHTML = '';
    if (doctor.education && Array.isArray(doctor.education) && doctor.education.length > 0) {
      doctor.education.forEach(edu => {
        const li = document.createElement('li');
        li.textContent = `${edu.degree} - ${edu.institution} (${edu.year})`;
        educationList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'Informasi pendidikan belum tersedia';
      educationList.appendChild(li);
    }
  }
  
  if (experienceList) {
    experienceList.innerHTML = '';
    if (doctor.experience && Array.isArray(doctor.experience) && doctor.experience.length > 0) {
      doctor.experience.forEach(exp => {
        const li = document.createElement('li');
        li.textContent = `${exp.position} - ${exp.hospital} (${exp.year})`;
        experienceList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'Informasi pengalaman kerja belum tersedia';
      experienceList.appendChild(li);
    }
  }
}

function initializeCalendar(doctorSchedules) {
  if (!confirmButton) {
    confirmButton = document.getElementById('confirmAppointment');
  }
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const scheduleMap = doctorSchedules.availableTimes || {};
  const availability = doctorSchedules.dayAvailability || {};
  if (Object.keys(scheduleMap).length === 0) {
    const demoScheduleMap = {};
    const demoAvailability = {};
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const formattedDate = formatDateForAPI(date);
        if (i % 2 === 0) {
          demoScheduleMap[formattedDate] = ["09:00", "09:30", "10:00", "10:30", "11:00"];
          demoAvailability[formattedDate] = "available";
        } 
        else if (i % 3 === 0) {
          demoScheduleMap[formattedDate] = ["13:00", "13:30"];
          demoAvailability[formattedDate] = "limited";
        }
        else if (i % 7 === 0) {
          demoAvailability[formattedDate] = "unavailable";
        }
      }
    }
    if (Object.keys(scheduleMap).length === 0) {
      Object.assign(scheduleMap, demoScheduleMap);
      Object.assign(availability, demoAvailability);
    }
  }
  renderCalendar(currentYear, currentMonth, scheduleMap, availability);
  document.getElementById('prevMonth').addEventListener('click', () => {
    renderPrevMonth(scheduleMap, availability);
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    renderNextMonth(scheduleMap, availability);
  });
  if (confirmButton) {
    confirmButton.addEventListener('click', proceedToUserForm);
  } else {
  }
}

let displayedMonth = new Date().getMonth();
let displayedYear = new Date().getFullYear();

function renderCalendar(year, month, scheduleMap, availability) {
  displayedMonth = month;
  displayedYear = year;
  if (!confirmButton) {
    confirmButton = document.getElementById('confirmAppointment');
  }
  const monthYear = document.getElementById('monthYear');
  const calendarDates = document.getElementById('calendarDates');
  const timeSlots = document.getElementById('timeSlots');
  const selectedDay = document.getElementById('selectedDay');
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (monthYear) {
    monthYear.innerText = `${monthNames[month]} ${year}`;
  }
  if (calendarDates) {
    calendarDates.innerHTML = "";
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay + 6) % 7;
    for (let i = 0; i < offset; i++) {
      const empty = document.createElement("div");
      calendarDates.appendChild(empty);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const btn = document.createElement("button");
      btn.innerText = day;
      const status = availability[formattedDate];
      if (status === "available") btn.classList.add("available");
      else if (status === "limited") btn.classList.add("limited");
      else if (status === "unavailable") btn.classList.add("unavailable");
      if (status !== "unavailable") {
        btn.addEventListener("click", () => selectDate(formattedDate, btn, scheduleMap));
      } else {
        btn.disabled = true;
      }
      calendarDates.appendChild(btn);
    }
  }
  if (timeSlots) {
    timeSlots.innerHTML = "";
  }
  if (selectedDay) {
    selectedDay.innerText = "Pilih tanggal untuk melihat jadwal";
  }
  if (confirmButton) {
    confirmButton.disabled = true;
  }
}

function renderPrevMonth(scheduleMap, availability) {
  let newMonth = displayedMonth - 1;
  let newYear = displayedYear;
  if (newMonth < 0) {
    newMonth = 11;
    newYear--;
  }
  renderCalendar(newYear, newMonth, scheduleMap, availability);
}

function renderNextMonth(scheduleMap, availability) {
  let newMonth = displayedMonth + 1;
  let newYear = displayedYear;
  if (newMonth > 11) {
    newMonth = 0;
    newYear++;
  }
  renderCalendar(newYear, newMonth, scheduleMap, availability);
}

async function checkSlotAvailability(doctorId, date, slot) {
  try {
    const response = await fetchWithAuth(`/api/appointments/available/${doctorId}?date=${date}`);
    if (!response || !response.availableTimes) {
      return true;
    }
    return response.availableTimes.includes(slot);
  } catch (error) {
    return true;
  }
}

function selectDate(date, btn, scheduleMap) {
  const selectedDay = document.getElementById('selectedDay');
  const timeSlots = document.getElementById('timeSlots');
  const noTimesMessage = document.getElementById('noTimesMessage');
  selectedDate = date;
  const buttons = document.querySelectorAll(".calendar-dates button");
  buttons.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  const [year, month, day] = date.split('-');
  const displayDate = new Date(year, month - 1, day);
  const formattedDate = displayDate.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  if (selectedDay) {
    selectedDay.innerText = `Jadwal Dokter – ${formattedDate}`;
  }
  selectedTime = null;
  if (!confirmButton) {
    confirmButton = document.getElementById('confirmAppointment');
  }
  const slots = scheduleMap[date] || [];
  if (timeSlots) {
    timeSlots.innerHTML = "";
    if (slots.length === 0) {
      if (noTimesMessage) {
        noTimesMessage.style.display = "block";
      } else {
        timeSlots.innerHTML = "<p>Tidak ada jadwal tersedia pada tanggal ini</p>";
      }
      if (confirmButton) confirmButton.disabled = true;
      return;
    }
    if (noTimesMessage) {
      noTimesMessage.style.display = "none";
    }
    slots.forEach(slot => {
      const slotBtn = document.createElement("button");
      slotBtn.innerText = slot;
      slotBtn.addEventListener("click", () => {
        selectedTime = slot;
        document.querySelectorAll(".time-slots button").forEach(b => b.classList.remove("active"));
        slotBtn.classList.add("active");
        if (confirmButton) confirmButton.disabled = false;
      });
      timeSlots.appendChild(slotBtn);
    });
  }
}

function proceedToUserForm() {
  if (!selectedDoctorId || !selectedDate || !selectedTime) {
    alert('Silakan pilih tanggal dan waktu untuk janji temu Anda');
    return;
  }
  const params = new URLSearchParams({
    doctorId: selectedDoctorId,
    doctorName: selectedDoctor?.name || 'Unknown Doctor',
    specialty: selectedDoctor?.specialty || 'Specialist',
    date: selectedDate,
    time: selectedTime
  });
  window.location.href = `/payment?${params.toString()}`;
}

function getMockDoctorData(doctorId) {
  const mockDoctors = [
   
  ];
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  mockDoctors.forEach(doctor => {
    const availableTimes = {};
    const morningSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
    const afternoonSlots = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
    for (let day = 5; day < 10; day++) {
      const date = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const slots = morningSlots.filter(() => Math.random() > 0.3);
      availableTimes[date] = slots;
    }
    for (let day = 15; day < 20; day++) {
      const date = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const slots = afternoonSlots.filter(() => Math.random() > 0.3);
      availableTimes[date] = slots;
    }
    const dayAvailability = {};
    for (let day = 1; day <= 31; day++) {
      const date = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      if (availableTimes[date] && availableTimes[date].length > 3) {
        dayAvailability[date] = "available";
      } else if (availableTimes[date] && availableTimes[date].length > 0) {
        dayAvailability[date] = "limited";
      } else {
        if (Math.random() < 0.2) {
          dayAvailability[date] = "unavailable";
        }
      }
    }
    doctor.schedules.availableTimes = availableTimes;
    doctor.schedules.dayAvailability = dayAvailability;
  });
  const matchedDoctor = mockDoctors.find(d => d.id === doctorId);
  if (!matchedDoctor && !isNaN(doctorId)) {
    const index = (parseInt(doctorId) - 1) % mockDoctors.length;
    return mockDoctors[index >= 0 ? index : 0];
  }
  return matchedDoctor || mockDoctors[0];
} 