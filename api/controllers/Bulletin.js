// api/controllers/Bulletin.js
const Bulletin = require('../models/Bulletin');
const socketModule = require('../socket');


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

exports.create = async(req,res) => {
    try {
        const {userId, userName, content, location} = req.body;
        
        // Validasyon kontrolleri
        if(!content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Content is required' 
            });
        }
        
        if(!location || !location.coordinates || location.coordinates.length !== 2) {
            return res.status(400).json({ 
                success: false, 
                message: 'Location with valid coordinates (longitude, latitude) is required' 
            });
        }

        // Yeni duyuru oluştur
        const newBulletin = new Bulletin({
            userId,
            userName,
            content,
            location: {
                type: 'Point',
                coordinates: location.coordinates
            }
        });

        // Duyuruyu kaydet
        const savedBulletin = await newBulletin.save();

        // Socket.io ile bildirim gönderme
        try {
            const io = socketModule.getIO();
            if (io) {
                // Duyurunun konumundan grid hücresini hesapla
                const lat = location.coordinates[1]; // latitude
                const lng = location.coordinates[0]; // longitude
                const gridCell = calculateGridCell(lat, lng);
                const room = `location:${gridCell}`;
                
                console.log(`Emitting new-bulletin to room ${room}`);
                
                // Tüm bağlı kullanıcılara bildirim gönder (test için)
                io.emit('new-bulletin', savedBulletin);
                
                // İlgili odaya yeni duyuruyu bildir
                io.to(room).emit('new-bulletin', savedBulletin);
                
                // Komşu grid hücrelerine de bildirim gönder
                const neighborCells = getNeighborCells(gridCell);
                neighborCells.forEach(cell => {
                    const neighborRoom = `location:${cell}`;
                    console.log(`Emitting new-bulletin to neighbor room ${neighborRoom}`);
                    io.to(neighborRoom).emit('new-bulletin', savedBulletin);
                });
                
                // Aktif odaları logla
                console.log('Active rooms:', Object.keys(io.sockets.adapter.rooms));
            } else {
                console.warn("Socket.io instance (io) is not available");
            }
        } catch (socketError) {
            console.error("Socket notification error:", socketError);
        }

        return res.status(201).json({
            success: true,
            message: 'Bulletin created successfully',
            data: savedBulletin
        });
    } catch (error) {
        console.error("Bulletin creation error:", error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the bulletin',
            error: error.message
        });
    }
}


exports.update = async(req,res) => {
    try {
        const bulletinId = req.params.id;
        const {content} = req.body;
        if(!bulletinId)
            return res.status(400).json({
                success:false,
                msg:"Bulletin Id is required"
            });
        
        const updatedBulletin = await Bulletin.findByIdAndUpdate(bulletinId,{
            content:content,
        },{new:true});
        if(!updatedBulletin)
            return res.status(400).json({
                success:false,
                msg:"No bulletin found"
            });

        try {
            const io = socketModule.getIO();
            if (io) {
                const lat = updatedBulletin.location.coordinates[1];
                const lng = updatedBulletin.location.coordinates[0];
                const gridCell = calculateGridCell(lat, lng);
                const room = `location:${gridCell}`;
                
                console.log(`Emitting bulletin-updated to room ${room} for bulletin ${bulletinId}`);
                
                io.to(room).emit('bulletin-updated', updatedBulletin);
                
                const neighborCells = getNeighborCells(gridCell);
                neighborCells.forEach(cell => {
                    const neighborRoom = `location:${cell}`;
                    io.to(neighborRoom).emit('bulletin-updated', updatedBulletin);
                });
            }
        } catch (socketError) {
            console.error("Socket notification error during update:", socketError);
        }
        
        return res.status(200).json({
            success:true,
            msg:"bulletin updated successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while update bulletin',
            error: error.message
        });
    }
}

