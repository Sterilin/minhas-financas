# 🚀 Roadmap de Otimização e Refatoração - Minhas Finanças Pro

Este documento lista as melhorias técnicas necessárias para elevar a escalabilidade, performance e segurança do aplicativo, mantendo a arquitetura Serverless (Google Sheets + GitHub Pages).

## Fase 1: Arquitetura e Modularidade (ES Modules)
Atualmente, o projeto utiliza o escopo global (`window.Module`) para comunicação.
- [ ] **Migrar para ES Modules:** Alterar a declaração dos scripts no `index.html` para `<script type="module" src="js/main.js"></script>`.
- [ ] **Remover variáveis globais:** Utilizar `export default` nos arquivos `js/modules/` e `js/core/`, e realizar os devidos `imports` onde forem necessários.
- [ ] **Refatorar AppState e AppParams:** Centralizar o estado da aplicação utilizando um padrão Singleton importável, garantindo reatividade de forma segura.

## Fase 2: Performance e Carregamento
O aplicativo precisa ser rápido e leve em conexões 3G.
- [ ] **Remover Tailwind CDN:** Configurar o Tailwind CLI localmente para compilar as classes utilizadas em um arquivo `css/tailwind.min.css` estático. Remover o script CDN do `<head>`.
- [ ] **Otimização do DOM (Tabelas):** Refatorar o método `renderBankTable` no `Tables.js`. Substituir o uso de `innerHTML` (concatenação de strings) por `DocumentFragment` ou virtualização (exibir apenas os itens visíveis na tela) para evitar o congelamento da UI ao renderizar milhares de transações.
- [ ] **Lazy Loading do Chart.js:** Carregar a biblioteca Chart.js apenas quando o usuário navegar para uma aba que possua gráficos (`Dashboard`, `Report`, `Compare`), reduzindo o tempo de bloqueio inicial da página.

## Fase 3: Segurança e Robustez (Tratamento de Dados)
Como os dados vêm de uma fonte externa editável (Google Sheets), precisamos blindar a interface.
- [ ] **Prevenção de XSS:** Criar um método `Utils.sanitizeHTML()` para escapar caracteres perigosos (`<`, `>`, `&`) vindos das descrições das planilhas antes de injetá-los no DOM.
- [ ] **Tratamento de Erros de Rede:** Melhorar os blocos `try/catch` no `DataService.js`. Caso a planilha do Google esteja fora do ar ou o limite de requisições exceda, exibir uma notificação amigável (Toast) em vez de apenas travar ou falhar silenciosamente no console.
- [ ] **Robustez do Parser (Worker):** Garantir que, caso uma linha da planilha (TSV) venha em branco ou com formato de data incorreto, o método `parseBankStatement` pule essa linha com um aviso, em vez de invalidar o lote inteiro de dados.

## Fase 4: Experiência do Usuário (UX/UI)
- [ ] **Feedback de Sincronização:** Adicionar indicadores visuais mais claros (Spinners) nos botões de atualização enquanto o `DataService` busca novos dados no background.
- [ ] **Filtros e Buscas Locais:** Implementar uma barra de busca rápida na aba "Dados" para filtrar transações específicas por texto na tabela já carregada em memória.