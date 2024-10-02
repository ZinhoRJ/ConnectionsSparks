const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const GrupoSchema = new Schema({
    nome: {
        type: String,
        default: "Sem Nome"
    },
    descricao: {
        type: String,
        default: ""
    },
    membros: {
        type: Array,
    },
    criador: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Grupo", GrupoSchema);
