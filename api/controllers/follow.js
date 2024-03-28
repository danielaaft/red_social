'use strict'

// var path = require('path')
// var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req, res) {
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save()
        .then(followStored => {
            if (!followStored) {
                return res.status(404).send({ message: 'El seguimiento no se ha guardado' });
            }
            res.status(200).send({ follow: followStored });
        })
        .catch(err => {
            res.status(500).send({ message: 'Error al guardar el seguimiento', error: err });
        });
}

function deleteFollow(req, res) {
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.findOneAndDelete({'user': userId, 'followed': followId})
        .then(result => {
            if (!result) {
                return res.status(404).send({ message: 'El follow no se ha encontrado o ya ha sido eliminado' });
            }
            return res.status(200).send({ message: 'El follow se ha eliminado con éxito.' });
        })
        .catch(err => {
            return res.status(500).send({ message: 'Error al dejar de seguir', error: err });
        });
}

function getFollowingUsers(req, res) {
    var userId = req.user.sub;
    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    var page = 1;
    if (req.params.page) {
        page = parseInt(req.params.page);
    } else {
        page = req.params.id;
    }

    var itemsPerPage = 4;

    Follow.find({ user: userId })
        .populate({ path: 'followed' })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .then(follows => {
            if (!follows || follows.length === 0) {
                return res.status(404).send({ message: 'No estás siguiendo a ningún usuario.' });
            }
            Follow.countDocuments({ user: userId })
                .then(total => {
                    return res.status(200).send({
                        total: total,
                        pages: Math.ceil(total / itemsPerPage),
                        follows
                    });
                })
                .catch(err => {
                    return res.status(500).send({ message: 'Error en el servidor', error: err });
                });
        })
        .catch(err => {
            return res.status(500).send({ message: 'Error en el servidor', error: err });
        });
}

function getFollowedUsers(req, res) {
    var userId = req.user.sub;
    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    var page = 1;
    if (req.params.page) {
        page = parseInt(req.params.page);
    } else {
        page = req.params.id;
    }

    var itemsPerPage = 4;

    Follow.find({ followed: userId })
        .populate({ path: 'followed' })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .then(follows => {
            if (!follows || follows.length === 0) {
                return res.status(404).send({ message: 'No te sigue ningún usuario.' });
            }
            Follow.countDocuments({ followed: userId })
                .then(total => {
                    return res.status(200).send({
                        total: total,
                        pages: Math.ceil(total / itemsPerPage),
                        follows
                    });
                })
                .catch(err => {
                    return res.status(500).send({ message: 'Error en el servidor', error: err });
                });
        })
        .catch(err => {
            return res.status(500).send({ message: 'Error en el servidor', error: err });
        });
}







module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers
}
