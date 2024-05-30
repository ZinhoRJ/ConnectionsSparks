const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const PostSchema = new Schema({
    title: {
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
    body: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tags: {
        type: Array,
        default: ""
    }
});
module.exports = mongoose.model("Post", PostSchema);