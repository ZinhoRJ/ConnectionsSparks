const express = require("express");
const lodash = require("lodash");
const router = express.Router();
const Post = require("../models/post");
const Comentario = require("../models/comentarios");
const Grupo = require('../models/grupos');
const Publicacao = require('../models/publicacao')
const timeFunction = require('../dateFunc');
const multer = require("multer");


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null,  
 file.originalname);
    }
}); //MULTER
/* const upload = multer({ storage: storage }); */

const upload = multer({ dest: 'public/uploads/'});


// FUNÇÃO PRA PEGAR O TEMPO
// para ajudar nos logs!
const currentDate = new Date();
Date.prototype.timeNow = function () {
    return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}; //eu queria exportar isso de outro canto, mas eu não consegui, me sinto derrotado .·°՞(¯□¯)՞°·.


// GET
// TESTE CROP IMAGE
router.get('/crop', async (req, res) => {
    try {
        res.render('cropper');
    } catch (error) {
        console.log(error);
    }
});

router.get('/pfp/:id', async (req, res) => {
    try {
        const locals = {
            title: "PFP & Banner",
            description: "Definir imagens de perfil e de baner"
        }

        const data = await Post.findOne( { _id: req.params.id } );

        res.render('criarImagem', {
            locals, data
        });
    } catch (error) {
        console.log(error);
    }
});

router.post('/pfp/:id', upload.single('image'), async (req, res) => {
    try{
        const newImage = await Post.findByIdAndUpdate(req.params.id, {
            imagem: "/uploads/" + req.file.filename
        });
        
        // O arquivo está em req.file
        console.log(req.file); // Exibe informações sobre o arquivo
        res.send({ filename: req.file.filename });
        
    } catch (error){
        console.log(error);
    };
});


// GET
// GRUPOS
router.get('/novogrupo', async (req, res) => {
    try {
        const locals = {
            title: "Nova Constelação",
            decription: "Tela de criação de Grupos"
        }

        const data = await Post.find();
        const dataPerfis = await Post.aggregate([ {$sort: {createdAt: -1} } ]);
        
        res.render('criarG', {
            locals, data, dataPerfis
        });
        
    } catch (error){
        console.log(error);
    }
});
// POST
// GRUPOS
 router.post('/novogrupo', async (req, res) => {
     try {
        const opcoesSelecionadas = req.body.selectedUsers; //array pra gravar os ids

        const newGrupo = new Grupo({
            nome: req.body.nomegrupo,
            membros: opcoesSelecionadas,
            descricao: req.body.descricao,
        });

        await Grupo.create(newGrupo);

        res.redirect("/grupo/"+newGrupo._id);
        
        console.log(`[ DBUG ] Novo grupo criado: ${req.body.nomegrupo} às ` + currentDate.timeNow());

     } catch (error) {
         console.log(error);
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
        const grupos = await Grupo.aggregate([ {$sort: {createdAt: -1} } ]);

        res.render('listagrupos', {
            locals, grupos
        });

    } catch (error) {
        console.log(error);
    }
});
// GET
// *EXIBIR UM* GRUPO
router.get('/grupo/:id', async (req, res) => {
    try {
        const slug = req.params.id;

        const data = await Grupo.findById({ _id: slug });
        const data2 = Grupo.find();
        const membro = data.membros;
        const publicacoes = await Publicacao.findById({ _id: slug });
        const publicacoesOrdenadas = await Publicacao.aggregate([ {$sort: {createdAt: -1 } } ]);
        

        const locals = {
            title: data.nome,
        }
        
        res.render('grupo',{
            locals, data, slug, membro, data2, publicacoes, publicacoesOrdenadas
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
            assinatura: assinatura,
            texto: req.body.texto,
            idGrupo: req.params.id
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

        const publicacao = await Publicacao.findById({ _id: slug }); //variável que vai guardar o ID do perfil que será exibido
        const comentarios = await Comentario.findById({ _id: slug }); //variável que vai procurar os comentários no banco de dados
        const comentariosOrdenados = await Comentario.aggregate([ {$sort: {createdAt: -1} } ]); //vai salvar os comentários numa ordem Ascendente e permitir mostrá-los corretamente

        res.render('publicacao', {
            locals, publicacao, comentarios, comentariosOrdenados
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
            assinatura: req.body.assinatura,
            texto: req.body.texto,
            idResposta: req.params.id
        });

        await Comentario.create(novoComentario);

        res.redirect(`/publicacao/${req.params.id}`);

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

        const data = await Post.aggregate([ {$sort: {createdAt: -1} } ])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec();

        const count = await Post.count();
        const nextPage = parseInt(page) + 1; // TryParse, transformando nextpage numa int
        const hasNextPage = nextPage <= Math.ceil(count /perPage);

        const publicacoesOrdenadas = await Publicacao.aggregate([ {$sort: {createdAt: -1} } ]).limit(3);

        res.render('index', {
            locals,
            data,
            publicacoesOrdenadas,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: "/"
        });

    } catch (error) {
        console.log(error);
    }

    //console.log("[ INFO ] Acessou a Home " + `às ${new Date().timeNow()})`);
});

// GET
// CRIAR PERFIL
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
        console.log('Criando Perfil!')

    } catch (error) {
        console.log(`!!! ERRO NA EXECUÇÃO DA QUERY DE PERFIL: (${error})`)
    }
});
// POST
// PERFIL (ENVIAR AO BANCO DE DADOS)
router.post('/criar', upload.single('image'), async (req, res) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body,
                insta: req.body.insta,
                nascimento: req.body.nascimento,
                sexo: req.body.sexo
            });

            const verificarValorExistente = await Post.findOne({ title: req.body.title });
            if (verificarValorExistente) {
                return res.json({ error: 'Valor já existe no banco de dados' });
            };
    
            await Post.create(newPost); //isso é oq cria um novo perfil 
            
            const ultimoId = newPost._id;  //QUANDO PRECISAR LEVAR DIRETO AO NOVO PERFIL, NOSSA EU FUI MUITO BRABÍSSIMO AQUI
            res.redirect(`/interesses/${ultimoId}`);

        } catch (error) {
            console.log(error);
            res.send("OCORREU UM ERRO!");
        }
    } catch (error) {
        console.log(error);
    }
});

