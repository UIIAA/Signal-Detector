# Signal-Detector

---

## Migração para PostgreSQL (Concluída)

Para garantir a compatibilidade e a estabilidade do deploy na Vercel, o projeto foi migrado do SQLite para o PostgreSQL. A lógica da aplicação foi ajustada para exigir o PostgreSQL em ambiente de produção.

### Instruções para Setup de Produção (Vercel)

Para fazer o deploy da sua aplicação na Vercel, você precisa configurar um banco de dados PostgreSQL. A Vercel oferece uma opção integrada e gratuita para começar.

**1. Crie um Banco de Dados Vercel Postgres:**
   - No painel do seu projeto na Vercel, vá para a aba **Storage**.
   - Selecione **Postgres** e clique em **Create Database**.
   - Siga as instruções para criar um novo banco de dados. Associe-o ao seu projeto `Signal-Detector`.

**2. Configure a Variável de Ambiente:**
   - Após a criação, a Vercel irá gerar uma URL de conexão. Ela já deve aparecer na seção **Environment Variables** do seu projeto com o nome `POSTGRES_URL`.
   - Vá para **Settings -> Environment Variables** no seu projeto Vercel e confirme que a variável `POSTGRES_URL` existe e está conectada ao seu ambiente de produção.

**3. Inicialize o Banco de Dados:**
   - O passo final é criar as tabelas no seu novo banco de dados. Você precisa executar o script `schema.postgres.sql`.
   - Na Vercel, na página do seu banco de dados (aba **Storage**), procure por uma aba ou opção chamada **Query** ou **Console**.
   - Copie todo o conteúdo do arquivo `signal-detector/shared/database/schema.postgres.sql`.
   - Cole o conteúdo no console de query da Vercel e execute.

Após seguir esses passos, seu banco de dados estará pronto e a aplicação deverá funcionar corretamente em produção. O build na Vercel não deve mais apresentar os erros relacionados ao banco de dados.

---

## 🚀 Novas Funcionalidades Implementadas

### ✨ Matriz de Alavancagem
- **Visualização interativa** das atividades baseada em impacto vs. esforço
- **Quadrantes inteligentes** para análise de produtividade:
  - 🟢 **Alta Alavancagem**: Alto impacto, baixo esforço
  - 🔵 **Projetos Estratégicos**: Alto impacto, alto esforço
  - 🟡 **Distrações**: Baixo impacto, baixo esforço
  - 🔴 **Drenos de Energia**: Baixo impacto, alto esforço
- **Tooltips detalhados** ao passar o mouse sobre as atividades
- **Tamanho das bolhas** representa a duração da atividade

### 📊 Dashboard Aprimorado
- **Estados de carregamento melhorados** com mensagens apropriadas
- **Analytics em tempo real** com dados de produtividade
- **Matriz de alavancagem integrada** para análise visual
- **Carregamento otimizado** para melhor experiência do usuário

### 🛠️ Melhorias Técnicas
- **Campos impact e effort** adicionados à tabela de atividades
- **APIs atualizadas** para incluir dados de impacto e esforço
- **Schema do banco expandido** para suportar análise de alavancagem
- **Componentes reutilizáveis** para tooltips e visualizações

### 🔧 Correções de Bugs
- ✅ **Tooltip da matriz** agora exibe informações corretas
- ✅ **Estados de loading** mostram mensagens apropriadas
- ✅ **APIs de atividades** retornam dados completos
- ✅ **Dashboard** atualiza corretamente após adicionar atividades

---

## 📈 Como Usar a Matriz de Alavancagem

1. **Registre atividades** com valores de impacto e esforço (escala 1-10)
2. **Acesse o dashboard** para visualizar a matriz
3. **Analise os quadrantes** para identificar padrões de produtividade
4. **Passe o mouse** sobre as atividades para ver detalhes
5. **Foque em atividades** do quadrante "Alta Alavancagem" para máxima eficiência