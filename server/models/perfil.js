const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const PerfilSchema = new Schema({
    title: {
        type: String,
        required: false
    },
    insta: {
        type: String,
        default: null
    },
    sexo: {
        type: String,
        required: false
    },
    nascimento: {
        type: Date,
        required: false
    },
    body: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tags: {
        type: Array,
        default: ""
    },
    curtidas: {
        type: Array
    },
    verificado: {
        type: Boolean,
        default: false
    },
    imagem: {
        type: String,
        default: "/uploads/user.png"
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    senha: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model("Perfil", PerfilSchema);