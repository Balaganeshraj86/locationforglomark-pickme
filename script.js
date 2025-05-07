// Store locations
const stores = [
    { id: "store-wattala", name: "Glomark Wattala", lat: 6.991337, lng: 79.889625 },
    { id: "store-kandy", name: "Glomark Kandy", lat: 7.293497, lng: 80.635010 },
    { id: "store-kandana", name: "Glomark Kandana", lat: 7.048293, lng: 79.892387 },
    { id: "store-thalawathugoda", name: "Glomark Thalawathugoda", lat: 6.872935, lng: 79.909944 },
    { id: "store-negombo", name: "Glomark Negombo", lat: 7.211580, lng: 79.839279 },
    { id: "store-kurunegala", name: "Glomark Kurunegala", lat: 7.484999, lng: 80.362739 },
    { id: "store-kottawa", name: "Glomark Kottawa", lat: 6.841352, lng: 79.968410 },
    { id: "store-mtlavinia", name: "Glomark Mount Lavinia", lat: 6.839844, lng: 79.867409 },
    { id: "store-nawala", name: "Glomark Nawala", lat: 6.894882, lng: 79.889051 }
];

// Google Maps variables
let map;
let directionsService;
let directionsRenderer;
let userLocation = null;
let nearbyStores = [];
let nearestStore = null;

document.addEventListener("DOMContentLoaded", function() {
    // Initialize slider functionality
    initSlider();
    
    // Fix store button links
    initStoreButtons();
    
    // Get user location and find nearby stores
    getUserLocation();
});

// Initialize slider functionality
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prev = document.querySelector('.slider-prev');
    const next = document.querySelector('.slider-next');
    let currentIndex = 0;
    
    // Set interval for automatic sliding
    const slideInterval = setInterval(nextSlide, 5000);
    
    // Next slide function
    function nextSlide() {
        slides[currentIndex].classList.remove('active');
        dots[currentIndex].classList.remove('active');
        
        currentIndex = (currentIndex + 1) % slides.length;
        
        slides[currentIndex].classList.add('active');
        dots[currentIndex].classList.add('active');
    }
    
    // Previous slide function
    function prevSlide() {
        slides[currentIndex].classList.remove('active');
        dots[currentIndex].classList.remove('active');
        
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        
        slides[currentIndex].classList.add('active');
        dots[currentIndex].classList.add('active');
    }
    
    // Set event listeners for navigation
    if (next) {
        next.addEventListener('click', function() {
            clearInterval(slideInterval);
            nextSlide();
        });
    }
    
    if (prev) {
        prev.addEventListener('click', function() {
            clearInterval(slideInterval);
            prevSlide();
        });
    }
    
    // Add event listeners to dots
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            
            if (index !== currentIndex) {
                clearInterval(slideInterval);
                
                slides[currentIndex].classList.remove('active');
                dots[currentIndex].classList.remove('active');
                
                currentIndex = index;
                
                slides[currentIndex].classList.add('active');
                dots[currentIndex].classList.add('active');
            }
        });
    });
}

