const express = require("express");
const router = express.Router();
const Perfil = require("../models/perfil");
const Posts = require("../models/posts");
const Admin = require("../models/admins");
const Comentario = require("../models/comentarios");
const Grupo = require("../models/grupos");
const Publicacao = require("../models/publicacao");
const bcrypt = require("bcrypt"); // encriptador de senhas
const jwt = require("jsonwebtoken"); // token para o usuário logado, ficará salvo nos cookies

const adminLayout = "../views/layouts/admin"; //define o layout das páginas como o de admin, pra ficar diferente do layout de usuário comum
const jwtSecret = process.env.JWT_SECRET; //senha para transações de cookies, sem ela, todas as senhas ficam vulneráveis

// PORTEIRO:
// Verifica se o usuário já está logado, antes de deixar entrar em alguma rota especial de admin
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token; //variável que vai pegar o token da sessão atual (cookies)

    /* if(!token) { // (!) é o operador de negação, então caso não tenha token, significa que não tá logado
        return res.status(401).json( { message: "Não Autorizado!" } );
    } */

    const admin = await Admin.findOne({ userId: req.userId });

    if (!admin) {
        return res.status(403).json({ message: "Acesso negado." });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret); //vai decodificar o cookie
        req.userId = decoded.userId; //salva o cookie
        next(); //libera a passagem
    } catch (error) {
        return res.status(401).json({ message: "Não Autorizado!" });
    } //neste caso, não é que ele foi desautorizado, mas definimos todos os erros como "falta de autorização" pra confundir possíves penetras e hackers
}//é uma medida de segurança dos dados e a melhor forma de evitar o acesso de terceiros
//também podiamos usar esse sistema pra gerar contas de usuários, mas isso em larga escala deixaria a plataforma pesada, lenta e mais complexa


// GET !
// tela inicial do admin
router.get('/admin', async (req, res) => {
    try {
        const locals = {
            title: "AdminPage",
            description: "página de admin"
        }
        res.render("admin/index", { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

// POST !
// Checar login admin
router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await Admin.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie("token", token, { httpOnly: true });

        res.redirect("/dashboard");

        console.log(`[ WARN ] Login do administrador, usuário: ${req.body.username}`)
        //res.render("admin/index", { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

// tela da dashboard (depois que o login for bem-sucedido)
router.get("/dashboard", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Dashboard",
            description: "Painel do Administrador"
        }

        const data = await Perfil.aggregate([{ $sort: { createdAt: -1 } }]); //pega os perfis no banco de dados e salva na variável data
        const grupos = await Grupo.aggregate([{ $sort: { createdAt: -1 } }]); //pega os grupos no banco de dados e salva na variável grupos
        const posts = await Posts.aggregate([{ $sort: { createdAt: -1 } }]);
        const publicacoes = await Publicacao.aggregate([{ $sort: { createdAt: -1 } }]);

        res.render("admin/dashboard", {
            locals,
            data,
            grupos,
            posts,
            publicacoes,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }
});


// ISSO NÃO ENTRA NO PROJETO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// admin - Criar novo Perfil
// isso se torna não muito útil no projeto real
router.get("/add-post", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Add Perfil",
            description: "Painel do Administrador"
        }

        const data = await Perfil.find();
        res.render("admin/add-post", {
            locals,
        });
    } catch (error) {
        console.log(error);
    }

})

// isso também meio que vai ir embora
// mas vamos precisar de primeira pra registrar as senhas
// Admin - Registrar
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await Admin.create({ username, password: hashedPassword });
            res.status(201).json({ message: "Usuário Criado", user });
        } catch (error) {
            if (error.code == 11000) {
                res.status(409).json({ message: "Usuário já existe" });
            }
            res.status(500).json({ message: "Internal server error " });
        }

    } catch (error) {
        console.log(error);
    }
});

// GET !
// Admin: criar novo post
router.get("/add-post", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Adicionar Perfil",
            description: "Painel do Administrador"
        }

        const data = await Perfil.find();
        res.render("admin/add-post", {
            locals,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }

});

