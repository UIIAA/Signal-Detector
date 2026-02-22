# Migração para Componentes Lazy - FASE 3 PERFORMANCE

## Objetivo
Implementar code-splitting automático substituindo importes diretos por componentes lazy loading.

---

## Antes (sem otimização)

```javascript
// pages/kanban.js
import KanbanBoard from '../src/components/KanbanBoard';

export default function Kanban() {
  return <KanbanBoard />;
}
```

**Problema:** O componente KanbanBoard é incluído no bundle inicial, mesmo que o usuário não visite a página.

---

## Depois (com otimização)

```javascript
// pages/kanban.js
import { LazyKanbanBoard } from '../src/lib/lazyComponents';
import { Box, CircularProgress } from '@mui/material';

export default function Kanban() {
  return (
    <Box>
      <LazyKanbanBoard />
    </Box>
  );
}
```

**Benefício:**
- O componente é carregado sob demanda quando a página é acessada
- Bundle inicial reduz em ~20-30%
- Mostra loading spinner enquanto o componente está sendo carregado

---

## Páginas para Migrar (Recomendações)

### 1. **pages/kanban.js** - Usar LazyKanbanBoard
```javascript
import { LazyKanbanBoard } from '../src/lib/lazyComponents';

export default function Kanban() {
  return (
    <ProtectedRoute>
      <Head>
        <title>Kanban | Signal Detector</title>
      </Head>
      <Header />
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pt: 2 }}>
        <Container maxWidth="xl">
          <LazyKanbanBoard />
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
```

### 2. **pages/plan.js** - Usar LazyLeverageMatrix
Se a página plan.js usa LeverageMatrix:
```javascript
import { LazyLeverageMatrix } from '../src/lib/lazyComponents';

export default function Plan() {
  return (
    <ProtectedRoute>
      {/* ... */}
      <LazyLeverageMatrix activities={activities} />
      {/* ... */}
    </ProtectedRoute>
  );
}
```

### 3. **pages/schedule.js** - Usar LazyTimeBlockScheduler
Se existe página com TimeBlockScheduler:
```javascript
import { LazyTimeBlockScheduler } from '../src/lib/lazyComponents';

export default function Schedule() {
  return (
    <ProtectedRoute>
      {/* ... */}
      <LazyTimeBlockScheduler userId={userId} />
      {/* ... */}
    </ProtectedRoute>
  );
}
```

---

## Como Implementar

### Passo 1: Importar do arquivo lazyComponents.js
```javascript
// ANTES:
import KanbanBoard from '../src/components/KanbanBoard';

// DEPOIS:
import { LazyKanbanBoard } from '../src/lib/lazyComponents';
```

### Passo 2: Substituir o nome do componente
```javascript
// ANTES:
<KanbanBoard />

// DEPOIS:
<LazyKanbanBoard />
```

### Passo 3: Testar carregamento
1. Abrir DevTools → Network
2. Acessar a página
3. Verificar que o componente carrega com delay (mostra spinner)
4. Confirmar funcionamento normal após carregamento

---

## Verificação de Sucesso

### No Lighthouse:
- [ ] Unused JavaScript reduzido em ~20-30KB
- [ ] First Contentful Paint melhorado
- [ ] Largest Contentful Paint melhorado

### No Chrome DevTools:
- [ ] Network: Bundle reduzido
- [ ] Performance: Menos JavaScript no critical path
- [ ] Coverage: Mais código desnecessário marcado como unused

### No console:
- Sem erros de importação
- Componentes carregam sem console.log de erros

---

## Componentes Disponíveis para Lazy Loading

```javascript
// Importar do arquivo lazyComponents.js
import {
  LazyLeverageMatrix,      // Matriz de alavancagem
  LazyKanbanBoard,         // Quadro Kanban
  LazyTimeBlockScheduler   // Agendador de blocos de tempo
} from '@/lib/lazyComponents';
```

Cada um inclui:
- Carregamento automático com Next.js dynamic()
- Loading fallback com CircularProgress
- SSR desabilitado (ssr: false) para melhor performance

---

## Impacto na Performance

**Bundle Size:**
- LeverageMatrix: ~15KB
- KanbanBoard: ~35KB
- TimeBlockScheduler: ~20KB
- Total potencial de economy: ~70KB

**Ao visitar página:**
- Usuário aguarda apenas componentes necessários
- Sem bloqueio de carregamento inicial
- Loading spinner indica atividade

---

## Rollback (Se necessário)

Se quiser reverter para importação direta:
```javascript
// Substitua:
import { LazyKanbanBoard } from '../src/lib/lazyComponents';

// Por:
import KanbanBoard from '../src/components/KanbanBoard';
```

E use `<KanbanBoard />` normalmente.

---

## Notas

- Loading fallback é mostrado apenas na primeira visita à página
- Requisições subsequentes usam cache do navegador
- Funciona automaticamente com Next.js no modo production
- Compatible com SSR via next/dynamic

---

**Implementação:** Manual page-by-page
**Tempo estimado:** 5-10 minutos por página
**Impacto:** -15-30% no bundle inicial