// Initialize store buttons
function initStoreButtons() {
    const storeLinks = document.querySelectorAll("#store-buttons a");
    
    storeLinks.forEach(link => {
        const originalHref = link.getAttribute("href");
        const storeButton = link.querySelector("button");
        const storeId = link.getAttribute("id");
        
        // Remove the href attribute from the link
        link.removeAttribute("href");
        
        // Add click event to the button
        storeButton.addEventListener("click", function() {
            // Add subtle animation to button click
            this.style.transform = "scale(0.95)";
            setTimeout(() => {
                this.style.transform = "";
            }, 200);
            
            // Open the route in Google Maps if we have user location
            const storeObj = stores.find(store => store.id === storeId);
            if (userLocation && storeObj) {
                const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${storeObj.lat},${storeObj.lng}&travelmode=driving`;
                window.open(gmapsUrl, '_blank');
            } else {
                // Navigate to the original href as fallback
                setTimeout(() => {
                    window.location.href = originalHref;
                }, 300);
            }
        });
    });
}

// Get user location 
function getUserLocation() {
    // Update location message
    const locationStatus = document.getElementById('location-status');
    locationStatus.textContent = "Getting your location...";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update location message
                locationStatus.textContent = "Location found! Finding nearby stores...";
                
                // Initialize Google Maps
                initializeGoogleMaps();
                
                // Find nearby stores
                findNearbyStores();
            },
            error => {
                // Handle location error
                handleLocationError(error);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 10000 
            }
        );
    } else {
        // Geolocation not supported
        locationStatus.textContent = "Geolocation is not supported by your browser.";
    }
}

// Handle location error
function handleLocationError(error) {
    const locationStatus = document.getElementById('location-status');
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            locationStatus.textContent = "Location access denied. Please enable location services to find nearby stores.";
            break;
        case error.POSITION_UNAVAILABLE:
            locationStatus.textContent = "Location information is unavailable. Please try again later.";
            break;
        case error.TIMEOUT:
            locationStatus.textContent = "Location request timed out. Please try again.";
            break;
        case error.UNKNOWN_ERROR:
            locationStatus.textContent = "An unknown error occurred. Please try again.";
            break;
    }
}

// Initialize Google Maps
function initializeGoogleMaps() {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined') {
        // Add Google Maps API script if not already loaded
        loadGoogleMapsAPI();
        return;
    }
    
    // Initialize map
    map = new google.maps.Map(document.getElementById("map-container"), {
        center: userLocation,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });
    
    // Add user marker
    new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2
        },
        title: "Your Location"
    });
    
    // Initialize directions service
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });
    
    // Show the map container
    document.getElementById("map-container").style.display = "block";
}

// Load Google Maps API
function loadGoogleMapsAPI() {
    // Create script element
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=googleMapsCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    // Define callback function in global scope
    window.googleMapsCallback = function() {
        initializeGoogleMaps();
    };
}

// Find nearby stores
function findNearbyStores() {
    if (!userLocation) return;
    
    // Calculate distance to each store
    const storesWithDistance = stores.map(store => {
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            store.lat, store.lng
        );
        
        return {
            ...store,
            distance: distance,
            distanceText: formatDistance(distance)
        };
    });
    
    // Sort by distance
    storesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Get nearby stores (within 10km)
    nearbyStores = storesWithDistance.filter(store => store.distance <= 10);
    
    // Get nearest store
    nearestStore = storesWithDistance[0];
    
    // Update UI with nearby stores
    updateStoreUI(nearbyStores, nearestStore);
    
    // Get directions to nearest store
    if (nearestStore) {
        getDirections(nearestStore);
    }
    
    // Create and show nearest store popup
    showNearestStorePopup(nearbyStores);
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
}

// Convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Format distance in km or m
function formatDistance(distance) {
    if (distance < 1) {
        return Math.round(distance * 1000) + " m";
    } else {
        return distance.toFixed(1) + " km";
    }
}

// Update store UI with nearby stores
function updateStoreUI(nearbyStores, nearestStore) {
    const locationStatus = document.getElementById('location-status');
    
    if (nearbyStores.length > 0) {
        locationStatus.textContent = `Found ${nearbyStores.length} stores near you. Nearest: ${nearestStore.name} (${nearestStore.distanceText})`;
        
        // Reset all store buttons
        const storeButtons = document.querySelectorAll("#store-buttons button");
        storeButtons.forEach(button => {
            button.classList.remove("nearby");
            button.classList.remove("nearest");
            button.textContent = button.textContent.split(" (")[0]; // Remove any distance text
        });
        
        // Mark nearby stores
        nearbyStores.forEach(store => {
            const storeButton = document.querySelector(`#${store.id} button`);
            if (storeButton) {
                storeButton.classList.add("nearby");
                storeButton.textContent = `${store.name.replace("Glomark ", "")} (${store.distanceText})`;
            }
        });
        
        // Mark nearest store
        const nearestStoreButton = document.querySelector(`#${nearestStore.id} button`);
        if (nearestStoreButton) {
            nearestStoreButton.classList.remove("nearby");
            nearestStoreButton.classList.add("nearest");
        }
    } else {
        locationStatus.textContent = "No stores found nearby. Please select any store from the list.";
    }
}

// Get directions to a store
function getDirections(store) {
    if (!directionsService || !directionsRenderer) return;
    
    const request = {
        origin: userLocation,
        destination: { lat: store.lat, lng: store.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
    };
    
    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            
            // Update nearest store with route information
            if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
                const leg = result.routes[0].legs[0];
                
                nearestStore.duration = {
                    text: leg.duration.text,
                    value: leg.duration.value
                };
                
                nearestStore.durationInTraffic = leg.duration_in_traffic ? {
                    text: leg.duration_in_traffic.text,
                    value: leg.duration_in_traffic.value
                } : nearestStore.duration;
                
                // Update the nearest store popup if it exists
                updateNearestStorePopupWithRouteInfo();
            }
        }
    });
    
    // Get travel times for different modes
    getTravelTimesForAllModes(store);
}

// Get travel times for all transportation modes
function getTravelTimesForAllModes(store) {
    const modes = [
        { mode: google.maps.TravelMode.DRIVING, id: "driving-time" },
        { mode: google.maps.TravelMode.WALKING, id: "walking-time" },
        { mode: google.maps.TravelMode.BICYCLING, id: "bicycling-time" },
        { mode: google.maps.TravelMode.TRANSIT, id: "transit-time" }
    ];
    
    modes.forEach(modeObj => {
        const request = {
            origin: userLocation,
            destination: { lat: store.lat, lng: store.lng },
            travelMode: modeObj.mode
        };
        
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
                    const leg = result.routes[0].legs[0];
                    const timeElement = document.getElementById(modeObj.id);
                    
                    if (timeElement) {
                        timeElement.textContent = leg.duration.text;
                    }
                }
            }
        });
    });
}

