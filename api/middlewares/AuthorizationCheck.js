const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// JWT token doğrulama middleware'i
exports.verifyToken = (req, res, next) => {
    try {
        // Authorization header'dan token'ı al
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing'
            });
        }
        
        // "Bearer " kısmını kaldır ve sadece token'ı al
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing'
            });
        }
        
        // Token'ı doğrula
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('JWT verification error:', err);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    error: err.message
                });
            }
            
            // Doğrulanmış kullanıcı bilgilerini request nesnesine ekle
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

// Admin rolü kontrolü middleware'i
exports.isAdmin = (req, res, next) => {
    try {
        // Token doğrulandıysa, kullanıcının admin rolü var mı kontrol et
        if (!req.user || !req.user.role || !req.user.role.includes('admin')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Admin role required'
            });
        }
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization failed',
            error: error.message
        });
    }
};

/**
 * Genel kaynak sahipliği kontrolü middleware'i
 * @param {string} model - Kontrol edilecek model adı (örn. 'Bulletin', 'Comment', 'Post')
 * @param {string} paramName - URL parametresindeki ID'nin adı (varsayılan: 'id')
 * @param {string} ownerField - Model içindeki kullanıcı ID'sinin saklandığı alan adı (varsayılan: 'userId')
 * @returns {Function} Middleware fonksiyonu
 */
exports.isResourceOwner = (model, paramName = 'id', ownerField = 'userId') => {
    return async (req, res, next) => {
        try {
            // Kullanıcı doğrulaması verifyToken middleware'i tarafından yapılmış olmalı
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required before checking resource ownership'
                });
            }
            
            // URL parametresinden kaynak ID'sini al
            const resourceId = req.params[paramName];
            
            if (!resourceId) {
                return res.status(400).json({
                    success: false,
                    message: `Resource ID (${paramName}) is required`
                });
            }
            
            // Model adını kullanarak modeli dinamik olarak al
            const Model = mongoose.model(model);
            
            // Kaynağı bul
            const resource = await Model.findById(resourceId);
            
            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: `${model} not found`
                });
            }
            
            // Kullanıcı admin ise veya kaynağın sahibi ise izin ver
            if ((req.user.role && req.user.role.includes('admin')) || 
                resource[ownerField].toString() === req.user.id) {
                // Kaynağı request nesnesine ekle (isteğe bağlı)
                req.resource = resource;
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: `Access denied: You do not own this ${model.toLowerCase()}`
                });
            }
        } catch (error) {
            console.error(`${model} ownership check error:`, error);
            return res.status(500).json({
                success: false,
                message: 'Authorization failed',
                error: error.message
            });
        }
    };
};


exports.isAuthenticated = (req, res, next) => {
    try {
        // Kullanıcı doğrulaması verifyToken middleware'i tarafından yapılmış olmalı
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied: Authentication required for this action'
            });
        }
        
        // Authenticated ise, bir sonraki middleware'e geç
        next();
    } catch (error) {
        console.error('Authentication check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};