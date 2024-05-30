const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const PerfilSchema = new Schema({
    nome: {
        type: String,
        required: true
    },
    insta: {
        type: String,
        default: null
    },
    sexo: {
        type: String,
        required: true
    },
    nascimento: {
        type: Date,
        required: true
    },
    bio: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tags: {
        type: String
    }
});

module.exports = mongoose.model("Perfil", PerfilSchema);