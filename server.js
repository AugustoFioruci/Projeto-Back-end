const express = require('express');
const session = require('express-session');
const { inicializarBanco, pool, fecharConexao } = require('./db.js');
const Usuario = require('./models/Usuario.js');
const Categoria = require('./models/Categoria.js');
const Evento = require('./models/Evento.js');
const { logInfo, logErro } = require('./logger.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de sessão
app.use(session({
    secret: 'sua_chave_secreta_aqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

// Middleware de autenticação
const verificarAutenticacao = (req, res, next) => {
    if (!req.session.usuario_id) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Não autenticado. Faça login primeiro.'
        });
    }
    next();
};

// Instâncias dos modelos
let usuarioModel, categoriaModel, eventoModel;

// ============ ROTAS DE AUTENTICAÇÃO ============

// POST /api/registro - Criar novo usuário
app.post('/api/registro', async (req, res) => {
    try {
        const { nome, email, senha, telefone } = req.body;

        // Validação de campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome, Email e Senha são obrigatórios'
            });
        }

        const novoUsuario = await usuarioModel.criar({
            nome,
            email,
            senha,
            telefone: telefone || null
        });

        logInfo(`Novo usuário registrado: ${novoUsuario.email}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Usuário registrado com sucesso',
            usuario: novoUsuario
        });
    } catch (error) {
        logErro(`Erro ao registrar: ${error.message}`);
        return res.status(400).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});

// POST /api/login - Autenticar usuário
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validação de campos obrigatórios
        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Email e Senha são obrigatórios'
            });
        }

        const usuario = await usuarioModel.autenticar(email, senha);

        // Criar sessão
        req.session.usuario_id = usuario.id;
        req.session.usuario_nome = usuario.nome;
        req.session.usuario_email = usuario.email;

        logInfo(`Usuário ${usuario.email} fez login`);

        return res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso',
            usuario: usuario
        });
    } catch (error) {
        logErro(`Erro ao fazer login: ${error.message}`);
        return res.status(401).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});

// POST /api/logout - Sair
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao fazer logout'
            });
        }

        logInfo('Usuário fez logout');

        return res.json({
            sucesso: true,
            mensagem: 'Logout realizado com sucesso'
        });
    });
});

// ============ ROTAS DE USUÁRIOS ============

// GET /api/usuarios/perfil - Obter perfil do usuário autenticado
app.get('/api/usuarios/perfil', verificarAutenticacao, async (req, res) => {
    try {
        const usuario = await usuarioModel.buscarPorId(req.session.usuario_id);

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        return res.json({
            sucesso: true,
            usuario: usuario
        });
    } catch (error) {
        logErro(`Erro ao buscar perfil: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar perfil'
        });
    }
});

// PUT /api/usuarios/perfil - Atualizar perfil do usuário
app.put('/api/usuarios/perfil', verificarAutenticacao, async (req, res) => {
    try {
        const { nome, telefone } = req.body;

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome é obrigatório'
            });
        }

        const usuarioAtualizado = await usuarioModel.atualizar(req.session.usuario_id, {
            nome,
            telefone: telefone || null
        });

        logInfo(`Perfil do usuário ${usuarioAtualizado.id} foi atualizado`);

        return res.json({
            sucesso: true,
            mensagem: 'Perfil atualizado com sucesso',
            usuario: usuarioAtualizado
        });
    } catch (error) {
        logErro(`Erro ao atualizar perfil: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar perfil'
        });
    }
});

// ============ ROTAS DE CATEGORIAS ============

// GET /api/categorias - Listar categorias do usuário
app.get('/api/categorias', verificarAutenticacao, async (req, res) => {
    try {
        const categorias = await categoriaModel.buscarPorUsuario(req.session.usuario_id);

        return res.json({
            sucesso: true,
            categorias: categorias || []
        });
    } catch (error) {
        logErro(`Erro ao listar categorias: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar categorias'
        });
    }
});

