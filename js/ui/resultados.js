// =========================================================
// RESULTADOS: a grade de cards que se reorganiza (GSAP Flip)
// e o estado "nada combinou" com sugestões de chip para tirar.
// =========================================================
(function (SS) {
    'use strict';

    const { el, fotoDaReceita, giro, preco, rotuloChip, reduzMovimento } = SS.util;

    let app, grade, titulo, dica, vazio, vazioTitulo, vazioTexto, vazioSugestoes;
    const cache = new Map(); // id → <li> (reaproveitado entre renderizações)
    let jaRenderizou = false;

    function criarCard(receita) {
        const pct = el('span', { class: 'card-pct' });
        const nome = el('h3', { class: 'card-nome' });
        const meta = el('p', { class: 'card-meta' });
        const papel = el('button', { type: 'button', class: 'card-papel', onclick: () => app.abrirReceita(receita.id) },
            el('figure', { class: 'card-foto' }, fotoDaReceita(receita)), pct, nome, meta);
        const card = el('li', { class: 'card', 'data-id': receita.id, style: { '--giro': `${giro(receita.id)}deg` } }, papel);
        card.partes = { pct, nome, meta, papel };
        return card;
    }

    function atualizarCard(card, { receita, pct }) {
        const { pct: selo, nome, meta, papel } = card.partes;
        nome.textContent = receita.nome;
        meta.textContent = `${receita.tempo} min · ${receita.dificuldade} · ${preco(receita.custo)}`;
        selo.hidden = pct == null;
        selo.textContent = pct == null ? '' : `${pct}%`;
        papel.setAttribute('aria-label', `${receita.nome}${pct == null ? '' : `, ${pct}% de combinação`}. Ver receita`);
    }

    function atualizarGrade(itens) {
        const animar = jaRenderizou && window.gsap && window.Flip && !reduzMovimento();
        const atuais = [...grade.children];
        const estado = animar ? Flip.getState(atuais) : null;
        const ficam = new Set(itens.map((i) => i.receita.id));

        itens.forEach((item) => {
            let card = cache.get(item.receita.id);
            if (!card) { card = criarCard(item.receita); cache.set(item.receita.id, card); }
            if (card.saindo) {
                // Voltou antes de terminar de sair: cancela a saída.
                card.saindo = false;
                if (window.gsap) { gsap.killTweensOf(card); gsap.set(card, { clearProps: 'transform,opacity' }); }
            }
            card.style.display = '';
            atualizarCard(card, item);
            grade.appendChild(card); // reordena
        });

        const saindo = atuais.filter((c) => !ficam.has(c.dataset.id));
        if (!animar) { saindo.forEach((c) => c.remove()); return; }

        saindo.forEach((c) => { c.style.display = 'none'; c.saindo = true; });
        Flip.from(estado, {
            duration: 0.62,
            ease: 'power3.inOut',
            stagger: 0.015,
            absoluteOnLeave: true,
            onEnter: (entrando) => gsap.fromTo(entrando,
                { opacity: 0, y: 70, rotation: -10, scale: 0.92 },
                { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.65, ease: 'back.out(1.5)', stagger: 0.05, clearProps: 'transform,opacity' }),
            onLeave: (indo) => gsap.to(indo, {
                opacity: 0, scale: 0.8, rotation: 6, duration: 0.3, ease: 'power2.in',
                onComplete: () => indo.forEach((c) => {
                    if (!c.saindo) return;
                    c.saindo = false;
                    c.remove();
                    gsap.set(c, { clearProps: 'transform,opacity' });
                })
            })
        });
    }

    function rotuloSugestao({ grupo, valor }) {
        return grupo === 'sem' ? `⊘ ${valor}` : rotuloChip(grupo, valor);
    }

    function renderizarVazio() {
        if (!app.caderno.length) {
            vazioTitulo.replaceChildren('O caderno está ', el('em', { text: 'vazio' }));
            vazioTexto.textContent = 'Todas as receitas foram removidas. Dá para trazer as originais de volta ou criar uma nova.';
            vazioSugestoes.replaceChildren(
                el('button', { type: 'button', class: 'sugestao', text: 'restaurar caderno original', onclick: () => app.restaurarCaderno() }),
                el('button', { type: 'button', class: 'sugestao', text: '+ nova receita', onclick: () => app.novaReceita() })
            );
            return;
        }
        vazioTitulo.replaceChildren('Nenhum prato passou ', el('em', { text: 'na peneira' }));
        const sugestoes = SS.motor.sugerirRemocoes(app.caderno, app.filtros);
        if (!sugestoes.length) {
            vazioTexto.textContent = 'Nenhum filtro sozinho resolve. Que tal recomeçar?';
            vazioSugestoes.replaceChildren(el('button', { type: 'button', class: 'sugestao', text: 'limpar tudo', onclick: () => app.limparFiltros() }));
            return;
        }
        vazioTexto.textContent = 'Tem filtro demais para o caderno de hoje. Experimente tirar um:';
        vazioSugestoes.replaceChildren(...sugestoes.map((s) => el('button', {
            type: 'button',
            class: 'sugestao',
            onclick: () => app.alternarChip(s.grupo, s.valor)
        }, 'tirar ', el('s', { text: rotuloSugestao(s) }), ` → ${s.total} ${s.total === 1 ? 'prato' : 'pratos'}`)));
    }

    function renderizar() {
        const itens = app.resultado();
        const { vontades, com, sem, tempo, preco: limite } = app.filtros;
        const pesando = vontades.length + com.length > 0;
        const peneirando = sem.length > 0 || tempo != null || limite != null;
        const n = itens.length;
        const palavra = n === 1 ? 'prato' : 'pratos';

        const quantos = n === 0 ? 'Nenhum prato' : `${n} ${palavra}`;
        const singular = n <= 1;
        if (pesando) titulo.replaceChildren(`${quantos} `, el('em', { text: singular ? 'combina' : 'combinam' }));
        else if (peneirando) titulo.replaceChildren(`${quantos} `, el('em', { text: singular ? 'passa na peneira' : 'passam na peneira' }));
        else titulo.replaceChildren(`${quantos} `, el('em', { text: 'no caderno' }));
        dica.textContent = pesando
            ? 'Ordenados pela combinação com você.'
            : 'Do mais rápido ao mais demorado. Toque numa vontade para ver a % de combinação.';

        vazio.hidden = n > 0;
        if (!n) renderizarVazio();
        atualizarGrade(itens);
        jaRenderizou = true;
    }

    function iniciar(a) {
        app = a;
        grade = document.getElementById('grade');
        titulo = document.getElementById('resultados-titulo');
        dica = document.querySelector('.resultados-dica');
        vazio = document.getElementById('vazio');
        vazioTitulo = vazio.querySelector('.vazio-titulo');
        vazioTexto = vazio.querySelector('.vazio-texto');
        vazioSugestoes = vazio.querySelector('.vazio-sugestoes');

        app.on('filtros', renderizar);
        app.on('caderno', () => {
            const ids = new Set(app.caderno.map((r) => r.id));
            for (const id of cache.keys()) if (!ids.has(id)) cache.delete(id);
            renderizar();
        });
        renderizar();
    }

    (SS.ui = SS.ui || {}).resultados = { iniciar };
})(window.SS);
