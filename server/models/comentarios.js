const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const Comentario = new Schema({
    assinatura: {
        type: String,
        required: true,
        default: "Anônimo",
    },
    texto: {
        type: String,
        required: true,
    },
    imagem: {
        type: String,
        default: "../public/img/1"
    },
    idResposta: {
        type: String
        
    }
});

module.exports = mongoose.model("Comentario", Comentario);