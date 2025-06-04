import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import styles from './UserProfile.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Confirmation Modal Component
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <p>{message}</p>
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
            type="button" 
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserProfile() {
  const { currentUser, isAuthenticated } = useAuth();
  const [userBulletins, setUserBulletins] = useState([]);
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bulletinToDelete, setBulletinToDelete] = useState(null);
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchUser();
      fetchUserBulletins();
    }
  }, [isAuthenticated, currentUser]);

  const fetchUser = async() => {
    try {
      const response = await axios.get(`http://localhost:4000/api/user/${currentUser.id}`);
      if(response.data.success) {
        setUser(response.data.data);
      } else {
        setError('An error occurred while retrieving user information.');
        toast.error('Could not retrieve user information.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while retrieving user information.');
      toast.error('Could not retrieve user information: ' + (error.response?.data?.message || 'An error occurred'));
    }
  }

  const fetchUserBulletins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/api/bulletin/userbulletins`,{
        params:{
          userId:currentUser.id
        }
      });
      
      if (response.data.success) {
        setUserBulletins(response.data.data);
      } else {
        setError('An error occurred while retrieving announcements.');
        toast.error('Could not retrieve announcements.');
      }
    } catch (err) {
      console.error('Error fetching user bulletins:', err);
      setError(err.response?.data?.message || 'An error occurred while retrieving announcements.');
      toast.error('Could not retrieve announcements: ' + (err.response?.data?.message || 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // Function to open delete confirmation modal
  const openDeleteConfirmModal = (bulletinId) => {
    setBulletinToDelete(bulletinId);
    setIsConfirmModalOpen(true);
  };

  // Function to perform deletion
  const handleDeleteBulletin = async () => {
    if (!bulletinToDelete) return;
    
    try {
      setDeleteLoading(true);
      setDeletingId(bulletinToDelete);
      
      const response = await axios.delete(`http://localhost:4000/api/bulletin/${bulletinToDelete}`);
      
      if (response.data.success) {
        // Remove the deleted bulletin from the state
        setUserBulletins(prevBulletins => 
          prevBulletins.filter(bulletin => bulletin._id !== bulletinToDelete)
        );
        toast.success('Announcement successfully deleted.');
      } else {
        setError('An error occurred while deleting the announcement.');
        toast.error('Could not delete announcement.');
      }
    } catch (err) {
      console.error('Error deleting bulletin:', err);
      setError(err.response?.data?.message || 'An error occurred while deleting the announcement.');
      toast.error('Could not delete announcement: ' + (err.response?.data?.message || 'An error occurred'));
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
      setIsConfirmModalOpen(false);
      setBulletinToDelete(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          Please log in to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <h1>Profile</h1>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className={styles.userDetails}>
              <h2>{user.userName || 'User'}</h2>
              <p>{user.email}</p>
              <Link to={`/user/update/${user._id}`} className={styles.updateProfileButton}>
                Update Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bulletinsSection}>
        <h2>My Announcements</h2>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div className={styles.loadingMessage}>
            Loading announcements...
          </div>
        ) : userBulletins.length === 0 ? (
          <div className={styles.emptyMessage}>
            You haven't created any announcements yet.
          </div>
        ) : (
          <div className={styles.bulletinsList}>
            {userBulletins.map(bulletin => (
              <div key={bulletin._id} className={styles.bulletinCard}>
                <div className={styles.bulletinContent}>
                  <p>{bulletin.content}</p>
                  <div className={styles.bulletinMeta}>
                    <span className={styles.bulletinDate}>
                      {formatDate(bulletin.createdAt)}
                    </span>
                    <span className={styles.bulletinLocation}>
                      Location: {bulletin.location.coordinates[1].toFixed(6)}, {bulletin.location.coordinates[0].toFixed(6)}
                    </span>
                  </div>
                </div>
                <Link to={`/user/bulletin/${bulletin._id}`} className={styles.updateButton}>
                  Update
                </Link>
                <button 
                  className={styles.deleteButton}
                  onClick={() => openDeleteConfirmModal(bulletin._id)}
                  disabled={deleteLoading && deletingId === bulletin._id}
                >
                  {deleteLoading && deletingId === bulletin._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeleteBulletin}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        loading={deleteLoading}
      />

      {/* Toast Container */}
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

export default UserProfile;