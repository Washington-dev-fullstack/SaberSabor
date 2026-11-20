// Testes do motor de recomendação: node --test testes/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const motor = require('../js/motor.js');
const { CADERNO_PADRAO } = require('../js/dados.js');

const vazio = () => ({ vontades: [], com: [], sem: [], tempo: null, preco: null });
const nomes = (lista) => lista.map((x) => x.receita.nome);
const receita = (id) => CADERNO_PADRAO.find((r) => r.id === id);

test('normalizar tira acento, caixa e espaço', () => {
    assert.equal(motor.normalizar('  Glúten  '), 'gluten');
    assert.equal(motor.normalizar('Abóbora'), 'abobora');
    assert.equal(motor.normalizar(null), '');
});

test('restrição em grupo: lactose barra queijo, mas não leite de coco', () => {
    assert.equal(motor.temRestricao(receita('frango-cremoso'), 'lactose'), true);
    assert.equal(motor.temRestricao(receita('curry-legumes'), 'lactose'), false);
});

test('restrição pimenta não confunde pimentão', () => {
    const soPimentao = { ...receita('moqueca-peixe'), ingredientes: ['peixe', 'pimentão'] };
    assert.equal(motor.temRestricao(soPimentao, 'pimenta'), false);
    assert.equal(motor.temRestricao(receita('tacos-apimentados'), 'pimenta'), true);
});

test('restrição livre (fora do dicionário) vira o próprio termo, sem acento', () => {
    assert.equal(motor.temRestricao(receita('curry-legumes'), 'abobora'), true);
    assert.equal(motor.temRestricao(receita('curry-legumes'), 'camarão'), false);
});

test('glúten pega tortilha de trigo e massa', () => {
    assert.equal(motor.temRestricao(receita('tacos-apimentados'), 'glúten'), true);
    assert.equal(motor.temRestricao(receita('macarrao-pesto'), 'glúten'), true);
    assert.equal(motor.temRestricao(receita('lasanha-berinjela'), 'glúten'), false);
});

test('peneira: tempo e preço são limites máximos', () => {
    const f = { ...vazio(), tempo: 15, preco: 25 };
    const ok = CADERNO_PADRAO.filter((r) => motor.passaNaPeneira(r, f)).map((r) => r.id).sort();
    assert.deepEqual(ok, ['bowl-grao-de-bico', 'omelete-espinafre']);
});

test('sem vontade nem com: caderno inteiro do mais rápido ao mais demorado, sem %', () => {
    const r = motor.recomendar(CADERNO_PADRAO, vazio());
    assert.equal(r.length, CADERNO_PADRAO.length);
    assert.equal(r[0].receita.id, 'omelete-espinafre');
    assert.equal(r[r.length - 1].receita.id, 'lasanha-berinjela');
    assert.ok(r.every((x) => x.pct === null));
});

test('balança: vontade vale 3, com vale 2, e só fica quem pontua', () => {
    const f = { ...vazio(), vontades: ['cremoso'], com: ['frango'] };
    const r = motor.recomendar(CADERNO_PADRAO, f);
    // cremoso + frango = 5/5
    assert.equal(r[0].pct, 100);
    assert.deepEqual(nomes(r).slice(0, 2).sort(), ['Frango cremoso com ervas', 'Strogonoff de frango']);
    // só cremoso = 3/5 = 60%, só frango = 2/5 = 40%
    assert.equal(r.find((x) => x.receita.id === 'risoto-queijo-tomate').pct, 60);
    assert.equal(r.find((x) => x.receita.id === 'salada-tropical').pct, 40);
    assert.ok(r.every((x) => x.pct > 0));
    assert.deepEqual(r[0].acertos, { vontades: ['cremoso'], com: ['frango'] });
});

test('empate na % desempata pelo tempo', () => {
    const r = motor.recomendar(CADERNO_PADRAO, { ...vazio(), vontades: ['cremoso'], com: ['frango'] });
    assert.equal(r[0].receita.id, 'frango-cremoso'); // 25 min antes do strogonoff (30)
});

test('sem peneira antes da balança: alergia nunca aparece', () => {
    const r = motor.recomendar(CADERNO_PADRAO, { ...vazio(), vontades: ['cremoso'], sem: ['lactose'] });
    assert.deepEqual(nomes(r), ['Curry de legumes com coco']);
});

test('sugerir remoções: os chips que mais trazem pratos de volta', () => {
    const f = { ...vazio(), vontades: ['cremoso'], sem: ['lactose'], tempo: 15 };
    assert.equal(motor.recomendar(CADERNO_PADRAO, f).length, 0);
    // tirar "cremoso" → só a salada (≤15 min e sem lactose); tirar "15 min" → só o curry;
    // tirar "lactose" não traz nada, então não é sugerido.
    assert.deepEqual(motor.sugerirRemocoes(CADERNO_PADRAO, f), [
        { grupo: 'vontades', valor: 'cremoso', total: 1 },
        { grupo: 'tempo', valor: 15, total: 1 }
    ]);
});

test('buscar por nome: sem acento, começo do nome primeiro, limite', () => {
    assert.deepEqual(motor.buscarPorNome(CADERNO_PADRAO, 'risoto').map((r) => r.id), ['risoto-queijo-tomate']);
    const frango = motor.buscarPorNome(CADERNO_PADRAO, 'frango').map((r) => r.id);
    assert.equal(frango[0], 'frango-cremoso');
    assert.equal(frango.length, 3);
    assert.deepEqual(motor.buscarPorNome(CADERNO_PADRAO, 'grao').map((r) => r.id), ['bowl-grao-de-bico']);
    assert.deepEqual(motor.buscarPorNome(CADERNO_PADRAO, '   '), []);
    assert.equal(motor.buscarPorNome(CADERNO_PADRAO, 'o', 4).length, 4);
});

test('sugerir ingredientes do caderno para o campinho', () => {
    assert.deepEqual(motor.sugerirIngredientes(CADERNO_PADRAO, 'abo'), ['abóbora', 'abobrinha']);
    assert.deepEqual(motor.sugerirIngredientes(CADERNO_PADRAO, 'cebo'), ['cebola']);
    assert.deepEqual(motor.sugerirIngredientes(CADERNO_PADRAO, ''), []);
});

test('vegetariana = passa na restrição de carnes', () => {
    assert.equal(motor.ehVegetariana(receita('bowl-grao-de-bico')), true);
    assert.equal(motor.ehVegetariana(receita('moqueca-peixe')), false);
});

test('porQueCombina explica peneira e balança em frases curtas', () => {
    const f = { ...vazio(), vontades: ['cremoso'], com: ['frango'], sem: ['camarão'], tempo: 30 };
    const motivos = motor.porQueCombina(receita('frango-cremoso'), f);
    assert.deepEqual(motivos, ['cremoso', 'tem frango', 'sem camarão', 'pronto em até 30 min']);
});
