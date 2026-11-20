// =========================================================
// ARMAZENAMENTO: caderno e perfil (Com/Sem) no localStorage.
// Lê os dados do site antigo na primeira visita e nunca derruba
// a página se o storage estiver bloqueado ou corrompido.
// =========================================================
(function (raiz) {
    'use strict';

    const noNode = typeof module !== 'undefined' && module.exports;
    const dados = noNode ? require('./dados.js') : raiz.SS.dados;
    const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    const CHAVES = { caderno: 'saberSabor.v2.caderno', perfil: 'saberSabor.v2.perfil' };
    const CHAVES_ANTIGAS = { caderno: 'saberSabor_comidas', perfil: 'saberSabor_perfil' };

    const copiar = (valor) => JSON.parse(JSON.stringify(valor));
    const lista = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

    function gerarId(nome) {
        const base = normalizar(nome).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'receita';
        return `${base}-${Math.random().toString(36).slice(2, 7)}`;
    }

    // Garante todos os campos, mesmo vindo de dado velho ou editado à mão.
    function completarReceita(r) {
        const ingredientes = lista(r.ingredientes);
        return {
            id: r.id || gerarId(r.nome),
            nome: String(r.nome || 'Receita sem nome'),
            ingredientes,
            vontades: lista(r.vontades),
            tempo: Number(r.tempo) > 0 ? Number(r.tempo) : 30,
            dificuldade: r.dificuldade || 'fácil',
            custo: Number(r.custo) >= 0 ? Number(r.custo) : 0,
            foto: typeof r.foto === 'string' ? r.foto : '',
            itens: lista(r.itens).length ? lista(r.itens) : ingredientes,
            preparo: lista(r.preparo)
        };
    }

    function migrarCaderno(antigo, padrao) {
        return antigo.map((velha) => {
            const conhecida = padrao.find((p) => normalizar(p.nome) === normalizar(velha.nome));
            return conhecida ? copiar(conhecida) : completarReceita({ ...velha, id: null });
        });
    }

    function migrarPerfil(antigo) {
        const separar = (texto) => String(texto || '').split(',').map((p) => p.trim()).filter(Boolean);
        return {
            com: separar(antigo.gostaAlimentos),
            sem: antigo.alergiaAtiva ? separar(antigo.alergiaIngrediente) : []
        };
    }

    function criarArmazenamento(storage) {
        function ler(chave) {
            try {
                const bruto = storage.getItem(chave);
                return bruto == null ? null : JSON.parse(bruto);
            } catch {
                return null;
            }
        }
        function gravar(chave, valor) {
            try { storage.setItem(chave, JSON.stringify(valor)); } catch { /* storage cheio ou bloqueado */ }
        }

        return {
            carregarCaderno() {
                const novo = ler(CHAVES.caderno);
                if (Array.isArray(novo)) return novo.map(completarReceita);
                const antigo = ler(CHAVES_ANTIGAS.caderno);
                if (Array.isArray(antigo)) return migrarCaderno(antigo, dados.CADERNO_PADRAO);
                return copiar(dados.CADERNO_PADRAO);
            },
            salvarCaderno(caderno) { gravar(CHAVES.caderno, caderno); },
            carregarPerfil() {
                const novo = ler(CHAVES.perfil);
                if (novo && typeof novo === 'object') return { com: lista(novo.com), sem: lista(novo.sem) };
                const antigo = ler(CHAVES_ANTIGAS.perfil);
                if (antigo && typeof antigo === 'object') return migrarPerfil(antigo);
                return { com: [], sem: [] };
            },
            salvarPerfil(perfil) { gravar(CHAVES.perfil, { com: perfil.com, sem: perfil.sem }); },
            cadernoOriginal() { return copiar(dados.CADERNO_PADRAO); }
        };
    }

    const api = { criarArmazenamento, migrarCaderno, migrarPerfil, completarReceita, gerarId, CHAVES };

    if (noNode) module.exports = api;
    else raiz.SS.armazenamento = api;
})(typeof window !== 'undefined' ? window : globalThis);
