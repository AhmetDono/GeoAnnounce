import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

function Navbar() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.navLogo}>
          <span className={styles.logoText}>Announce</span>
          <span className={styles.logoAccent}>It</span>
        </Link>

        {/* Hamburger menu for mobile */}
        <div 
          className={`${styles.menuIcon} ${isMenuOpen ? styles.active : ''}`} 
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Navigation links */}
        <ul className={`${styles.navMenu} ${isMenuOpen ? styles.active : ''}`}>
          <li className={styles.navItem}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
            >
              Home page
            </Link>
          </li>
          
          {isAuthenticated ? (
            <>
                <li className={styles.navItem}>
                  <Link 
                    to="/user" 
                    className={`${styles.navLink} ${location.pathname === '/user' ? styles.active : ''}`}
                  >
                    <div className={styles.profileLinkContent}>
                      <span>My Profile</span>
                      <div className={styles.userAvatar}>
                        {currentUser?.userName ? currentUser.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                  </Link>
                </li>
                <li className={styles.navItem}>
                <button 
                  onClick={handleLogout} 
                  className={styles.logoutButton}
                >
                  Log out
                </button>
              </li>
            </>
          ) : (
            <>
              <li className={styles.navItem}>
                <Link 
                  to="/login" 
                  className={`${styles.navLink} ${location.pathname === '/login' ? styles.active : ''}`}
                >
                  Login
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link 
                  to="/register" 
                  className={`${styles.navLink} ${location.pathname === '/register' ? styles.active : ''}`}
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;