// POST /api/categorias - Criar categoria
app.post('/api/categorias', verificarAutenticacao, async (req, res) => {
    try {
        const { nome, descricao } = req.body;

        // Validação de campos obrigatórios
        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome da categoria é obrigatório'
            });
        }

        const novaCategoria = await categoriaModel.criar({
            nome,
            descricao: descricao || null,
            usuario_id: req.session.usuario_id
        });

        logInfo(`Categoria "${nome}" criada para o usuário ${req.session.usuario_id}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Categoria criada com sucesso',
            categoria: novaCategoria
        });
    } catch (error) {
        logErro(`Erro ao criar categoria: ${error.message}`);
        return res.status(400).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});

// GET /api/categorias/:id - Obter categoria por ID
app.get('/api/categorias/:id', verificarAutenticacao, async (req, res) => {
    try {
        const categoria = await categoriaModel.buscarPorId(req.params.id);

        if (!categoria) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Categoria não encontrada'
            });
        }

        // Verificar se a categoria pertence ao usuário
        if (categoria.usuario_id !== req.session.usuario_id) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        return res.json({
            sucesso: true,
            categoria: categoria
        });
    } catch (error) {
        logErro(`Erro ao buscar categoria: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar categoria'
        });
    }
});

// PUT /api/categorias/:id - Atualizar categoria
app.put('/api/categorias/:id', verificarAutenticacao, async (req, res) => {
    try {
        const { nome, descricao } = req.body;

        const categoria = await categoriaModel.buscarPorId(req.params.id);

        if (!categoria) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Categoria não encontrada'
            });
        }

        if (categoria.usuario_id !== req.session.usuario_id) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome da categoria é obrigatório'
            });
        }

        const categoriaAtualizada = await categoriaModel.atualizar(req.params.id, {
            nome,
            descricao: descricao || null
        });

        logInfo(`Categoria ${req.params.id} foi atualizada`);

        return res.json({
            sucesso: true,
            mensagem: 'Categoria atualizada com sucesso',
            categoria: categoriaAtualizada
        });
    } catch (error) {
        logErro(`Erro ao atualizar categoria: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar categoria'
        });
    }
});

// DELETE /api/categorias/:id - Deletar categoria
app.delete('/api/categorias/:id', verificarAutenticacao, async (req, res) => {
    try {
        const categoria = await categoriaModel.buscarPorId(req.params.id);

        if (!categoria) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Categoria não encontrada'
            });
        }

        if (categoria.usuario_id !== req.session.usuario_id) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        await categoriaModel.deletar(req.params.id);

        logInfo(`Categoria ${req.params.id} foi deletada`);

        return res.json({
            sucesso: true,
            mensagem: 'Categoria deletada com sucesso'
        });
    } catch (error) {
        logErro(`Erro ao deletar categoria: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao deletar categoria'
        });
    }
});

// ============ ROTAS DE EVENTOS ============

// GET /api/eventos - Listar eventos do usuário
app.get('/api/eventos', verificarAutenticacao, async (req, res) => {
    try {
        const eventos = await eventoModel.buscarPorUsuario(req.session.usuario_id);

        return res.json({
            sucesso: true,
            eventos: eventos || []
        });
    } catch (error) {
        logErro(`Erro ao listar eventos: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar eventos'
        });
    }
});

// POST /api/eventos - Criar evento
app.post('/api/eventos', verificarAutenticacao, async (req, res) => {
    try {
        const { titulo, descricao, data_inicio, data_fim, local, categoria_id } = req.body;

        // Validação de campos obrigatórios
        if (!titulo || !data_inicio || !data_fim) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Título, data_inicio e data_fim são obrigatórios'
            });
        }

        // Validação de datas
        if (new Date(data_inicio) >= new Date(data_fim)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'data_inicio deve ser anterior à data_fim'
            });
        }

        // Se categoria_id foi informada, verificar se pertence ao usuário
        if (categoria_id) {
            const categoria = await categoriaModel.buscarPorId(categoria_id);
            if (!categoria) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: 'Categoria não encontrada'
                });
            }

            if (categoria.usuario_id !== req.session.usuario_id) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso negado à categoria'
                });
            }
        }

        const novoEvento = await eventoModel.criar({
            titulo,
            descricao: descricao || null,
            data_inicio,
            data_fim,
            local: local || null,
            usuario_id: req.session.usuario_id,
            categoria_id: categoria_id || null
        });

        logInfo(`Evento "${titulo}" criado para o usuário ${req.session.usuario_id}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Evento criado com sucesso',
            evento: novoEvento
        });
    } catch (error) {
        logErro(`Erro ao criar evento: ${error.message}`);
        return res.status(400).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});

