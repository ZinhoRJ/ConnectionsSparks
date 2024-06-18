require("dotenv").config();
//const client = require('./database'); // chama o arquivo contendo as informações de conexão do banco de dados

const express = require("express");
const methodOverride = require('method-override')
const expressLayout = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const MongoStore = require("connect-mongo");
const path = require("path"); //depedência de algo, mas eu não sei oq é

const connectDB = require("./server/db");
const { isActiveRoute } = require("./server/helpers/routeHelpers");

const app = express(); //toda vez que usarmos "app.algumacoisa" significa que estamos chamando o express
const PORT = 8081 || process.env.PORT; // define a porta de conexão como local (8081) ou qualquer que seja a do host (process.env)

// Conectar ao banco de dados mongol
connectDB();

// POST Data
// dependências necessárias para carregar informações nas rotas
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// Configurar cookies
app.use(session({
    secret: 'cat', //"senha" pra cada sessão
    cookie: { maxAge: 300 },
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
}));

app.use(express.static("public")); //vamos usar como static os arquivos presentes na pasta public.
app.use(express.static(path.join(__dirname, 'public'))); //USAR ESSE!
//essa vai permitir usar imagens locais em rotas do servidor, ao contrário do de cima

// MiddleWare da Template Engine
app.use(expressLayout);
app.set('layout', "./layouts/main"); //define o modelo padrão como o main.ejs (header>body>footer)
app.set("view engine", "ejs"); //define a EJS como engine de visualização padrão, daora

app.locals.isActiveRoute = isActiveRoute;

app.use("/", require("./server/routes/main")); //dizemos que vamos usar as rotas presentes no arquivo main.js, isso evitar ter que definir todas as rotas aqui
app.use("/", require("./server/routes/admin")); //a mesma coisa, mas com as rotas separadas para o administrador

app.listen(PORT, () => { //inicia o servidor como web app, usando o express!
    console.log(`Servidor aberto na porta ${PORT}`);
})