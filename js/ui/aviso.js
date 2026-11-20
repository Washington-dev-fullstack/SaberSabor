// =========================================================
// AVISO: mensagem curta no rodapé da tela, com uma ação
// opcional (ex.: "Desfazer") que expira sozinha.
// =========================================================
(function (SS) {
    'use strict';

    let caixa, texto, acao, barra, relogio, aoAgir;

    function esconder() {
        clearTimeout(relogio);
        caixa.hidden = true;
        aoAgir = null;
    }

    function mostrar(mensagem, { rotulo = '', agir = null, duracao = 6000 } = {}) {
        clearTimeout(relogio);
        texto.textContent = mensagem;
        acao.textContent = rotulo;
        acao.hidden = !rotulo;
        aoAgir = agir;
        caixa.style.setProperty('--duracao', `${duracao}ms`);
        // Reinicia as animações de entrada e da barra.
        caixa.hidden = true;
        barra.style.animation = 'none';
        void caixa.offsetWidth;
        barra.style.animation = '';
        caixa.hidden = false;
        relogio = setTimeout(esconder, duracao);
    }

    function iniciar() {
        caixa = document.getElementById('aviso');
        texto = caixa.querySelector('.aviso-texto');
        acao = caixa.querySelector('.aviso-acao');
        barra = caixa.querySelector('.aviso-barra');
        acao.addEventListener('click', () => {
            const fn = aoAgir;
            esconder();
            if (fn) fn();
        });
        // Passar o mouse segura o aviso (dá tempo de clicar em "Desfazer").
        caixa.addEventListener('mouseenter', () => { clearTimeout(relogio); barra.style.animationPlayState = 'paused'; });
        caixa.addEventListener('mouseleave', () => { relogio = setTimeout(esconder, 2500); barra.style.animationPlayState = ''; });
    }

    (SS.ui = SS.ui || {}).aviso = { iniciar, mostrar, esconder };
})(window.SS);
