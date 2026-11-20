// =========================================================
// GAVETA: detalhe da receita. Desliza da direita (no celular,
// sobe de baixo). Fecha com Esc, com o X ou clicando fora.
// =========================================================
(function (SS) {
    'use strict';

    const { el, fotoDaReceita, preco } = SS.util;
    const { motor } = SS;

    let app, gaveta, quemAbriu = null, fechando = false;

    function preencher(receita) {
        const q = (s) => gaveta.querySelector(s);
        q('.gaveta-foto').replaceChildren(fotoDaReceita(receita, { largura: 640, proporcao: 16 / 10, sizes: '(max-width: 760px) 100vw, 560px', ansiosa: true }));
        q('.gaveta-nome').textContent = receita.nome;

        const { pct } = motor.pontuar(receita, app.filtros);
        const meta = [
            el('li', { text: `${receita.tempo} min` }),
            el('li', { text: receita.dificuldade }),
            el('li', { text: preco(receita.custo) })
        ];
        if (pct != null && motor.passaNaPeneira(receita, app.filtros)) meta.push(el('li', { class: 'pct', text: `${pct}% com você` }));
        q('.gaveta-meta').replaceChildren(...meta);

        const motivos = motor.porQueCombina(receita, app.filtros);
        q('.gaveta-motivo').hidden = !motivos.length;
        q('.gaveta-motivos').replaceChildren(...motivos.map((m) => el('li', { text: m })));

        q('.gaveta-itens').replaceChildren(...receita.itens.map((i) => el('li', { text: i })));
        q('.gaveta-preparo').replaceChildren(...(receita.preparo.length
            ? receita.preparo.map((p) => el('li', { text: p }))
            : [el('li', { class: 'gaveta-vazio', text: 'Esta receita ainda não tem modo de preparo.' })]));
    }

    function abrir(id) {
        const receita = app.receita(id);
        if (!receita) return;
        preencher(receita);
        quemAbriu = document.activeElement;
        gaveta.classList.remove('fechando');
        if (!gaveta.open) gaveta.showModal();
        gaveta.scrollTop = 0;
        gaveta.querySelector('.fechar').focus({ preventScroll: true });
    }

    function fechar() {
        if (!gaveta.open || fechando) return;
        fechando = true;
        gaveta.classList.add('fechando');
        const terminar = () => {
            if (!fechando) return;
            gaveta.classList.remove('fechando');
            gaveta.close();
            fechando = false;
            if (quemAbriu && document.contains(quemAbriu)) quemAbriu.focus({ preventScroll: true });
        };
        if (SS.util.reduzMovimento()) { terminar(); return; }
        gaveta.addEventListener('animationend', (e) => { if (e.target === gaveta) terminar(); }, { once: true });
        setTimeout(terminar, 450); // garantia se a animação não disparar o evento
    }

    // Clique no fundo escurecido: o alvo é o próprio <dialog>, mas fora da caixa dele.
    function cliqueForaDaCaixa(e) {
        if (e.target !== gaveta) return false;
        const r = gaveta.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    }

    function iniciar(a) {
        app = a;
        gaveta = document.getElementById('gaveta');
        gaveta.querySelector('[data-acao="fechar"]').addEventListener('click', fechar);
        gaveta.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); }); // Esc
        gaveta.addEventListener('click', (e) => { if (cliqueForaDaCaixa(e)) fechar(); });
        app.on('abrir-receita', abrir);
    }

    (SS.ui = SS.ui || {}).gaveta = { iniciar, fechar };
})(window.SS);
