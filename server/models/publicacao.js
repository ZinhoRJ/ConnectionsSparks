const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const Comentario = new Schema({
    titulo: {
        type: String,
        required: true
    },
    assinatura: {
        type: String,
        default: "Anônimo"
    },
    texto: {
        type: String,
        required: true,
    },
    idGrupo: {
        type: String
    }
});

module.exports = mongoose.model("Publicacao", Comentario);