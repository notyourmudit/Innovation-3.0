let currentRoute = '';
let availableBuses = [];
let trackingInterval = null;


const busRoutes = {
    'ludhiana-chandigarh': {
        name: 'Ludhiana - Chandigarh',
        buses: [
            { number: 'PB-01-A-1234', status: 'On Time', location: 'Near Ludhiana Bus Stand', nextStop: 'Khanna', eta: '5 min' },
            { number: 'PB-01-B-5678', status: 'Delayed', location: 'Rajpura Junction', nextStop: 'Chandigarh', eta: '15 min' },
            { number: 'PB-01-C-9012', status: 'On Time', location: 'Sirhind', nextStop: 'Fatehgarh Sahib', eta: '8 min' }
        ]
    },
    'amritsar-jalandhar': {
        name: 'Amritsar - Jalandhar',
        buses: [
            { number: 'PB-02-A-3456', status: 'On Time', location: 'Near Golden Temple', nextStop: 'Tarn Taran', eta: '10 min' },
            { number: 'PB-02-B-7890', status: 'On Time', location: 'Kapurthala', nextStop: 'Jalandhar City', eta: '20 min' }
        ]
    },
    'patiala-mohali': {
        name: 'Patiala - Mohali',
        buses: [
            { number: 'PB-03-A-2468', status: 'On Time', location: 'Patiala Bus Stand', nextStop: 'Banur', eta: '12 min' },
            { number: 'PB-03-B-1357', status: 'Delayed', location: 'Zirakpur', nextStop: 'Mohali', eta: '5 min' }
        ]
    },
    'bathinda-faridkot': {
        name: 'Bathinda - Faridkot',
        buses: [
            { number: 'PB-04-A-9753', status: 'On Time', location: 'Bathinda Central', nextStop: 'Maur', eta: '18 min' }
        ]
    }
};

const sampleBookingResults = [
    {
        busNumber: 'PB-01-EXP-101',
        route: 'Ludhiana - Chandigarh',
        departure: '08:00 AM',
        arrival: '10:30 AM',
        duration: '2h 30m',
        price: 120,
        seatsAvailable: 15,
        type: 'Express'
    },
    {
        busNumber: 'PB-01-REG-205',
        route: 'Ludhiana - Chandigarh',
        departure: '10:15 AM',
        arrival: '01:00 PM',
        duration: '2h 45m',
        price: 90,
        seatsAvailable: 8,
        type: 'Regular'
    },
    {
        busNumber: 'PB-01-DEL-350',
        route: 'Ludhiana - Chandigarh',
        departure: '02:30 PM',
        arrival: '05:00 PM',
        duration: '2h 30m',
        price: 150,
        seatsAvailable: 22,
        type: 'Deluxe'
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setMinDate();
});

function initializeApp() {
    console.log('Punjab Transport System Initialized');
    updateNavigation();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Booking form
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    // Modal events
    window.addEventListener('click', handleModalClick);

    // Form validations
    setupFormValidation();
}

function handleNavigation(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    scrollToSection(targetId);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    e.target.classList.add('active');
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = section.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

function updateNavigation() {
    const currentSection = getCurrentSection();
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

function getCurrentSection() {
    const sections = ['home', 'tracking', 'booking', 'routes', 'contact'];
    const scrollPosition = window.scrollY + 100;

    for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPosition) {
            return sections[i];
        }
    }
    return 'home';
}

// Bus Tracking Functions
function trackBus() {
    const routeSelect = document.getElementById('route-select');
    const busNumberInput = document.getElementById('bus-number');
    const selectedRoute = routeSelect.value;
    const busNumber = busNumberInput.value.trim();

    if (!selectedRoute) {
        showNotification('Please select a route first', 'warning');
        return;
    }

    currentRoute = selectedRoute;
    displayLiveBuses(selectedRoute, busNumber);
    updateMapView(selectedRoute);
}

