# Plano de Implementação: Novas Features - Sistema de Alavancagem

## Visão Geral
O objetivo deste plano é detalhar os passos técnicos para implementar a **Fase 2: Sistema de Alavancagem** no projeto "Sinal vs Ruído". Esta funcionalidade é o coração da aplicação, permitindo aos usuários classificar suas atividades com base em **Impacto** e **Esforço** e visualizar essa relação em uma matriz.

---

## Passo 1: Evoluir o Modelo de Dados (Database)

**Objetivo:** Adicionar suporte no banco de dados para armazenar os valores de impacto e esforço de cada atividade.

**Tarefas:**

1.  **Criar um Arquivo de Migração SQL:**
    *   Crie um novo arquivo chamado `migration_v4_leverage_system.sql` dentro do diretório `shared/database/`.
    *   Adicione o seguinte conteúdo a este arquivo. Este script adicionará as colunas `impact` e `effort` à tabela `activities` com um valor padrão de `5` para não invalidar os registros existentes.

    ```sql
    -- migration_v4_leverage_system.sql
    -- Adiciona suporte para o Sistema de Alavancagem (Impacto vs. Esforço)

    ALTER TABLE activities
    ADD COLUMN impact INTEGER NOT NULL DEFAULT 5;

    ALTER TABLE activities
    ADD COLUMN effort INTEGER NOT NULL DEFAULT 5;

    -- O valor padrão 5 é um ponto de partida neutro.
    -- A aplicação pode, no futuro, incentivar o usuário a reavaliar atividades antigas.
    ```

2.  **Aplicar a Migração (Instrução para o Desenvolvedor):**
    *   O desenvolvedor deverá executar o script de migração no banco de dados de desenvolvimento para aplicar as alterações.
    *   Comando de exemplo: `sqlite3 shared/database/signal.db < shared/database/migration_v4_leverage_system.sql`

---

## Passo 2: Atualizar o Backend (API)

**Objetivo:** Habilitar as rotas da API para receber, validar e persistir os novos dados `impact` e `effort`.

**Arquivos a serem modificados:** As rotas de API localizadas em `frontend/pages/api/activities/`.

**Tarefas:**

1.  **Modificar a Rota de Criação de Atividade (`POST /api/activities`)**:
    *   No handler da requisição `POST`, extraia `impact` e `effort` do corpo da requisição (`req.body`).
    *   **Validação:** Assegure que `impact` e `effort` são números inteiros, idealmente dentro de um intervalo esperado (ex: 0 a 10). Se estiverem ausentes, pode-se usar o valor padrão `5`.
    *   Atualize a query `INSERT` para incluir os novos campos e seus valores ao salvar a atividade no banco de dados.

2.  **Modificar a Rota de Atualização de Atividade (`PUT /api/activities/:id`)**:
    *   No handler da requisição `PUT`, extraia `impact` e `effort` do `req.body`.
    *   Adicione a mesma validação do passo anterior.
    *   Atualize a query `UPDATE` para modificar os campos `impact` e `effort` da atividade correspondente ao `:id`.

---

## Passo 3: Modificar o Frontend (Captura de Dados)

**Objetivo:** Atualizar a interface do usuário para que o usuário possa inserir os valores de impacto e esforço.

**Arquivos a serem modificados:** O componente de formulário para registro/edição de atividades (ex: `frontend/pages/record.js`, `frontend/pages/text-entry.js` ou um componente dedicado).

**Tarefas:**

1.  **Adicionar Campos ao Formulário:**
    *   Adicione dois novos controles de formulário para "Impacto" e "Esforço".
    *   **Recomendação de UI:** Utilize componentes `<Slider>` da biblioteca Material-UI (ou similar) com um intervalo de 0 a 10 para uma experiência de usuário mais intuitiva. Adicione `labels` claras como "Impacto no Objetivo (0-10)" e "Esforço Necessário (0-10)".

2.  **Atualizar o Gerenciamento de Estado do Formulário:**
    *   No componente React, adicione `impact` e `effort` ao estado do formulário (ex: `useState({ ..., impact: 5, effort: 5 })`).

3.  **Atualizar a Lógica de Submissão:**
    *   Na função `onSubmit` que envia os dados para a API, inclua os valores de `impact` e `effort` no payload da requisição.

---

## Passo 4: Visualizar a Matriz de Alavancagem (Dashboard)

**Objetivo:** Criar o componente visual da Matriz de Alavancagem e integrá-lo ao dashboard.

**Tarefas:**

1.  **Criar um Novo Componente `LeverageMatrix.js`:**
    *   Crie o arquivo `frontend/src/components/LeverageMatrix.js`.
    *   Este componente receberá a lista de atividades (`activities`) como `props`.

2.  **Implementar o Gráfico de Dispersão:**
    *   Dentro de `LeverageMatrix.js`, utilize a biblioteca `Recharts` para construir um `ScatterChart`.
    *   **Eixos:** Configure o eixo X para "Esforço" e o eixo Y para "Impacto".
    *   **Dados:** Cada ponto no gráfico representará uma atividade, plotada de acordo com seus valores `effort` e `impact`.
    *   **Quadrantes:** Utilize `ReferenceArea` ou estilização de fundo para dividir visualmente o gráfico em quatro quadrantes:
        *   **Q1 (Canto Superior Esquerdo):** Alto Impacto, Baixo Esforço (Cor: Verde) - "Vitórias Rápidas"
        *   **Q2 (Canto Superior Direito):** Alto Impacto, Alto Esforço (Cor: Azul) - "Projetos Estratégicos"
        *   **Q3 (Canto Inferior Esquerdo):** Baixo Impacto, Baixo Esforço (Cor: Amarelo) - "Distrações"
        *   **Q4 (Canto Inferior Direito):** Baixo Impacto, Alto Esforço (Cor: Vermelho) - "Drenos de Energia"
    *   **Tooltips:** Configure os tooltips para exibir o nome da atividade ao passar o mouse sobre um ponto.

3.  **Integrar ao Dashboard:**
    *   No arquivo `frontend/pages/dashboard.js`, importe o novo componente `LeverageMatrix`.
    *   Obtenha os dados das atividades (provavelmente através de uma chamada de API).
    *   Renderize o componente, passando os dados das atividades: `<LeverageMatrix activities={data} />`.

