// BIBLIOTECAS DE ROTEAMENTO E TROCA DE INFORMAÇÕES DO SITE:
const express = require("express");
const lodash = require("lodash");
const router = express.Router();
const Perfil = require("../models/perfil");
const Posts = require("../models/posts");
const Comentario = require("../models/comentarios");
const Grupo = require('../models/grupos');
const Publicacao = require('../models/publicacao')
const timeFunction = require('../dateFunc');
const multer = require("multer");


// MUITO IMPORTANTE
// CASO PRECISE MUDAR O NOME DE UMA COLEÇÃO
/* Nome_Da_Coleção.collection.rename("novo_nome", { dropTarget: true }, (err) => {
    if (err) {
        console.error("Error renaming collection:", err);
    } else {
        console.log("Collection renamed successfully!");
    }
}); */


// BIBLIOTECAS DE COOKIES E AFINS:
const bcrypt = require("bcrypt"); // encriptador de senhas
const jwt = require("jsonwebtoken"); // token para o usuário logado, ficará salvo nos cookies
const jwtSecret = process.env.JWT_SECRET; //senha para transações de cookies, sem ela, todas as senhas ficam vulneráveis
const cookieParser = require('cookie-parser');

// PORTEIRO:
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; //variável que vai pegar o token da sessão atual (cookies)

    if (!token) { // (!) é o operador de negação, então caso não tenha token, significa que não tá logado
        //return res.status(401).json( { message: "Não Autorizado!" } );
        return res.redirect("/login");
    }

    try {
        const decoded = jwt.verify(token, jwtSecret); //vai decodificar o cookie
        req.userId = decoded.userId; //salva o cookie
        next(); //libera a passagem
    } catch (error) {
        res.redirect('/login');
    } //neste caso, não é que ele foi desautorizado, mas definimos todos os erros como "falta de autorização" pra confundir possíves penetras e hackers
}



// ROTAS DO SITE
router.get('/login', async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error);
    }
});

