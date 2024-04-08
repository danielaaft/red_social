'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-paginate-v2');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res) {
    res.status(200).send({message:'Hola desde publications controller'});
}

function savePublication(req,res) {
    var params = req.body;

    if(!params.text) return res.status(200).send({message:'Debes enviar un texto!'});

    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save()
        .then((publicationStored) => {
            if (!publicationStored)
          { return res.status(200).send({message:'La publicación no se ha podido guardar'});}
        return res.status(200).send({publication: publicationStored});
        })
        .catch((error) => {
            console.error('Error al guardar la publicación:', error);
            return res.status(500).send({message: 'Error al guardar la publicación'});
        })
        
    
}

module.exports = {
    probando,
    savePublication
}