import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import styles from './UserUpdateBulletin.module.css';

function UserUpdateBulletin() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [bulletin, setBulletin] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchBulletin();
  }, [id]);

  const fetchBulletin = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/api/bulletin/${id}`);
      
      if (response.data && response.data.success) {
        const bulletinData = response.data.data;
        setBulletin(bulletinData);
        setContent(bulletinData.content || '');
        
        // Check if the bulletin belongs to the current user
        if (bulletinData.userId !== currentUser.id) {
          setError('You do not have permission to edit this announcement.');
        }
        
      } else {
        setError('Could not retrieve announcement information.');
      }
    } catch (err) {
      console.error('Error fetching bulletin:', err);
      setError('An error occurred while loading the announcement: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!content.trim()) {
      setError('Announcement content cannot be empty.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Send update request
      const response = await axios.put(`http://localhost:4000/api/bulletin/${id}`, {
        content: content
      });
      
      if (response.data && response.data.success) {
        setSuccessMessage('Announcement updated successfully.');
        
        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate('/user');
        }, 2000);
      } else {
        setError('An error occurred while updating the announcement.');
      }
    } catch (err) {
      console.error('Error updating bulletin:', err);
      setError('An error occurred while updating the announcement: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      if (!dateString) return 'No date information';
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Format location for display
  const formatLocation = (location) => {
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return 'No location information';
    }
    
    const [longitude, latitude] = location.coordinates;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.updateCard}>
        <div className={styles.cardHeader}>
          <h1>Edit Announcement</h1>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading announcement information...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <div className={styles.errorActions}>
              <button 
                className={styles.retryButton}
                onClick={fetchBulletin}
              >
                Try Again
              </button>
              <button 
                className={styles.backButton}
                onClick={() => navigate('/user')}
              >
                Return to Profile
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.formContainer}>
            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.bulletinForm}>
              <div className={styles.formGroup}>
                <label htmlFor="content">Announcement Content</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={styles.contentTextarea}
                  placeholder="Enter announcement content"
                  rows={5}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Creation Date</label>
                <input
                  type="text"
                  value={bulletin && formatDate(bulletin.createdAt)}
                  className={styles.formInput}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>Expiration Date</label>
                <input
                  type="text"
                  value={bulletin && formatDate(bulletin.expiresAt)}
                  className={styles.formInput}
                  disabled
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Location</label>
                <input
                  type="text"
                  value={bulletin && formatLocation(bulletin.location)}
                  className={styles.formInput}
                  disabled
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => navigate('/user')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving || !content.trim()}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserUpdateBulletin;