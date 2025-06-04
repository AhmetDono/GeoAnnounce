import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.errorCode}>404</div>
        
        <div className={styles.iconContainer}>
          <div className={styles.icon}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
            </svg>
          </div>
        </div>
        
        <h1 className={styles.title}>Page Not Found</h1>
        
        <p className={styles.message}>
          The page you are looking for does not exist or may have been removed.
        </p>
        
        <div className={styles.actions}>
          <Link to="/" className={styles.homeButton}>
            Go Back Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;