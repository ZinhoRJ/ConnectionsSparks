const mongoose = require("mongoose")
const connectDB = async () => {
    try {
        mongoose.set ("strictQuery", false);
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('[ \x1b[32m OK \x1b[0m ] ' + `Banco de dados MongoDB conectado. HOST: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectDB;