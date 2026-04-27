const { Pool } = require('pg');
const logErro = require('./logger.js');

const pool = new Pool({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'agenda_eletronica'
});

const inicializarBanco = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                telefone VARCHAR(20),
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                descricao TEXT,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS eventos (
                id SERIAL PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT,
                data_inicio TIMESTAMP NOT NULL,
                data_fim TIMESTAMP NOT NULL,
                local VARCHAR(255),
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        logErro(`Erro ao inicializar banco de dados: ${error.message}`);
        throw error;
    }
};

const query = async (text, params) => {
    try {
        const resultado = await pool.query(text, params);
        return resultado;
    } catch (error) {
        logErro(`Erro na query: ${error.message}`);
        throw error;
    }
};

const fecharConexao = async () => {
    try {
        await pool.end();
        console.log('Conexão com banco de dados fechada');
    } catch (error) {
        logErro(`Erro ao fechar conexão: ${error.message}`);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    inicializarBanco,
    fecharConexao
};
