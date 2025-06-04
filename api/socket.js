// api/socket.js
let io;

// Grid hücresi hesaplama fonksiyonu
function calculateGridCell(lat, lng) {
  const latGrid = Math.floor(lat * 10) / 10;
  const lngGrid = Math.floor(lng * 10) / 10;
  return `${latGrid}:${lngGrid}`;
}

// Komşu grid hücrelerini hesaplama
function getNeighborCells(gridCell) {
  const [latGrid, lngGrid] = gridCell.split(':').map(Number);
  
  const neighbors = [];
  for (let latOffset = -0.1; latOffset <= 0.1; latOffset += 0.1) {
    for (let lngOffset = -0.1; lngOffset <= 0.1; lngOffset += 0.1) {
      if (latOffset === 0 && lngOffset === 0) continue; // Kendisi hariç
      
      const neighborLat = Math.round((latGrid + latOffset) * 10) / 10;
      const neighborLng = Math.round((lngGrid + lngOffset) * 10) / 10;
      neighbors.push(`${neighborLat}:${neighborLng}`);
    }
  }
  
  return neighbors;
}

function initializeSocket(server) {
  const socketIo = require('socket.io');
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Kullanıcı konum bilgisini gönderdiğinde
    socket.on('join-location', (data) => {
      try {
        // Eski odadan ayrıl
        if (socket.currentRoom) {
          console.log(`User ${socket.id} leaving room ${socket.currentRoom}`);
          socket.leave(socket.currentRoom);
        }
        
        // Konum bilgisinden grid hücresini hesapla
        const gridCell = calculateGridCell(data.lat, data.lng);
        const room = `location:${gridCell}`;
        
        // Yeni odaya katıl
        console.log(`User ${socket.id} joining room ${room}`);
        socket.join(room);
        socket.currentRoom = room;
        
        // Odaya katıldıktan sonra aktif odaları logla
        console.log('Socket rooms after join:', Array.from(socket.rooms));
        console.log('All rooms:', Object.keys(io.sockets.adapter.rooms));
      } catch (error) {
        console.error("Error in join-location:", error);
      }
    });
    
    // Odaları kontrol etme olayı
    socket.on('check-rooms', () => {
      console.log(`Rooms for socket ${socket.id}:`, Array.from(socket.rooms));
      console.log('All rooms:', Object.keys(io.sockets.adapter.rooms));
      
      // Kullanıcıya odalarını bildir
      socket.emit('rooms-info', {
        socketRooms: Array.from(socket.rooms),
        allRooms: Object.keys(io.sockets.adapter.rooms)
      });
    });
    
    // Test bağlantı mesajını dinle
    socket.on('test-connection', (data) => {
      console.log('Test connection message received:', data);
      socket.emit('test-response', { message: 'Hello from server' });
    });
    
    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = {
  initializeSocket,
  getIO,
};