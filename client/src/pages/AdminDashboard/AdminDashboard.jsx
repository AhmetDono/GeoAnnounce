import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/adminsidebar/AdminSidebar';
import styles from './AdminDashboard.module.css';
import axios from 'axios';

function AdminDashboard() {
  const { currentUser, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBulletins: 0,
    totalReports: 0,
    recentBulletins: [],
    recentUsers: [],
    recentReports: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Make the requests separately for better error handling
        let users = [];
        let bulletins = [];
        let reports = [];
        let totalUsers = 0;
        let totalBulletins = 0;
        let totalReports = 0;
        
        try {
          // Kullanıcılar için API çağrısı - pagination bilgisini kullanarak toplam sayıyı al
          const usersResponse = await axios.get('http://localhost:4000/api/user/getall', {
            params: {
              page: 1,
              limit: 5 // Sadece son 5 kullanıcıyı al
            }
          });
          
          if (usersResponse.data && (usersResponse.data.success === true || usersResponse.data.success === "true")) {
            users = usersResponse.data.data || [];
            // Pagination bilgisinden toplam kullanıcı sayısını al
            totalUsers = usersResponse.data.pagination?.totalUsers || 0;
          } else {
            console.warn('Unexpected users response format:', usersResponse.data);
          }
        } catch (userErr) {
          console.error('Error fetching users:', userErr);
        }
        
        try {
          // Duyurular için API çağrısı - pagination bilgisini kullanarak toplam sayıyı al
          const bulletinsResponse = await axios.get('http://localhost:4000/api/bulletin/getall', {
            params: {
              page: 1,
              limit: 5 // Sadece son 5 duyuruyu al
            }
          });
          
          if (bulletinsResponse.data && (bulletinsResponse.data.success === true || bulletinsResponse.data.success === "true")) {
            bulletins = bulletinsResponse.data.data || [];
            // Pagination bilgisinden toplam duyuru sayısını al
            totalBulletins = bulletinsResponse.data.pagination?.totalBulletins || 0;
          } else {
            console.warn('Unexpected bulletins response format:', bulletinsResponse.data);
          }
        } catch (bulletinErr) {
          console.error('Error fetching bulletins:', bulletinErr);
        }
        
        try {
          // Raporlar için API çağrısı - pagination bilgisini kullanarak toplam sayıyı al
          const reportsResponse = await axios.get('http://localhost:4000/api/report/getall', {
            params: {
              page: 1,
              limit: 5 // Sadece son 5 raporu al
            }
          });
          
          if (reportsResponse.data && (reportsResponse.data.success === true || reportsResponse.data.success === "true")) {
            reports = reportsResponse.data.data || [];
            // Pagination bilgisinden toplam rapor sayısını al
            totalReports = reportsResponse.data.pagination?.totalReports || 0;
          } else {
            console.warn('Unexpected reports response format:', reportsResponse.data);
          }
        } catch (reportErr) {
          console.error('Error fetching reports:', reportErr);
        }
        
        // Process the data safely
        setStats({
          totalUsers: totalUsers,
          totalBulletins: totalBulletins,
          totalReports: totalReports,
          recentUsers: users.map(user => ({
            ...user,
            createdAt: user.createdAt || new Date().toISOString() // Provide default if missing
          })),
          recentBulletins: bulletins.map(bulletin => ({
            ...bulletin,
            createdAt: bulletin.createdAt || new Date().toISOString() // Provide default if missing
          })),
          recentReports: reports.map(report => ({
            ...report,
            createdAt: report.createdAt || new Date().toISOString() // Provide default if missing
          }))
        });
        
        setError(null);
      } catch (err) {
        console.error('Error in fetchStats:', err);
        setError('An error occurred while loading data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [hasRole, navigate]);

  // Safer date formatting function
  const formatDate = (dateString) => {
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      // Check if dateString is valid
      if (!dateString) {
        return 'No date information';
      }
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('tr-TR', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Truncate text for display
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {currentUser?.userName || 'Admin'}!</p>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <h3>Total Users</h3>
                  <p className={styles.statValue}>{stats.totalUsers}</p>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <h3>Total Announcements</h3>
                  <p className={styles.statValue}>{stats.totalBulletins}</p>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <h3>Total Reports</h3>
                  <p className={styles.statValue}>{stats.totalReports}</p>
                </div>
              </div>
            </div>
            
            <div className={styles.recentDataGrid}>
              {/* Son Kullanıcılar, Duyurular ve Raporlar bölümleri aynı kalacak */}
              {/* ... */}
              <div className={styles.recentDataCard}>
                <div className={styles.cardHeader}>
                  <h2>Latest Users</h2>
                  <button className={styles.viewAllButton} onClick={() => navigate('/admin/users')}>
                    Show All
                  </button>
                </div>
                
                {stats.recentUsers.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Email</th>
                          <th>Registration Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentUsers.map(user => (
                          <tr key={user._id || `user-${Math.random()}`}>
                            <td>{user.userName || 'No Name'}</td>
                            <td>{user.email || 'No Email'}</td>
                            <td>{formatDate(user.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>There are no users yet.</p>
                  </div>
                )}
              </div>
              
              <div className={styles.recentDataCard}>
                <div className={styles.cardHeader}>
                  <h2>Latest Announcements</h2>
                  <button className={styles.viewAllButton} onClick={() => navigate('/admin/bulletins')}>
                    Show All
                  </button>
                </div>
                
                {stats.recentBulletins.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Contents</th>
                          <th>User</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentBulletins.map(bulletin => (
                          <tr key={bulletin._id || `bulletin-${Math.random()}`}>
                            <td className={styles.contentCell}>{truncateText(bulletin.content)}</td>
                            <td>{bulletin.userName || 'No Name'}</td>
                            <td>{formatDate(bulletin.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>There are no announcements yet.</p>
                  </div>
                )}
              </div>
              
              <div className={styles.recentDataCard}>
                <div className={styles.cardHeader}>
                  <h2>Latest Reports</h2>
                  <button className={styles.viewAllButton} onClick={() => navigate('/admin/reports')}>
                    Show All
                  </button>
                </div>
                
                {stats.recentReports.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Report Message</th>
                          <th>Report By</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentReports.map(report => (
                          <tr key={report._id || `report-${Math.random()}`}>
                            <td className={styles.contentCell}>{truncateText(report.message)}</td>
                            <td>{report.userId?.userName || 'Unknown'}</td>
                            <td>{formatDate(report.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>There are no reports yet.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;