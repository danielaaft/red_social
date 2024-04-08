'user strict'

var express = require('express');
var PublicationController = require('../controllers/publication');
var api = express.Router();
var md_auth = require('../middelware/authenticated');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './upload/publications'});

api.get('/probando-pub', md_auth.ensureAuth, PublicationController.probando);
api.post('/publication', md_auth.ensureAuth, PublicationController.savePublication);

module.exports = api;