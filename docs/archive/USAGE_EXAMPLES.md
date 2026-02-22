# EXEMPLOS DE USO - Service Layer & API Response

## Antes (código antigo)

### Component usando fetch direto
```javascript
// pages/Kanban.js
export default function KanbanPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kanban?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        // O que vem aqui? { tasks }? { data }? Não há padrão
        setTasks(data.tasks || data);
      })
      .catch(err => console.error(err));
  }, [userId]);
}
```

**Problemas:**
- Sem saber padrão de resposta, developer tenta `data.tasks` ou `data`
- Sem tratamento de erro estruturado
- Lógica de API misturada com componente
- Difícil testar ou reutilizar

---

## Depois (código novo com Service Layer)

### 1. Usar KanbanService (Recomendado)

```javascript
// pages/Kanban.js
import { KanbanService } from '../src/services';

export default function KanbanPage() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        // Service já sabe autenticar, formatear, etc
        const { data: { tasks, stats } } = await KanbanService.getTasks(userId, {
          status: 'todo',
          classificacao: 'SINAL'
        });

        setTasks(tasks);
        setStats(stats);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    loadTasks();
  }, [userId]);

  if (error) return <div>Erro: {error}</div>;
  return <div>Total: {stats?.total || 0} tarefas</div>;
}
```

**Vantagens:**
- ✅ API encapsulado no Service
- ✅ Resposta estruturada: sempre `{ data: { tasks, stats } }`
- ✅ Erro tratado como exception
- ✅ Fácil de testar (mock do Service)
- ✅ Reutilizável em vários componentes

---

### 2. Criar nova tarefa

```javascript
import { KanbanService } from '../src/services';

async function createNewTask() {
  try {
    const { data: task } = await KanbanService.createTask(userId, {
      titulo: 'Implementar feature X',
      descricao: 'Adicionar novo botão na interface',
      prioridade: 'alta',
      impacto: 8,
      esforco: 3,
      gera_receita: true
    });

    console.log(`Tarefa criada: ${task.id}`);
    console.log(`Score: ${task.signal_score} (${task.classificacao})`);

    // Atualizar UI
    setTasks([...tasks, task]);
  } catch (error) {
    console.error('Falha ao criar tarefa:', error.message);
  }
}
```

**Resposta esperada:**
```javascript
{
  success: true,
  data: {
    id: '123e4567',
    titulo: 'Implementar feature X',
    signal_score: 70,
    classificacao: 'SINAL',
    created_at: '2025-01-29T...'
  },
  message: 'Task created successfully',
  statusCode: 201,
  timestamp: '2025-01-29T...'
}
```

---

### 3. Atualizar tarefa

```javascript
async function updateTask(taskId) {
  try {
    const { data: updated } = await KanbanService.updateTask(userId, taskId, {
      status: 'progress',
      importante: true
    });

    setTasks(tasks.map(t => t.id === taskId ? updated : t));
  } catch (error) {
    showError(`Erro ao atualizar: ${error.message}`);
  }
}
```

---

### 4. Classificar com IA

```javascript
async function classifyWithAI(taskId) {
  try {
    const result = await KanbanService.classifyTask(userId, taskId, true); // useAI = true

    const { task, classification } = result.data;

    console.log(`Score: ${classification.score}`);
    console.log(`Label: ${classification.label}`); // SINAL/NEUTRO/RUÍDO
    console.log(`Reasoning: ${classification.reasoning}`);
    console.log(`Usou IA: ${classification.usedAI}`);

    // Atualizar tarefa na UI
    setTasks(tasks.map(t => t.id === taskId ? task : t));
  } catch (error) {
    showError('Classificação falhou');
  }
}
```

**Resposta esperada:**
```javascript
{
  success: true,
  data: {
    task: { /* tarefa atualizada */ },
    classification: {
      score: 75,
      label: 'SINAL',
      reasoning: 'Contribui diretamente para objetivo...',
      usedAI: true
    }
  },
  message: 'Task classified successfully',
  timestamp: '2025-01-29T...'
}
```

---

### 5. GoalService - Operações de Goals

```javascript
import { GoalService } from '../src/services';

// Listar objetivos
async function loadGoals() {
  try {
    const { data: goals } = await GoalService.getGoals(userId);
    setGoals(goals);
  } catch (error) {
    console.error('Erro ao carregar goals:', error.message);
  }
}

// Criar novo objetivo
async function createGoal() {
  try {
    const { data: goal } = await GoalService.createGoal({
      title: 'Lançar novo produto',
      description: 'Desenvolvimento e lançamento em 3 meses',
      type: 'long-term'
    }, userId);

    setGoals([...goals, goal]);
  } catch (error) {
    console.error('Erro ao criar goal:', error.message);
  }
}

// Progresso de objetivo
async function checkProgress(goalId) {
  try {
    const { data: progress } = await GoalService.getGoalProgress(goalId);
    console.log(`Progresso: ${progress.percentage}%`);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}
```

---

## Tratamento de Erros Padronizado