// Show nearest store popup
function showNearestStorePopup(nearbyStores) {
    // Check if popup already exists
    let popup = document.getElementById("nearest-store-popup");
    if (!popup) {
        // Create popup
        popup = document.createElement("div");
        popup.id = "nearest-store-popup";
        popup.className = "nearest-store-popup";
        document.body.appendChild(popup);
    }
    
    // Create popup content
    let popupContent = `
        <div class="popup-header">
            <h3>Nearest Glomark Stores</h3>
            <button id="close-popup">×</button>
        </div>
        <div class="popup-content">
    `;
    
    if (nearbyStores.length > 0) {
        popupContent += `<p>We found ${nearbyStores.length} stores near your location:</p>`;
        
        popupContent += `<ul class="store-list">`;
        nearbyStores.forEach(store => {
            let storeClass = store.id === nearestStore.id ? "store-item nearest" : "store-item";
            
            popupContent += `
                <li class="${storeClass}" data-store-id="${store.id}">
                    <div class="store-info">
                        <h4>${store.name}</h4>
                        <p>${store.distanceText} from you</p>
                    </div>
                    <div class="travel-times">
                        <div class="travel-mode">
                            <span class="mode-icon">🚗</span>
                            <span id="${store.id}-driving-time">Loading...</span>
                        </div>
                        <div class="travel-mode">
                            <span class="mode-icon">🚶</span>
                            <span id="${store.id}-walking-time">Loading...</span>
                        </div>
                        <div class="travel-mode">
                            <span class="mode-icon">🚲</span>
                            <span id="${store.id}-bicycling-time">Loading...</span>
                        </div>
                    </div>
                    <button class="select-store" data-store-id="${store.id}">Select This Store</button>
                </li>
            `;
            
            // Get travel times for this store
            setTimeout(() => {
                getStoreTravelTimes(store);
            }, 300);
        });
        popupContent += `</ul>`;
    } else {
        popupContent += `<p>No stores found near your location. Please select a store from the list below.</p>`;
    }
    
    popupContent += `</div>`;
    
    // Set popup content
    popup.innerHTML = popupContent;
    
    // Add event listeners
    document.getElementById("close-popup").addEventListener("click", () => {
        popup.classList.remove("show");
        setTimeout(() => {
            popup.style.display = "none";
        }, 300);
    });
    
    // Add event listeners to select store buttons
    const selectButtons = popup.querySelectorAll(".select-store");
    selectButtons.forEach(button => {
        button.addEventListener("click", function() {
            const storeId = this.getAttribute("data-store-id");
            const store = stores.find(s => s.id === storeId);
            
            if (store) {
                // Trigger click on the store button
                const storeButton = document.querySelector(`#${storeId} button`);
                if (storeButton) {
                    storeButton.click();
                }
                
                // Close popup
                popup.classList.remove("show");
                setTimeout(() => {
                    popup.style.display = "none";
                }, 300);
            }
        });
    });
    
    // Show popup with animation
    popup.style.display = "block";
    setTimeout(() => {
        popup.classList.add("show");
    }, 10);
}

// Get travel times for a store
function getStoreTravelTimes(store) {
    const modes = [
        { mode: "DRIVING", id: `${store.id}-driving-time` },
        { mode: "WALKING", id: `${store.id}-walking-time` },
        { mode: "BICYCLING", id: `${store.id}-bicycling-time` }
    ];
    
    modes.forEach(modeObj => {
        const request = {
            origin: userLocation,
            destination: { lat: store.lat, lng: store.lng },
            travelMode: google.maps.TravelMode[modeObj.mode]
        };
        
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
                    const leg = result.routes[0].legs[0];
                    const timeElement = document.getElementById(modeObj.id);
                    
                    if (timeElement) {
                        timeElement.textContent = leg.duration.text;
                    }
                }
            }
        });
    });
}

// Update nearest store popup with route information
function updateNearestStorePopupWithRouteInfo() {
    if (!nearestStore || !nearestStore.duration) return;
    
    const nearestStoreItem = document.querySelector(`.store-item.nearest`);
    if (nearestStoreItem) {
        const drivingTimeElement = document.getElementById(`${nearestStore.id}-driving-time`);
        if (drivingTimeElement) {
            drivingTimeElement.textContent = nearestStore.duration.text;
            
            if (nearestStore.durationInTraffic) {
                drivingTimeElement.textContent += ` (with traffic: ${nearestStore.durationInTraffic.text})`;
            }
        }
    }
}