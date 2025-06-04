const Report = require('../models/Report');


exports.create = async(req,res) => {
    try {
        const {message,userId, bulletinId} = req.body;
        if(!message || !userId || !bulletinId)
            return res.status(400).json({
                success: false, 
                msg:"Gerekli alanlarda problem var"}
            );
        
        const newReport = new Report({
            message,
            userId,
            bulletinId
        });

        const savedReport = await newReport.save();

        return res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: savedReport
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the report',
            error: error.message
        });
    }
}

exports.delete = async(req,res) => {
    try {
        const reportId = req.params.id;
        
        if (!reportId) {
            return res.status(400).json({
                success: false,
                message: 'Report ID is required'
            });
        }

        const report = await Report.findById(reportId);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        await Report.findByIdAndDelete(reportId);

        return res.status(200).json({
            success: true,
            message: 'Report deleted successfully'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the report',
            error: error.message
        });
    }
};

exports.getAll = async(req,res) => {
    try {
        const {page = 1, limit = 10 } = req.query;
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Find reports with pagination
        const reports = await Report.find()
            .populate('userId', 'userName email')
            .populate('bulletinId', 'content')
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(parseInt(limit));
            
        const totalReports = await Report.countDocuments();
        
        return res.status(200).json({
            success: true,
            message: 'Reports retrieved successfully',
            data: reports,
            pagination: {
                totalReports,
                totalPages: Math.ceil(totalReports / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving reports',
            error: error.message
        });
    }
};

exports.getById = async(req, res) => {
    try {
        const reportId = req.params.id;
        
        if (!reportId) {
            return res.status(400).json({
                success: false,
                message: 'Report ID is required'
            });
        }

        const report = await Report.findById(reportId)
            .populate('userId', 'userName email')
            .populate('bulletinId', 'content');
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Report retrieved successfully',
            data: report
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving the report',
            error: error.message
        });
    }
};