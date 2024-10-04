const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const Post = new Schema({
    assinatura: {
        type: String,
        default: "Anônimo"
    },
    texto: {
        type: String,
        required: true,
    },
    likes: {
        type: Array
    },
    imagem: {
        type: String,
        required: true,
        default: "/uploads/user.png"
    },
    idResposta: {
        type: String
        
    },
    idAutor: {
        type: String
    }
});

module.exports = mongoose.model("Post", Post);