const express = require("express");
const Post = require("../models/perfil");
const User = require("../models/user");
const Comentario = require("../models/comentarios");
const Grupo = require("../models/grupos");
const Publicacao = require("../models/publicacao");
const router = express.Router();

// BIBLIOTECAS DE COOKIES E AFINS:
const bcrypt = require("bcrypt"); // encriptador de senhas
const jwt = require("jsonwebtoken"); // token para o usuário logado, ficará salvo nos cookies
const jwtSecret = process.env.JWT_SECRET; //senha para transações de cookies, sem ela, todas as senhas ficam vulneráveis
const cookieParser = require('cookie-parser');

// PORTEIRO:
const authMiddleware = (req, res, next ) => {
    const token = req.cookies.token; //variável que vai pegar o token da sessão atual (cookies)

    if(!token) { // (!) é o operador de negação, então caso não tenha token, significa que não tá logado
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
};

// GET
// EDITAR PERFIL
router.get('/editar-perfil/:id', authMiddleware, async (req, res) => {
    try {
        //caso um usuário esteja tentando editar o perfil de outra pessoa, ele vai voltar direto para a página inicial
        if (req.cookies.userid != req.params.id){ //(se o id salvo nos cookies for diferente do id na rota...)
            return res.redirect("/"); //...(retornar à página inicial)
        }
      
        const locals = {
        title: "Editar Perfil",
        description: "Paínel de opções do usuário",
      };
  
      const data = await Post.findOne({ _id: req.params.id }); //variável para procurar as informações do perfil no banco de dados
      const comentarios = await Comentario.findById({ _id: req.params.id }); //variável que vai procurar os comentários no banco de dados
      const comentariosOrdenados = await Comentario.aggregate([ {$sort: {createdAt: -1} } ]); //variável que vai listar os comentários em ordem de criação

      res.render('user/editarPerfil', {
        locals,
        data,
        comentarios,
        comentariosOrdenados
      });
  
    } catch (error) {
      console.log(error);
    };
});

// POST
// EDITAR PERFIL
router.post('/editar-perfil/:id', async (req, res) => {
    try {
       await Post.findByIdAndUpdate(req.params.id, {
           title: req.body.title,
           body: req.body.body,
           insta: req.body.insta,
           sexo: req.body.sexo,
           nascimento: req.body.nascimento,
           updatedAt: Date.now()
       });

       res.redirect(`/post/${req.params.id}`);
   } catch (error) {
       console.log(error);
   }
});

// DELETE
// Deletar post
router.delete('/delete-post-user/:id', authMiddleware, async (req, res) => {
    try {
        const comentario = await Comentario.findById({ _id: req.params.id });

        if (req.cookies.userid == comentario.idResposta){
            await Comentario.deleteOne( { _id: req.params.id } );
            res.redirect("back");
        } else {
            res.send("Você não devia estar aqui.")
        }
    } catch (error) {
        console.log(error);
    }
});

// POST
// Curtir Comentários
router.post('/curtir-comentario/:id', authMiddleware, async (req, res) => {
    try {
        const comentario = await Comentario.findById({ _id: req.params.id });
        const userId = req.cookies.userid;

        if (!comentario.likes.includes(userId)) {
            comentario.likes.push(userId);
            await comentario.save();
            
            res.redirect('back');
        } else {
            res.status(400).json({ message: 'O post já fui curtido pelo usuário.' });
        }
    } catch (error) {
        console.log(error);
    }
});

// POST
// Curtir Perfil
router.post('/curtir/:id', authMiddleware, async (req, res) => {
    try {
        const perfil = await Post.findById({ _id: req.params.id });
        const userId = req.cookies.userid;

        if (!perfil.curtidas.includes(userId)) {
            perfil.curtidas.push(userId);
            await perfil.save();
            
            res.redirect('back');
        } else {
            res.status(400).json({ message: 'O perfil já fui curtido pelo usuário.' });
        }
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;