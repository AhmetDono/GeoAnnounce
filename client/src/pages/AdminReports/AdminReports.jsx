import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './AdminReports.module.css';
import { FaTrash, FaEye, FaFilter, FaSearch } from 'react-icons/fa';
import AdminSidebar from '../../components/adminsidebar/AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Onay Modalı Bileşeni
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
            {loading ? 'Ongoing...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Rapor Detay Modalı
function ReportDetailModal({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Report Details</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.detailRow}>
            <strong>Rapor ID:</strong>
            <span>{report._id}</span>
          </div>
          <div className={styles.detailRow}>
            <strong>Report Message:</strong>
            <p className={styles.reportMessage}>{report.message}</p>
          </div>
          <div className={styles.detailRow}>
            <strong>Reporting User:</strong>
            <span>{report.userId?.userName || 'Bilinmiyor'} ({report.userId?.email || 'No Email'})</span>
          </div>
          <div className={styles.detailRow}>
            <strong>Announcement Content:</strong>
            <p className={styles.bulletinContent}>{report.bulletinId?.content || 'No announce found'}</p>
          </div>
          <div className={styles.detailRow}>
            <strong>CreateAt</strong>
            <span>{new Date(report.createdAt).toLocaleString('tr-TR')}</span>
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

function AdminReports() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    bulletinId: '',
    userId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    // Check if user is admin
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }

    fetchReports();
  }, [currentPage, hasRole, navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Build query parameters - only using pagination now
      const params = {
        page: currentPage,
        limit: 10
      };
      
      const response = await axios.get('http://localhost:4000/api/report/getall', {
        params
      });
      
      if (response.data.success) {
        setReports(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('An error occurred while retrieving reports.');
        toast.error('Reports could not be obtained.');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'An error occurred while retrieving reports.');
      toast.error('Reports could not be obtained. ' + (err.response?.data?.message || 'Someting went wronge'));
    } finally {
      setLoading(false);
    }
  };

  // Silme işlemi için modal açma fonksiyonu
  const openDeleteConfirmModal = (reportId) => {
    setReportToDelete(reportId);
    setIsConfirmModalOpen(true);
  };

  // Silme işlemini gerçekleştiren fonksiyon
  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      const response = await axios.delete(`http://localhost:4000/api/report/${reportToDelete}`);
      
      if (response.data.success) {
        // Remove the deleted report from the state
        setReports(prevReports => 
          prevReports.filter(report => report._id !== reportToDelete)
        );
        setSelectedReports(prev => prev.filter(id => id !== reportToDelete));
        toast.success('The report was deleted successfully.');
      } else {
        setError('An error occurred while deleting the report.');
        toast.error('The report could not be deleted.');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError(err.response?.data?.message || 'An error occurred while deleting the report.');
      toast.error('Report could not be deleted: ' + (err.response?.data?.message || 'Something went wronge'));
    } finally {
      setDeleteLoading(false);
      setIsConfirmModalOpen(false);
      setReportToDelete(null);
    }
  };

  // Rapor detayını görüntüleme fonksiyonu
  const openReportDetail = async (reportId) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`http://localhost:4000/api/report/${reportId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setSelectedReport(response.data.data);
        setIsDetailModalOpen(true);
      } else {
        toast.error('Report details could not be obtained.');
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
      toast.error('Report details could not be obtained: ' + (err.response?.data?.message || 'Something went wronge'));
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme işlemi - artık client-side yapılacak
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Arama işlemi
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Sayfalama işlemi
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Tarih formatı
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mesaj kısaltma
  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Handle report selection
  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });
  };

  // Handle select all reports
  const handleSelectAll = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredReports.map(report => report._id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) return;
    
    try {
      setDeleteLoading(true);
      
      // In a real app, you would have a bulk delete endpoint
      // For now, we'll delete one by one
      const deletePromises = selectedReports.map(reportId => 
        axios.delete(`http://localhost:4000/api/report/${reportId}`)
      );
      
      await Promise.all(deletePromises);
      
      // Remove deleted reports from state
      setReports(prev => prev.filter(report => !selectedReports.includes(report._id)));
      setSelectedReports([]);
      toast.success(`${selectedReports.length} the report was deleted successfully.`);
    } catch (err) {
      console.error('Error bulk deleting reports:', err);
      toast.error('An error occurred while deleting reports.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Client-side filtering and sorting
  const filteredReports = reports.filter(report => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!(
        (report.message && report.message.toLowerCase().includes(searchLower)) ||
        (report.userId?.userName && report.userId.userName.toLowerCase().includes(searchLower))
      )) {
        return false;
      }
    }
    
    // Apply bulletinId filter if provided
    if (filters.bulletinId && report.bulletinId?._id !== filters.bulletinId) {
      return false;
    }
    
    // Apply userId filter if provided
    if (filters.userId && report.userId?._id !== filters.userId) {
      return false;
    }
    
    return true;
  });

  // Apply sorting to filtered reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    // Handle nested properties
    let aValue, bValue;
    
    if (sortConfig.key.includes('.')) {
      const [obj, prop] = sortConfig.key.split('.');
      aValue = a[obj] ? a[obj][prop] : null;
      bValue = b[obj] ? b[obj][prop] : null;
    } else {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }
    
    // Handle missing values
    if (!aValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (!bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    
    // Compare values based on type
    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortConfig.direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
  });

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar activeItem="reports" />
      
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1>Reports Management</h1>
          <p>Manage announcements reported by users</p>
        </div>

        <div className={styles.actionsBar}>
          <div className={styles.filterContainer}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search report..."
                value={searchTerm}
                onChange={handleSearch}
                className={styles.searchInput}
              />
              <FaSearch className={styles.searchIcon} />
            </div>
            
            <div className={styles.filterGroup}>
              <input
                type="text"
                name="bulletinId"
                value={filters.bulletinId}
                onChange={handleFilterChange}
                placeholder="Filter by announcement ID"
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <input
                type="text"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                placeholder="Filter by user ID"
                className={styles.filterInput}
              />
            </div>
          </div>
          
          <div className={styles.bulkActions}>
            {selectedReports.length > 0 && (
              <button 
                className={styles.deleteButton}
                onClick={handleBulkDelete}
                disabled={deleteLoading}
              >
                {selectedReports.length} Delete Report
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={fetchReports}
            >
              Try Again
            </button>
          </div>
        )}

        {loading && reports.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading reports...</p>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No reports found.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCell}>
                      <input 
                        type="checkbox" 
                        checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th 
                      className={styles.sortableHeader}
                      onClick={() => requestSort('message')}
                    >
                      Report Message {getSortIndicator('message')}
                    </th>
                    <th 
                      className={styles.sortableHeader}
                      onClick={() => requestSort('userId.userName')}
                    >
                      Reporting By {getSortIndicator('userId.userName')}
                    </th>
                    <th 
                      className={styles.sortableHeader}
                      onClick={() => requestSort('bulletinId._id')}
                    >
                      Announcement ID {getSortIndicator('bulletinId._id')}
                    </th>
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
                  {sortedReports.map(report => (
                    <tr key={report._id}>
                      <td className={styles.checkboxCell}>
                        <input 
                          type="checkbox" 
                          checked={selectedReports.includes(report._id)}
                          onChange={() => handleSelectReport(report._id)}
                        />
                      </td>
                      <td className={styles.messageColumn}>{truncateMessage(report.message)}</td>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            {report.userId?.userName ? report.userId.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{report.userId?.userName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className={styles.idColumn}>{report.bulletinId?._id || 'Unknown'}</td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.viewButton}
                            onClick={() => openReportDetail(report._id)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            className={styles.deleteButton}
                            onClick={() => openDeleteConfirmModal(report._id)}
                            title="Delete Report"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button 
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <div className={styles.paginationInfo}>
                  Page {currentPage} / {totalPages}
                </div>
                
                <button 
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button 
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            )}
          </>
        )}

        {/* Onay Modalı */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleDeleteReport}
          title="Delete Report"
          message="Are you sure you want to delete this report? This action cannot be undone."
          loading={deleteLoading}
        />

        {/* Detay Modalı */}
        <ReportDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          report={selectedReport}
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
    </div>
  );
}

export default AdminReports;