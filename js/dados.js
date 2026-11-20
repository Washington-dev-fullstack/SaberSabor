// =========================================================
// DADOS: vocabulário dos chips, dicionário de restrições
// e o caderno de receitas que vem de fábrica.
// Funciona no navegador (window.SS.dados) e no Node (require).
// =========================================================
(function (raiz) {
    'use strict';

    // Fotos linkadas direto da CDN do Unsplash (licença livre).
    const foto = (id) => `https://images.unsplash.com/photo-${id}`;

    const VONTADES = ['cremoso', 'leve', 'apimentado', 'refrescante', 'saudável'];
    const COM_SUGERIDOS = ['frango', 'carne', 'peixe', 'queijo', 'massa', 'arroz', 'ovos', 'tomate'];
    const SEM_SUGERIDOS = ['lactose', 'glúten', 'carnes', 'pimenta'];
    const TEMPOS = [15, 30, 45];
    const PRECOS = [20, 30, 40];

    // "Sem lactose" não é um ingrediente: vira uma lista de termos.
    // As exceções evitam falso positivo ("leite de coco" não tem lactose).
    const RESTRICOES = {
        'lactose': {
            termos: ['queijo', 'creme de leite', 'leite', 'iogurte', 'manteiga', 'requeijão'],
            excecoes: ['leite de coco']
        },
        'glúten': {
            termos: ['massa', 'farinha', 'trigo', 'pão', 'macarrão', 'aveia', 'cevada'],
            excecoes: []
        },
        'carnes': {
            termos: ['carne', 'frango', 'peixe', 'bacon', 'camarão', 'linguiça', 'presunto', 'atum'],
            excecoes: []
        },
        'pimenta': {
            termos: ['pimenta'],
            excecoes: ['pimentão']
        }
    };

    const CADERNO_PADRAO = [
        {
            id: 'frango-cremoso',
            nome: 'Frango cremoso com ervas',
            ingredientes: ['frango', 'creme de leite', 'cebola', 'alho', 'ervas finas'],
            vontades: ['cremoso'],
            tempo: 25, dificuldade: 'fácil', custo: 28,
            foto: foto('1586530844517-791ce35ad21d'),
            itens: ['500 g de peito de frango em cubos', '200 ml de creme de leite', '1 cebola picada', '2 dentes de alho', '1 colher (sopa) de ervas finas', 'sal, pimenta-do-reino e azeite'],
            preparo: ['Tempere o frango com sal e pimenta-do-reino.', 'Doure a cebola e o alho num fio de azeite.', 'Junte o frango e deixe pegar cor por todos os lados.', 'Entre com o creme de leite e as ervas e cozinhe em fogo baixo até engrossar.']
        },
        {
            id: 'macarrao-pesto',
            nome: 'Macarrão ao pesto',
            ingredientes: ['massa', 'manjericão', 'queijo parmesão', 'castanha-do-pará', 'alho', 'azeite'],
            vontades: ['leve'],
            tempo: 20, dificuldade: 'fácil', custo: 32,
            foto: foto('1766706519060-d44bd9dc50f7'),
            itens: ['250 g de massa curta', '1 maço de manjericão', '50 g de queijo parmesão ralado', '1/3 de xícara de castanha-do-pará', '1 dente de alho', '1/2 xícara de azeite'],
            preparo: ['Cozinhe a massa em água com sal até ficar al dente.', 'Bata no liquidificador o manjericão, o queijo, a castanha, o alho e o azeite.', 'Misture o pesto à massa com um pouco da água do cozimento.', 'Sirva com mais queijo por cima.']
        },
        {
            id: 'salada-tropical',
            nome: 'Salada tropical com frango',
            ingredientes: ['frango', 'alface', 'manga', 'castanha de caju', 'limão'],
            vontades: ['leve', 'refrescante', 'saudável'],
            tempo: 15, dificuldade: 'fácil', custo: 26,
            foto: foto('1761315600943-d8a5bb0c499f'),
            itens: ['300 g de frango grelhado em tiras', '1 pé de alface', '1 manga em cubos', '1/4 de xícara de castanha de caju', 'suco de 1 limão', 'azeite, sal e hortelã'],
            preparo: ['Grelhe o frango temperado só com sal.', 'Lave e rasgue a alface com as mãos.', 'Misture a manga, o frango e as castanhas.', 'Regue com limão e azeite na hora de servir.']
        },
        {
            id: 'risoto-queijo-tomate',
            nome: 'Risoto de queijo e tomate',
            ingredientes: ['arroz arbóreo', 'queijo parmesão', 'tomate', 'cebola', 'caldo de legumes', 'manteiga'],
            vontades: ['cremoso'],
            tempo: 35, dificuldade: 'média', custo: 35,
            foto: foto('1649510227325-5e40e1d87caa'),
            itens: ['1 xícara de arroz arbóreo', '1 litro de caldo de legumes quente', '2 tomates sem pele picados', '1/2 cebola', '60 g de queijo parmesão', '1 colher (sopa) de manteiga'],
            preparo: ['Refogue a cebola na manteiga até ficar transparente.', 'Junte o arroz e mexa por um minuto.', 'Adicione o caldo aos poucos, mexendo sempre, por uns 18 minutos.', 'Entre com o tomate na metade do cozimento.', 'Desligue o fogo e misture o queijo até ficar cremoso.']
        },
        {
            id: 'peixe-grelhado',
            nome: 'Peixe grelhado com legumes',
            ingredientes: ['peixe', 'abobrinha', 'cenoura', 'azeite', 'limão'],
            vontades: ['leve', 'saudável'],
            tempo: 25, dificuldade: 'fácil', custo: 42,
            foto: foto('1509402308-817902776267'),
            itens: ['2 filés de peixe', '1 abobrinha em rodelas', '1 cenoura em palitos', 'suco de 1 limão', 'azeite, sal e páprica'],
            preparo: ['Tempere o peixe com limão, sal e páprica.', 'Grelhe os legumes numa frigideira bem quente com azeite.', 'Grelhe o peixe por 3 a 4 minutos de cada lado.', 'Sirva tudo junto com um fio de azeite.']
        },
        {
            id: 'tacos-apimentados',
            nome: 'Tacos apimentados',
            ingredientes: ['carne moída', 'pimenta', 'milho', 'tortilha de trigo', 'queijo', 'tomate'],
            vontades: ['apimentado'],
            tempo: 30, dificuldade: 'fácil', custo: 30,
            foto: foto('1599974579688-8dbdd335c77f'),
            itens: ['400 g de carne moída', '1 pimenta dedo-de-moça picada', '1/2 xícara de milho', '6 tortilhas de trigo', '100 g de queijo ralado', '1 tomate em cubos'],
            preparo: ['Doure a carne moída com sal e a pimenta.', 'Junte o milho e deixe secar o caldo.', 'Aqueça as tortilhas numa frigideira seca.', 'Monte com a carne, o tomate e o queijo.']
        },
        {
            id: 'lasanha-berinjela',
            nome: 'Lasanha de berinjela',
            ingredientes: ['berinjela', 'queijo muçarela', 'molho de tomate', 'manjericão'],
            vontades: ['cremoso'],
            tempo: 50, dificuldade: 'média', custo: 34,
            foto: foto('1574894709920-11b28e7367e3'),
            itens: ['2 berinjelas em fatias finas', '300 g de queijo muçarela', '2 xícaras de molho de tomate', 'folhas de manjericão', 'sal e azeite'],
            preparo: ['Grelhe as fatias de berinjela com sal e azeite.', 'Num refratário, alterne molho, berinjela e queijo.', 'Termine com queijo e manjericão.', 'Asse a 200 °C por 25 minutos, até gratinar.']
        },
        {
            id: 'bowl-grao-de-bico',
            nome: 'Bowl de grão-de-bico',
            ingredientes: ['grão-de-bico', 'pepino', 'tomate', 'iogurte', 'hortelã', 'limão'],
            vontades: ['leve', 'refrescante', 'saudável'],
            tempo: 15, dificuldade: 'fácil', custo: 24,
            foto: foto('1511690656952-34342bb7c2f2'),
            itens: ['1 lata de grão-de-bico cozido', '1 pepino em cubos', '10 tomates-cereja', '1 pote de iogurte natural', 'folhas de hortelã', 'suco de 1/2 limão'],
            preparo: ['Escorra e lave o grão-de-bico.', 'Pique o pepino e corte os tomates ao meio.', 'Misture o iogurte com limão, sal e hortelã.', 'Monte o bowl e regue com o molho.']
        },
        {
            id: 'curry-legumes',
            nome: 'Curry de legumes com coco',
            ingredientes: ['abóbora', 'grão-de-bico', 'leite de coco', 'curry', 'pimenta', 'cebola'],
            vontades: ['apimentado', 'cremoso'],
            tempo: 35, dificuldade: 'fácil', custo: 29,
            foto: foto('1755090154755-006e02ea26b9'),
            itens: ['2 xícaras de abóbora em cubos', '1 xícara de grão-de-bico cozido', '200 ml de leite de coco', '1 colher (sopa) de curry', '1 pimenta dedo-de-moça', '1 cebola'],
            preparo: ['Refogue a cebola e a pimenta até murchar.', 'Junte o curry e mexa por 30 segundos.', 'Entre com a abóbora, o grão-de-bico e o leite de coco.', 'Cozinhe tampado até a abóbora ficar macia.']
        },
        {
            id: 'omelete-espinafre',
            nome: 'Omelete de espinafre e queijo',
            ingredientes: ['ovos', 'espinafre', 'queijo minas', 'cebola'],
            vontades: ['leve', 'saudável'],
            tempo: 10, dificuldade: 'fácil', custo: 15,
            foto: foto('1677844592730-ce9c936d8f1a'),
            itens: ['3 ovos', '1 xícara de espinafre', '50 g de queijo minas', '1/4 de cebola', 'sal e azeite'],
            preparo: ['Bata os ovos com uma pitada de sal.', 'Murche o espinafre e a cebola na frigideira.', 'Despeje os ovos e espalhe o queijo.', 'Dobre ao meio quando firmar embaixo.']
        },
        {
            id: 'strogonoff-frango',
            nome: 'Strogonoff de frango',
            ingredientes: ['frango', 'creme de leite', 'cogumelo', 'molho de tomate', 'cebola', 'arroz'],
            vontades: ['cremoso'],
            tempo: 30, dificuldade: 'fácil', custo: 30,
            foto: foto('1644592219048-5c070fd3c91c'),
            itens: ['500 g de frango em tiras', '1 caixa de creme de leite', '1 xícara de cogumelos', '3 colheres (sopa) de molho de tomate', '1 cebola', 'arroz branco para acompanhar'],
            preparo: ['Doure o frango com sal e cebola.', 'Junte os cogumelos e o molho de tomate.', 'Desligue o fogo e misture o creme de leite.', 'Sirva com arroz branco.']
        },
        {
            id: 'moqueca-peixe',
            nome: 'Moqueca de peixe',
            ingredientes: ['peixe', 'leite de coco', 'tomate', 'pimentão', 'cebola', 'coentro', 'pimenta dedo-de-moça', 'azeite de dendê'],
            vontades: ['apimentado'],
            tempo: 40, dificuldade: 'média', custo: 45,
            foto: foto('1620894580123-466ad3a0ca06'),
            itens: ['600 g de peixe em postas', '200 ml de leite de coco', '2 tomates em rodelas', '1 pimentão em rodelas', '1 cebola em rodelas', 'coentro, 1 pimenta dedo-de-moça e 2 colheres de azeite de dendê'],
            preparo: ['Tempere o peixe com limão e sal.', 'Numa panela, faça camadas de cebola, tomate, pimentão e peixe.', 'Regue com o leite de coco e o dendê e junte a pimenta.', 'Cozinhe tampado por 20 minutos e finalize com coentro.']
        }
    ];

    const dados = { VONTADES, COM_SUGERIDOS, SEM_SUGERIDOS, TEMPOS, PRECOS, RESTRICOES, CADERNO_PADRAO };

    if (typeof module !== 'undefined' && module.exports) module.exports = dados;
    else (raiz.SS = raiz.SS || {}).dados = dados;
})(typeof window !== 'undefined' ? window : globalThis);