### API Error Response
```javascript
// 401 Unauthorized
{
  success: false,
  error: {
    message: 'User ID required',
    code: 401
  },
  timestamp: '2025-01-29T...'
}

// 404 Not Found
{
  success: false,
  error: {
    message: 'Task not found',
    code: 404
  },
  timestamp: '2025-01-29T...'
}

// 400 Validation
{
  success: false,
  error: {
    message: 'Validation failed',
    code: 400,
    validation: {
      titulo: 'Title is required',
      impacto: 'Must be number between 1-10'
    }
  },
  timestamp: '2025-01-29T...'
}
```

### Component Error Handling
```javascript
try {
  const result = await KanbanService.getTasks(userId);

  if (!result.success) {
    // Tratamento centralizado
    const error = result.error;

    if (error.code === 401) {
      // Redirecionar para login
      redirectToLogin();
    } else if (error.code === 400 && error.validation) {
      // Mostrar erros de validação
      showValidationErrors(error.validation);
    } else {
      // Erro genérico
      showError(error.message);
    }
  }
} catch (err) {
  // Erro de rede ou parsing
  showError('Network error');
}
```

---

## Cálculo Local de Score

```javascript
// Frontend pode calcular score sem chamar API
const classification = KanbanService.calculateSignalScore({
  gera_receita: true,
  prioridade: 'alta',
  urgente: true,
  importante: true,
  impacto: 8,
  esforco: 2
});

console.log(classification);
// Output:
// {
//   signal_score: 100,
//   classificacao: 'SINAL'
// }

// Gerar explanation
const explanation = KanbanService.generateReasoning(task, classification);
console.log(explanation);
// Output: "SINAL (Score: 100): Gera receita direta (+40); Prioridade alta (+30); ..."
```

---

## Padrão de Resposta Uniforme

Todas as APIs agora retornam estrutura similar:

```javascript
// GET /api/kanban - Lista
{
  success: true,
  data: { tasks: [...], stats: {...} },
  message: 'Tasks retrieved successfully',
  timestamp: '2025-01-29T...'
}

// POST /api/kanban - Cria
{
  success: true,
  data: { id: '...', titulo: '...', ... },
  message: 'Task created successfully',
  statusCode: 201,
  timestamp: '2025-01-29T...'
}

// PUT /api/kanban/[id] - Atualiza
{
  success: true,
  data: { id: '...', titulo: '...', ... },
  message: 'Task updated successfully',
  timestamp: '2025-01-29T...'
}

// DELETE /api/kanban/[id] - Deleta
{
  success: true,
  data: { deleted: true, id: '...' },
  message: 'Task deleted successfully',
  timestamp: '2025-01-29T...'
}

// Erro
{
  success: false,
  error: { message: '...', code: 400 },
  timestamp: '2025-01-29T...'
}
```

**Benefício:** Frontend sempre sabe onde procurar dados: `response.data`

---

## Testing

### Unit Test do Service
```javascript
describe('KanbanService', () => {
  it('should calculate correct signal score', () => {
    const score = KanbanService.calculateSignalScore({
      gera_receita: true,
      prioridade: 'alta',
      impacto: 8,
      esforco: 2
    });

    expect(score.signal_score).toBe(80); // 40 + 30 + 10 (leverage)
    expect(score.classificacao).toBe('SINAL');
  });
});
```

### Integration Test
```javascript
describe('Kanban API', () => {
  it('should return standardized success response', async () => {
    const response = await KanbanService.getTasks('user-123');

    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('timestamp');
  });

  it('should handle errors consistently', async () => {
    try {
      await KanbanService.getTasks(''); // sem userId
    } catch (error) {
      expect(error.message).toBe('User ID is required');
    }
  });
});
```

---

## Migração Gradual

Para projetos existentes, usar código antigo e novo em paralelo:

```javascript
// Antigo (ainda funciona)
import api from '../services/api';
api.getTasks();

// Novo (recomendado para novo código)
import { KanbanService } from '../services';
KanbanService.getTasks(userId);
```

Ambos funcionam! Migrar gradualmente conforme conveniente.

---

## Checklist para Novo Desenvolvedor

Ao trabalhar com Kanban:

- [ ] Usar `KanbanService` em vez de fetch direto
- [ ] Sempre fornecer `userId` como primeiro parâmetro
- [ ] Esperar resposta com `{ data, success, timestamp }`
- [ ] Tratar erros com try/catch
- [ ] Usar `KanbanService.calculateSignalScore()` localmente quando possível
- [ ] Consultar JSDoc dos métodos

```javascript
// ✅ BOM
const { data: tasks } = await KanbanService.getTasks(userId);

// ❌ EVITAR
fetch('/api/kanban?userId=' + userId)
  .then(r => r.json())
  .then(d => setTasks(d.tasks || d));
```

---

## Documentação Completa

Todos os métodos incluem JSDoc:

```javascript
/**
 * Busca todas as tarefas do usuário com filtros opcionais
 * @param {string} userId - ID do usuário (obrigatório)
 * @param {Object} filters - { status?, projeto?, classificacao?, gera_receita? }
 * @returns {Promise<Object>} { success, data: { tasks, stats }, message, timestamp }
 * @throws {Error} Se userId não fornecido ou rede falhar
 * @example
 * const { data } = await KanbanService.getTasks('user-123', { status: 'todo' });
 */
static async getTasks(userId, filters = {})
```

Passe o mouse no método para ver documentação completa em seu IDE!
