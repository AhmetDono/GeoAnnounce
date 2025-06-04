// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Socket bağlantısını başlat
  useEffect(() => {
    let newSocket = null;
    
    if (isAuthenticated) {
      console.log('Creating new socket connection');
      newSocket = io('http://localhost:4000', {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });
      
      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server with ID:', newSocket.id);
        setIsConnected(true);
        
        // Test mesajı gönder
        newSocket.emit('test-connection', { message: 'Hello from client' });
      });
      
      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
      
      // Debug: Log all events
      newSocket.onAny((event, ...args) => {
        console.log(`Socket event received: ${event}`, args);
      });
      
      setSocket(newSocket);
    }
    
    // Cleanup on unmount or when auth state changes
    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
        setSocket(null);
      }
    };
  }, [isAuthenticated]);
  
  // Konum değişikliğini bildirme - useCallback ile memoize et
  const joinLocation = useCallback((lat, lng) => {
    if (socket && isConnected) {
      console.log('Joining location room:', lat, lng);
      socket.emit('join-location', { lat, lng });
    } else {
      console.log('Cannot join location: socket not connected', { socket, isConnected });
    }
  }, [socket, isConnected]);
  
  // Yeni duyuruları dinleme
  useEffect(() => {
    if (!socket) return;
    
    const handleNewBulletin = (bulletin) => {
      console.log('New bulletin received via WebSocket:', bulletin);
      
      // Bulletin geçerli mi kontrol et
      if (!bulletin || !bulletin._id) {
        console.error('Received invalid bulletin object:', bulletin);
        return;
      }
      
      setBulletins(prev => {
        // Duyuru zaten varsa ekleme
        if (prev.some(b => b._id === bulletin._id)) {
          console.log('Bulletin already exists, not adding again:', bulletin._id);
          return prev;
        }
        
        console.log('Adding new bulletin to state:', bulletin._id);
        // Yeni duyuruyu en başa ekle
        return [bulletin, ...prev];
      });
    };

    const handleDeletedBulletin = (bulletinId) => {
    console.log('Bulletin deleted via WebSocket, ID:', bulletinId);
    
    // bulletinId geçerli mi kontrol et
    if (!bulletinId) {
      console.error('Received invalid bulletinId:', bulletinId);
      return;
    }
    
    // Önemli: Burada state güncellemesi yapılıyor
    setBulletins(prev => {
      // Silinen duyuruyu state'ten kaldır
      const filtered = prev.filter(b => b._id !== bulletinId);
      console.log(`Removed bulletin ${bulletinId} from state. Before: ${prev.length}, After: ${filtered.length}`);
      return filtered;
    });
  };

  const handleUpdatedBulletin = (updatedBulletin) => {
    console.log('Bulletin updated via WebSocket:', updatedBulletin);

  // Bulletin geçerli mi kontrol et
    if (!updatedBulletin || !updatedBulletin._id) {
      console.error('Received invalid updated bulletin object:', updatedBulletin);
      return;
    }

    setBulletins(prev => {
      // Güncellenmiş duyuruyu state'te bul ve güncelle
      return prev.map(bulletin => 
        bulletin._id === updatedBulletin._id ? updatedBulletin : bulletin
      );
    });
  }
    
    // Event listener'ları ekle
    console.log('Setting up new-bulletin event listener');
    socket.on('new-bulletin', handleNewBulletin);
    socket.on('bulletin-deleted', handleDeletedBulletin);
    socket.on('bulletin-updated', handleUpdatedBulletin);
    
    // Test için: Tüm olayları dinle
    socket.onAny((event, ...args) => {
      console.log(`Socket event received: ${event}`, args);
    });
    
    // Cleanup
    return () => {
      console.log('Removing new-bulletin event listener');
      socket.off('new-bulletin', handleNewBulletin);
      socket.off('bulletin-deleted', handleDeletedBulletin);
      socket.off('bulletin-updated', handleUpdatedBulletin);
      socket.offAny();
    };
  }, [socket]);
  



  // Duyuruları manuel olarak güncelleme (API'den alındığında) - useCallback ile memoize et
  const updateBulletins = useCallback((newBulletins) => {
    console.log('Manually updating bulletins:', Array.isArray(newBulletins) ? newBulletins.length : 'not an array');
    setBulletins(newBulletins);
  }, []);
  
  // Context değerini memoize et
  const value = useMemo(() => ({
    socket,
    isConnected,
    bulletins,
    joinLocation,
    updateBulletins
  }), [socket, isConnected, bulletins, joinLocation, updateBulletins]);
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;