exports.delete = async(req,res) => {
    try {
        const bulletinId = req.params.id;

        if(!bulletinId)
            return res.status(400).json({
                success:false,
                message:"Bulletin ID is required"
            })

            const bulletinToDelete = await Bulletin.findById(bulletinId);

            if(!bulletinToDelete) {
                return res.status(404).json({
                    success: false,
                    message: "Bulletin not found"
                });
            }

             // Socket.io ile silme bildirimini gönder
            try {
                const io = socketModule.getIO();
                if (io) {
                    // 1. Duyurunun konumundan grid hücresini hesapla
                    const lat = bulletinToDelete.location.coordinates[1]; // latitude
                    const lng = bulletinToDelete.location.coordinates[0]; // longitude
                    const gridCell = calculateGridCell(lat, lng);
                    const room = `location:${gridCell}`;
                    
                    console.log(`Emitting bulletin-deleted to room ${room} for bulletin ${bulletinId}`);
                    
                    // Locationda ki grid de ki room da ki herkese bildirim gönderir
                    io.to(room).emit('bulletin-deleted', bulletinId);
                    
                    // 4. Komşu grid hücrelerine de bildirim gönder
                    const neighborCells = getNeighborCells(gridCell);
                    neighborCells.forEach(cell => {
                        const neighborRoom = `location:${cell}`;
                        console.log(`Emitting bulletin-deleted to neighbor room ${neighborRoom}`);
                        io.to(neighborRoom).emit('bulletin-deleted', bulletinId);
                    });
                    
                    // 5. Aktif odaları logla //silinebilir
                    console.log('Active rooms after deletion:', Object.keys(io.sockets.adapter.rooms));
                } else {
                    console.warn("Socket.io instance (io) is not available");
                }
            } catch (socketError) {
                console.error("Socket notification error during deletion:", socketError);
            }
        
            const deletedBulletin = await Bulletin.findByIdAndDelete(bulletinId);
            
            return res.status(200).json({
                success:true,
                message:"Bulletin deleted successfully"    
            })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deletin bulletin',
            error: error.message
        });
    }
}

exports.getNearby = async(req,res) => {
    try {
        const {longitude, latitute, radius = 2000} = req.query;
        
        if(!longitude || !latitute) {
            return res.status(400).json({
                success: false,
                message: 'Longitude and latitude are required'
            });
        }

        const lng = parseFloat(longitude);
        const lat = parseFloat(latitute);
        const maxDistance = parseInt(radius);
        
        if(isNaN(lng) || isNaN(lat)) {
            return res.status(400).json({
                success: false,
                message: 'Longitude and latitude must be valid numbers'
            });
        }
        
        const bulletins = await Bulletin.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: maxDistance,
                }
            }
        });

        return res.status(200).json({
            success: true,
            count: bulletins.length,
            data: bulletins
        });

    } catch (error) {
        console.error('Error finding nearby bulletins:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while finding nearby bulletins',
            error: error.message
        });
    }
}

exports.getByUser = async(req,res) => {
    try {
        const userId = req.query.userId;
        console.log(userId)

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const bulletins = await Bulletin.find({userId:userId});

        if(!bulletins || bulletins.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No bulletins found for this user"
            });
        }

        return res.status(200).json({
            success:true,
            count:bulletins.length,    
            data:bulletins
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the bulletin',
            error: error.message
        });
    }
    
}

exports.getOne = async(req,res) => {
    try {
        const bulletinId = req.params.id;
     if(!bulletinId)
        return res.status(400).json({msg:"Id is required"});

     const bulletin = await Bulletin.findOne({_id:bulletinId});
     if(!bulletin)
        return res.status(400).json({msg:"No bulletin found"});

     return res.status(200).json({
            success:true,
            data:bulletin
        });
    } catch (error) {
        return res.status(500).json({ message: "Sometingh went wrong", error: error.message });
    }
}

exports.getAll = async(req,res) => {
    try {
        const {page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const bulletins = await Bulletin.find({})
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(parseInt(limit));
        
        const totalBulletins = await Bulletin.countDocuments();


        if(!bulletins)
            return res.status(400).json({msg:"There is no bulletins found"});
        
        return res.status(200).json({
            success:"true",
            data:bulletins,
            pagination: {
                totalBulletins,
                totalPages: Math.ceil(totalBulletins / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        })
    } catch (error) {
        return res.status(500).json({ message: "Sometingh went wrong", error: error.message });
    }
}



module.exports = exports;