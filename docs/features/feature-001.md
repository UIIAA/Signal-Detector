# Feature: Deploy Atualizado na Vercel
**Status:** Draft
**Prioridade:** P0
**Data:** 2026-02-21

## Objetivo
Atualizar o deploy na Vercel para refletir todas as mudanças recentes: novo tema (red/black/white), features novas (Kanban, hábitos, critical path) e a consolidação arquitetural (remoção do signal-processor).

## Comportamento
1. Quando o código for pushado para `main`
2. Vercel faz build automático com `next build`
3. Resultado: aplicação em produção com tema Apple-inspired, todas as features e sem referências ao signal-processor

## Pré-requisitos
- [ ] Verificar que `POSTGRES_URL` está configurada nas env vars da Vercel
- [ ] Verificar que `NEXTAUTH_SECRET` está configurada
- [ ] Verificar que `GEMINI_API_KEY` (ou `GOOGLE_GENERATIVE_AI_API_KEY`) está configurada
- [ ] Verificar que `NEXTAUTH_URL` aponta para o domínio correto da Vercel

## Tarefas
1. Verificar variáveis de ambiente na Vercel
2. Push do branch `main` para o remote
3. Monitorar o build na Vercel (deve passar — já passa localmente)
4. Testar em produção:
   - Login/registro funciona
   - Dashboard carrega com novo tema
   - Kanban board funciona (CRUD + classificação IA)
   - Goals management funciona
   - Habits tracking funciona
   - Critical path wizard funciona

## Regras de Negócio
- vercel.json já aponta corretamente para `frontend/package.json`
- Todas as API routes estão no Next.js (não depende mais de serviço externo)
- Build local já passa sem erros

## Casos Extremos
- Se POSTGRES_URL não estiver configurada → app tenta SQLite → falha no Vercel (filesystem read-only)
- Se GEMINI_API_KEY não estiver configurada → classificação IA falha, mas regras heurísticas continuam funcionando
- Se build falhar na Vercel → verificar logs, pode ser diferença de Node.js version

## Critérios de Aceite
- [ ] Build passa na Vercel sem erros
- [ ] Tema red/black/white visível em produção
- [ ] Kanban board acessível e funcional em `/kanban`
- [ ] Dashboard carrega dados corretamente
- [ ] Login/registro funciona
- [ ] Nenhuma referência a localhost:4000 nos requests do browser

## Decisões Técnicas
- Não alterar código — apenas push e validação
- Se variáveis de ambiente estiverem faltando, adicionar via Vercel Dashboard

## Dependências
- Depende de: commit `24a9702` (consolidação arquitetural) estar no remote
- Bloqueia: nenhuma feature downstream
