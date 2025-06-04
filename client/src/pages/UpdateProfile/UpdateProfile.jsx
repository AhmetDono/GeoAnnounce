import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './UpdateProfile.module.css';

const UpdateProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    currentPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [originalUserName, setOriginalUserName] = useState('');

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/user/${id}`);
        
        if (response.data.success) {
          const userName = response.data.data.userName || '';
          const email = response.data.data.email || '';
          setFormData(prevState => ({
            ...prevState,
            userName: userName,
            email: email
          }));
          setOriginalUserName(userName);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      }
    };

    fetchUserData();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    const isUserNameChanged = formData.userName !== originalUserName && formData.userName.trim() !== '';
    const isPasswordChanged = formData.password.trim() !== '';

    // Only validate username if it's changed
    if (isUserNameChanged) {
      if (formData.userName.length < 3) {
        newErrors.userName = 'Username must be at least 3 characters';
      }
    }

    // Only validate password if it's being changed
    if (isPasswordChanged) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      
      if (formData.password.length < 6) {
        newErrors.password = 'New password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Check if anything is being updated
    if (!isUserNameChanged && !isPasswordChanged) {
      newErrors.general = 'No changes detected. Please modify at least one field.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data based on what changed
      const updateData = {};
      
      // Only include username if it changed
      if (formData.userName !== originalUserName && formData.userName.trim() !== '') {
        updateData.userName = formData.userName;
      }
      
      // Only include password if it was entered
      if (formData.password.trim() !== '') {
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }
      
      const response = await axios.put(
        `http://localhost:4000/api/user/${id}`,
        updateData,
      );
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        
        // Update original username if it was changed
        if (updateData.userName) {
          setOriginalUserName(updateData.userName);
        }
        
        // Clear password fields
        setFormData(prevState => ({
          ...prevState,
          password: '',
          currentPassword: '',
          confirmPassword: ''
        }));
        
        // Redirect to profile page
        navigate('/user');
      }
    } catch (error) {
      console.error('Update error:', error);
      
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || 'Failed to update profile');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Update Profile</h2>
        <p>Change your username or password below</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className={styles.errorMessage}>{errors.general}</div>
        )}
        
        {/* Username Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Username</label>
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            className={`${styles.input} ${errors.userName ? styles.inputError : ''}`}
            placeholder="Enter new username"
          />
          {errors.userName && (
            <p className={styles.errorMessage}>{errors.userName}</p>
          )}
        </div>

        {/* Email Field (Disabled) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            className={`${styles.input} ${styles.disabledInput}`}
            placeholder="Email cannot be changed"
            disabled
          />
        </div>
        
        <div className={styles.divider}></div>
        
        {/* Password Fields */}
        <div className={styles.passwordSection}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`${styles.input} ${errors.currentPassword ? styles.inputError : ''}`}
              placeholder="Required to change password"
            />
            {errors.currentPassword && (
              <p className={styles.errorMessage}>{errors.currentPassword}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Enter new password"
            />
            {errors.password && (
              <p className={styles.errorMessage}>{errors.password}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className={styles.errorMessage}>{errors.confirmPassword}</p>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? (
            <>
              <span className={styles.loadingSpinner}></span>
              Updating...
            </>
          ) : (
            'Update Profile'
          )}
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;