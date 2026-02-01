import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Checkbox,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  IconButton
} from '@mui/material';
import {
  CloudUpload,
  Close,
  InsertDriveFile,
  AutoAwesome,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const PROJECTS = ['DEFENZ', 'CONNECT', 'GRAFONO', 'PEC', 'PESSOAL'];

const ACCEPTED_EXTENSIONS = ['.txt', '.csv', '.xlsx'];

// Header aliases for structured files
const HEADER_MAP = {
  titulo: 'titulo', title: 'titulo', tarefa: 'titulo', task: 'titulo', nome: 'titulo', name: 'titulo',
  descricao: 'descricao', description: 'descricao', desc: 'descricao', detalhes: 'descricao',
  projeto: 'projeto', project: 'projeto', proj: 'projeto',
  categoria: 'categoria', category: 'categoria', cat: 'categoria',
  prioridade: 'prioridade', priority: 'prioridade', prio: 'prioridade'
};

const PRIORITY_MAP = {
  alta: 'alta', high: 'alta', h: 'alta', '3': 'alta',
  media: 'media', medium: 'media', m: 'media', '2': 'media', 'média': 'media',
  baixa: 'baixa', low: 'baixa', l: 'baixa', '1': 'baixa'
};

function normalizeHeader(h) {
  return h.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function mapHeaders(rawHeaders) {
  const mapped = {};
  rawHeaders.forEach((h, i) => {
    const key = normalizeHeader(h);
    if (HEADER_MAP[key]) {
      mapped[i] = HEADER_MAP[key];
    }
  });
  return mapped;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  const firstRow = parseCSVLine(lines[0]);
  const headerMap = mapHeaders(firstRow);
  const hasHeaders = Object.keys(headerMap).length > 0;

  const dataLines = hasHeaders ? lines.slice(1) : lines;
  return dataLines.map(line => {
    const cols = parseCSVLine(line);
    if (hasHeaders) {
      const task = { titulo: '', descricao: '', projeto: '', prioridade: '' };
      Object.entries(headerMap).forEach(([idx, field]) => {
        if (cols[idx] !== undefined) task[field] = cols[idx];
      });
      return task;
    }
    // No recognized headers — first column = titulo
    return { titulo: cols[0] || '', descricao: cols[1] || '', projeto: cols[2] || '', prioridade: cols[3] || '' };
  }).filter(t => t.titulo.trim());
}

function parseXLSX(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length === 0) return [];

  const firstRow = rows[0].map(String);
  const headerMap = mapHeaders(firstRow);
  const hasHeaders = Object.keys(headerMap).length > 0;

  const dataRows = hasHeaders ? rows.slice(1) : rows;
  return dataRows.map(row => {
    const cols = row.map(String);
    if (hasHeaders) {
      const task = { titulo: '', descricao: '', projeto: '', prioridade: '' };
      Object.entries(headerMap).forEach(([idx, field]) => {
        if (cols[idx] !== undefined) task[field] = cols[idx];
      });
      return task;
    }
    return { titulo: cols[0] || '', descricao: cols[1] || '', projeto: cols[2] || '', prioridade: cols[3] || '' };
  }).filter(t => t.titulo.trim());
}

function isSimpleList(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return false;
  const longLines = lines.filter(l => l.trim().length > 80);
  return longLines.length / lines.length < 0.3;
}

function parseTXTAsList(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.replace(/^[\s\-\*\d\.\)\]]+/, '').trim())
    .filter(l => l.length > 0)
    .map(l => ({ titulo: l, descricao: '', projeto: '', prioridade: '' }));
}

function normalizePriority(val) {
  if (!val) return 'media';
  return PRIORITY_MAP[val.toLowerCase().trim()] || 'media';
}

function normalizeProject(val) {
  if (!val) return '';
  const upper = val.toUpperCase().trim();
  return PROJECTS.includes(upper) ? upper : '';
}

