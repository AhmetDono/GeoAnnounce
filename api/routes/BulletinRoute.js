const express = require("express");
const BulletinController = require('../controllers/Bulletin');
const { verifyToken, isAdmin, isResourceOwner, isAuthenticated } = require('../middlewares/AuthorizationCheck');

const router = express.Router();

router.post('/create',verifyToken,isAuthenticated,BulletinController.create);
router.get('/nearby',verifyToken,isAuthenticated,BulletinController.getNearby);
router.get('/userbulletins',verifyToken,isAuthenticated,BulletinController.getByUser);
 //! başkalarının profilinden bulletins i görebilir bu yüzden auth olması yeter
router.get('/getall',verifyToken,isAdmin,BulletinController.getAll);
router.get('/:id',verifyToken,isAuthenticated,BulletinController.getOne);
router.put('/:id',verifyToken,isResourceOwner('Bulletin'),BulletinController.update);
router.delete('/:id',verifyToken,isResourceOwner('Bulletin'),BulletinController.delete);


module.exports = router;