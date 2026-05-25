const bcryptjs = require('bcryptjs');
const logErro = require('../logger.js');

class Usuario {
    constructor(db) {
        this.db = db;
    }

    async criar(dados) {
        try {
            if (!dados.nome || !dados.email || !dados.senha) {
                throw new Error('Nome, Email e Senha são obrigatórios');
            }

            if (dados.email && !dados.email.includes('@')) {
                throw new Error('Email inválido');
            }

            // Verificar se email já existe
            const usuarioExistente = await this.buscarPorEmail(dados.email);
            if (usuarioExistente) {
                throw new Error('Email já cadastrado');
            }

            // Hash da senha
            const senhaHash = await bcryptjs.hash(dados.senha, 10);

            const sql = 'INSERT INTO usuarios (nome, email, senha, telefone) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, telefone, criado_em';
            const valores = [dados.nome, dados.email, senhaHash, dados.telefone || null];

            const resultado = await this.db.query(sql, valores);
            return resultado.rows[0];
        } catch (error) {
            logErro(`[Usuario.criar] ${error.message}`);
            throw error;
        }
    }

    async autenticar(email, senha) {
        try {
            if (!email || !senha) {
                throw new Error('Email e Senha são obrigatórios');
            }

            const sql = 'SELECT * FROM usuarios WHERE email = $1';
            const resultado = await this.db.query(sql, [email]);

            if (resultado.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const usuario = resultado.rows[0];
            const senhaValida = await bcryptjs.compare(senha, usuario.senha);

            if (!senhaValida) {
                throw new Error('Senha incorreta');
            }

            // Retorna usuário sem a senha
            return {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
                criado_em: usuario.criado_em
            };
        } catch (error) {
            logErro(`[Usuario.autenticar] ${error.message}`);
            throw error;
        }
    }

    async buscarPorId(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const sql = 'SELECT id, nome, email, telefone, criado_em FROM usuarios WHERE id = $1';
            const resultado = await this.db.query(sql, [id]);

            if (resultado.rows.length === 0) {
                return null;
            }

            return resultado.rows[0];
        } catch (error) {
            logErro(`[Usuario.buscarPorId] ${error.message}`);
            throw error;
        }
    }

    async buscarPorEmail(email) {
        try {
            if (!email) {
                throw new Error('Email é obrigatório');
            }

            const sql = 'SELECT id, nome, email, telefone, criado_em FROM usuarios WHERE email = $1';
            const resultado = await this.db.query(sql, [email]);

            if (resultado.rows.length === 0) {
                return null;
            }

            return resultado.rows[0];
        } catch (error) {
            logErro(`[Usuario.buscarPorEmail] ${error.message}`);
            throw error;
        }
    }

    async buscarTodos() {
        try {
            const sql = 'SELECT id, nome, email, telefone, criado_em FROM usuarios ORDER BY id';
            const resultado = await this.db.query(sql, []);

            return resultado.rows;
        } catch (error) {
            logErro(`[Usuario.buscarTodos] ${error.message}`);
            throw error;
        }
    }

    async atualizar(id, dados) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const usuario = await this.buscarPorId(id);
            if (!usuario) {
                throw new Error('Usuário não encontrado');
            }

            const nome = dados.nome || usuario.nome;
            const email = dados.email || usuario.email;
            const telefone = dados.telefone || usuario.telefone;

            const sql = 'UPDATE usuarios SET nome = $1, email = $2, telefone = $3 WHERE id = $4 RETURNING id, nome, email, telefone, criado_em';
            const valores = [nome, email, telefone, id];

            const resultado = await this.db.query(sql, valores);
            return resultado.rows[0];
        } catch (error) {
            logErro(`[Usuario.atualizar] ${error.message}`);
            throw error;
        }
    }

    async deletar(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const usuario = await this.buscarPorId(id);
            if (!usuario) {
                throw new Error('Usuário não encontrado');
            }

            const sql = 'DELETE FROM usuarios WHERE id = $1';
            await this.db.query(sql, [id]);

            return { mensagem: 'Usuário deletado com sucesso' };
        } catch (error) {
            logErro(`[Usuario.deletar] ${error.message}`);
            throw error;
        }
    }
}