// POST
// admin: criar novo post
router.post("/add-post", authMiddleware, async (req, res) => {
    try {
        try {
            const newPerfil = new Perfil({
                title: req.body.title,
                body: req.body.body
            });

            await Perfil.create(newPerfil);
            res.redirect("/dashboard");
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
});

// GET !
// Admin: editar post
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {

        const locals = {
            title: "Editar Perfil",
            description: "Admin Management System",
        };

        const data = await Perfil.findOne({ _id: req.params.id });
        const comentarios = await Posts.findById({ _id: req.params.id }); //variável que vai procurar os comentários no banco de dados
        const comentarios2 = await Posts.aggregate([{ $sort: { createdAt: -1 } }]); //variável que vai listar os comentários no banco de dados

        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout,
            comentarios,
            comentarios2
        })

    } catch (error) {
        console.log(error);
    };

});
// PUT -- POST
// Admin: editar post
router.post('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        await Perfil.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            insta: req.body.insta,
            sexo: req.body.sexo,
            updatedAt: Date.now()
        });

        res.redirect(`/edit-post/${req.params.id}`);
    } catch (error) {
        console.log(error);
    }

});
// DELETE !
// Admin: deletar post
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Perfil.deleteOne({ _id: req.params.id })
        res.redirect("/dashboard")
    } catch (error) {
        console.log(error);
    }

});

// GET
// Editar grupos
router.get('/edit-grupo/:id', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Editar Grupo",
            description: "Sistema de Gerenciamento do Administrador"
        };

        const data = await Grupo.findOne({ _id: req.params.id });
        const publicacao = await Publicacao.findOne({ _id: req.params.id });
        const publicacoesOrdenadas = await Publicacao.aggregate([{ $sort: { createdAt: -1 } }]);

        //const comentarios = await Comentario.findById({ _id: req.params.id }); //variável que vai procurar os comentários no banco de dados
        //const comentariosOrdenados = await Comentario.aggregate([ {$sort: {createdAt: -1} } ]); //vai salvar os comentários numa ordem Ascendente e permitir mostrá-los corretamente

        res.render('admin/edit-grupo', {
            locals,
            data,
            layout: adminLayout,
            publicacao, publicacoesOrdenadas
            //comentarios, comentariosOrdenados
        });

    } catch (error) {
        console.log(error);
    }
});
// POST
// Editar grupos
router.post('/edit-grupo/:id', authMiddleware, async (req, res) => {
    try {
        await Grupo.findByIdAndUpdate(req.params.id, {
            nome: req.body.nome,
            descricao: req.body.descricao
        });

        res.redirect(`/edit-grupo/${req.params.id}`);
    } catch (error) {
        console.log(error);
    }
});
// DELETE
// Deletar grupo
router.delete('/delete-grupo/:id', authMiddleware, async (req, res) => {
    try {
        await Grupo.deleteOne({ _id: req.params.id });
        res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
    }
});

// DELETE
// Deletar Publicações
router.delete('/delete-publicacao/:id', authMiddleware, async (req, res) => {
    try {
        await Publicacao.deleteOne({ _id: req.params.id });
        res.redirect('back');
    } catch (error) {
        console.log(error);
    }
});

// Admin: deletar comentários
router.delete('/deletar-comentario/:id', authMiddleware, async (req, res) => {
    try {
        await Comentario.deleteOne({ _id: req.params.id });
        res.redirect(`/dashboard`);
    } catch (error) {
        console.log(error);
    }
});

// DELETE
// Deletar post
router.delete('/delete-post-admin/:id', authMiddleware, async (req, res) => {
    try {
        //const post = await Posts.findById({ _id: req.params.id });

        await Posts.deleteOne( { _id: req.params.id } );
        res.redirect("back");
    } catch (error) {
        console.log(error);
    }
});


/**
 * GET /
 * Admin Logout
*/
router.get("/logout", (req, res) => {
    res.clearCookie('token');
    //res.json({ message: 'Logout successful.'});
    res.redirect('/');
});



/* router.get('', async (req, res) => {
    const locals = {
        title: "AdminPage",
        description: "página de admin"
    }

    try {
        const data = await Perfil.find();
        res.render("index", { locals, data });
    } catch (error) {
        console.log(error);
    }
});
 */
module.exports = router;