// GET /api/eventos/:id - Obter evento por ID
app.get('/api/eventos/:id', verificarAutenticacao, async (req, res) => {
    try {
        const evento = await eventoModel.buscarPorId(req.params.id);

        if (!evento) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Evento não encontrado'
            });
        }

        // Verificar se o evento pertence ao usuário
        if (evento.usuario_id !== req.session.usuario_id) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        return res.json({
            sucesso: true,
            evento: evento
        });
    } catch (error) {
        logErro(`Erro ao buscar evento: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar evento'
        });
    }
});

// PUT /api/eventos/:id - Atualizar evento
app.put('/api/eventos/:id', verificarAutenticacao, async (req, res) => {
    try {
        const { titulo, descricao, data_inicio, data_fim, local, categoria_id } = req.body;

        const evento = await eventoModel.buscarPorId(req.params.id);

        if (!evento) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Evento não encontrado'
            });
        }

        if (evento.usuario_id !== req.session.usuario_id) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        if (!titulo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Título é obrigatório'
            });
        }

        // Validação de datas, se informadas
        if (data_inicio && data_fim) {
            if (new Date(data_inicio) >= new Date(data_fim)) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'data_inicio deve ser anterior à data_fim'
                });
            }
        }

        // Se categoria_id foi informada, verificar se pertence ao usuário
        if (categoria_id) {
            const categoria = await categoriaModel.buscarPorId(categoria_id);
            if (!categoria) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: 'Categoria não encontrada'
                });
            }

            if (categoria.usuario_id !== req.session.usuario_id) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso negado à categoria'
                });
            }
        }

        const eventoAtualizado = await eventoModel.atualizar(req.params.id, {
            titulo,
            descricao: descricao || null,
            data_inicio,
            data_fim,
            local: local || null,
            categoria_id: categoria_id || null
        });

        logInfo(`Evento ${req.params.id} foi atualizado`);

        return res.json({
            sucesso: true,
            mensagem: 'Evento atualizado com sucesso',
            evento: eventoAtualizado
        });
    } catch (error) {
        logErro(`Erro ao atualizar evento: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar evento'
        });
    }
});

// DELETE /api/eventos/:id - Deletar evento
app.delete('/api/eventos/:id', verificarAutenticacao, async (req, res) => {
    try {
        const evento = await eventoModel.buscarPorId(req.params.id);

        if (!evento) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Evento não encontrado'
            });
        }

        if (evento.usuario_id !== req.session.usuario_id) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        await eventoModel.deletar(req.params.id);

        logInfo(`Evento ${req.params.id} foi deletado`);

        return res.json({
            sucesso: true,
            mensagem: 'Evento deletado com sucesso'
        });
    } catch (error) {
        logErro(`Erro ao deletar evento: ${error.message}`);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao deletar evento'
        });
    }
});

// ============ ROTA DE HEALTH CHECK ============
app.get('/api/saude', (req, res) => {
    res.json({
        sucesso: true,
        mensagem: 'Servidor funcionando normalmente',
        timestamp: new Date().toISOString()
    });
});

// ============ INICIALIZAÇÃO DO SERVIDOR ============

const iniciarServidor = async () => {
    try {
        // Inicializar banco de dados
        await inicializarBanco();

        // Criar instâncias dos modelos
        usuarioModel = new Usuario(pool);
        categoriaModel = new Categoria(pool);
        eventoModel = new Evento(pool);

        // Iniciar servidor
        app.listen(PORT, () => {
            logInfo(`Servidor iniciado na porta ${PORT}`);
            console.log(`Servidor disponível em http://localhost:${PORT}`);
            console.log('Pressione Ctrl+C para parar o servidor');
        });
    } catch (error) {
        logErro(`Erro ao iniciar servidor: ${error.message}`);
        process.exit(1);
    }
};

// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
    console.log('\nEncerrando servidor...');
    await fecharConexao();
    process.exit(0);
});

// Iniciar o servidor
iniciarServidor();

module.exports = app;