function displayLiveBuses(route, filterBusNumber = '') {
    const busList = document.getElementById('bus-list');
    const routeData = busRoutes[route];

    if (!routeData) {
        busList.innerHTML = '<p>No buses found for this route.</p>';
        return;
    }

    let buses = routeData.buses;
    
    // Filter by bus number if provided
    if (filterBusNumber) {
        buses = buses.filter(bus => 
            bus.number.toLowerCase().includes(filterBusNumber.toLowerCase())
        );
    }

    if (buses.length === 0) {
        busList.innerHTML = '<p>No buses match your search criteria.</p>';
        return;
    }

    const busHTML = buses.map(bus => `
        <div class="bus-item" data-bus-number="${bus.number}">
            <div class="bus-number">${bus.number}</div>
            <div class="bus-status">
                <span class="status-indicator ${getStatusClass(bus.status)}"></span>
                <span class="${getStatusClass(bus.status)}">${bus.status}</span>
            </div>
            <div class="bus-location">
                <i class="fas fa-map-marker-alt"></i>
                Current: ${bus.location}
            </div>
            <div class="bus-next-stop">
                <i class="fas fa-arrow-right"></i>
                Next: ${bus.nextStop} (${bus.eta})
            </div>
            <button class="btn-primary" onclick="selectBusForTracking('${bus.number}')">
                <i class="fas fa-eye"></i>
                Track This Bus
            </button>
        </div>
    `).join('');

    busList.innerHTML = busHTML;

    // Start live updates
    startLiveTracking();
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'on time':
            return 'status-on-time';
        case 'delayed':
            return 'status-delayed';
        case 'cancelled':
            return 'status-cancelled';
        default:
            return '';
    }
}

function selectBusForTracking(busNumber) {
    showNotification(`Now tracking bus ${busNumber}`, 'success');
    updateMapView(currentRoute, busNumber);
}

function updateMapView(route, busNumber = null) {
    const mapArea = document.getElementById('map-area');
    const routeData = busRoutes[route];

    if (!routeData) return;

    let mapContent = `
        <div style="padding: 2rem; text-align: left;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">
                <i class="fas fa-route"></i>
                ${routeData.name} Route
            </h3>
    `;

    if (busNumber) {
        const bus = routeData.buses.find(b => b.number === busNumber);
        if (bus) {
            mapContent += `
                <div style="background: var(--light-green); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <h4>${bus.number}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${bus.location}</p>
                    <p><i class="fas fa-clock"></i> ETA to ${bus.nextStop}: ${bus.eta}</p>
                    <div class="live-indicator" style="display: inline-block; margin-right: 0.5rem;"></div>
                    <span style="color: var(--success); font-weight: bold;">LIVE TRACKING</span>
                </div>
            `;
        }
    }

    mapContent += `
            <div style="background: #e9ecef; padding: 2rem; border-radius: 0.5rem; text-align: center;">
                <i class="fas fa-map" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                <p style="color: var(--medium-gray);">Interactive map will be displayed here</p>
                <p style="font-size: 0.9rem; color: var(--medium-gray);">Showing real-time GPS locations of buses</p>
            </div>
        </div>
    `;

    mapArea.innerHTML = mapContent;
}

function startLiveTracking() {
    // Clear existing interval
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }

    // Update every 30 seconds
    trackingInterval = setInterval(() => {
        if (currentRoute) {
            // Simulate real-time updates by slightly modifying the data
            updateBusPositions();
        }
    }, 30000);
}

