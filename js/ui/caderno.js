// =========================================================
// CADERNO DE RECEITAS: lista com filtros rápidos, remover com
// "Desfazer" e o formulário de nova receita (no lugar dos prompt()).
// =========================================================
(function (SS) {
    'use strict';

    const { el, fotoDaReceita, preco, reduzMovimento } = SS.util;
    const { motor, dados } = SS;

    let app, lista, filtros, janela, form;
    let filtroAtual = 'todas';

    const FILTROS = [
        { id: 'todas', rotulo: () => `Todas · ${app.caderno.length}`, passa: () => true },
        { id: 'rapidas', rotulo: () => 'Até 20 min', passa: (r) => r.tempo <= 20 },
        { id: 'vegetarianas', rotulo: () => 'Vegetarianas', passa: (r) => motor.ehVegetariana(r) },
        { id: 'baratas', rotulo: () => 'Até R$ 30', passa: (r) => r.custo <= 30 }
    ];

    // ---------- Lista ----------
    function renderizarFiltros() {
        filtros.replaceChildren(...FILTROS.map((f) => el('button', {
            type: 'button',
            class: 'chip',
            'aria-pressed': String(f.id === filtroAtual),
            text: f.rotulo(),
            onclick: () => { filtroAtual = f.id; renderizar(); }
        })));
    }

    function linha(receita) {
        const remover = el('button', {
            type: 'button',
            class: 'linha-remover',
            'aria-label': `Remover ${receita.nome} do caderno`,
            text: 'remover'
        });
        const item = el('li', { class: 'linha-receita', 'data-id': receita.id },
            el('button', { type: 'button', class: 'linha-abrir', 'aria-label': `Ver receita: ${receita.nome}`, onclick: () => app.abrirReceita(receita.id) },
                el('span', { class: 'linha-foto' }, fotoDaReceita(receita, { largura: 128, sizes: '64px' })),
                el('span', { class: 'linha-nome', text: receita.nome }),
                el('span', { class: 'linha-ing', text: receita.ingredientes.join(', ') }),
                el('span', { class: 'linha-num', text: `${receita.tempo} min` }),
                el('span', { class: 'linha-num linha-num-preco', text: preco(receita.custo) })),
            remover);
        remover.addEventListener('click', () => removerComDesfazer(receita.id, item));
        return item;
    }

    function renderizar() {
        renderizarFiltros();
        const filtro = FILTROS.find((f) => f.id === filtroAtual);
        const visiveis = app.caderno.filter(filtro.passa);
        lista.replaceChildren(...(visiveis.length
            ? visiveis.map(linha)
            : [el('li', { class: 'lista-vazia', text: app.caderno.length ? 'Nenhuma receita neste filtro.' : 'O caderno está vazio. Crie uma receita ou restaure o caderno original.' })]));
    }

    function removerComDesfazer(id, item) {
        const executar = () => {
            const removida = app.removerReceita(id);
            if (!removida) return;
            SS.ui.aviso.mostrar(`"${removida.receita.nome}" saiu do caderno`, {
                rotulo: 'Desfazer',
                agir: () => app.devolverReceita(removida)
            });
        };
        if (window.gsap && !reduzMovimento()) {
            gsap.to(item, { height: 0, opacity: 0, x: 40, duration: 0.32, ease: 'power2.in', onComplete: executar });
        } else {
            executar();
        }
    }

    function restaurar() {
        const anterior = app.restaurarCaderno();
        SS.ui.aviso.mostrar('Caderno original restaurado', {
            rotulo: 'Desfazer',
            agir: () => app.trocarCaderno(anterior)
        });
    }

    // ---------- Formulário de nova receita ----------
    let ingredientes = [];
    let vontades = [];

    function desenharIngredientes() {
        const caixa = form.querySelector('[data-campo="ingredientes"]');
        const entrada = caixa.querySelector('input');
        caixa.querySelectorAll('.campo-chip').forEach((c) => c.remove());
        ingredientes.forEach((nome, i) => {
            caixa.insertBefore(el('span', { class: 'campo-chip' }, nome,
                el('button', {
                    type: 'button',
                    'aria-label': `Tirar ${nome}`,
                    text: '✕',
                    onclick: () => { ingredientes.splice(i, 1); desenharIngredientes(); entrada.focus(); }
                })), entrada);
        });
    }

    function adicionarIngrediente(texto) {
        texto.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).forEach((t) => {
            if (!ingredientes.some((i) => motor.normalizar(i) === motor.normalizar(t))) ingredientes.push(t);
        });
        desenharIngredientes();
    }

    function desenharVontades() {
        form.querySelector('[data-campo="vontades"]').replaceChildren(...dados.VONTADES.map((v) => el('button', {
            type: 'button',
            class: 'chip',
            'data-grupo': 'vontades',
            'aria-pressed': String(vontades.includes(v)),
            text: v,
            onclick: () => {
                vontades = vontades.includes(v) ? vontades.filter((x) => x !== v) : [...vontades, v];
                desenharVontades();
                form.querySelector(`[data-campo="vontades"] .chip:nth-child(${dados.VONTADES.indexOf(v) + 1})`).focus();
            }
        })));
    }

    function erro(campo, mensagem) {
        const alvo = campo === 'ingredientes' ? form.querySelector('.campo-chips') : form.elements[campo];
        const caixaErro = document.getElementById(campo === 'ingredientes' ? 'f-ingredientes-erro' : `f-${campo}-erro`);
        if (mensagem) alvo.setAttribute('aria-invalid', 'true');
        else alvo.removeAttribute('aria-invalid');
        if (caixaErro) caixaErro.textContent = mensagem || '';
        return Boolean(mensagem);
    }

    function validar() {
        const nome = form.elements.nome.value.trim();
        const tempo = Number(form.elements.tempo.value);
        const custo = Number(form.elements.custo.value);
        const foto = form.elements.foto.value.trim();
        const problemas = [
            erro('nome', nome ? '' : 'Dê um nome ao prato.') && form.elements.nome,
            erro('ingredientes', ingredientes.length ? '' : 'Adicione pelo menos um ingrediente.') && form.querySelector('#f-ingrediente'),
            erro('tempo', Number.isInteger(tempo) && tempo > 0 ? '' : 'Precisa ser um número inteiro de minutos.') && form.elements.tempo,
            erro('custo', Number.isFinite(custo) && custo > 0 ? '' : 'Precisa ser um valor positivo.') && form.elements.custo,
            erro('foto', !foto || /^https?:\/\//i.test(foto) ? '' : 'Use um link que comece com https://') && form.elements.foto
        ].filter(Boolean);
        if (problemas.length) problemas[0].focus();
        return !problemas.length;
    }

    function abrirFormulario(nome = '') {
        form.reset();
        ingredientes = [];
        vontades = [];
        desenharIngredientes();
        desenharVontades();
        ['nome', 'ingredientes', 'tempo', 'custo', 'foto'].forEach((c) => erro(c, ''));
        form.elements.nome.value = nome;
        janela.classList.remove('fechando');
        janela.showModal();
        (nome ? form.querySelector('#f-ingrediente') : form.elements.nome).focus();
    }

    function fecharFormulario() {
        if (!janela.open) return;
        const terminar = () => { janela.classList.remove('fechando'); if (janela.open) janela.close(); };
        if (reduzMovimento()) { terminar(); return; }
        janela.classList.add('fechando');
        setTimeout(terminar, 260);
    }

    function salvar(e) {
        e.preventDefault();
        const entrada = form.querySelector('#f-ingrediente');
        if (entrada.value.trim()) { adicionarIngrediente(entrada.value); entrada.value = ''; }
        if (!validar()) return;

        const receita = SS.armazenamento.completarReceita({
            id: SS.armazenamento.gerarId(form.elements.nome.value),
            nome: form.elements.nome.value.trim(),
            ingredientes,
            vontades,
            tempo: Number(form.elements.tempo.value),
            dificuldade: form.elements.dificuldade.value,
            custo: Number(form.elements.custo.value),
            foto: form.elements.foto.value.trim(),
            itens: ingredientes,
            preparo: form.elements.preparo.value.split('\n').map((p) => p.trim()).filter(Boolean)
        });
        app.adicionarReceita(receita);
        fecharFormulario();
        SS.ui.aviso.mostrar(`"${receita.nome}" entrou no caderno`, { rotulo: 'Ver', agir: () => app.abrirReceita(receita.id) });
    }

    function iniciarFormulario() {
        janela = document.getElementById('janela-receita');
        form = document.getElementById('form-receita');
        const entrada = form.querySelector('#f-ingrediente');

        entrada.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ',') && entrada.value.trim()) {
                e.preventDefault();
                adicionarIngrediente(entrada.value);
                entrada.value = '';
                erro('ingredientes', '');
            } else if (e.key === 'Enter') {
                e.preventDefault(); // Enter vazio não envia o formulário
            } else if (e.key === 'Backspace' && !entrada.value && ingredientes.length) {
                ingredientes.pop();
                desenharIngredientes();
            }
        });
        entrada.addEventListener('blur', () => { if (entrada.value.trim()) { adicionarIngrediente(entrada.value); entrada.value = ''; } });
        form.querySelector('.campo-chips').addEventListener('click', (e) => { if (e.target === e.currentTarget) entrada.focus(); });

        form.addEventListener('submit', salvar);
        form.addEventListener('input', (e) => { if (e.target.name) erro(e.target.name, ''); });
        janela.querySelectorAll('[data-acao="fechar"]').forEach((b) => b.addEventListener('click', fecharFormulario));
        janela.addEventListener('cancel', (e) => { e.preventDefault(); fecharFormulario(); });
    }

    function iniciar(a) {
        app = a;
        lista = document.getElementById('lista');
        filtros = document.querySelector('.filtros-rapidos');
        iniciarFormulario();
        renderizar();

        app.on('caderno', renderizar);
        app.on('nova-receita', abrirFormulario);
        document.querySelector('[data-acao="nova-receita"]').addEventListener('click', () => abrirFormulario());
        document.querySelector('[data-acao="restaurar"]').addEventListener('click', restaurar);
    }

    (SS.ui = SS.ui || {}).caderno = { iniciar };
})(window.SS);