// GET
// POST - Exibir Um Perfil
router.get("/post/:id", async (req, res) => {
    try {
        const slug = req.params.id; // um slug é um redirecionamento de rota dinâmico, ou seja, mudaremos a rota de exibição ela dinamicamente para o perfil específico escolhido

        const data = await Post.findById({ _id: slug }); //variável que vai guardar o ID do perfil que será exibido
        const comentarios = await Comentario.findById({ _id: slug }); //variável que vai procurar os comentários no banco de dados
        const comentarios2 = await Comentario.aggregate([ {$sort: {createdAt: -1} } ]);

        const tagsFormatadas = data.tags.join(', ') + '.'; //formata o array dos interesses pra eles não aparecem bagunçados no perfil

        const locals = {
            title: data.title,
            description: "Perfil",
            currentRoute: `/post/${slug}` //n entendi pra que serve, não me pergunte ¯\_(ツ)_/¯
        }

        res.render('post', { locals, data, comentarios, slug, comentarios2, tagsFormatadas });
    }
    catch (error) {
        console.log(error);
    }
})
// POST
// Perfis - ESSE POST SÓ EXISTE POR CAUSA DOS COMENTÁRIOS, A EXIBIÇÃO DO PERFIL SÓ DEPENDE DE GET
router.post('/post/:id', async (req, res) => {
    try {
        const assinatura = req.body.assinatura || "Anônimo"; //essa variável vai substituir o vazio por "Anônimo", já que o moongose decidiu ignorar o default value!

        const novoComentario = new Comentario({
            assinatura: assinatura,
            texto: req.body.texto,
            idResposta: req.params.id
        });

        await Comentario.create(novoComentario);
        
        res.redirect(`/post/${req.params.id}`);
        
        console.log(`[ DBUG ] Comentário postado no perfil de ID: ${req.params.id} às ` + currentDate.timeNow());

    } catch (error) {
        console.log(error);
    }
})
// POST
// Curtir perfil
router.post('/curtir/:id', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, { $inc: { curtidas: 1 } }); //atualiza o perfil no banco de dados, incrementando 1 ao número de curtidas

        res.redirect('back'); //retorna para a página do perfil
    } catch (error) {
        console.log(error);
    }
});

// GET
// interesses - escolher interesses
router.get('/interesses/:id', async (req, res) => {
    try {
        const locals = {
            title: "Interesses",
            description: "Adicionar Tags de Interesse",
        };
        
        const data = await Post.findOne( { _id: req.params.id } );

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
        
        await Post.findByIdAndUpdate(req.params.id, {
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
    try{
        let slug = req.params.id; //vai pegar o ID do perfil (na página de exibição de perfil)
        const data = await Post.findById({ _id: slug }); //vai achar as informações no banco de daods

        const data2 = await Post.aggregate([ {$sort: {createdAt: -1} } ]);
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

            if (resultados === true && perfil.tags !== undefined && perfil.tags !== null){
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

        console.log(`[ INFO ] Exibindo resultados de pesquisa para '${searchTerm}' às ` + currentDate.timeNow())
    } catch (error) {
        console.log(error);
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

// GET
// Sobre Nós
router.get("/about", async (req, res) => {
    res.render('about');
    console.log(`[ INFO ] acessou about às ` + currentDate.timeNow());
});

module.exports = router;