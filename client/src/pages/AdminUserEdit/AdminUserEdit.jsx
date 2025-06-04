import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/adminsidebar/AdminSidebar';
import styles from './AdminUserEdit.module.css';
import axios from 'axios';

function AdminUserEdit() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    roles: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const availableRoles = ['user', 'admin']; // Add more roles as needed

  useEffect(() => {
    // Check if user is admin
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }

    // Fetch user data
    fetchUser();
  }, [id, hasRole, navigate]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/api/user/${id}`);
      
      if (response.data && response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        
        // Set form data with user data (excluding password)
        setFormData({
          userName: userData.userName || '',
          email: userData.email || '',
          password: '', // Password is empty by default
          roles: userData.roles || ['user']
        });
        
        setError(null);
      } else {
        setError('User information could not be retrieved.');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('An error occurred while loading the user: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleToggle = (role) => {
    setFormData(prev => {
      // If role exists in array, remove it, otherwise add it
      if (prev.roles.includes(role)) {
        return {
          ...prev,
          roles: prev.roles.filter(r => r !== role)
        };
      } else {
        return {
          ...prev,
          roles: [...prev.roles, role]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.userName.trim()) {
      setError('Usernama is required');
      return;
    }
    
    if (formData.roles.length === 0) {
      setError('At least one role must be selected.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Prepare data for update
      const updateData = {
        userName: formData.userName,
        roles: formData.roles
      };
      
      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      // Send update request
      const response = await axios.put(`http://localhost:4000/api/user/${id}`, updateData);
      
      if (response.data && response.data.success) {
        setSuccessMessage('User updated successfully.');
        
        // Refresh user data
        fetchUser();
      } else {
        setError('An error occurred while updating the user.');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('An error occurred while updating the user: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1>Update User</h1>
          <p>Update user information.</p>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading user information...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={fetchUser}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className={styles.formContainer}>
            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.userForm}>
              <div className={styles.formGroup}>
                <label htmlFor="userName">User Name</label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="User Name"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className={styles.formInput}
                  disabled
                  title="Email adresi değiştirilemez"
                />
                <small className={styles.helperText}>Email address cannot be changed.</small>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="New password (leave blank if you don't want to change it)"
                />
                <small className={styles.helperText}>If you do not want to change the password, leave it blank.</small>
              </div>
              
              <div className={styles.formGroup}>
                <label>Roles</label>
                <div className={styles.rolesContainer}>
                  {availableRoles.map(role => (
                    <div key={role} className={styles.roleItem}>
                      <label className={styles.roleLabel}>
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          className={styles.roleCheckbox}
                        />
                        <span className={styles.roleName}>{role}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <small className={styles.helperText}>At least one role must be selected.</small>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => navigate('/admin/users')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
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

export default AdminUserEdit;