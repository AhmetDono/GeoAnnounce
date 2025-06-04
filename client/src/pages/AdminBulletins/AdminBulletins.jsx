import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/adminsidebar/AdminSidebar';
import styles from './AdminBulletins.module.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye } from 'react-icons/fa';

// Bulletin Detail Modal Component
function BulletinDetailModal({ isOpen, onClose, bulletin }) {
  if (!isOpen || !bulletin) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Announcement Details</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.detailRow}>
            <strong>Announcement ID:</strong>
            <span>{bulletin._id}</span>
          </div>
          <div className={styles.detailRow}>
            <strong>Content:</strong>
            <p className={styles.bulletinContent}>{bulletin.content}</p>
          </div>
          <div className={styles.detailRow}>
            <strong>User:</strong>
            <span>{bulletin.userName || 'İsimsiz'}</span>
          </div>
          <div className={styles.detailRow}>
            <strong>Location:</strong>
            <span>{bulletin.location && bulletin.location.coordinates ? 
              `${bulletin.location.coordinates[1].toFixed(6)}, ${bulletin.location.coordinates[0].toFixed(6)}` : 
              'No location information'}</span>
          </div>
          <div className={styles.detailRow}>
            <strong>CreateAt:</strong>
            <span>{new Date(bulletin.createdAt).toLocaleString('tr-TR')}</span>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button 
            type="button" 
            className={styles.primaryButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm Modal Component
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmButtonText, loading }) {
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
          <p className={styles.warningText}>This action cannot be undone!</p>
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className={styles.confirmDeleteButton}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmButtonText || 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminBulletins() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBulletins, setTotalBulletins] = useState(0);
  const [limit] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedBulletins, setSelectedBulletins] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bulletinToDelete, setBulletinToDelete] = useState(null);
  const [filterByUser, setFilterByUser] = useState('');
  const [users, setUsers] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }

    fetchBulletins();
    fetchUsers();
  }, [hasRole, navigate, currentPage]);

  const fetchBulletins = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/api/bulletin/getall', {
        params: {
          page: currentPage,
          limit: limit
        }
      });
      
      if (response.data && (response.data.success === true || response.data.success === "true")) {
        // Add default values for missing fields
        const processedBulletins = (response.data.data || []).map(bulletin => ({
          ...bulletin,
          createdAt: bulletin.createdAt || new Date().toISOString(),
          userName: bulletin.userName || 'İsimsiz'
        }));
        
        setBulletins(processedBulletins);
        
        // Set pagination data from API response
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalBulletins(response.data.pagination.totalBulletins || 0);
        }
        
        setError(null);
        
        if (processedBulletins.length === 0 && currentPage === 1) {
          toast.info('No announcements found.');
        }
      } else {
        console.warn('Unexpected response format:', response.data);
        setError('Announcement data could not be retrieved.');
        toast.error('Announcement data could not be retrieved.');
      }
    } catch (err) {
      console.error('Error fetching bulletins:', err);
      setError('An error occurred while loading announcements: ' + (err.response?.data?.message || err.message));
      toast.error('An error occurred while loading announcements: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/user/getall');
      
      if (response.data && (response.data.success === true || response.data.success === "true")) {
        setUsers(response.data.data || []);
      } else {
        toast.error('User data could not be retrieved.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('An error occurred while loading users: ' + (err.response?.data?.message || err.message));
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
      
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('tr-TR', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
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

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Reset to first page when searching
    // Note: In a real implementation, you would send the search term to the backend
    setCurrentPage(1);
  };

  // Handle user filter
  const handleUserFilter = (e) => {
    setFilterByUser(e.target.value);
    // Reset to first page when filtering
    // Note: In a real implementation, you would send the filter to the backend
    setCurrentPage(1);
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

  // Client-side filtering for now
  // In a real implementation, these filters would be sent to the backend
  const getFilteredBulletins = () => {
    let filteredBulletins = [...bulletins];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredBulletins = filteredBulletins.filter(bulletin => 
        (bulletin.content && bulletin.content.toLowerCase().includes(searchLower)) ||
        (bulletin.userName && bulletin.userName.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply user filter
    if (filterByUser) {
      filteredBulletins = filteredBulletins.filter(bulletin => 
        bulletin.userId === filterByUser
      );
    }
    
    return filteredBulletins;
  };

  // Get filtered bulletins
  const filteredBulletins = getFilteredBulletins();

  // Handle pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // This will trigger the useEffect to fetch bulletins for the new page
  };

  // Handle bulletin selection
  const handleSelectBulletin = (bulletinId) => {
    setSelectedBulletins(prev => {
      if (prev.includes(bulletinId)) {
        return prev.filter(id => id !== bulletinId);
      } else {
        return [...prev, bulletinId];
      }
    });
  };

  // Handle select all bulletins
  const handleSelectAll = () => {
    if (selectedBulletins.length === filteredBulletins.length) {
      setSelectedBulletins([]);
    } else {
      setSelectedBulletins(filteredBulletins.map(bulletin => bulletin._id));
    }
  };

  // Handle delete bulletin
  const handleDeleteBulletin = (bulletin) => {
    setBulletinToDelete(bulletin);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete bulletin
  const confirmDeleteBulletin = async () => {
    if (!bulletinToDelete) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:4000/api/bulletin/${bulletinToDelete._id}`);
      
      if (response.data && response.data.success) {
        // Remove bulletin from state
        setBulletins(prev => prev.filter(bulletin => bulletin._id !== bulletinToDelete._id));
        setSelectedBulletins(prev => prev.filter(id => id !== bulletinToDelete._id));
        setIsDeleteModalOpen(false);
        setBulletinToDelete(null);
        toast.success('The announcement was deleted successfully.');
        
        // Refresh the current page to get updated data
        fetchBulletins();
      } else {
        setError('The announcement could not be deleted.');
        toast.error('The announcement could not be deleted.');
      }
    } catch (err) {
      console.error('Error deleting bulletin:', err);
      setError('An error occurred while deleting the announcement: ' + (err.response?.data?.message || err.message));
      toast.error('An error occurred while deleting the announcement: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Open bulk delete modal
  const openBulkDeleteModal = () => {
    if (selectedBulletins.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedBulletins.length === 0) return;
    
    try {
      setLoading(true);
      
      // In a real app, you would have a bulk delete endpoint
      // For now, we'll delete one by one
      const deletePromises = selectedBulletins.map(bulletinId => 
        axios.delete(`http://localhost:4000/api/bulletin/${bulletinId}`)
      );
      
      await Promise.all(deletePromises);
      
      // Remove deleted bulletins from state
      setBulletins(prev => prev.filter(bulletin => !selectedBulletins.includes(bulletin._id)));
      setSelectedBulletins([]);
      setIsBulkDeleteModalOpen(false);
      toast.success(`${selectedBulletins.length} announcement was deleted successfully.`);
      
      // Refresh the current page to get updated data
      fetchBulletins();
    } catch (err) {
      console.error('Error bulk deleting bulletins:', err);
      setError('An error occurred while deleting announcements.');
      toast.error('An error occurred while deleting announcements: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // View bulletin details
  const viewBulletinDetails = (bulletin) => {
    setSelectedBulletin(bulletin);
    setIsDetailModalOpen(true);
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Find user name by ID
  const getUserNameById = (userId) => {
    const user = users.find(user => user._id === userId);
    return user ? user.userName || user.email : 'Unknown User';
  };

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1>Announcement Management</h1>
          <p>View and manage all announcements in the system.</p>
        </div>
        
        <div className={styles.actionsBar}>
          <div className={styles.filterContainer}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search Announcements"
                value={searchTerm}
                onChange={handleSearch}
                className={styles.searchInput}
              />
              <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            
            <div className={styles.userFilterContainer}>
              <select
                value={filterByUser}
                onChange={handleUserFilter}
                className={styles.userFilter}
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.userName || user.email || 'Unknown User'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.bulkActions}>
            {selectedBulletins.length > 0 && (
              <button 
                className={styles.deleteButton}
                onClick={openBulkDeleteModal}
                disabled={loading}
              >
                {selectedBulletins.length} Delete Announcement
              </button>
            )}
          </div>
        </div>
        
        {loading && bulletins.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Announcements are loading...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={fetchBulletins}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              {filteredBulletins.length > 0 ? (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.checkboxCell}>
                        <input 
                          type="checkbox" 
                          checked={selectedBulletins.length === filteredBulletins.length && filteredBulletins.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => requestSort('content')}
                      >
                        Content {getSortIndicator('content')}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => requestSort('userName')}
                      >
                        User {getSortIndicator('userName')}
                      </th>
                      <th>Location</th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => requestSort('createdAt')}
                      >
                        Date {getSortIndicator('createdAt')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBulletins.map(bulletin => (
                      <tr key={bulletin._id || `bulletin-${Math.random()}`}>
                        <td className={styles.checkboxCell}>
                          <input 
                            type="checkbox" 
                            checked={selectedBulletins.includes(bulletin._id)}
                            onChange={() => handleSelectBulletin(bulletin._id)}
                          />
                        </td>
                        <td className={styles.contentCell}>
                          {truncateText(bulletin.content)}
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>
                              {bulletin.userName ? bulletin.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span>{bulletin.userName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className={styles.locationCell}>
                          {formatLocation(bulletin.location)}
                        </td>
                        <td>{formatDate(bulletin.createdAt)}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button 
                              className={styles.viewButton}
                              onClick={() => viewBulletinDetails(bulletin)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className={styles.deleteButton}
                              onClick={() => handleDeleteBulletin(bulletin)}
                              title="Delete Announcement"
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
                  <p>No announcement found.</p>
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
                  Page {currentPage} / {totalPages} (Total {totalBulletins} annoucement)
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
                  Latest
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && bulletinToDelete && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setBulletinToDelete(null);
          }}
          onConfirm={confirmDeleteBulletin}
          title="Delete Announcement"
          message={<>
            <strong>"{truncateText(bulletinToDelete.content, 50)}"</strong> are you sure you want to delete the announcement?
          </>}
          confirmButtonText="Yes, Delete"
          loading={loading}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Bulk Delete Announcement"
        message={`${selectedBulletins.length} are you sure you want to delete the announcement?`}
        confirmButtonText={`Evet, ${selectedBulletins.length} Delete announcement`}
        loading={loading}
      />

      {/* Bulletin Detail Modal */}
      <BulletinDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        bulletin={selectedBulletin}
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

export default AdminBulletins;