// =========================================================
// MAIN: estado da página (caderno + filtros), eventos entre
// as partes da interface e o menu do topo.
// =========================================================
(function (SS) {
    'use strict';

    const { motor, armazenamento } = SS;
    const norm = motor.normalizar;

    // localStorage pode lançar erro em modo privado ou com cookies bloqueados.
    function storageSeguro() {
        try {
            const s = window.localStorage;
            s.getItem('teste');
            return s;
        } catch {
            const memoria = {};
            return {
                getItem: (k) => (k in memoria ? memoria[k] : null),
                setItem: (k, v) => { memoria[k] = String(v); },
                removeItem: (k) => { delete memoria[k]; }
            };
        }
    }

    const guarda = armazenamento.criarArmazenamento(storageSeguro());
    const perfil = guarda.carregarPerfil();
    const filtrosVazios = () => ({ vontades: [], com: [], sem: [], tempo: null, preco: null });

    const app = {
        caderno: guarda.carregarCaderno(),
        filtros: { ...filtrosVazios(), com: [...perfil.com], sem: [...perfil.sem] },
        ouvintes: {},

        on(evento, fn) { (this.ouvintes[evento] = this.ouvintes[evento] || []).push(fn); },
        emitir(evento, dado) { (this.ouvintes[evento] || []).forEach((fn) => fn(dado)); },

        resultado() { return motor.recomendar(this.caderno, this.filtros); },
        receita(id) { return this.caderno.find((r) => r.id === id); },

        // ---------- Filtros ----------
        estaAtivo(grupo, valor) {
            if (grupo === 'tempo' || grupo === 'preco') return this.filtros[grupo] === valor;
            return this.filtros[grupo].some((v) => norm(v) === norm(valor));
        },
        alternarChip(grupo, valor) {
            if (grupo === 'tempo' || grupo === 'preco') {
                this.filtros[grupo] = this.filtros[grupo] === valor ? null : valor;
            } else {
                const lista = this.filtros[grupo];
                const i = lista.findIndex((v) => norm(v) === norm(valor));
                if (i >= 0) lista.splice(i, 1);
                else lista.push(valor);
            }
            this.depoisDeFiltrar(grupo);
        },
        ligarChip(grupo, valor) {
            if (!this.estaAtivo(grupo, valor)) this.alternarChip(grupo, valor);
        },
        limparFiltros() {
            this.filtros = filtrosVazios();
            this.depoisDeFiltrar('com');
        },
        depoisDeFiltrar(grupo) {
            // Só "Com" e "Sem" (gostos e alergias) ficam salvos.
            if (grupo === 'com' || grupo === 'sem') {
                guarda.salvarPerfil(this.filtros);
                this.emitir('perfil-salvo');
            }
            this.emitir('filtros');
        },

        // ---------- Caderno ----------
        adicionarReceita(receita) {
            this.caderno.push(receita);
            this.depoisDoCaderno();
        },
        removerReceita(id) {
            const indice = this.caderno.findIndex((r) => r.id === id);
            if (indice < 0) return null;
            const [receita] = this.caderno.splice(indice, 1);
            this.depoisDoCaderno();
            return { receita, indice };
        },
        devolverReceita({ receita, indice }) {
            if (this.receita(receita.id)) return;
            this.caderno.splice(Math.min(indice, this.caderno.length), 0, receita);
            this.depoisDoCaderno();
        },
        trocarCaderno(novo) {
            const anterior = this.caderno;
            this.caderno = novo;
            this.depoisDoCaderno();
            return anterior;
        },
        restaurarCaderno() { return this.trocarCaderno(guarda.cadernoOriginal()); },
        depoisDoCaderno() {
            guarda.salvarCaderno(this.caderno);
            this.emitir('caderno');
        },

        // ---------- Navegação entre partes ----------
        abrirReceita(id) { this.emitir('abrir-receita', id); },
        novaReceita(nome) { this.emitir('nova-receita', nome || ''); }
    };

    function iniciarTopo() {
        const topo = document.querySelector('.topo');
        const botao = document.querySelector('.nav-botao');
        const lista = document.getElementById('nav-lista');

        const aoRolar = () => topo.classList.toggle('rolou', window.scrollY > 12);
        window.addEventListener('scroll', aoRolar, { passive: true });
        aoRolar();

        const abrirMenu = (abrir) => {
            botao.setAttribute('aria-expanded', String(abrir));
            botao.querySelector('.visualmente-oculto').textContent = abrir ? 'Fechar menu' : 'Abrir menu';
            lista.classList.toggle('aberta', abrir);
        };
        botao.addEventListener('click', () => abrirMenu(botao.getAttribute('aria-expanded') !== 'true'));
        lista.addEventListener('click', (e) => { if (e.target.closest('a')) abrirMenu(false); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lista.classList.contains('aberta')) { abrirMenu(false); botao.focus(); }
        });
    }

    const ui = SS.ui;
    ui.aviso.iniciar();
    ui.painel.iniciar(app);
    ui.resultados.iniciar(app);
    ui.busca.iniciar(app);
    ui.gaveta.iniciar(app);
    ui.caderno.iniciar(app);
    ui.faixa.iniciar(app);
    iniciarTopo();
    ui.movimento.iniciar();

    SS.app = app; // facilita depurar pelo console
})(window.SS);
