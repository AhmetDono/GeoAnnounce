const express = require("express");
const UserController = require('../controllers/User');
const { verifyToken, isAdmin, isResourceOwner, isAuthenticated } = require('../middlewares/AuthorizationCheck');

const router = express.Router();

router.post('/register',UserController.create);
router.post('/login',UserController.login);
router.get('/getall',verifyToken, isAdmin,UserController.getAll);
// eğer GET /:id router üstte olursa herhangi bir get işlemi için önce onu yakalıyor
// bu sebeple getAll düzgün çalışmıyor bu yüzden spesifik endpointler başa yazılmalı
router.get('/:id',verifyToken,isAuthenticated,UserController.getOne);
//! başkalarının profilnini görebilir bir kişi bu yüzden auth olamsı yeter
router.put('/:id',verifyToken,isResourceOwner('User', 'id', '_id'),UserController.update); //TODO POST  => hepsi aynı endpoint ama işlemler farklı
router.delete('/:id',verifyToken,isResourceOwner('User', 'id', '_id'),UserController.delete); //DELETE



module.exports = router;