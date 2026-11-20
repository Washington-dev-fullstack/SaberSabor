# Saber Sabor — redesign (especificação)

Data: 2026-10-10 · Original intacto em `../saber sabor/`. Maquetes aprovadas em `../saber sabor/.superpowers/brainstorm/`.

## Objetivo
Redesenhar o visual e a experiência do recomendador de receitas fáceis, mantendo HTML/CSS/JS puro + GSAP e a lógica de recomendação. Público: quem cozinha em casa. Resultado: um site sofisticado, com identidade forte e cara de comida.

## Identidade (aprovada)
- **Direção "Feira"**: fundo de papel com grão, cards de foto inclinados (−8° a 8°), etiquetas e chips, toalha xadrez só nas bordas.
- **Paleta**: papel `#F1E8D8`, papel claro `#FFFDF8`, tinta `#1E1B16`, tinta suave `#6E6252`, tomate `#E2412B` (só texto grande/UI), tomate escuro `#C2321F` (texto pequeno), mostarda `#E8B53A`, oliva `#3E4A1F`, limão `#C9D86B`.
- **Tipografia**: Funnel Display (títulos, 800 com destaque em 300 tomate) + Funnel Sans (texto). Proibido: serifas, Poppins, Inter/Montserrat como título, Bebas/Anton.
- **Logo**: etiqueta de feira mostarda inclinada com "ss" + "saber sabor" em Funnel Display 800. No favicon, a etiqueta leva um "s" só.
- **Fotos**: Unsplash (linkadas da CDN deles, sem baixar), prato de cima ou a 45°, mesmo tratamento quente.

## Estrutura (aprovada)
1. Topo: logo + 3 links (Monte sua fome, Como funciona, Caderno de receitas). Sem "Entrar".
2. Título "Qual é a sua fome **hoje?**" + painel **Monte sua fome**: chips de Vontade, Com, Sem, Tempo, Bolso + lupa "Buscar prato pelo nome".
3. Pratos que combinam: grade de cards com %, que se reorganiza a cada chip.
4. Como funciona: 3 passos.
5. Faixa de vontades rolando (tocar ativa o chip).
6. Caderno de receitas: filtros rápidos, lista, + Nova receita (formulário), remover com desfazer, "restaurar caderno original".
7. Rodapé escuro com o slogan "Sua fome tem um caminho certo."
- Detalhe da receita numa gaveta lateral (no celular, de baixo para cima).

## Regras de interação (aprovadas)
- Nada de visual de chat de IA; tudo responde na hora, sem botão de enviar ou salvar.
- **Peneira** (filtro rígido): Sem (com dicionário: lactose, glúten, carnes…), Tempo ≤, Bolso ≤.
- **Balança** (pontos): Vontade = 3 pontos por acerto, Com = 2. % = pontos / máximo. Só aparecem pratos com pontos > 0.
- Sem Vontade/Com: caderno inteiro do mais rápido ao mais demorado, sem %.
- Nada combinou: sugerir os 2 chips cuja remoção traz mais pratos.
- Lupa: só pelo nome, sem acento; `/` foca, setas navegam, Enter abre a gaveta, Esc limpa; sem resultado → "+ adicionar ao caderno" com o nome preenchido.
- Com e Sem ficam salvos no navegador; Vontade/Tempo/Bolso não. Migra o perfil e o caderno do site antigo se existirem.
- Remover: some na hora e mostra "Desfazer" por 6 s.

## Movimento (decidido sem rodada de aprovação, a pedido)
- Abertura curta (≤ 1,2 s, sem tela de carregamento falsa): etiqueta da logo balança até −8°, título sobe e "hoje?" afina de 800 para 300.
- Cards: GSAP Flip ao reordenar (entra caindo com giro, sai encolhendo); no hover o card endireita e sobe.
- Seções e passos entram na rolagem (ScrollTrigger, uma vez só). Faixa em loop infinito, pausa no hover.
- Gaveta, janela e aviso deslizam. Hover em "hoje?" engrossa a letra.
- `prefers-reduced-motion`: tudo instantâneo, faixa parada.

## Arquitetura
- Pasta `saber sabor redesign/`: `index.html`, `css/` (tokens, base, componentes, secoes), `js/` (dados, motor, armazenamento, ui/*, main), `img/` (logo e favicon em SVG), `testes/`.
- Scripts clássicos com `defer` e namespace `window.SS` (abre até por `file://`). GSAP 3.13.0 via cdnjs (gsap, Flip, ScrollTrigger).
- `motor.js` só com funções puras (normalizar, peneira, pontuar, recomendar, sugerir remoções, buscar por nome), exportável para Node.
- Caderno padrão: 12 receitas com ingredientes, vontades, tempo, dificuldade, preço, foto, itens com quantidades e preparo.
- Conteúdo do usuário renderizado via `textContent` (sem `innerHTML` com dados).

## Verificação
- `node --test testes/` para o motor (peneira, dicionário de restrições, pontuação, sugestões, busca, migração).
- No navegador: console sem erros, fluxo de chips → cards → gaveta, lupa, formulário, remover/desfazer, celular (375 px) e movimento reduzido.
