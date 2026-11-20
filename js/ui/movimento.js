// =========================================================
// MOVIMENTO: abertura curta e entradas na rolagem.
// Sem GSAP ou com "reduzir movimento", tudo aparece parado.
// =========================================================
(function (SS) {
    'use strict';

    const pode = () => window.gsap && !SS.util.reduzMovimento();

    // Abertura (≤ 1,2 s, não bloqueia nada): etiqueta balança,
    // título sobe e o "hoje?" afina de 800 para 300.
    function abertura() {
        if (!pode()) return;
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.nav', { y: -24, opacity: 0, duration: 0.6 })
            .from('.topo .marca-etiqueta', { rotation: -55, duration: 1.2, ease: 'elastic.out(1, 0.4)' }, 0.05)
            .from('.abertura-titulo .t-linha', { yPercent: 70, opacity: 0, duration: 0.7 }, 0.12)
            .from('.abertura-titulo .t-destaque', { yPercent: 70, opacity: 0, duration: 0.6 }, 0.24)
            .fromTo('.abertura-titulo .t-destaque', { fontWeight: 800 }, { fontWeight: 300, duration: 0.9, ease: 'power2.inOut', clearProps: 'fontWeight' }, 0.42)
            .from('.abertura-sub', { y: 16, opacity: 0, duration: 0.5 }, 0.4)
            .from('.painel', { y: 36, opacity: 0, duration: 0.7 }, 0.45)
            .from('.grade .card', {
                y: 90, opacity: 0, rotation: (i) => (i % 2 ? 9 : -9),
                duration: 0.8, ease: 'back.out(1.3)', stagger: 0.05, clearProps: 'transform,opacity'
            }, 0.6);
    }

    // Títulos e passos entram uma vez, quando chegam à tela.
    function entradas() {
        if (!pode() || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.batch('[data-revelar]', {
            start: 'top 88%',
            once: true,
            onEnter: (lote) => gsap.fromTo(lote, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1 })
        });
        gsap.set('[data-revelar]', { opacity: 0 });

        gsap.utils.toArray('[data-passo]').forEach((passo, i) => {
            gsap.from(passo, {
                y: 80, rotation: i % 2 ? 8 : -8, opacity: 0, duration: 0.9, ease: 'back.out(1.4)', delay: i * 0.08,
                scrollTrigger: { trigger: passo, start: 'top 90%', once: true }
            });
        });

        gsap.from('.rodape-slogan', {
            y: 60, opacity: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: '.rodape', start: 'top 80%', once: true }
        });
    }

    function iniciar() {
        if (window.gsap && window.Flip) gsap.registerPlugin(Flip);
        abertura();
        entradas();
    }

    (SS.ui = SS.ui || {}).movimento = { iniciar };
})(window.SS);
