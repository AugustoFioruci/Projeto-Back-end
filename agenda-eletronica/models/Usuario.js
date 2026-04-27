const { query } = require('../db.js');
const logErro = require('../logger.js');

class Usuario {
    constructor(db) {
        this.db = db;
    }

    async criar(dados) {
        try {
            if (!dados.nome || !dados.email) {
                throw new Error('Nome e Email são obrigatórios');
            }

            const sql = 'INSERT INTO usuarios (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *';
            const valores = [dados.nome, dados.email, dados.telefone || null];

            const resultado = await this.db.query(sql, valores);
            return resultado.rows[0];
        } catch (error) {
            logErro(`[Usuario.criar] ${error.message}`);
            throw error;
        }
    }

    async buscarPorId(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const sql = 'SELECT * FROM usuarios WHERE id = $1';
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

            const sql = 'SELECT * FROM usuarios WHERE email = $1';
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
            const sql = 'SELECT * FROM usuarios ORDER BY id';
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

            const sql = 'UPDATE usuarios SET nome = $1, email = $2, telefone = $3 WHERE id = $4 RETURNING *';
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

module.exports = Usuario;