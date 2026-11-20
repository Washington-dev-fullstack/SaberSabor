// Testes do armazenamento e da migração do site antigo: node --test testes/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarArmazenamento, migrarCaderno, migrarPerfil, CHAVES } = require('../js/armazenamento.js');
const { CADERNO_PADRAO } = require('../js/dados.js');

function memoria(inicial = {}) {
    const dados = { ...inicial };
    return {
        getItem: (k) => (k in dados ? dados[k] : null),
        setItem: (k, v) => { dados[k] = String(v); },
        removeItem: (k) => { delete dados[k]; },
        dados
    };
}

test('migrarCaderno: receita antiga conhecida ganha os dados novos', () => {
    const antigo = [{ nome: 'Frango cremoso com ervas', ingredientes: ['frango'], custo: 28 }];
    const [r] = migrarCaderno(antigo, CADERNO_PADRAO);
    assert.equal(r.id, 'frango-cremoso');
    assert.equal(r.tempo, 25);
    assert.ok(r.preparo.length > 0);
});

test('migrarCaderno: receita criada pela pessoa recebe valores padrão', () => {
    const [r] = migrarCaderno([{ nome: 'Pão de queijo', ingredientes: ['polvilho', 'queijo'], custo: 12 }], CADERNO_PADRAO);
    assert.equal(r.nome, 'Pão de queijo');
    assert.equal(r.custo, 12);
    assert.equal(r.tempo, 30);
    assert.equal(r.dificuldade, 'fácil');
    assert.deepEqual(r.vontades, []);
    assert.deepEqual(r.itens, ['polvilho', 'queijo']);
    assert.ok(r.id);
});

test('migrarPerfil: gostos viram "Com" e a alergia vira "Sem"', () => {
    assert.deepEqual(
        migrarPerfil({ gostaAlimentos: 'frango, queijo ,', alergiaAtiva: true, alergiaIngrediente: 'camarão' }),
        { com: ['frango', 'queijo'], sem: ['camarão'] }
    );
    assert.deepEqual(
        migrarPerfil({ gostaAlimentos: '', alergiaAtiva: false, alergiaIngrediente: 'amendoim' }),
        { com: [], sem: [] }
    );
});

test('carregar sem nada salvo devolve o caderno padrão (cópia) e perfil vazio', () => {
    const a = criarArmazenamento(memoria());
    const caderno = a.carregarCaderno();
    assert.equal(caderno.length, CADERNO_PADRAO.length);
    caderno[0].nome = 'mexido';
    assert.notEqual(CADERNO_PADRAO[0].nome, 'mexido');
    assert.deepEqual(a.carregarPerfil(), { com: [], sem: [] });
});

test('a versão nova tem prioridade sobre os dados do site antigo', () => {
    const m = memoria({
        [CHAVES.caderno]: JSON.stringify([CADERNO_PADRAO[1]]),
        saberSabor_comidas: JSON.stringify([{ nome: 'X', ingredientes: ['x'], custo: 1 }])
    });
    assert.deepEqual(criarArmazenamento(m).carregarCaderno().map((r) => r.id), ['macarrao-pesto']);
});

test('lê os dados do site antigo quando não há versão nova', () => {
    const m = memoria({
        saberSabor_perfil: JSON.stringify({ gostaAlimentos: 'massa', alergiaAtiva: true, alergiaIngrediente: 'lactose' })
    });
    assert.deepEqual(criarArmazenamento(m).carregarPerfil(), { com: ['massa'], sem: ['lactose'] });
});

test('JSON quebrado ou storage bloqueado não derrubam o site', () => {
    const quebrado = criarArmazenamento(memoria({ [CHAVES.caderno]: '{oops' }));
    assert.equal(quebrado.carregarCaderno().length, CADERNO_PADRAO.length);

    const bloqueado = criarArmazenamento({
        getItem() { throw new Error('bloqueado'); },
        setItem() { throw new Error('bloqueado'); },
        removeItem() { throw new Error('bloqueado'); }
    });
    assert.equal(bloqueado.carregarCaderno().length, CADERNO_PADRAO.length);
    assert.doesNotThrow(() => bloqueado.salvarPerfil({ com: ['a'], sem: [] }));
});

test('salvar e carregar de novo devolve o mesmo conteúdo', () => {
    const m = memoria();
    const a = criarArmazenamento(m);
    a.salvarPerfil({ com: ['ovos'], sem: ['glúten'] });
    a.salvarCaderno([CADERNO_PADRAO[2]]);
    const b = criarArmazenamento(m);
    assert.deepEqual(b.carregarPerfil(), { com: ['ovos'], sem: ['glúten'] });
    assert.deepEqual(b.carregarCaderno().map((r) => r.id), ['salada-tropical']);
});
