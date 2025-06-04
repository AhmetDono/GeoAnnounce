// src/pages/Home/Home.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import styles from './Home.module.css';

import { FaFlag } from 'react-icons/fa';
// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Create different colored icons for user and bulletins
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Create a custom icon for bulletins
let BulletinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula to calculate distance between two points on Earth
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Distance in meters
  return distance;
}

// Function to add a small offset to bulletins that are too close to user location
function getOffsetPosition(bulletinLat, bulletinLng, userLat, userLng) {
  // Calculate distance between bulletin and user
  const distance = calculateDistance(bulletinLat, bulletinLng, userLat, userLng);
  
  // If distance is less than 10 meters, add an offset
  if (distance < 10) {
    // Create a random offset in a circle around the user
    const angle = Math.random() * 2 * Math.PI; // Random angle
    const offsetDistance = 20; // 20 meters offset
    
    // Convert offset distance to latitude and longitude
    // Approximate conversion: 0.00001 degrees ≈ 1.11 meters
    const offsetLat = (offsetDistance / 111000) * Math.sin(angle);
    const offsetLng = (offsetDistance / (111000 * Math.cos(bulletinLat * Math.PI / 180))) * Math.cos(angle);
    
    return [bulletinLat + offsetLat, bulletinLng + offsetLng];
  }
  
  // If not too close, return original position
  return [bulletinLat, bulletinLng];
}

// Component to recenter the map to user's location
function LocationMarker({ onLocationFound }) {
  const [position, setPosition] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const map = useMap();
  const hasLocated = useRef(false);

  useEffect(() => {
    // Only locate once to prevent infinite loop
    if (!hasLocated.current) {
      hasLocated.current = true;
      
      map.locate({ setView: true, maxZoom: 17 });
      
      map.on('locationfound', (e) => {
        setPosition(e.latlng);
        
        // Only fly to location once
        map.flyTo(e.latlng, 17, {
          animate: true,
          duration: 1
        });
        
        // Call the callback with the found location
        if (onLocationFound) {
          onLocationFound(e.latlng);
        }
      });

      map.on('locationerror', (e) => {
        console.error('Error getting location:', e);
        setLocationError(e.message);
        toast.error("Location information could not be obtained: " + e.message);
      });
    }
  }, [map, onLocationFound]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div className={styles.userPopup}>
          <strong>Your Location</strong>
          <p>You are here</p>
          {locationError ? <span className={styles.error}>{locationError}</span> : null}
        </div>
      </Popup>
    </Marker>
  );
}

