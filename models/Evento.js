const { query } = require('../db.js');
const logErro = require('../logger.js');

class Evento {
    constructor(db) {
        this.db = db;
    }

    async criar(dados) {
        try {
            if (!dados.titulo || !dados.data_inicio || !dados.data_fim || !dados.usuario_id) {
                throw new Error('Título, data_inicio, data_fim e usuario_id são obrigatórios');
            }

            if (new Date(dados.data_inicio) >= new Date(dados.data_fim)) {
                throw new Error('data_inicio deve ser anterior à data_fim');
            }

            const sql = 'INSERT INTO eventos (titulo, descricao, data_inicio, data_fim, local, usuario_id, categoria_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
            const valores = [
                dados.titulo,
                dados.descricao || null,
                dados.data_inicio,
                dados.data_fim,
                dados.local || null,
                dados.usuario_id,
                dados.categoria_id || null
            ];

            const resultado = await this.db.query(sql, valores);
            return resultado.rows[0];
        } catch (error) {
            logErro(`[Evento.criar] ${error.message}`);
            throw error;
        }
    }

    async buscarPorId(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const sql = 'SELECT * FROM eventos WHERE id = $1';
            const resultado = await this.db.query(sql, [id]);

            if (resultado.rows.length === 0) {
                return null;
            }

            return resultado.rows[0];
        } catch (error) {
            logErro(`[Evento.buscarPorId] ${error.message}`);
            throw error;
        }
    }

    async buscarPorUsuario(usuario_id) {
        try {
            if (!usuario_id) {
                throw new Error('usuario_id é obrigatório');
            }

            const sql = 'SELECT * FROM eventos WHERE usuario_id = $1 ORDER BY data_inicio';
            const resultado = await this.db.query(sql, [usuario_id]);

            return resultado.rows;
        } catch (error) {
            logErro(`[Evento.buscarPorUsuario] ${error.message}`);
            throw error;
        }
    }

    async buscarPorCategoria(categoria_id) {
        try {
            if (!categoria_id) {
                throw new Error('categoria_id é obrigatório');
            }

            const sql = 'SELECT * FROM eventos WHERE categoria_id = $1 ORDER BY data_inicio';
            const resultado = await this.db.query(sql, [categoria_id]);

            return resultado.rows;
        } catch (error) {
            logErro(`[Evento.buscarPorCategoria] ${error.message}`);
            throw error;
        }
    }

    async buscarEmPeriodo(usuario_id, data_inicio, data_fim) {
        try {
            if (!usuario_id || !data_inicio || !data_fim) {
                throw new Error('usuario_id, data_inicio e data_fim são obrigatórios');
            }

            const sql = 'SELECT * FROM eventos WHERE usuario_id = $1 AND data_inicio >= $2 AND data_fim <= $3 ORDER BY data_inicio';
            const resultado = await this.db.query(sql, [usuario_id, data_inicio, data_fim]);

            return resultado.rows;
        } catch (error) {
            logErro(`[Evento.buscarEmPeriodo] ${error.message}`);
            throw error;
        }
    }

    async buscarTodos() {
        try {
            const sql = 'SELECT * FROM eventos ORDER BY data_inicio';
            const resultado = await this.db.query(sql, []);

            return resultado.rows;
        } catch (error) {
            logErro(`[Evento.buscarTodos] ${error.message}`);
            throw error;
        }
    }

    async atualizar(id, dados) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const evento = await this.buscarPorId(id);
            if (!evento) {
                throw new Error('Evento não encontrado');
            }

            const titulo = dados.titulo || evento.titulo;
            const descricao = dados.descricao || evento.descricao;
            const data_inicio = dados.data_inicio || evento.data_inicio;
            const data_fim = dados.data_fim || evento.data_fim;
            const local = dados.local || evento.local;
            const categoria_id = dados.categoria_id || evento.categoria_id;

            if (new Date(data_inicio) >= new Date(data_fim)) {
                throw new Error('data_inicio deve ser anterior à data_fim');
            }

            const sql = 'UPDATE eventos SET titulo = $1, descricao = $2, data_inicio = $3, data_fim = $4, local = $5, categoria_id = $6 WHERE id = $7 RETURNING *';
            const valores = [titulo, descricao, data_inicio, data_fim, local, categoria_id, id];

            const resultado = await this.db.query(sql, valores);
            return resultado.rows[0];
        } catch (error) {
            logErro(`[Evento.atualizar] ${error.message}`);
            throw error;
        }
    }

    async deletar(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório');
            }

            const evento = await this.buscarPorId(id);
            if (!evento) {
                throw new Error('Evento não encontrado');
            }

            const sql = 'DELETE FROM eventos WHERE id = $1';
            await this.db.query(sql, [id]);

            return { mensagem: 'Evento deletado com sucesso' };
        } catch (error) {
            logErro(`[Evento.deletar] ${error.message}`);
            throw error;
        }
    }
}

module.exports = Evento;
