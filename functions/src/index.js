const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialiser l'application Firebase Admin
admin.initializeApp();

// Importer les fonctions de synchronisation d'images
const imageSync = require('./imageSync');

// Exporter les fonctions Cloud
exports.syncImageUpdate = imageSync.syncImageUpdate;
exports.syncImageDelete = imageSync.syncImageDelete;
