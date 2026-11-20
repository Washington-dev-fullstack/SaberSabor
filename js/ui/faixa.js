// =========================================================
// FAIXA DE VONTADES: letreiro de feira rolando sem parar.
// Tocar numa palavra liga o chip lá no painel.
// =========================================================
(function (SS) {
    'use strict';

    const { el } = SS.util;

    const ITENS = [
        { texto: 'cremoso', grupo: 'vontades', valor: 'cremoso' },
        { texto: 'sem glúten', grupo: 'sem', valor: 'glúten' },
        { texto: 'até 15 minutos', grupo: 'tempo', valor: 15 },
        { texto: 'apimentado', grupo: 'vontades', valor: 'apimentado' },
        { texto: 'até R$ 30', grupo: 'preco', valor: 30 },
        { texto: 'leve', grupo: 'vontades', valor: 'leve' },
        { texto: 'com frango', grupo: 'com', valor: 'frango' },
        { texto: 'refrescante', grupo: 'vontades', valor: 'refrescante' },
        { texto: 'sem lactose', grupo: 'sem', valor: 'lactose' },
        { texto: 'saudável', grupo: 'vontades', valor: 'saudável' }
    ];

    let app;

    function grupo(copia) {
        const filhos = [];
        ITENS.forEach((item) => {
            filhos.push(el('button', {
                type: 'button',
                class: 'faixa-item',
                tabindex: copia ? '-1' : null,
                text: item.texto,
                onclick: () => usar(item)
            }));
            filhos.push(el('span', { class: 'faixa-ponto', 'aria-hidden': 'true', text: '·' }));
        });
        return el('div', { class: 'faixa-grupo', 'aria-hidden': copia ? 'true' : null }, filhos);
    }

    function usar(item) {
        app.ligarChip(item.grupo, item.valor);
        const painel = document.getElementById('painel');
        painel.scrollIntoView({ behavior: SS.util.reduzMovimento() ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => SS.ui.painel.piscarChip(item.grupo, item.valor), 450);
    }

    function iniciar(a) {
        app = a;
        // Duas cópias lado a lado: a animação anda metade e recomeça sem emenda.
        document.querySelector('.faixa-trilho').replaceChildren(grupo(false), grupo(true));
    }

    (SS.ui = SS.ui || {}).faixa = { iniciar };
})(window.SS);
