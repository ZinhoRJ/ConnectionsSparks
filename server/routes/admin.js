const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");
const bcrypt = require("bcrypt"); // encriptador de senhas
const jwt = require("jsonwebtoken"); // token para o usuário logado, ficará salvo nos cookies

const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET;

// PORTEIRO:
// Verifica se o usuário já está logado, antes de deixar entrar em alguma rota
const authMiddleware = (req, res, next ) => {
    const token = req.cookies.token; //variável que vai pegar o token da sessão atual

    if(!token) { // (!) é o operador de negação, então caso não tenha token, significa que não tá logado
        return res.status(401).json( { message: "Não Autorizado!" } );
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json( { message: "Não Autorizado!" } );
    }
}


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
        
        const user = await User.findOne( { username } );

        if(!user) {
            return res.status(401).json( { message: "Invalid credentials" } );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json( { message: "Invalid credentials" } );
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret );
        res.cookie("token", token, { httpOnly: true });

        res.redirect("/dashboard");

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

        const data = await Post.find();
        res.render("admin/dashboard", {
            locals,
            data,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }
});


// admin - create new post
router.get("/add-post", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Add Post",
            description: "Painel do Administrador"
        }

        const data = await Post.find();
        res.render("admin/add-post", {
            locals,
        });
    } catch (error) {
        console.log(error);
    }

})


// Admin - Registrar
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password: hashedPassword });
            res.status(201).json({ message: "Usuário Criado", user });
        } catch (error) {
            if(error.code == 11000 ) {
                res.status(409).json({ message: "Usuário já existe" });
            }
            res.status(500).json({ message: "Internal server error "});
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
            title: "Adicionar Post",
            description: "Painel do Administrador"
        }

        const data = await Post.find();
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
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body
            });
    
            await Post.create(newPost);
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
        title: "Edit Post",
        description: "User Management System",
      };
  
      const data = await Post.findOne({ _id: req.params.id });
  
      res.render('admin/edit-post', {
        locals,
        data,
        layout: adminLayout
      })
  
    } catch (error) {
      console.log(error);
    }
  
  });


// PUT !
// Admin: editar post
router.post('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
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
        await Post.deleteOne( { _id: req.params.id } )
        res.redirect("/dashboard")
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
        const data = await Post.find();
        res.render("index", { locals, data });
    } catch (error) {
        console.log(error);
    }
});
 */
module.exports = router;