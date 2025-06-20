// Custom User Location Indicator
// This creates a visible round indicator that doesn't disappear during Track Up mode

(function() {
    'use strict';
    
    let customLocationMarker = null;
    let customLocationCircle = null;
    
    // Create custom location indicator
    function createCustomLocationIndicator(lat, lng, heading = null) {
        if (!window.leafletMap) return;
        
        // Remove existing custom markers
        removeCustomLocationIndicator();
        
        // Create a bright, visible circular marker
        const customIcon = L.divIcon({
            className: 'custom-location-indicator',
            html: `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: #FF4444;
                    border: 3px solid #FFFFFF;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
                    position: relative;
                    z-index: 1000;
                ">
                    <div style="
                        width: 8px;
                        height: 8px;
                        background: #FFFFFF;
                        border-radius: 50%;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                    "></div>
                </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });
        
        // Create the marker
        customLocationMarker = L.marker([lat, lng], {
            icon: customIcon,
            zIndexOffset: 1000
        }).addTo(window.leafletMap);
        
        // Create accuracy circle
        customLocationCircle = L.circle([lat, lng], {
            radius: 50, // 50 meter accuracy circle
            fillColor: '#FF4444',
            fillOpacity: 0.1,
            color: '#FF4444',
            weight: 2,
            opacity: 0.3
        }).addTo(window.leafletMap);
        
        // Ensure the marker stays visible during rotations
        if (customLocationMarker) {
            const markerElement = customLocationMarker.getElement();
            if (markerElement) {
                markerElement.style.zIndex = '1000';
                markerElement.style.position = 'relative';
                markerElement.classList.add('custom-user-location');
            }
        }
        
        console.log('🎯 Custom location indicator created at:', lat, lng);
    }
    
    // Remove custom location indicator
    function removeCustomLocationIndicator() {
        if (customLocationMarker && window.leafletMap) {
            window.leafletMap.removeLayer(customLocationMarker);
            customLocationMarker = null;
        }
        if (customLocationCircle && window.leafletMap) {
            window.leafletMap.removeLayer(customLocationCircle);
            customLocationCircle = null;
        }
    }
    
    // Update custom location indicator position
    function updateCustomLocationIndicator(lat, lng, heading = null) {
        if (customLocationMarker) {
            customLocationMarker.setLatLng([lat, lng]);
        }
        if (customLocationCircle) {
            customLocationCircle.setLatLng([lat, lng]);
        }
    }
    
    // Override the original location tracking to use custom indicator
    function enhanceLocationTracking() {
        // Wait for the map to be ready
        const checkMap = setInterval(() => {
            if (window.leafletMap) {
                clearInterval(checkMap);
                
                // Remove any existing default location markers first
                removeDefaultLocationMarkers();
                
                // Override geolocation success handler
                const originalGeolocationSuccess = window.handleGeolocationSuccess;
                if (originalGeolocationSuccess) {
                    window.handleGeolocationSuccess = function(position) {
                        // Remove default markers before calling original function
                        removeDefaultLocationMarkers();
                        
                        // Call original function
                        originalGeolocationSuccess(position);
                        
                        // Remove default markers again after original function
                        setTimeout(() => {
                            removeDefaultLocationMarkers();
                        }, 100);
                        
                        // Add our custom indicator
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const heading = position.coords.heading;
                        
                        createCustomLocationIndicator(lat, lng, heading);
                    };
                }
                
                // Also hook into the map.js location tracking
                if (window.trackUserLocation) {
                    const originalTrackLocation = window.trackUserLocation;
                    window.trackUserLocation = function() {
                        // Call original function but override its success handler
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                function(position) {
                                    // Remove any default markers
                                    removeDefaultLocationMarkers();
                                    
                                    const lat = position.coords.latitude;
                                    const lng = position.coords.longitude;
                                    
                                    // Set map view
                                    if (window.leafletMap) {
                                        window.leafletMap.setView([lat, lng], 16);
                                    }
                                    
                                    // Create our custom indicator
                                    createCustomLocationIndicator(lat, lng, position.coords.heading);
                                    
                                    // Update button
                                    const trackBtn = document.getElementById('track-location-btn');
                                    if (trackBtn) {
                                        trackBtn.textContent = '📍 Where Am I';
                                        trackBtn.disabled = false;
                                    }
                                },
                                function(error) {
                                    console.error('Geolocation error:', error);
                                    const trackBtn = document.getElementById('track-location-btn');
                                    if (trackBtn) {
                                        trackBtn.textContent = '📍 Where Am I';
                                        trackBtn.disabled = false;
                                    }
                                },
                                {
                                    enableHighAccuracy: true,
                                    timeout: 10000,
                                    maximumAge: 60000
                                }
                            );
                        }
                    };
                }
                
                console.log('🎯 Custom location indicator system initialized');
            }
        }, 100);
    }
    
    // Remove default location markers (yellow arrow, blue dot, etc.)
    function removeDefaultLocationMarkers() {
        if (!window.leafletMap) return;
        
        // Remove all existing markers that might be default location indicators
        window.leafletMap.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                // Check if this is likely a default location marker
                const element = layer.getElement();
                if (element) {
                    const src = element.src || '';
                    const alt = element.alt || '';
                    const className = element.className || '';
                    
                    // Remove if it looks like a default location marker
                    if (src.includes('arrow') || 
                        alt.includes('location') || 
                        className.includes('user-location') ||
                        !element.classList.contains('custom-location-indicator')) {
                        window.leafletMap.removeLayer(layer);
                        console.log('🗑️ Removed default location marker');
                    }
                }
            }
        });
        
        // Also remove any blue dots or other location indicators
        const locationElements = document.querySelectorAll('.leaflet-marker-icon:not(.custom-location-indicator)');
        locationElements.forEach(element => {
            const src = element.src || '';
            const alt = element.alt || '';
            if (src.includes('arrow') || alt.includes('location') || element.style.backgroundColor === 'blue') {
                const parent = element.closest('.leaflet-marker-pane');
                if (parent) {
                    element.remove();
                    console.log('🗑️ Removed default location element');
                }
            }
        });
    }
    
    // Ensure custom indicator stays visible during Track Up mode
    function protectCustomIndicator() {
        setInterval(() => {
            if (customLocationMarker) {
                const markerElement = customLocationMarker.getElement();
                if (markerElement) {
                    markerElement.style.visibility = 'visible';
                    markerElement.style.opacity = '1';
                    markerElement.style.display = 'block';
                    markerElement.style.zIndex = '1000';
                    
                    // Ensure it's not affected by map rotation
                    const currentTransform = markerElement.style.transform;
                    if (currentTransform && currentTransform.includes('rotate')) {
                        // Remove any rotation applied to the marker
                        markerElement.style.transform = currentTransform.replace(/rotate\([^)]*\)/g, '');
                    }
                }
            }
        }, 1000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            enhanceLocationTracking();
            protectCustomIndicator();
        });
    } else {
        enhanceLocationTracking();
        protectCustomIndicator();
    }
    
    // Export functions for external use
    window.createCustomLocationIndicator = createCustomLocationIndicator;
    window.removeCustomLocationIndicator = removeCustomLocationIndicator;
    window.updateCustomLocationIndicator = updateCustomLocationIndicator;
    
})();