function updateBusPositions() {
    // Simulate position updates (in a real app, this would fetch from API)
    const locations = [
        'Moving towards next stop',
        'At traffic signal',
        'Approaching bus stop',
        'Departed from stop'
    ];
    
    document.querySelectorAll('.bus-item').forEach(busItem => {
        const locationElement = busItem.querySelector('.bus-location');
        if (locationElement && Math.random() > 0.7) { // 30% chance to update
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            const busNumber = busItem.dataset.busNumber;
            locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                Current: ${randomLocation}
                <span class="live-indicator" style="margin-left: 0.5rem;"></span>
            `;
        }
    });
}

// Booking Functions
function handleBookingSubmit(e) {
    e.preventDefault();
    
    const fromCity = document.getElementById('from-city').value;
    const toCity = document.getElementById('to-city').value;
    const travelDate = document.getElementById('travel-date').value;
    const passengers = document.getElementById('passengers').value;

    // Validation
    if (!fromCity || !toCity) {
        showNotification('Please select both departure and destination cities', 'warning');
        return;
    }

    if (fromCity === toCity) {
        showNotification('Departure and destination cities cannot be the same', 'warning');
        return;
    }

    if (!travelDate) {
        showNotification('Please select a travel date', 'warning');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Searching...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        displayBookingResults(fromCity, toCity, travelDate, passengers);
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }, 1500);
}

function displayBookingResults(from, to, date, passengers) {
    const availableBusesSection = document.getElementById('available-buses');
    const busResults = document.getElementById('bus-results');

    // Filter and modify sample results based on search criteria
    const results = sampleBookingResults.map(bus => ({
        ...bus,
        route: `${capitalize(from)} - ${capitalize(to)}`,
        seatsAvailable: Math.floor(Math.random() * 25) + 5 // Random available seats
    }));

    const resultsHTML = results.map(bus => `
        <div class="bus-result-item">
            <div class="bus-info">
                <h4>${bus.busNumber} - ${bus.type}</h4>
                <div class="bus-details">
                    <span><i class="fas fa-clock"></i> ${bus.departure} - ${bus.arrival}</span>
                    <span><i class="fas fa-hourglass-half"></i> ${bus.duration}</span>
                    <span><i class="fas fa-users"></i> ${bus.seatsAvailable} seats available</span>
                </div>
            </div>
            <div class="bus-price">
                <div class="price-amount">₹${bus.price}</div>
                <div style="font-size: 0.8rem; color: var(--medium-gray);">per person</div>
                <button class="btn-primary" onclick="bookBus('${bus.busNumber}', ${bus.price}, '${passengers}')">
                    <i class="fas fa-ticket-alt"></i>
                    Book Now
                </button>
            </div>
        </div>
    `).join('');

    busResults.innerHTML = resultsHTML;
    availableBusesSection.style.display = 'block';
    
    // Scroll to results
    availableBusesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    showNotification(`Found ${results.length} buses for your journey`, 'success');
}

function bookBus(busNumber, price, passengers) {
    const totalPrice = price * parseInt(passengers);
    const confirmMessage = `
        Confirm booking for:
        Bus: ${busNumber}
        Passengers: ${passengers}
        Total Amount: ₹${totalPrice}
        
        Proceed with booking?
    `;
    
    if (confirm(confirmMessage)) {
        // In a real app, this would redirect to payment page
        showNotification(`Booking confirmed for bus ${busNumber}! Redirecting to payment...`, 'success');
        
        // Simulate redirect delay
        setTimeout(() => {
            alert('This would redirect to secure payment gateway in a real application.');
        }, 2000);
    }
}

// Modal Functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function openSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchModal(closeModalId, openModalId) {
    closeModal(closeModalId);
    document.getElementById(openModalId).style.display = 'block';
}

function handleModalClick(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
}

// Utility Functions
function setMinDate() {
    const travelDateInput = document.getElementById('travel-date');
    if (travelDateInput) {
        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        travelDateInput.min = minDate;
        
        // Set default to today
        travelDateInput.value = minDate;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                box-shadow: var(--shadow-medium);
                z-index: 1500;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-success { border-left: 4px solid var(--success); }
            .notification-warning { border-left: 4px solid var(--warning); }
            .notification-error { border-left: 4px solid var(--danger); }
            .notification-info { border-left: 4px solid var(--primary-color); }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .notification-success i { color: var(--success); }
            .notification-warning i { color: var(--warning); }
            .notification-error i { color: var(--danger); }
            .notification-info i { color: var(--primary-color); }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--medium-gray);
                cursor: pointer;
                font-size: 1rem;
                padding: 0.25rem;
            }
            
            .notification-close:hover {
                color: var(--danger);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'check-circle';
        case 'warning':
            return 'exclamation-triangle';
        case 'error':
            return 'exclamation-circle';
        default:
            return 'info-circle';
    }
}

function setupFormValidation() {
    // Add real-time validation for form inputs
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing error styling
    field.classList.remove('error');
    
    // Validation logic
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    if (field.type === 'tel' && value && !isValidPhone(value)) {
        showFieldError(field, 'Please enter a valid phone number');
        return false;
    }
    
    return true;
}

function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('error');
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: var(--danger);
        font-size: 0.8rem;
        margin-top: 0.25rem;
    `;
    
    field.parentElement.appendChild(errorElement);
    
    // Add error styling if not already added
    if (!document.getElementById('field-error-styles')) {
        const style = document.createElement('style');
        style.id = 'field-error-styles';
        style.textContent = `
            .form-control.error {
                border-color: var(--danger) !important;
                box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Scroll event listener for navigation updates
window.addEventListener('scroll', () => {
    updateNavigation();
});

// Cleanup function for intervals
window.addEventListener('beforeunload', () => {
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }
});

// Add some demo functionality for government trust
function showSecurityInfo() {
    const securityInfo = `
        🔒 Security Features:
        • 256-bit SSL encryption
        • Government verified certificates
        • Secure payment gateway
        • Real-time data protection
        • Privacy policy compliant
        
        🏛️ Government Verification:
        • Official Punjab Transport Department
        • Licensed operator
        • Regular safety audits
        • Complaint redressal system
    `;
    
    alert(securityInfo);
}

// Initialize demo data on page load
window.addEventListener('load', () => {
    console.log('Punjab Public Transport System Ready');
    console.log('Government of Punjab - Secure & Reliable Transport');
});
const API_BASE = "http://localhost:5000/api";

/* ------------------ NAVIGATION ------------------ */
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

/* ------------------ MODALS ------------------ */
function openLoginModal() {
  document.getElementById("loginModal").style.display = "block";
}
function openSignupModal() {
  document.getElementById("signupModal").style.display = "block";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
function switchModal(from, to) {
  closeModal(from);
  document.getElementById(to).style.display = "block";
}

/* ------------------ LIVE BUS TRACKING ------------------ */
async function trackBus() {
  const route = document.getElementById("route-select").value;
  if (!route) {
    alert("Please select a route");
    return;
  }

  const res = await fetch(`${API_BASE}/buses/live?route=${route}`);
  const buses = await res.json();

  const list = document.getElementById("bus-list");
  list.innerHTML = "";

  buses.forEach(bus => {
    const eta = calculateETA(bus.location.lat, bus.location.lng);

    list.innerHTML += `
      <div class="bus-card">
        <b>Bus:</b> ${bus.busNumber}<br>
        <b>ETA:</b> ${eta} mins
        <button onclick="sendSOS('${bus.id}')">SOS</button>
      </div>
    `;
  });

  document.getElementById("map-area").innerHTML =
    "<p>Live bus locations updated</p>";
}

/* ------------------ ETA CALCULATION ------------------ */
function calculateETA(lat, lng) {
  // Dummy calculation (real version uses Google Maps API)
  const distanceKm = Math.random() * 20;
  const speed = 40; // km/hr
  return Math.round((distanceKm / speed) * 60);
}

/* ------------------ SOS BUTTON ------------------ */
async function sendSOS(busId) {
  await fetch(`${API_BASE}/buses/sos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      busId,
      message: "Emergency alert triggered",
    }),
  });

  alert("🚨 SOS Sent to Control Room!");
}

/* ------------------ BOOKING ------------------ */
document.getElementById("booking-form").addEventListener("submit", async e => {
  e.preventDefault();

  const data = {
    from: fromCity.value,
    to: toCity.value,
    date: travelDate.value,
    passengers: passengers.value,
  };

  const res = await fetch(`${API_BASE}/booking/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const buses = await res.json();
  document.getElementById("available-buses").style.display = "block";

  const result = document.getElementById("bus-results");
  result.innerHTML = "";

  buses.forEach(b => {
    result.innerHTML += `
      <div class="bus-card">
        <b>Departure:</b> ${b.departure}<br>
        <b>Fare:</b> ₹${b.fare}
        <button onclick="bookTicket()">Book</button>
      </div>
    `;
  });
});

function bookTicket() {
  alert("🎟 Ticket booked successfully!");
}
