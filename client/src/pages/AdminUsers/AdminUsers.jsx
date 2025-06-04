import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/adminsidebar/AdminSidebar';
import styles from './AdminUsers.module.css';
import axios from 'axios';

function AdminUsers() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }

    fetchUsers();
  }, [hasRole, navigate, currentPage]); // Added currentPage as dependency to fetch when page changes

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/api/user/getall', {
        params: {
          page: currentPage,
          limit: limit
        }
      });
      
      if (response.data && (response.data.success === true || response.data.success === "true")) {
        // Add default values for missing fields
        const processedUsers = (response.data.data || []).map(user => ({
          ...user,
          createdAt: user.createdAt || new Date().toISOString(),
          roles: user.roles || ['user']
        }));
        
        setUsers(processedUsers);
        
        // Set pagination data from API response
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalUsers(response.data.pagination.totalUsers || 0);
        }
        
        setError(null);
      } else {
        console.warn('Unexpected response format:', response.data);
        setError('User data could not be retrieved.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('An error occurred while loading users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      if (!dateString) return 'No date information';
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return 'Unvalid date';
      
      return date.toLocaleDateString('tr-TR', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Note: In a real implementation, you would send the search term to the backend
    // For now, we'll just filter the current users client-side
  };

  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    // Note: In a real implementation, you would send the sort config to the backend
  };

  // Get filtered users (client-side filtering for now)
  const getFilteredUsers = () => {
    if (!searchTerm) return users;
    
    const searchLower = searchTerm.toLowerCase();
    return users.filter(user => 
      (user.userName && user.userName.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  };

  // Apply client-side sorting to filtered users
  const getSortedUsers = () => {
    const filteredUsers = getFilteredUsers();
    
    if (!sortConfig.key) return filteredUsers;
    
    return [...filteredUsers].sort((a, b) => {
      // Handle missing values
      if (!a[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (!b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // Compare values based on type
      if (typeof a[sortConfig.key] === 'string') {
        return sortConfig.direction === 'asc' 
          ? a[sortConfig.key].localeCompare(b[sortConfig.key])
          : b[sortConfig.key].localeCompare(a[sortConfig.key]);
      } else {
        return sortConfig.direction === 'asc' 
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
      }
    });
  };

  const sortedAndFilteredUsers = getSortedUsers();

  // Handle pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // This will trigger the useEffect to fetch users for the new page
  };

  // Handle user selection
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === sortedAndFilteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(sortedAndFilteredUsers.map(user => user._id));
    }
  };

  // Handle delete user
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:4000/api/user/${userToDelete._id}`);
      
      if (response.data && response.data.success) {
        // Remove user from state
        setUsers(prev => prev.filter(user => user._id !== userToDelete._id));
        setSelectedUsers(prev => prev.filter(id => id !== userToDelete._id));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        
        // Refresh the current page to get updated data
        fetchUsers();
      } else {
        setError('The user could not be deleted.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('An error occurred while deleting the user: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`${selectedUsers.length} Are you sure you want to delete the user?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real app, you would have a bulk delete endpoint
      // For now, we'll delete one by one
      const deletePromises = selectedUsers.map(userId => 
        axios.delete(`http://localhost:4000/api/user/${userId}`)
      );
      
      await Promise.all(deletePromises);
      
      // Remove deleted users from state
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user._id)));
      setSelectedUsers([]);
      
      // Refresh the current page to get updated data
      fetchUsers();
    } catch (err) {
      console.error('Error bulk deleting users:', err);
      setError('An error occurred while deleting users.');
    } finally {
      setLoading(false);
    }
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1>User Management</h1>
          <p>View and manage all users in the system.</p>
        </div>
        
        <div className={styles.actionsBar}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
            <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          
          <div className={styles.bulkActions}>
            {selectedUsers.length > 0 && (
              <button 
                className={styles.deleteButton}
                onClick={handleBulkDelete}
                disabled={loading}
              >
                {selectedUsers.length} Kullanıcıyı Sil
              </button>
            )}
          </div>
        </div>
        
        {loading && users.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Kullanıcılar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={fetchUsers}
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              {sortedAndFilteredUsers.length > 0 ? (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.checkboxCell}>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.length === sortedAndFilteredUsers.length && sortedAndFilteredUsers.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => requestSort('userName')}
                      >
                        User Name {getSortIndicator('userName')}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => requestSort('email')}
                      >
                        Email {getSortIndicator('email')}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => requestSort('createdAt')}
                      >
                        Registration Date {getSortIndicator('createdAt')}
                      </th>
                      <th>Roles</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredUsers.map(user => (
                      <tr key={user._id || `user-${Math.random()}`}>
                        <td className={styles.checkboxCell}>
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleSelectUser(user._id)}
                          />
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>
                              {user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span>{user.userName || 'No Name'}</span>
                          </div>
                        </td>
                        <td>{user.email || 'No Email'}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className={styles.rolesList}>
                            {user.roles && user.roles.map(role => (
                              <span 
                                key={role} 
                                className={`${styles.roleTag} ${role === 'admin' ? styles.adminRole : styles.userRole}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button 
                              className={styles.editButton}
                              onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button 
                              className={styles.deleteButton}
                              onClick={() => handleDeleteUser(user)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <p>No user found.</p>
                </div>
              )}
            </div>
            
            {/* Pagination - Now using server-side pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.paginationButton}
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button 
                  className={styles.paginationButton}
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <div className={styles.paginationInfo}>
                  Page {currentPage} / {totalPages} (Total {totalUsers} user)
                </div>
                
                <button 
                  className={styles.paginationButton}
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button 
                  className={styles.paginationButton}
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Delete User</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <p>
                <strong>{userToDelete.userName || userToDelete.email || 'Bu kullanıcıyı'}</strong> Are you sure you want to delete?
              </p>
              <p className={styles.warningText}>This action cannot be undone!</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteButton}
                onClick={confirmDeleteUser}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;