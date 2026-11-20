// =========================================================
// UTIL: criação de elementos, imagens e pequenos ajudantes.
// Dados do usuário entram sempre como texto (nunca innerHTML).
// =========================================================
(function (SS) {
    'use strict';

    // el('li', { class: 'x', 'aria-label': '…', onclick: fn }, filho1, 'texto', …)
    function el(tag, atributos = {}, ...filhos) {
        const no = document.createElement(tag);
        for (const [nome, valor] of Object.entries(atributos)) {
            if (valor == null || valor === false) continue;
            if (nome === 'class') no.className = valor;
            else if (nome === 'text') no.textContent = valor;
            else if (nome.startsWith('on') && typeof valor === 'function') no.addEventListener(nome.slice(2), valor);
            else if (nome === 'style' && typeof valor === 'object') {
                // setProperty aceita variáveis CSS ("--giro"); atribuição direta não.
                for (const [prop, v] of Object.entries(valor)) no.style.setProperty(prop, v);
            }
            else no.setAttribute(nome, valor === true ? '' : valor);
        }
        for (const filho of filhos.flat()) {
            if (filho == null || filho === false) continue;
            no.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
        }
        return no;
    }

    // Unsplash aceita largura/altura na URL: pedimos só o tamanho necessário.
    function urlDaFoto(url, largura, altura) {
        if (!/^https:\/\/images\.unsplash\.com\//.test(url)) return url;
        const base = url.split('?')[0];
        return `${base}?auto=format&fit=crop&q=72&w=${largura}${altura ? `&h=${altura}` : ''}`;
    }

    const CORES_VONTADE = {
        cremoso: '#E8B53A', leve: '#8FA35A', apimentado: '#E2412B', refrescante: '#3E4A1F', saudável: '#3E4A1F'
    };

    // Imagem da receita; sem foto, uma "foto" desenhada com a inicial.
    function fotoDaReceita(receita, { largura = 480, proporcao = 1, sizes = '(max-width: 760px) 72vw, 280px', ansiosa = false } = {}) {
        if (!receita.foto) {
            const cor = CORES_VONTADE[(receita.vontades || [])[0]] || '#E8B53A';
            return el('div', { class: 'foto-desenhada', style: { '--cor': cor }, role: 'img', 'aria-label': receita.nome },
                receita.nome.trim().charAt(0).toUpperCase() || '?');
        }
        const altura = (l) => Math.round(l / proporcao);
        const img = el('img', {
            src: urlDaFoto(receita.foto, largura, altura(largura)),
            srcset: /unsplash/.test(receita.foto)
                ? `${urlDaFoto(receita.foto, largura, altura(largura))} ${largura}w, ${urlDaFoto(receita.foto, largura * 2, altura(largura * 2))} ${largura * 2}w`
                : null,
            sizes: /unsplash/.test(receita.foto) ? sizes : null,
            alt: receita.nome,
            loading: ansiosa ? 'eager' : 'lazy',
            decoding: 'async',
            width: largura,
            height: altura(largura)
        });
        // Link quebrado (receita do usuário): troca pela foto desenhada.
        img.addEventListener('error', () => img.replaceWith(fotoDaReceita({ ...receita, foto: '' })), { once: true });
        return img;
    }

    // Inclinação fixa por receita, entre -6° e 6°.
    function giro(id) {
        let h = 0;
        for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0;
        return ((Math.abs(h) % 13) - 6) || 3;
    }

    const preco = (valor) => `R$ ${valor}`;

    function rotuloChip(grupo, valor) {
        if (grupo === 'tempo') return `até ${valor} min`;
        if (grupo === 'preco') return `até R$ ${valor}`;
        return String(valor);
    }

    // Destaca o trecho buscado, ignorando acentos (as posições batem porque o texto está em NFC).
    function destacar(texto, busca) {
        const alvo = SS.motor.normalizar(busca);
        const i = SS.motor.normalizar(texto).indexOf(alvo);
        if (!alvo || i < 0) return [texto];
        return [texto.slice(0, i), el('mark', { text: texto.slice(i, i + alvo.length) }), texto.slice(i + alvo.length)];
    }

    const reduzMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    SS.util = { el, urlDaFoto, fotoDaReceita, giro, preco, rotuloChip, destacar, reduzMovimento };
})(window.SS);
