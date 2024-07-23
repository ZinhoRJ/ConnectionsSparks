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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Grupo", GrupoSchema);
