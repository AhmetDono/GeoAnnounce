// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const userRoutes = require('./routes/UserRoute');
const bulletinRoutes = require('./routes/BulletinRoute');
const reportRoutes = require('./routes/ReportRoute');
const socketModule = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);


// Grid hücresi hesaplama fonksiyonu (1km x 1km grid)
function calculateGridCell(lat, lng) {
  // 0.01 derece yaklaşık 1.11 km
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


// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı');
    
    // HTTP sunucusunu başlat
    server.listen(process.env.PORT || 4000, () => {
      console.log(`Sunucu ${process.env.PORT || 4000} portunda çalışıyor`);
    });
    
    // Socket.io'yu başlat
    const io = socketModule.initializeSocket(server);
  })
  .catch((error) => {
    console.error('MongoDB bağlantı hatası:', error);
  });

app.use(cors({
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', userRoutes);
app.use('/api/bulletin', bulletinRoutes);
app.use('/api/report', reportRoutes);

// Socket.io ve yardımcı fonksiyonları dışa aktar
module.exports = { app, server, calculateGridCell, getNeighborCells };