// Modal component for creating bulletins
function BulletinModal({ isOpen, onClose, onSubmit, loading }) {
  const [bulletinContent, setBulletinContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(bulletinContent);
    setBulletinContent(''); // Clear the input after submission
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Add New Announcement</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="bulletinContent">Announcement Content:</label>
            <textarea
              id="bulletinContent"
              value={bulletinContent}
              onChange={(e) => setBulletinContent(e.target.value)}
              placeholder="Enter your announcement content here..."
              rows={4}
              required
            />
          </div>
          <div className={styles.modalFooter}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading || !bulletinContent.trim()}
            >
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Report Modal Component
function ReportModal({ isOpen, onClose, onSubmit, bulletinId }) {
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit(bulletinId, reportReason);
      setReportReason('');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error("An error occurred while sending the report.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Report Announcement</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="reportReason">Reason for Report:</label>
            <textarea
              id="reportReason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please explain why you are reporting this announcement..."
              rows={4}
              required
            />
          </div>
          <div className={styles.modalFooter}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading || !reportReason.trim()}
            >
              {loading ? 'Sending...' : 'Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Home() {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedBulletinId, setSelectedBulletinId] = useState(null);
  const [offsetPositions, setOffsetPositions] = useState({});
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const locationInitialized = useRef(false);
  
  // Get current user from AuthContext
  const { currentUser, isAuthenticated } = useAuth();
  
  // Get socket context
  const { socket, isConnected, bulletins, joinLocation, updateBulletins } = useSocket();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Get user's location only once
    if (!locationInitialized.current) {
      locationInitialized.current = true;
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("Browser geolocation:", latitude, longitude);
            
            const userLoc = {
              lat: latitude,
              lng: longitude
            };
            setUserLocation(userLoc);
            
            // Fetch bulletins once we have the location
            fetchBulletins(userLoc);
          },
          (error) => {
            console.error("Error getting location:", error);
            setError("Could not get your location. Please enable location services.");
            toast.error("Location information could not be obtained. Please allow location access.");
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
        toast.error("Your browser does not support location services.");
      }
    }
  }, [isAuthenticated, navigate]);

  // Track location changes and update socket.io room
  useEffect(() => {
    if (socket && isConnected && userLocation) {
      console.log('User location available, joining location room:', userLocation);
      joinLocation(userLocation.lat, userLocation.lng);
    }
  }, [socket, isConnected, userLocation, joinLocation]);

  // Calculate offset positions for bulletins once when they change
  useEffect(() => {
    if (bulletins && bulletins.length > 0 && userLocation) {
      const newOffsetPositions = {};
      
      bulletins.forEach(bulletin => {
        // Skip if we already have an offset for this bulletin
        if (offsetPositions[bulletin._id]) return;
        
        const bulletinLat = bulletin.location.coordinates[1]; // latitude
        const bulletinLng = bulletin.location.coordinates[0]; // longitude
        
        const [adjustedLat, adjustedLng] = getOffsetPosition(
          bulletinLat, 
          bulletinLng, 
          userLocation.lat, 
          userLocation.lng
        );
        
        newOffsetPositions[bulletin._id] = [adjustedLat, adjustedLng];
      });
      
      // Only update state if we have new offsets
      if (Object.keys(newOffsetPositions).length > 0) {
        setOffsetPositions(prev => ({...prev, ...newOffsetPositions}));
      }
    }
  }, [bulletins, userLocation, offsetPositions]);

  const fetchBulletins = async (location) => {
    try {
      setLoading(true);
      // Use the location parameter if provided, otherwise use the state
      const loc = location || userLocation;
      
      if (!loc) {
        console.log("User location not available yet");
        return;
      }
      
      console.log("Fetching bulletins for location:", loc.lat, loc.lng);
      
      // Use query parameters for GET request
      const response = await axios.get('http://localhost:4000/api/bulletin/nearby', {
        params: {
          longitude: loc.lng,
          latitute: loc.lat, // Note: Backend uses "latitute" instead of "latitude"
          radius: 2000 // 2000 meters
        }
      });

      if (response.data && response.data.success) {
        console.log("Bulletins found:", response.data.data.length);
        // Update bulletins in socket context
        updateBulletins(response.data.data || []);
        if (response.data.data.length > 0) {
          toast.info(`${response.data.data.length} announcements found in your area.`);
        } else {
          toast.info("No announcements found in your area");
        }
      } else {
        console.error("Unexpected response format:", response.data);
        updateBulletins([]);
        setError("Received invalid data format from server.");
        toast.error("Invalid data format received from server.");
      }
    } catch (err) {
      console.error("Error fetching bulletins:", err);
      setError("Failed to load bulletins: " + (err.response?.data?.message || err.message));
      toast.error("Failed to load announcements: " + (err.response?.data?.message || err.message));
      updateBulletins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBulletin = async (content) => {
    if (!userLocation) {
      setError("Location not available. Please enable location services.");
      toast.error("Location information not available. Please enable location services.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter announcement content.");
      toast.error("Please enter announcement content.");
      return;
    }

    try {
      setLoading(true);
      console.log("Creating bulletin at location:", userLocation.lat, userLocation.lng);
      
      const response = await axios.post('http://localhost:4000/api/bulletin/create', {
        userId: currentUser.id, // Use the ID from AuthContext
        userName: currentUser.userName || currentUser.email,
        content: content,
        location: {
          coordinates: [userLocation.lng, userLocation.lat] // GeoJSON format: [longitude, latitude]
        }
      });

      if (response.data.success) {
        // Add newly created bulletin directly to state
        const newBulletin = response.data.data;
        
        // If WebSocket update isn't working, manually fetch again
        await fetchBulletins(userLocation);
        
        setError(null);
        setIsModalOpen(false); // Close the modal after successful creation
        toast.success("Announcement created successfully!");
      } else {
        setError(response.data.message || "Failed to create announcement.");
        toast.error(response.data.message || "Failed to create announcement.");
      }
    } catch (err) {
      console.error("Error creating bulletin:", err);
      setError("Failed to create announcement. Please try again.");
      toast.error("Failed to create announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle location found from the map component
  const handleLocationFound = (latlng) => {
    console.log("Location found from map:", latlng.lat, latlng.lng);
    
    const userLoc = {
      lat: latlng.lat,
      lng: latlng.lng
    };
    
    // Only update if we don't already have a location
    if (!userLocation) {
      setUserLocation(userLoc);
      fetchBulletins(userLoc);
      toast.success("Your location was successfully obtained!");
    }
  };

  // Open report modal
  const openReportModal = (bulletinId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent the popup from closing
    }
    setSelectedBulletinId(bulletinId);
    setIsReportModalOpen(true);
  };

  // Handle report submission
  const handleReportBulletin = async (bulletinId, reason) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('http://localhost:4000/api/report/create', {
        message: reason,
        userId: currentUser.id,
        bulletinId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success("Announcement reported successfully. Thank you!");
        return response.data;
      } else {
        throw new Error(response.data.message || 'An error occurred while reporting the announcement.');
      }
    } catch (err) {
      console.error('Error reporting bulletin:', err);
      toast.error('An error occurred while reporting the announcement: ' + (err.response?.data?.message || err.message));
      throw err;
    }
  };
  
  // Memoize bulletin markers to prevent unnecessary re-renders
  const bulletinMarkers = useMemo(() => {
    if (!bulletins || !bulletins.length || !userLocation) return null;
    
    console.log('Rendering bulletin markers, count:', bulletins.length);
    
    return bulletins.map((bulletin) => {
      // Get bulletin coordinates - ensure correct order
      const bulletinLat = bulletin.location.coordinates[1]; // latitude
      const bulletinLng = bulletin.location.coordinates[0]; // longitude
      
      // Use stored offset position or calculate a new one
      const position = offsetPositions[bulletin._id] || 
        getOffsetPosition(bulletinLat, bulletinLng, userLocation.lat, userLocation.lng);
      
      return (
        <Marker 
          key={bulletin._id} 
          position={position}
          icon={BulletinIcon}
        >
          <Popup>
            <div className={styles.bulletinPopup}>
              <strong>Announcement</strong>
              <p>{bulletin.content}</p>
              <small>Posted by: {bulletin.userName}</small>
              {bulletin.userId !== currentUser.id && (
                <div className={styles.reportButtonContainer}>
                  <button 
                    className={styles.reportButton}
                    onClick={(e) => openReportModal(bulletin._id, e)}
                    title="Report this announcement"
                  >
                    <FaFlag /> Report
                  </button>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [bulletins, userLocation, offsetPositions, currentUser.id]);

  useEffect(() => {
    console.log('Bulletins state updated in SocketContext, count:', bulletins.length, 'IDs:', bulletins.map(b => b._id).join(', '));
  }, [bulletins]);

  // If not authenticated, don't render the component
  if (!isAuthenticated) {
    return null; // The useEffect will handle the redirect
  }

  return (
    <div className={styles.fullScreenContainer}>
      {error && <div className={styles.errorOverlay}>{error}</div>}
      
      {/* Add Bulletin Button */}
      <button 
        className={styles.addBulletinButton}
        onClick={() => setIsModalOpen(true)}
      >
        Add New Announcement
      </button>
      
      {/* Bulletin Count Overlay */}
      <div className={styles.bulletinCountOverlay}>
        {bulletins.length > 0 ? (
          <span>{bulletins.length} announcements found in your area</span>
        ) : (
          <span>No announcements found in your area</span>
        )}
      </div>

      
      {/* Full Screen Map */}
      <div className={styles.fullScreenMap}>
        {userLocation ? (
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={17} // Set initial zoom to 17 (street level)
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker onLocationFound={handleLocationFound} />
            
            {/* Display existing bulletins - now memoized */}
            {bulletinMarkers}
          </MapContainer>
        ) : (
          <div className={styles.loadingMap}>Loading map...</div>
        )}
      </div>
      
      {/* Bulletin Creation Modal */}
      <BulletinModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitBulletin}
        loading={loading}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        bulletinId={selectedBulletinId}
        onSubmit={handleReportBulletin}
      />

      {/* ToastContainer - Important: with high z-index value */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 9999 }}
      />
    </div>
  );
}

export default Home;