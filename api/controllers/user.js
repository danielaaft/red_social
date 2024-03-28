'use strict'

var bcrypt = require('bcrypt');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var fs = require('fs');
var path = require('path');
const { restart } = require('nodemon');
var jwt = require('../services/jwt');

//Métodos de prueba
function home(req, res) {
    res.status(200).send({
        message: 'Hola mundo desde el servidor de NodeJS'
    });
};

function pruebas(req, res) {
    console.log('hola');
    res.status(200).send({
        message: 'Acción de pruebas en el servidor de NodeJS'
    });
};

//Registro
function saveUser(req, res) {
    var params = req.body;
    var user = new User();

    if (params.name && params.surname &&
        params.nick && params.email && params.password) {

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = "ROLE_USER";
        user.image = null;

        console.log("Nuevo usuario:", user);

        // Controlar usuarios duplicados
        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        })
            .then(users => {
                if (users && users.length >= 1) {
                    return res.status(200).send({ message: 'El usuario que intentas registrar ya existe en la bbdd' });
                } else {
                    // Cifrar contraseña y guardar los datos
                    console.log('El usuario no existe en la bbdd, se puede crear');
                    bcrypt.hash(params.password, 10, (err, hash) => {
                        if (err) {
                            console.error('Error al cifrar la contraseña:', err);
                            return res.status(500).send({ message: 'Error al cifrar la contraseña' });
                        }
                        user.password = hash;
                        console.log('Contraseña cifrada:', user.password);
                        user.save()
                            .then(userStored => {
                                if (userStored) {
                                    console.log('Usuario guardado en la base de datos:', userStored);
                                    res.status(200).send({ user: userStored });
                                } else {
                                    res.status(400).send({ message: 'No se ha registrado el usuario' });
                                }
                            })
                            .catch(err => {
                                console.error('Error al guardar el usuario:', err);
                                res.status(500).send({ message: 'Error al guardar el usuario' });
                            });
                    });
                }
            })
            .catch(err => {
                console.error('Error en la petición de usuarios:', err);
                res.status(500).send({ message: 'Error en la petición de usuarios' });
            });
    } else {
        res.status(400).send({
            message: "Envía todos los campos necesarios!!"
        });
    }
}


//Login
function loginUser(req, res) {
    const params = req.body;
    const email = params.email;
    const password = params.password;

    let foundUser;

    console.log("Email:", email);
    User.findOne({ email: email })
        .then((user) => {
            console.log("Usuario encontrado:", user);
            foundUser = user;
            if (!user) {
                return res
                    .status(404)
                    .send({ message: "El usuario no se ha podido identificar" });
            }

            // Devolver una promesa de la comparación de contraseñas
            return bcrypt.compare(password, user.password);
        })
        .then((check) => {
            console.log("Contraseña verificada:", check);
            if (check) {

                if (params.gettoken) {
                    //generar y devolver token
                    return res.status(200).send({
                        token: jwt.createToken(foundUser)
                    });
                } else {
                    //Creamos un nuevo objeto sin la contraseña
                    const userWithoutPassword = { ...foundUser.toObject(), password: undefined };
                    //devolver datos del usuario sin contraseña
                    return res.status(200).send({ user: userWithoutPassword, message: "Usuario logueado" });
                }

            } else {
                return res
                    .status(404)
                    .send({ message: "El usuario no se ha podido identificar" });
            }
        })
        .catch((err) => {
            console.error("Error al comparar contraseñas:", err);
            return res.status(500).send({ message: "Error en la petición" });
        });
}


//Cpnseguir datos de un usuario
function getUser(req, res) {
    var userId = req.params.id;

    User.findById(userId)
        .then((user) => {
            if (!user)
                return res.status(404).send({ message: 'El usuario no existe' })
            return res.status(200).send({ user });
        })
        .catch((err) => {
            return res.status(500).send({ message: 'Error en la petición' });
        });
}

//Devolver un listado de usuarios paginado
function getUsers(req, res) {
    var identity_user_id = req.user.sub;
    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 5;

    var usersQuery = User.find().sort('_id').skip((page - 1) * itemsPerPage).limit(itemsPerPage);
    var countQuery = User.countDocuments();

    Promise.all([usersQuery, countQuery])
        .then(([users, total]) => {
            if (total === 0) {
                return res.status(404).send({ message: 'No hay usuarios disponibles' });
            }

            return res.status(200).send({
                users,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        })
        .catch((err) => {
            return res.status(500).send({ message: 'Error en la petición' });
        });
}

//Edición de datos de usuario
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;

    // Borramos la propiedad password del objeto update
    delete update.password;

    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tienes permiso para actualizar los datos del usuario' });
    }

    User.findByIdAndUpdate(userId, update, { new: true })
        .then(userUpdated => {
            if (!userUpdated) {
                return res.status(404).send({ message: 'No se ha podido actualizar el usuario.' });
            }
            return res.status(200).send({ user: userUpdated });
        })
        .catch(err => {
            return res.status(500).send({ message: 'Error en la petición' });
        });
}

//subir archivos de imagen/avatar usuario
function uploadImage(req, res) {
    var userId = req.params.id;



    try {
        if (!req.file) {
            return res.status(200).send({ message: 'No se han subido imágenes' });
        }

        var file_path = req.file.path;
        console.log('file path: ' + file_path);

        var file_split = file_path.split('\\');
        console.log('file split: ' + file_split);

        var file_name = file_split[2];
        console.log('file name: ' + file_name);

        var ext_split = file_name.split('\.');
        console.log('file ext: ' + ext_split);

        var file_ext = ext_split[1];
        console.log(file_ext);

        if (userId != req.user.sub) {
            //no tienes permiso
            console.log('usuario sin permiso ')
            removeFilesOfUploads(file_path)
            return res.status(403).send({ message: 'No tienes permiso para actualizar los datos del usuario' });
        }

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
            //Actualizar documento de usuario logueado.
            User.findByIdAndUpdate(userId, {image: file_name}, { new: true })
                .then(userUpdated => {
                    if (!userUpdated) {
                        return res.status(404).send({ message: 'No se ha podido actualizar la imagen de usuario.' });
                    }
                    return res.status(200).send({ user: userUpdated, message:'Archivo subido y actualizado '});
                })
                .catch(err => {
                    return res.status(500).send({ message: 'Error en la petición' });
                });
            //return res.status(200).send({ message: 'Archivo subido correctamente' });
        } else {
            console.log('La extensión no es válida')
            removeFilesOfUploads(file_path);
            return res.status(200).send({ message: 'Archivo eliminado por no ser de extensión válida' });

        }

        // Resto de la lógica para manejar el archivo subido


    } catch (error) {
        console.error('Error al subir el archivo:', error);
        return res.status(500).send({ message: 'Error al subir el archivo' });
    }
}

function removeFilesOfUploads(file_path) {
    fs.unlink(file_path, (err) => {
        if (err) {
            console.log('Error el aliminar el archivo, ', err);
        } else {
            console.log('Archivo eliminado: ', file_path);
        }

    });
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/'+image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({message: 'No existe la imagen...'});
        }
    });
}


module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile
}

