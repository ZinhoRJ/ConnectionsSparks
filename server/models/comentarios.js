const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const Comentario = new Schema({
    assinatura: {
        type: String,
        default: "Anônimo"
    },
    texto: {
        type: String,
        required: true,
    },
    imagem: {
        type: String,
        required: true,
        default: "/uploads/user.png"
    },
    idResposta: {
        type: String
        
    }
});

module.exports = mongoose.model("Comentario", Comentario);