router.post('/login', async (req, res) => {
    try {
        //pega as informações digitadas
        const { email, senha } = req.body;

        //procura o perfil no banco de dados referente ao email digitado na variável user
        const user = await Perfil.findOne({ email });

        //verifica se o perfil existe de fato
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        //compara a senha encriptada com a senha digitada
        const isPasswordValid = await bcrypt.compare(senha, user.senha);

        //verifica se a senha está correta
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        //o código abaixo foi deixado de lado:
        //const token = jwt.sign({ userId: user._id }, jwtSecret );

        //cria os cookies!
        const token = await jwt.sign({
            id: user._id,
            nome: user.title,
            email: user.email,
        }, jwtSecret);

        //salva o cookie "token" equivalente ao token do usuário
        res.cookie("token", token, { httpOnly: true });

        //salva o cookie "name" equivalente ao email do usuário
        res.cookie("name", user.title, { httpOnly: true });

        //salva o cookie "pfp" equivalente a foto de perfil do usuário
        res.cookie("pfp", user.imagem, { httpOnly: true });

        //salva o cookie "id" equivalente ao id do usuário
        res.cookie("userid", encodeURIComponent(user._id), { httpOnly: true });

        //redireciona para o menu iniciar
        res.redirect("/");

        console.log(`[ INFO ] Login de usuário: ${user.title}`)

        //res.render("admin/index", { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

// logout
router.post('/sair', (req, res) => {
    res.clearCookie('token'); //limpa o token do usuário
    res.clearCookie('name'); //limpa o cookie do nome
    res.clearCookie('userid'); //limpa o cookie do id
    res.clearCookie('pfp'); //limpa o cookie da foto de perfil
    res.redirect('/'); //retorna ao index
});

router.get('/registro', async (req, res) => {
    try {
        res.render('registro');
    } catch (error) {
        console.log(error);
    }
});

router.post('/registro', async (req, res) => {
    try {
        //diz que o email e a senha são equivalentes ao que está na tela
        const { email, senha } = req.body;

        //vai desencriptar a senha e comparar ela com o que foi digitado
        const hashedPassword = await bcrypt.hash(senha, 10);

        try {
            const user = await Perfil.create({
                email,
                senha: hashedPassword,
            });

            //res.status(201).json({ message: "Usuário Criado", user });

            //cria os cookies!
            const token = await jwt.sign({
                id: user._id,
                email: user.email,
            }, jwtSecret);

            //salva o cookie "token" equivalente ao token do usuário
            res.cookie("token", token, { httpOnly: true });

            //salva o cookie "id" equivalente ao id do usuário
            res.cookie("userid", encodeURIComponent(user._id), { httpOnly: true });

            res.redirect(`/criar/${user.id}`);

            console.log("[ DBUG ] Usuário Criado: " + user);
        } catch (error) {
            if (error.code == 11000) {
                res.status(409).json({ message: "Usuário já existe" });
            }
            res.status(500).json({ message: "Internal server error " });
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
});

/* const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null,  
 file.originalname);
    }
}); //MULTER
/* const upload = multer({ storage: storage }); */

const upload = multer({ dest: 'public/uploads/' });


// FUNÇÃO PRA PEGAR O TEMPO
// para ajudar nos logs!
const currentDate = new Date();
Date.prototype.timeNow = function () {
    return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
}; //eu queria exportar isso de outro canto, mas eu não consegui, me sinto derrotado .·°՞(¯□¯)՞°·.


// GET
// GRUPOS
router.get('/novogrupo', async (req, res) => {
    try {
        const locals = {
            title: "Nova Constelação",
            decription: "Tela de criação de Grupos"
        }

        const data = await Perfil.find();
        const dataPerfis = await Perfil.aggregate([{ $sort: { createdAt: -1 } }]);

        res.render('criarG', {
            locals, data, dataPerfis
        });

    } catch (error) {
        console.log(error);
    }
});
// POST
// GRUPOS
router.post('/novogrupo', authMiddleware, async (req, res) => {
    try {
        const opcoesSelecionadas = req.body.selectedUsers; //array pra gravar os ids

        const newGrupo = new Grupo({
            nome: req.body.nomegrupo,
            membros: opcoesSelecionadas,
            descricao: req.body.descricao,
            criador: req.cookies.userid
        });

        await Grupo.create(newGrupo);

        res.redirect("/grupo/" + newGrupo._id);

        console.log(`[ DBUG ] Novo grupo criado: ${req.body.nomegrupo} às ` + currentDate.timeNow());

    } catch (error) {
        console.log(error);
        res.json({ erro: error })
    }
});
// GET
// *VER* GRUPOS
router.get('/listagrupos', async (req, res) => {
    try {
        const locals = {
            title: "Constelações"
        }

        //const data = await Grupo.find();
        const grupos = await Grupo.aggregate([{ $sort: { createdAt: -1 } }]);

        res.render('listagrupos', {
            locals, grupos
        });

    } catch (error) {
        console.log(error);
    }
});
// GET
// *EXIBIR UM* GRUPO
router.get('/grupo/:id', authMiddleware, async (req, res) => {
    try {
        const slug = req.params.id;

        const data = await Grupo.findById({ _id: slug });
        const data2 = Grupo.find();
        const membro = data.membros;
        const publicacoes = await Publicacao.findById({ _id: slug });
        const publicacoesOrdenadas = await Publicacao.aggregate([{ $sort: { createdAt: -1 } }]);

        const userid = req.cookies.userid;
        const nameCookie = req.cookies.name;

        //const membrosOrdenados = await Perfil.find({ userId: { $in: membro } });

        /* membrosOrdenados.forEach(membros => {
            console.log(membrosOrdenados.title);
        }) */

        //console.log(membrosOrdenados);

        const locals = {
            title: data.nome,
        }

        //console.log(membrosOrdenados);

        res.render('grupo', {
            locals, data, slug, membro, data2, publicacoes, publicacoesOrdenadas, userid, nameCookie
        });
    } catch (error) {
        console.log(error);
    }
});
// POST
// GRUPOS - ADICIONAR PUBLICAÇÃO
router.post('/grupo/:id', async (req, res) => {
    try {
        const assinatura = req.body.assinatura || "Anônimo";
        const novaPublicacao = new Publicacao({
            titulo: req.body.titulo,
            assinatura: req.cookies.name,
            texto: req.body.texto,
            idGrupo: req.params.id,
            idAutor: req.cookies.userid
        });

        await Publicacao.create(novaPublicacao);

        res.redirect(`/grupo/${req.params.id}`);
        console.log(`[ DBUG ] Nova publicação criada no grupo ${req.body.nomegrupo} às ${currentDate.timeNow()}`);

    } catch (error) {
        console.log(error);
    }
});

router.post('/salvar-texto', async (req, res) => {
    try {
        const content = req.body;

        const novoTexto = new Publicacao({
            titulo: "teste",
            texto: content,
            assinatura: "admin",
            idGrupo: "669fe8d0051ffd5b07afc844"
        });

        await Publicacao.create(novoTexto);

        console.log('Texto salvo com sucesso!');

        res.redirect('/listagrupos');

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar o texto' });

    }
});


// GET
// Ver uma Publicação e seus comentários
router.get('/publicacao/:id', async (req, res) => {
    try {
        const locals = {
            title: "Publicação",
            description: "Exibindo Publicação de Comunidade"
        };

        const slug = req.params.id; // um slug é um redirecionamento de rota dinâmico, ou seja, mudaremos a rota de exibição ela dinamicamente para o perfil específico escolhido

        //informações puxadas do banco de dados
        const publicacao = await Publicacao.findById({ _id: slug }); //variável que vai guardar o ID do perfil que será exibido
        const comentarios = await Comentario.findById({ _id: slug }); //variável que vai procurar os comentários no banco de dados
        const comentariosOrdenados = await Comentario.aggregate([{ $sort: { createdAt: -1 } }]); //vai salvar os comentários numa ordem Ascendente e permitir mostrá-los corretamente



        const dataAutor = await Perfil.findById({ _id: publicacao.idAutor });

        //cookies
        const idCookie = req.cookies.userid;
        const pfpCookie = req.cookies.pfp;
        const nameCookie = req.cookies.name;

        res.render('publicacao', {
            locals, publicacao, comentarios, comentariosOrdenados, idCookie, pfpCookie, nameCookie, dataAutor
        });

    } catch (error) {
        console.log(error);
    };
});
// POST
// Esse post só existe para criar os novos comentários dentro de uma publicação
router.post('/publicacao/:id', async (req, res) => {
    try {
        const novoComentario = new Comentario({
            assinatura: req.cookies.name,
            texto: req.body.texto,
            idResposta: req.params.id,
            idAutor: req.cookies.userid,
            imagem: req.cookies.pfp
        });

        await Comentario.create(novoComentario);

        res.redirect(`/publicacao/${req.params.id}`);

        console.log(`[ DBUG ] Comentário postado na publicação de ID: ${req.params.id} às ` + currentDate.timeNow());

    } catch (error) {
        console.log(error);
    }
});



// GET
// Ver um Perfil e seus comentários
router.get('/ver-post/:id', async (req, res) => {
    try {
        const post = await Posts.findById({ _id: req.params.id }); //variável que vai guardar o ID do post que será exibido
        const dataAutor = await Perfil.findById({ _id: post.idResposta });

        const locals = {
            title: "Perfil de " + dataAutor.title,
            description: "Exibindo Perfil de usuário."
        };

        //informações puxadas do banco de dados
        
        //const comentarios = await Comentario.findById({ _id: req.params.id }); //variável que vai procurar os comentários no banco de dados
        const comentariosOrdenados = await Comentario.aggregate([{ $sort: { createdAt: -1 } }]); //vai salvar os comentários numa ordem Ascendente e permitir mostrá-los corretamente

        //cookies
        const idCookie = req.cookies.userid;
        const pfpCookie = req.cookies.pfp;
        const nameCookie = req.cookies.name;

        res.render('verPost', {
            locals, post, dataAutor, comentariosOrdenados, idCookie, pfpCookie, nameCookie
        });

    } catch (error) {
        console.log(error);
    };
});
// POST
// Esse post só existe para criar os novos comentários dentro de um post (do usuário)
router.post('/comentar-post/:id', async (req, res) => {
    try {
        const novoComentario = new Comentario({
            assinatura: req.cookies.name,
            texto: req.body.texto,
            idResposta: req.params.id,
            idAutor: req.cookies.userid,
            imagem: req.cookies.pfp
        });

        await Comentario.create(novoComentario);

        res.redirect(`back`);

        console.log(`[ DBUG ] Comentário postado na publicação de ID: ${req.params.id} às ` + currentDate.timeNow());

    } catch (error) {
        console.log(error);
    }
});








// Rotas
router.get('', async (req, res) => { // não estamos usando "app.get" pois nesse caso estaremos "roteando" (sim, como um roteador) tudo e exportando até o script inicial app.js!
    try {
        const locals = {
            title: "Connections: Sparks",
            description: "sei la sei la sei la."
        }

        let perPage = 10;
        let page = req.query.page || 1;

        const data = await Perfil.aggregate([{ $sort: { createdAt: -1 } }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Perfil.count();
        const nextPage = parseInt(page) + 1; // TryParse, transformando nextpage numa int
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        const publicacoesOrdenadas = await Publicacao.aggregate([{ $sort: { createdAt: -1 } }]).limit(3);
        const comentariosOrdenados = await Comentario.aggregate([{ $sort: { createdAt: -1 } }]).limit(5);
        
        const grupos = await Grupo.aggregate([{ $sort: { createdAt: -1 } }]);
        
        const postsOrdenados = await Posts.aggregate([{ $sort: { createdAt: -1 } }]).limit(7);

        const nomeCookie = req.cookies.name;

        const idCookie = req.cookies.userid;

        res.render('index', {
            locals,
            data,
            publicacoesOrdenadas,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: "/",
            nomeCookie,
            comentariosOrdenados,
            grupos,
            postsOrdenados,
            idCookie
        });
    } catch (error) {
        console.log(error);
    }

    //console.log("[ INFO ] Acessou a Home " + `às ${new Date().timeNow()})`);
});







// GET
// CRIAR PERFIL
router.get('/criar/:id', async (req, res) => {
    try {
        const locals = {
            title: "Criar Perfil",
            description: "Tela da criação de perfil do usuário."
        }

        const slug = req.params.id;

        const data = await Perfil.findOne({ _id: req.params.id });

        const nameCookie = req.cookies.name;

        res.render('criarP', {
            locals, data, nameCookie
        });

        console.log('[ DBUG ] Criando perfil de ' + nameCookie);

    } catch (error) {
        console.log(`!!! ERRO NA EXECUÇÃO DA QUERY DE PERFIL: (${error})`)
    }
});
// POST
// PERFIL (ENVIAR AO BANCO DE DADOS)
router.post('/criar/:id', upload.single('image'), async (req, res) => {
    try {
        await Perfil.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            insta: req.body.insta,
            sexo: req.body.sexo,
            nascimento: req.body.nascimento,
            updatedAt: Date.now()
        });

        //salva o cookie "name" equivalente ao email do usuário
        res.cookie("name", req.body.title, { httpOnly: true });

        res.redirect(`/interesses/${req.params.id}`);
    } catch (error) {
        console.log(error);
    }

});

// GET
// POST - Exibir Um Perfil
router.get("/post/:id", async (req, res) => {
    try {
        const slug = req.params.id; // um slug é um redirecionamento de rota dinâmico, ou seja, mudaremos a rota de exibição ela dinamicamente para o perfil específico escolhido

        const data = await Perfil.findById({ _id: slug }); //variável que vai guardar o ID do perfil que será exibido
        const posts = await Posts.findById({ _id: slug }); //variável que vai procurar os comentários no banco de dados
        const postsOrdenados = await Posts.aggregate([{ $sort: { createdAt: -1 } }]);

        const tagsFormatadas = data.tags.join(', ') + '.'; //formata o array dos interesses pra eles não aparecem bagunçados no perfil

        const idCookie = req.cookies.userid;
        const pfpCookie = req.cookies.pfp;
        const nameCookie = req.cookies.name;
        const tokenCookie = req.cookies.token;

        console.log(idCookie)

        const locals = {
            title: data.title,
            description: "Perfil",
            currentRoute: `/post/${slug}`, //n entendi pra que serve, não me pergunte ¯\_(ツ)_/¯
        }

        res.render('perfil', { locals, data, posts, slug, postsOrdenados, tagsFormatadas, idCookie, nameCookie, pfpCookie, tokenCookie });
    }
    catch (error) {
        console.log(error);
    }
})
// POST
// PUBLICAR POST
router.post('/public-post/:id', async (req, res) => {
    try {
        const assinatura = req.body.assinatura || "Anônimo"; //essa variável vai substituir o vazio por "Anônimo", já que o moongose decidiu ignorar o default value!

        const novoPost = new Comentario({
            assinatura: req.cookies.name,
            texto: req.body.texto,
            idResposta: req.params.id,
            imagem: req.cookies.pfp,
            idAutor: req.cookies.userid
        });

        await Posts.create(novoPost);

        res.redirect(`/post/${req.params.id}`);

        console.log(`[ DBUG ] Comentário postado no perfil de ID: ${req.params.id} às ` + currentDate.timeNow());

    } catch (error) {
        console.log(error);
    }
})

// GET
// interesses - escolher interesses
router.get('/interesses/:id', async (req, res) => {
    try {
        const locals = {
            title: "Interesses",
            description: "Adicionar Tags de Interesse",
        };

        const data = await Perfil.findOne({ _id: req.params.id });

        res.render('interesses', {
            locals,
            data
        });
    }
    catch (error) {
        console.log(error);
    }
});
// POST
// interesses - salvando os interesses escolhidos
router.post('/interesses/:id', async (req, res) => {
    try {
        //req.body.languages = req.body.languages.map(item => (Array.isArray(item) && item[1]) || null);
        //console.log(req.body.languages);

        await Perfil.findByIdAndUpdate(req.params.id, {
            tags: req.body.interesses
        });

        const lastId = req.params.id;  //OUTRO SLUG - QUANDO PRECISAR LEVAR DIRETO AO NOVO PERFIL, NOSSA EU FUI MUITO BRABÍSSIMO AQUI
        res.redirect(`/pfp/${lastId}`);

        console.log(`[ INFO ] Interesses atualizados para o usuário ${lastId} às ` + currentDate.timeNow());
    } catch (error) {
        console.log(error)
    }
});

// GET 
// CONSTELAÇÃO - juntar os interesses dos usuários
router.get('/verify/:id', async (req, res) => {
    try {
        let slug = req.params.id; //vai pegar o ID do perfil (na página de exibição de perfil)
        const data = await Perfil.findById({ _id: slug }); //vai achar as informações no banco de daods

        const data2 = await Perfil.aggregate([{ $sort: { createdAt: -1 } }]);
        //console.log(data2); //vai mostrar quais tags foram adicionadas ao perfil, isso vai ajudar a entender oq tá acontecendo na api


        function temCincoIguais(array1, array2) {
            // Interseção dos dois arrays: encontra os elementos comuns
            const intersecao = lodash.intersection(array1, array2);

            // Verifica se a interseção tem pelo menos 5 elementos
            return intersecao.length >= 5;
        };


        var perfisVerificados = [];

        data2.forEach(perfil => {

            const resultados = temCincoIguais(data.tags, perfil.tags);

            if (resultados === true && perfil.tags !== undefined && perfil.tags !== null) {
                perfisVerificados.push(perfil._id);
            };
        });

        console.log(perfisVerificados);

        const locals = {
            title: data.title,
            description: "Perfil",
            currentRoute: `/post/${slug}`
        }

        res.render('constelacao', {
            locals,
            data,
            data2,
            perfisVerificados
        });
    } catch (error) {
        console.log(error);
    }
});

// POST
// Pesquisa - rota da exibição dos resultados da pesquisa
router.post("/search", async (req, res) => {
    try {
        const locals = {
            title: "Pesquisar",
            description: "Pesquisa feita."
        }

        const verificarTermosPesquisa = /[^a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ ]/g;

        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(verificarTermosPesquisa, "");

        const data = await Perfil.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
                { body: { $regex: new RegExp(searchNoSpecialChar, "i") } }
            ]

        });

        res.render("search", {
            data,
            locals
        });

        console.log(`[ INFO ] Exibindo resultados de pesquisa para '${searchTerm}' às ` + currentDate.timeNow())
    } catch (error) {
        console.log(error);
    }
})



/*DUMMY
function inserirInfoPerfil () {
    Perfil.insertMany([
        {
            title: "Artigo de Teste 2",
            body: "Este é um teste."
        },
    ])
}
inserirInfoPerfil(); */

// GET
// Sobre Nós
router.get("/about", async (req, res) => {
    res.render('about');
    console.log(`[ INFO ] acessou about às ` + currentDate.timeNow());
});

router.get("/contact", async (req, res) => {
    res.render('contato');
    console.log('[ INFO ] acessou contato às ' + currentDate.timeNow());
});

module.exports = router;