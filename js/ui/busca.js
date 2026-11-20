// =========================================================
// LUPA: busca só pelo nome do prato (atalho para quem já sabe
// o que quer). Lista ao vivo, setas, Enter abre, Esc limpa, "/" foca.
// =========================================================
(function (SS) {
    'use strict';

    const { el, fotoDaReceita, preco, destacar } = SS.util;

    let app, campo, lista;
    let opcoes = []; // [{ tipo: 'receita' | 'nova', receita?, nome? }]
    let ativa = -1;

    function fechar() {
        lista.hidden = true;
        campo.setAttribute('aria-expanded', 'false');
        campo.removeAttribute('aria-activedescendant');
        ativa = -1;
    }

    function marcar() {
        [...lista.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === ativa)));
        if (ativa >= 0) {
            campo.setAttribute('aria-activedescendant', `busca-op-${ativa}`);
            lista.children[ativa].scrollIntoView({ block: 'nearest' });
        } else {
            campo.removeAttribute('aria-activedescendant');
        }
    }

    function escolher(opcao) {
        if (!opcao) return;
        campo.value = '';
        fechar();
        if (opcao.tipo === 'receita') app.abrirReceita(opcao.receita.id);
        else app.novaReceita(opcao.nome);
    }

    function desenhar() {
        const texto = campo.value.trim();
        if (!texto) { fechar(); return; }
        const achadas = SS.motor.buscarPorNome(app.caderno, texto);
        opcoes = achadas.length
            ? achadas.map((receita) => ({ tipo: 'receita', receita }))
            : [{ tipo: 'nova', nome: texto }];
        ativa = 0;

        lista.replaceChildren(...opcoes.map((o, i) => {
            const atributos = {
                id: `busca-op-${i}`,
                role: 'option',
                'aria-selected': String(i === ativa),
                onmousedown: (e) => e.preventDefault(),
                onclick: () => escolher(o)
            };
            if (o.tipo === 'nova') {
                return el('li', { ...atributos, class: 'busca-opcao busca-opcao-nova' },
                    el('b', {}, 'Nenhum prato com esse nome. ', el('strong', { text: `+ adicionar "${o.nome}" ao caderno` })));
            }
            const r = o.receita;
            return el('li', { ...atributos, class: 'busca-opcao' },
                fotoDaReceita(r, { largura: 80, sizes: '40px' }),
                el('b', {}, destacar(r.nome, texto)),
                el('small', { text: `${r.tempo} min · ${preco(r.custo)}` }));
        }));
        lista.hidden = false;
        campo.setAttribute('aria-expanded', 'true');
        marcar();
    }

    function digitandoEmCampo(alvo) {
        return alvo instanceof HTMLElement && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName));
    }

    function iniciar(a) {
        app = a;
        campo = document.getElementById('busca');
        lista = document.getElementById('busca-lista');

        campo.addEventListener('input', desenhar);
        campo.addEventListener('focus', () => { if (campo.value.trim()) desenhar(); });
        campo.addEventListener('blur', () => setTimeout(fechar, 120));
        campo.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (lista.hidden) { desenhar(); return; }
                ativa = (ativa + 1) % opcoes.length; marcar();
            } else if (e.key === 'ArrowUp' && !lista.hidden) {
                e.preventDefault();
                ativa = (ativa - 1 + opcoes.length) % opcoes.length; marcar();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (!lista.hidden) escolher(opcoes[Math.max(ativa, 0)]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (campo.value) { campo.value = ''; fechar(); } else campo.blur();
            }
        });

        // "/" em qualquer lugar leva à lupa.
        document.addEventListener('keydown', (e) => {
            if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
            if (digitandoEmCampo(e.target) || document.querySelector('dialog[open]')) return;
            e.preventDefault();
            campo.focus({ preventScroll: true });
            campo.closest('.painel').scrollIntoView({ behavior: SS.util.reduzMovimento() ? 'auto' : 'smooth', block: 'center' });
        });

        // A lista acompanha o caderno (receita removida some da busca).
        app.on('caderno', () => { if (!lista.hidden) desenhar(); });
    }

    (SS.ui = SS.ui || {}).busca = { iniciar };
})(window.SS);
