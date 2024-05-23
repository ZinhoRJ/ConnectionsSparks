const express = require("express");
const router = express.Router();
const Post = require("../models/post");

router.get('/criar', async (req, res) => {
    try {
        const locals = {
            title: "Criar Perfil",
            description: "Tela da criação de perfil do usuário."
        }

        const data = await Post.find();
        res.render('criarP', {
            locals, data
        });
        console.log('Criando Perfil !')
    } catch (error) {
        console.log(`!!! ERRO NA EXECUÇÃO DA QUERY DE PERFIL: (${error})`)
    }
});

router.post('/criar', async (req, res) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body,
                insta: req.body.insta,
                nascimento: req.body.nascimento,
                sexo: req.body.sexo
            });
    
            await Post.create(newPost);
            const lastId = newPost._id;  //QUANDO PRECISAR LEVAR DIRETO AO NOVO PERFIL, NOSSA EU FUI MUITO BRABÍSSIMO AQUI
            res.redirect(`/post/${lastId}`);
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
});



// Rotas
router.get('', async (req, res) => { // não estamos usando "app.get" pois nesse caso estaremos "roteando" (sim, como um roteador) tudo e exportando até o script inicial app.js!
    // um try n' catch desse tamanho não é ideal, eu sei, mas a forma que eu fiz o sistema de páginas (control c + v) também não é o ideal, e ambos funcionam.
    try {
        const locals = {
            title: "Connections:Sparks",
            description: "sei la sei la sei la."
        }

        let perPage = 10;
        let page = req.query.page || 1;

        const data = await Post.aggregate([ {$sort: {createdAt: -1} } ])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec();

        const count = await Post.count();
        const nextPage = parseInt(page) + 1; // TryParse, transformando nextpage numa int
        const hasNextPage = nextPage <= Math.ceil(count /perPage);

        //const data = await Post.find();
        res.render('index', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: "/"
        });

    } catch (error) {
        console.log(error);
    }

    console.log("[ ! ] acessou a home");
});

router.get("/post/:id", async (req, res) => {
    try {
        let slug = req.params.id; // um slug é um redirecionamento de rota dinâmico, ou seja, mudaremos a rota de exibição ela dinamicamente para o perfil específico escolhido

        const data = await Post.findById({ _id: slug }); //variável que vai guardar o ID do perfil que será exibido

        const locals = {
            title: data.title,
            description: "Perfil",
            currentRoute: `/post/${slug}`
        }

        res.render('post', { locals, data });
    }
    catch (error) {
        console.log(error);
    }
})

router.post("/search", async (req, res) => {
    try {
        const locals = {
            title: "Pesquisar",
            description: "Pesquisa feita."
        }

        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

        const data = await Post.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChar, "i") }},
                { body: { $regex: new RegExp(searchNoSpecialChar, "i") }}
            ]

        });

        res.render("search", { 
            data,
            locals
        });

    } catch (error) {

    }
})

/*DUMMY
function inserirInfoPost () {
    Post.insertMany([
        {
            title: "Artigo de Teste 2",
            body: "Este é um teste."
        },
    ])
}
inserirInfoPost(); */

router.get("/about", (req, res) => {
    res.render('about');
    console.log("[ * ] acessou about");
});

module.exports = router;