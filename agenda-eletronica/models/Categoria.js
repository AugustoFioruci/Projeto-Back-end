const { query } = require('../db.js');
const logErro = require('../logger.js');

class Categoria {
    constructor(db) {
        this.db = db;
    }

    async criar(dados) {
        try {
            if (!dados.nome || !dados.usuario_id) {
                throw new Error('Nome e usuario_id são obrigatórios');
            }

            const sql = 'INSERT INTO categorias (nome, descricao, usuario_id) VALUES ($1, $2, $3) RETURNING *';
            const valores = [dados.nome, dados.descricao || null, dados.usuario_id];

            const resultado = await this.db.query(sql, valores);
            return resultado.rows[0];
        } catch (error) {
            logErro(`[Categoria.criar] ${error.message}`);
            throw error;
        }
    }

    async buscarPorId(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const sql = 'SELECT * FROM categorias WHERE id = $1';
            const resultado = await this.db.query(sql, [id]);

            if (resultado.rows.length === 0) {
                return null;
            }

            return resultado.rows[0];
        } catch (error) {
            logErro(`[Categoria.buscarPorId] ${error.message}`);
            throw error;
        }
    }

    async buscarPorUsuario(usuario_id) {
        try {
            if (!usuario_id) {
                throw new Error('usuario_id é obrigatório');
            }

            const sql = 'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY id';
            const resultado = await this.db.query(sql, [usuario_id]);

            return resultado.rows;
        } catch (error) {
            logErro(`[Categoria.buscarPorUsuario] ${error.message}`);
            throw error;
        }
    }

    async buscarTodas() {
        try {
            const sql = 'SELECT * FROM categorias ORDER BY id';
            const resultado = await this.db.query(sql, []);

            return resultado.rows;
        } catch (error) {
            logErro(`[Categoria.buscarTodas] ${error.message}`);
            throw error;
        }
    }

    async atualizar(id, dados) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const categoria = await this.buscarPorId(id);
            if (!categoria) {
                throw new Error('Categoria não encontrada');
            }

            const nome = dados.nome || categoria.nome;
            const descricao = dados.descricao || categoria.descricao;

            const sql = 'UPDATE categorias SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *';
            const valores = [nome, descricao, id];

            const resultado = await this.db.query(sql, valores);
            return resultado.rows[0];
        } catch (error) {
            logErro(`[Categoria.atualizar] ${error.message}`);
            throw error;
        }
    }

    async deletar(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const categoria = await this.buscarPorId(id);
            if (!categoria) {
                throw new Error('Categoria não encontrada');
            }

            const sql = 'DELETE FROM categorias WHERE id = $1';
            await this.db.query(sql, [id]);

            return { mensagem: 'Categoria deletada com sucesso' };
        } catch (error) {
            logErro(`[Categoria.deletar] ${error.message}`);
            throw error;
        }
    }
}

module.exports = Categoria;
