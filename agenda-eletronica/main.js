const { inicializarBanco, fecharConexao, pool } = require('./db.js');
const Usuario = require('./models/Usuario.js');
const Categoria = require('./models/Categoria.js');
const Evento = require('./models/Evento.js');

const testar = async () => {
    try {
        await inicializarBanco();

        const usuarioModel = new Usuario(pool);
        const categoriaModel = new Categoria(pool);
        const eventoModel = new Evento(pool);

        console.log('\n--- Criando Usuário ---');
        const usuario = await usuarioModel.criar({
            nome: 'João Silva',
            email: 'joao@example.com',
            telefone: '11999999999'
        });
        console.log('Usuário criado:', usuario);

        console.log('\n--- Criando Categoria ---');
        const categoria = await categoriaModel.criar({
            nome: 'Trabalho',
            descricao: 'Eventos de trabalho',
            usuario_id: usuario.id
        });
        console.log('Categoria criada:', categoria);

        console.log('\n--- Criando Evento ---');
        const evento = await eventoModel.criar({
            titulo: 'Reunião com cliente',
            descricao: 'Discussão sobre projeto',
            data_inicio: '2026-04-27 10:00:00',
            data_fim: '2026-04-27 11:00:00',
            local: 'Sala 101',
            usuario_id: usuario.id,
            categoria_id: categoria.id
        });
        console.log('Evento criado:', evento);

        console.log('\n--- Buscando Eventos por Usuário ---');
        const eventosUsuario = await eventoModel.buscarPorUsuario(usuario.id);
        console.log('Eventos:', eventosUsuario);

        console.log('\n--- Atualizando Evento ---');
        const eventoAtualizado = await eventoModel.atualizar(evento.id, {
            titulo: 'Reunião com cliente - IMPORTANTE'
        });
        console.log('Evento atualizado:', eventoAtualizado);

        console.log('\n--- Buscando Categorias por Usuário ---');
        const categoriasUsuario = await categoriaModel.buscarPorUsuario(usuario.id);
        console.log('Categorias:', categoriasUsuario);

        console.log('\n--- Deletando Evento ---');
        const resultadoDeletar = await eventoModel.deletar(evento.id);
        console.log(resultadoDeletar);

        console.log('\n--- Listando Todos os Usuários ---');
        const usuarios = await usuarioModel.buscarTodos();
        console.log('Todos os usuários:', usuarios);

        await fecharConexao();
    } catch (error) {
        console.error('Erro:', error.message);
        await fecharConexao();
    }
};

testar();