const ImportTasksDialog = ({ open, onClose, onImportComplete, fetchWithAuth }) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedTasks, setParsedTasks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [useAI, setUseAI] = useState(false);
  const [aiNeeded, setAiNeeded] = useState(false);
  const [defaultProject, setDefaultProject] = useState('PESSOAL');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setParsedTasks([]);
    setSelected([]);
    setUseAI(false);
    setAiNeeded(false);
    setDefaultProject('PESSOAL');
    setParsing(false);
    setImporting(false);
    setError(null);
    setDragOver(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setParsing(true);
    setParsedTasks([]);

    try {
      const ext = selectedFile.name.split('.').pop().toLowerCase();

      let tasks = [];
      let needsAI = false;

      if (ext === 'csv') {
        const text = await selectedFile.text();
        tasks = parseCSV(text);
      } else if (ext === 'xlsx') {
        const buf = await selectedFile.arrayBuffer();
        tasks = parseXLSX(buf);
      } else if (ext === 'txt') {
        const text = await selectedFile.text();
        if (isSimpleList(text)) {
          tasks = parseTXTAsList(text);
        } else {
          needsAI = true;
          setAiNeeded(true);
          setUseAI(true);
          // Send to AI
          const res = await fetchWithAuth('/api/kanban/parse-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          if (!res.ok) throw new Error('Erro ao processar com IA');
          const data = await res.json();
          tasks = data.data?.tasks || data.tasks || [];
        }
      } else {
        throw new Error(`Formato .${ext} nao suportado. Use .txt, .csv ou .xlsx`);
      }

      // Normalize fields
      tasks = tasks.map((t, i) => ({
        _id: i,
        titulo: (t.titulo || '').trim(),
        descricao: (t.descricao || '').trim(),
        projeto: normalizeProject(t.projeto),
        prioridade: normalizePriority(t.prioridade)
      })).filter(t => t.titulo);

      setParsedTasks(tasks);
      setSelected(tasks.map(t => t._id));
      if (!needsAI) setAiNeeded(false);
    } catch (err) {
      console.error('Parse error:', err);
      setError(err.message || 'Erro ao processar arquivo');
    } finally {
      setParsing(false);
    }
  }, [fetchWithAuth]);

  const handleReprocessWithAI = useCallback(async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const text = await file.text();
      const res = await fetchWithAuth('/api/kanban/parse-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Erro ao processar com IA');
      const data = await res.json();
      let tasks = (data.data?.tasks || data.tasks || []).map((t, i) => ({
        _id: i,
        titulo: (t.titulo || '').trim(),
        descricao: (t.descricao || '').trim(),
        projeto: normalizeProject(t.projeto),
        prioridade: normalizePriority(t.prioridade)
      })).filter(t => t.titulo);
      setParsedTasks(tasks);
      setSelected(tasks.map(t => t._id));
    } catch (err) {
      setError(err.message || 'Erro ao reprocessar com IA');
    } finally {
      setParsing(false);
    }
  }, [file, fetchWithAuth]);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const selected = e.target.files[0];
    if (selected) processFile(selected);
  }, [processFile]);

  const toggleSelectAll = () => {
    if (selected.length === parsedTasks.length) {
      setSelected([]);
    } else {
      setSelected(parsedTasks.map(t => t._id));
    }
  };

  const toggleTask = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    const tasksToImport = parsedTasks.filter(t => selected.includes(t._id));
    if (tasksToImport.length === 0) return;

    setImporting(true);
    setError(null);
    let successCount = 0;

    try {
      for (const task of tasksToImport) {
        try {
          await fetchWithAuth('/api/kanban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              titulo: task.titulo,
              descricao: task.descricao || '',
              projeto: task.projeto || defaultProject,
              prioridade: task.prioridade || 'media',
              categoria: 'Geral',
              status: 'todo',
              gera_receita: false,
              urgente: false,
              importante: false,
              impacto: 5,
              esforco: 5
            })
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to import task: ${task.titulo}`, err);
        }
      }

      if (successCount > 0) {
        onImportComplete(successCount);
        handleClose();
      } else {
        setError('Nenhuma tarefa foi importada. Verifique os dados.');
      }
    } catch (err) {
      setError('Erro ao importar tarefas');
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = selected.length;
  const priorityLabel = { alta: 'Alta', media: 'Media', baixa: 'Baixa' };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CloudUpload />
          <span>Importar Tarefas</span>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Drop Zone */}
          {!file && (
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragOver ? 'action.hover' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                Arraste um arquivo aqui ou clique para selecionar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formatos aceitos: .txt, .csv, .xlsx
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Box>
          )}

          {/* File info */}
          {file && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <InsertDriveFile color="action" />
              <Typography variant="body2">{file.name}</Typography>
              <Chip label={file.name.split('.').pop().toUpperCase()} size="small" />
              <Button size="small" onClick={reset}>Trocar arquivo</Button>
            </Stack>
          )}

          {/* Parsing indicator */}
          {parsing && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {useAI ? 'Analisando com IA...' : 'Processando arquivo...'}
              </Typography>
            </Box>
          )}

          {/* Error */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* AI toggle + default project */}
          {file && !parsing && parsedTasks.length > 0 && (
            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={useAI}
                    onChange={(e) => {
                      setUseAI(e.target.checked);
                      if (e.target.checked && !aiNeeded) {
                        handleReprocessWithAI();
                      }
                    }}
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <AutoAwesome sx={{ fontSize: 18, color: useAI ? 'primary.main' : 'text.secondary' }} />
                    <Typography variant="body2">Usar IA para interpretar</Typography>
                  </Stack>
                }
              />

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Projeto padrao</InputLabel>
                <Select
                  value={defaultProject}
                  onChange={(e) => setDefaultProject(e.target.value)}
                  label="Projeto padrao"
                >
                  {PROJECTS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          )}

          {/* Preview table */}
          {parsedTasks.length > 0 && !parsing && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {parsedTasks.length} tarefas encontradas, {selectedCount} selecionadas
                </Typography>
                <Button size="small" onClick={toggleSelectAll}>
                  {selected.length === parsedTasks.length ? 'Desmarcar todas' : 'Selecionar todas'}
                </Button>
              </Stack>

              <Box sx={{ maxHeight: 350, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ bgcolor: 'grey.50' }}>
                      <Box component="th" sx={{ p: 1, width: 40, textAlign: 'center' }}>
                        <Checkbox
                          size="small"
                          checked={selected.length === parsedTasks.length && parsedTasks.length > 0}
                          indeterminate={selected.length > 0 && selected.length < parsedTasks.length}
                          onChange={toggleSelectAll}
                        />
                      </Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left' }}>
                        <Typography variant="caption" fontWeight="bold">Titulo</Typography>
                      </Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left' }}>
                        <Typography variant="caption" fontWeight="bold">Descricao</Typography>
                      </Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left' }}>
                        <Typography variant="caption" fontWeight="bold">Projeto</Typography>
                      </Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left' }}>
                        <Typography variant="caption" fontWeight="bold">Prioridade</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {parsedTasks.map(task => (
                      <Box
                        component="tr"
                        key={task._id}
                        sx={{
                          borderTop: 1,
                          borderColor: 'divider',
                          bgcolor: selected.includes(task._id) ? 'action.selected' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                          opacity: selected.includes(task._id) ? 1 : 0.5
                        }}
                      >
                        <Box component="td" sx={{ p: 1, textAlign: 'center' }}>
                          <Checkbox
                            size="small"
                            checked={selected.includes(task._id)}
                            onChange={() => toggleTask(task._id)}
                          />
                        </Box>
                        <Box component="td" sx={{ p: 1 }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {task.titulo}
                          </Typography>
                        </Box>
                        <Box component="td" sx={{ p: 1 }}>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                            {task.descricao || '-'}
                          </Typography>
                        </Box>
                        <Box component="td" sx={{ p: 1 }}>
                          {task.projeto ? (
                            <Chip label={task.projeto} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">{defaultProject}</Typography>
                          )}
                        </Box>
                        <Box component="td" sx={{ p: 1 }}>
                          <Typography variant="caption">
                            {priorityLabel[task.prioridade] || 'Media'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={importing || selectedCount === 0 || parsing}
          startIcon={importing ? <CircularProgress size={18} /> : <CloudUpload />}
        >
          {importing ? 'Importando...' : `Importar ${selectedCount} tarefa${selectedCount !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportTasksDialog;
