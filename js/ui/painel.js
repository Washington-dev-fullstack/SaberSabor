// =========================================================
// PAINEL "Monte sua fome": chips de Vontade, Com, Sem,
// Tempo e Bolso. Nada de botão de enviar: cada toque já filtra.
// =========================================================
(function (SS) {
    'use strict';

    const { el, rotuloChip } = SS.util;
    const { dados, motor } = SS;
    const norm = motor.normalizar;

    let app;
    const extras = { com: [], sem: [] }; // valores digitados nesta visita

    const BASE = {
        vontades: () => dados.VONTADES,
        com: () => dados.COM_SUGERIDOS,
        sem: () => dados.SEM_SUGERIDOS,
        tempo: () => dados.TEMPOS,
        preco: () => dados.PRECOS
    };

    function semRepetir(valores) {
        const vistos = new Set();
        return valores.filter((v) => {
            const chave = norm(v);
            if (vistos.has(chave)) return false;
            vistos.add(chave);
            return true;
        });
    }

    function valoresDoGrupo(grupo) {
        if (grupo !== 'com' && grupo !== 'sem') return BASE[grupo]();
        return semRepetir([...BASE[grupo](), ...extras[grupo], ...app.filtros[grupo]]);
    }

    const caixaDoGrupo = (grupo) => document.querySelector(`.painel [data-grupo="${grupo}"]`);
    const valorDoChip = (chip) => (chip.dataset.grupo === 'tempo' || chip.dataset.grupo === 'preco') ? Number(chip.dataset.valor) : chip.dataset.valor;

    function criarChip(grupo, valor) {
        return el('button', {
            type: 'button',
            class: 'chip',
            'data-grupo': grupo,
            'data-valor': String(valor),
            'aria-pressed': 'false',
            text: rotuloChip(grupo, valor),
            onclick: () => app.alternarChip(grupo, valor)
        });
    }

    function renderizarGrupo(grupo) {
        const caixa = caixaDoGrupo(grupo);
        const chips = valoresDoGrupo(grupo).map((v) => criarChip(grupo, v));
        if (grupo === 'com' || grupo === 'sem') chips.push(botaoAdicionar(grupo));
        caixa.replaceChildren(...chips);
    }

    function sincronizar() {
        document.querySelectorAll('.painel .chip[data-grupo]').forEach((chip) => {
            chip.setAttribute('aria-pressed', String(app.estaAtivo(chip.dataset.grupo, valorDoChip(chip))));
        });
    }

    // Valor novo vindo de fora (faixa, perfil salvo) ganha seu chip.
    function aoMudarFiltros() {
        for (const grupo of ['com', 'sem']) {
            const existentes = new Set([...caixaDoGrupo(grupo).querySelectorAll('.chip[data-valor]')].map((c) => norm(c.dataset.valor)));
            if (app.filtros[grupo].some((v) => !existentes.has(norm(v)))) renderizarGrupo(grupo);
        }
        sincronizar();
    }

    // ---------- "+ ingrediente" / "+ restrição" vira um campinho ----------
    function botaoAdicionar(grupo) {
        const botao = el('button', {
            type: 'button',
            class: 'chip chip-add',
            'data-adicionar': grupo,
            text: grupo === 'com' ? '+ ingrediente' : '+ restrição'
        });
        botao.addEventListener('click', () => abrirCampo(grupo, botao));
        return botao;
    }

    function sugestoesPara(grupo, texto) {
        const ingredientes = motor.sugerirIngredientes(app.caderno, texto, 5);
        if (grupo === 'com') return ingredientes;
        const restricoes = Object.keys(dados.RESTRICOES).filter((r) => norm(r).includes(norm(texto)));
        return semRepetir([...restricoes, ...ingredientes]).slice(0, 5);
    }

    function abrirCampo(grupo, botao) {
        const idLista = `sugestoes-${grupo}`;
        const input = el('input', {
            type: 'text',
            autocomplete: 'off',
            spellcheck: 'false',
            role: 'combobox',
            'aria-label': grupo === 'com' ? 'Novo ingrediente' : 'Nova restrição',
            'aria-expanded': 'false',
            'aria-autocomplete': 'list',
            'aria-controls': idLista,
            placeholder: grupo === 'com' ? 'ex.: abobrinha' : 'ex.: amendoim'
        });
        const lista = el('ul', { class: 'sugestoes', id: idLista, role: 'listbox', hidden: true });
        const campo = el('span', { class: 'chip-campo', 'data-grupo': grupo }, input, lista);
        let opcoes = [];
        let ativa = -1;
        let fechado = false;

        function desenhar() {
            const texto = input.value.trim();
            const sugeridas = texto ? sugestoesPara(grupo, texto) : [];
            const ehNovo = Boolean(texto) && !sugeridas.some((o) => norm(o) === norm(texto));
            opcoes = ehNovo ? [...sugeridas, texto] : sugeridas;
            ativa = opcoes.length ? 0 : -1;
            lista.replaceChildren(...opcoes.map((o, i) => el('li', {
                id: `${idLista}-${i}`,
                role: 'option',
                'aria-selected': String(i === ativa),
                onmousedown: (e) => { e.preventDefault(); confirmar(o); }
            }, ehNovo && i === opcoes.length - 1 ? ['adicionar "', o, '"'] : SS.util.destacar(o, texto))));
            lista.hidden = !opcoes.length;
            input.setAttribute('aria-expanded', String(!lista.hidden));
            marcar();
        }

        function marcar() {
            [...lista.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === ativa)));
            if (ativa >= 0) input.setAttribute('aria-activedescendant', `${idLista}-${ativa}`);
            else input.removeAttribute('aria-activedescendant');
        }

        function fechar(focarBotao) {
            if (fechado) return;
            fechado = true;
            renderizarGrupo(grupo);
            sincronizar();
            if (focarBotao) caixaDoGrupo(grupo).querySelector('[data-adicionar]')?.focus();
        }

        function confirmar(valor) {
            const limpo = String(valor || '').trim().toLowerCase();
            if (limpo) {
                if (!extras[grupo].some((v) => norm(v) === norm(limpo))) extras[grupo].push(limpo);
                fechado = true; // o renderizar do evento 'filtros' já redesenha o grupo
                app.ligarChip(grupo, limpo);
                renderizarGrupo(grupo);
                sincronizar();
                caixaDoGrupo(grupo).querySelector('[data-adicionar]')?.focus();
            } else {
                fechar(true);
            }
        }

        input.addEventListener('input', desenhar);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && opcoes.length) { e.preventDefault(); ativa = (ativa + 1) % opcoes.length; marcar(); }
            else if (e.key === 'ArrowUp' && opcoes.length) { e.preventDefault(); ativa = (ativa - 1 + opcoes.length) % opcoes.length; marcar(); }
            else if (e.key === 'Enter') { e.preventDefault(); confirmar(ativa >= 0 ? opcoes[ativa] : input.value); }
            else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(true); }
        });
        input.addEventListener('blur', () => setTimeout(() => fechar(false), 120));

        botao.replaceWith(campo);
        input.focus();
    }

    // ---------- Indicador "salvo" ----------
    function piscarSalvo() {
        const salvo = document.querySelector('.salvo');
        const texto = salvo.querySelector('.salvo-texto');
        const original = 'Seus "Com" e "Sem" ficam salvos neste navegador';
        texto.textContent = 'Salvo neste navegador';
        salvo.classList.add('acabou-de-salvar');
        clearTimeout(piscarSalvo.relogio);
        piscarSalvo.relogio = setTimeout(() => {
            salvo.classList.remove('acabou-de-salvar');
            texto.textContent = original;
        }, 1600);
    }

    function iniciar(a) {
        app = a;
        Object.keys(BASE).forEach(renderizarGrupo);
        sincronizar();
        app.on('filtros', aoMudarFiltros);
        app.on('perfil-salvo', piscarSalvo);
        document.querySelector('[data-acao="limpar"]').addEventListener('click', () => app.limparFiltros());
    }

    function piscarChip(grupo, valor) {
        const chip = [...document.querySelectorAll(`.painel .chip[data-grupo="${grupo}"]`)]
            .find((c) => norm(c.dataset.valor) === norm(valor));
        if (!chip) return;
        chip.classList.remove('piscar');
        void chip.offsetWidth;
        chip.classList.add('piscar');
        chip.addEventListener('animationend', () => chip.classList.remove('piscar'), { once: true });
    }

    (SS.ui = SS.ui || {}).painel = { iniciar, piscarChip };
})(window.SS);
