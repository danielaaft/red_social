'use strict'

var express = require('express');
var UserController = require('../controllers/user');

var api = express.Router();
var md_auth = require('../middelware/authenticated');

//var multipart = require('connect-multiparty');
//var md_upload = multipart({ dest: 'uploads/users' });

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/users'); // Directorio donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
    }
});
const md_upload = multer({ storage: storage });



api.get('/home', UserController.home);
api.get('/pruebas',md_auth.ensureAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?',md_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload.single('image')], UserController.uploadImage);
api.get('/get-image-user/:imageFile', UserController.getImageFile);

module.exports = api;