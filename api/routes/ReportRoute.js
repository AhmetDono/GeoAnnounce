const express = require("express");
const ReportController = require('../controllers/Report');
const { verifyToken, isAdmin, isResourceOwner, isAuthenticated } = require('../middlewares/AuthorizationCheck');

const router = express.Router();

router.post('/create',verifyToken,isAuthenticated,ReportController.create);
router.get('/getall',verifyToken,isAdmin,ReportController.getAll)
router.get('/:id',verifyToken,isAdmin,ReportController.getById)
router.delete('/:id',verifyToken,isAdmin,ReportController.delete)

module.exports = router;