'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

//Conexión database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/db_red_social').then(
    (() => {
        console.log("La conexión de la base de datos red social se ha realizado con éxito")

        //crear servidor
        app.listen(port, () => {
            console.log("servidor corriendo en http://localhost:3800");
        });
    })
).catch(err => console.log(err));