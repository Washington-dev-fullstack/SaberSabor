// =========================================================
// MOTOR: só funções puras (sem DOM). A recomendação passa por
// duas etapas: a PENEIRA tira o que não pode (Sem, Tempo, Bolso)
// e a BALANÇA dá pontos ao que a pessoa quer (Vontade, Com).
// =========================================================
(function (raiz) {
    'use strict';

    const noNode = typeof module !== 'undefined' && module.exports;
    const dados = noNode ? require('./dados.js') : raiz.SS.dados;

    const PESO_VONTADE = 3;
    const PESO_COM = 2;

    function normalizar(texto) {
        return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }

    // "lactose" vira a lista do dicionário; qualquer outra palavra vale por si.
    function termosDaRestricao(termo) {
        const alvo = normalizar(termo);
        const grupo = Object.keys(dados.RESTRICOES).find((chave) => normalizar(chave) === alvo);
        if (!grupo) return { termos: [alvo], excecoes: [] };
        const { termos, excecoes } = dados.RESTRICOES[grupo];
        return { termos: termos.map(normalizar), excecoes: excecoes.map(normalizar) };
    }

    function temRestricao(receita, termo) {
        const { termos, excecoes } = termosDaRestricao(termo);
        return receita.ingredientes.some((ingrediente) => {
            const i = normalizar(ingrediente);
            if (excecoes.some((e) => i.includes(e))) return false;
            return termos.some((t) => t.length > 1 && i.includes(t));
        });
    }

    function passaNaPeneira(receita, filtros) {
        if (filtros.tempo != null && receita.tempo > filtros.tempo) return false;
        if (filtros.preco != null && receita.custo > filtros.preco) return false;
        return !(filtros.sem || []).some((termo) => temRestricao(receita, termo));
    }

    // Termos curtos demais ("ov") dariam falso positivo.
    function temIngrediente(receita, termo) {
        const t = normalizar(termo);
        if (t.length < 3) return false;
        return normalizar(receita.nome).includes(t) || receita.ingredientes.some((i) => normalizar(i).includes(t));
    }

    function pontuar(receita, filtros) {
        const vontades = filtros.vontades || [];
        const com = filtros.com || [];
        const daReceita = (receita.vontades || []).map(normalizar);
        const acertosVontade = vontades.filter((v) => daReceita.includes(normalizar(v)));
        const acertosCom = com.filter((c) => temIngrediente(receita, c));
        const maximo = vontades.length * PESO_VONTADE + com.length * PESO_COM;
        const pontos = acertosVontade.length * PESO_VONTADE + acertosCom.length * PESO_COM;
        return {
            pontos,
            pct: maximo ? Math.round((pontos / maximo) * 100) : null,
            acertos: { vontades: acertosVontade, com: acertosCom }
        };
    }

    function porTempo(a, b) {
        return a.tempo - b.tempo || a.custo - b.custo || a.nome.localeCompare(b.nome, 'pt-BR');
    }

    function recomendar(caderno, filtros) {
        const peneirados = caderno.filter((r) => passaNaPeneira(r, filtros));
        const pesando = (filtros.vontades || []).length + (filtros.com || []).length > 0;

        if (!pesando) {
            return peneirados.slice().sort(porTempo)
                .map((receita) => ({ receita, pct: null, acertos: { vontades: [], com: [] } }));
        }
        return peneirados
            .map((receita) => ({ receita, ...pontuar(receita, filtros) }))
            .filter((x) => x.pontos > 0)
            .sort((a, b) => b.pct - a.pct || porTempo(a.receita, b.receita))
            .map(({ receita, pct, acertos }) => ({ receita, pct, acertos }));
    }

    function chipsAtivos(filtros) {
        const chips = [];
        for (const grupo of ['vontades', 'com', 'sem']) {
            for (const valor of filtros[grupo] || []) chips.push({ grupo, valor });
        }
        if (filtros.tempo != null) chips.push({ grupo: 'tempo', valor: filtros.tempo });
        if (filtros.preco != null) chips.push({ grupo: 'preco', valor: filtros.preco });
        return chips;
    }

    function semOChip(filtros, { grupo, valor }) {
        const copia = { ...filtros };
        if (grupo === 'tempo' || grupo === 'preco') copia[grupo] = null;
        else copia[grupo] = (filtros[grupo] || []).filter((v) => v !== valor);
        return copia;
    }

    // Testa tirar cada chip, um de cada vez, e devolve os que trazem mais pratos.
    function sugerirRemocoes(caderno, filtros, limite = 2) {
        return chipsAtivos(filtros)
            .map((chip) => ({ ...chip, total: recomendar(caderno, semOChip(filtros, chip)).length }))
            .filter((s) => s.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, limite);
    }

    function porComeco(alvo, a, b) {
        const inicioA = normalizar(a).startsWith(alvo) ? 0 : 1;
        const inicioB = normalizar(b).startsWith(alvo) ? 0 : 1;
        return inicioA - inicioB || a.localeCompare(b, 'pt-BR');
    }

    function buscarPorNome(caderno, texto, limite = 6) {
        const alvo = normalizar(texto);
        if (!alvo) return [];
        return caderno
            .filter((r) => normalizar(r.nome).includes(alvo))
            .sort((a, b) => porComeco(alvo, a.nome, b.nome))
            .slice(0, limite);
    }

    function sugerirIngredientes(caderno, texto, limite = 5) {
        const alvo = normalizar(texto);
        if (!alvo) return [];
        const vistos = new Map();
        for (const r of caderno) {
            for (const i of r.ingredientes) {
                const chave = normalizar(i);
                if (chave.includes(alvo) && !vistos.has(chave)) vistos.set(chave, i);
            }
        }
        return [...vistos.values()].sort((a, b) => porComeco(alvo, a, b)).slice(0, limite);
    }

    function ehVegetariana(receita) {
        return !temRestricao(receita, 'carnes');
    }

    // Frases curtas para o "Por que combina" da gaveta.
    function porQueCombina(receita, filtros) {
        const { acertos } = pontuar(receita, filtros);
        const motivos = [...acertos.vontades, ...acertos.com.map((c) => `tem ${c}`)];
        if (passaNaPeneira(receita, filtros)) {
            motivos.push(...(filtros.sem || []).map((s) => `sem ${s}`));
            if (filtros.tempo != null) motivos.push(`pronto em até ${filtros.tempo} min`);
            if (filtros.preco != null) motivos.push(`até R$ ${filtros.preco}`);
        }
        return motivos;
    }

    const motor = {
        normalizar, temRestricao, passaNaPeneira, pontuar, recomendar,
        sugerirRemocoes, buscarPorNome, sugerirIngredientes, ehVegetariana, porQueCombina
    };

    if (noNode) module.exports = motor;
    else raiz.SS.motor = motor;
})(typeof window !== 'undefined' ? window : globalThis);
