import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { format } from 'date-fns';
import { Plus, Check, Clock, Trash2, Calendar, Edit2, AlertCircle, X, Search, Filter, Timer } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult, DragStart } from '@hello-pangea/dnd';
import TaskModal from '../components/TaskModal';
import Pomodoro from '../components/Pomodoro';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  color?: string;
  categories?: Category[];
}

export default function Tasks() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  useEffect(() => {
    const checkFocus = () => {
      setFocusMode(localStorage.getItem('focus-mode') === 'true');
    };
    checkFocus();
    window.addEventListener('themeChange', checkFocus);
    return () => window.removeEventListener('themeChange', checkFocus);
  }, []);

  // Filtros e Pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await api.put(`/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: () => {
      setGlobalError('Não foi possível atualizar a tarefa. Ela voltará para a coluna original.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setDeleteConfirmId(null);
    },
    onError: () => {
      setGlobalError('Ops! Tivemos um problema ao excluir a tarefa.');
      setDeleteConfirmId(null);
    }
  });

  const openForm = (task?: Task) => {
    setGlobalError('');
    setEditingTaskId(task ? task.id : null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTaskId(null);
  };

  const onDragStart = (start: DragStart) => {
    setIsDraggingGlobal(true);
    document.body.style.cursor = 'grabbing';
    // Prevent scroll while dragging if needed
  };

  const onDragEnd = (result: DropResult) => {
    setIsDraggingGlobal(false);
    document.body.style.cursor = 'default';

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;

    queryClient.setQueryData(['tasks'], (oldTasks: Task[] | undefined) => {
      if (!oldTasks) return oldTasks;
      return oldTasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t);
    });

    updateStatus.mutate({ id: draggableId, status: newStatus });
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      const matchSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = priorityFilter ? task.priority === priorityFilter : true;
      const matchCategory = categoryFilter ? task.categories?.some(c => c.id === categoryFilter) : true;
      return matchSearch && matchPriority && matchCategory;
    });
  }, [tasks, searchTerm, priorityFilter, categoryFilter]);

  const pendingTasks = filteredTasks.filter(t => t.status === 'PENDING');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  if (tasksLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p className="mt-4 font-medium" style={{ color: 'var(--accent-text)' }}>Carregando quadro Kanban...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 transition-colors duration-500 overflow-y-auto">
      <div className="min-h-full">
        {/* Cabeçalho, Pesquisa e Filtros */}
        <div className={`mb-8 transition-all duration-500 ${focusMode ? 'opacity-0 h-0 pointer-events-none mb-0 overflow-hidden' : 'opacity-100'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Quadro de Tarefas</h2>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTimer(!showTimer)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border ${showTimer ? 'bg-accent text-white' : 'bg-surface text-muted'}`}
                style={{ 
                  backgroundColor: showTimer ? 'var(--accent)' : 'var(--surface)',
                  borderColor: showTimer ? 'var(--accent)' : 'var(--border)',
                  color: showTimer ? '#fff' : 'var(--text-secondary)'
                }}
                title="Temporizador Pomodoro"
              >
                <Timer size={20} />
              </button>
              <button
                onClick={() => openForm()}
                className="text-white flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-lg font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Nova Tarefa</span>
              </button>
            </div>
          </div>

          <div
            className="backdrop-blur-xl p-4 rounded-2xl flex flex-col md:flex-row gap-4 shadow-lg"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Pesquisar tarefas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex gap-4">
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl pl-10 pr-8 py-2.5 focus:outline-none transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <option value="">Prioridade: Todas</option>
                  <option value="HIGH">Alta</option>
                  <option value="MEDIUM">Média</option>
                  <option value="LOW">Baixa</option>
                </select>
              </div>

              <div className="relative min-w-[140px]">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl px-4 py-2.5 focus:outline-none transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <option value="">Categoria: Todas</option>
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          {/* Main Board */}
          <div className="flex-1 w-full">
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Coluna PENDING */}
                <Droppable droppableId="PENDING">
                  {(provided, snapshot) => (
                    <div
                      className={`backdrop-blur-xl rounded-3xl p-6 shadow-xl flex flex-col min-h-[500px] transition-all duration-300 ${snapshot.isDraggingOver ? 'droppable-active ring-2 ring-accent/20' : ''}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        boxShadow: snapshot.isDraggingOver ? '0 0 30px var(--accent-glow)' : undefined
                      }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--warning)', boxShadow: `0 0 8px var(--warning)` }} />
                          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Pendentes</h3>
                        </div>
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
                        >
                          {pendingTasks.length}
                        </span>
                      </div>

                      <div className="flex-1 space-y-4">
                        {pendingTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onEdit={() => openForm(task)}
                            onDelete={() => setDeleteConfirmId(task.id)}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>

                {/* Coluna DONE */}
                <Droppable droppableId="DONE">
                  {(provided, snapshot) => (
                    <div
                      className="backdrop-blur-xl rounded-3xl p-6 shadow-xl flex flex-col min-h-[500px] transition-all"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: snapshot.isDraggingOver
                          ? '2px solid var(--success)'
                          : '1px solid var(--border)',
                        boxShadow: snapshot.isDraggingOver ? '0 0 20px var(--success)33' : undefined
                      }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--success)', boxShadow: `0 0 8px var(--success)` }} />
                          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Concluídas</h3>
                        </div>
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
                        >
                          {doneTasks.length}
                        </span>
                      </div>

                      <div className="flex-1 space-y-4">
                        {doneTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onEdit={() => openForm(task)}
                            onDelete={() => setDeleteConfirmId(task.id)}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>

              </div>
            </DragDropContext>
          </div>

          {/* Productivity Side Panel (Pomodoro) */}
          {(showTimer || focusMode) && (
            <div className={`w-full lg:w-80 flex-shrink-0 animate-in slide-in-from-right-8 duration-500 sticky top-4 ${focusMode ? 'z-[110]' : ''}`}>
              <Pomodoro />
              <div className="mt-4 p-4 rounded-2xl backdrop-blur-md border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <p className="text-xs text-center">
                  {focusMode ? 'Você está em modo de concentração profunda. Todas as distrações foram removidas.' : 'O Temporizador Pomodoro ajuda a manter o ritmo.'}
                </p>
              </div>
              {focusMode && (
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-white font-bold transition-all shadow-xl cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Plus size={20} /> Nova Tarefa Rápida
                </button>
              )}
            </div>
          )}
        </div>

        {globalError && (
          <div
            className="backdrop-blur p-4 rounded-xl flex items-center justify-between mt-6 shadow-lg"
            style={{ backgroundColor: 'var(--danger-subtle)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>{globalError}</span>
            </div>
            <button onClick={() => setGlobalError('')} className="cursor-pointer"><X size={20} /></button>
          </div>
        )}

        <TaskModal
          isOpen={isFormOpen}
          onClose={closeForm}
          taskToEdit={tasks?.find(t => t.id === editingTaskId)}
          categories={categories || []}
        />

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
            <div
              className="p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95"
              style={{ backgroundColor: 'var(--modal-bg)', border: '1px solid var(--border-strong)' }}
            >
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Excluir Tarefa?</h3>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Tem certeza que deseja excluir esta tarefa? Essa ação não pode ser desfeita.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteTask.mutate(deleteConfirmId)}
                  disabled={deleteTask.isPending}
                  className="px-4 py-2 text-white rounded-xl transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--danger)', boxShadow: `0 0 15px var(--danger)44` }}
                >
                  {deleteTask.isPending ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, index, onEdit, onDelete }: any) {
  const isDone = task.status === 'DONE';
  const customColor = task.color && task.color !== 'transparent' ? task.color : null;

  const priorityStyle: Record<string, { bg: string; text: string; border: string }> = {
    'HIGH': { bg: 'var(--danger-subtle)', text: 'var(--danger)', border: 'var(--danger)' },
    'MEDIUM': { bg: 'var(--warning-subtle)', text: 'var(--warning)', border: 'var(--warning)' },
    'LOW': { bg: 'var(--accent-subtle)', text: 'var(--accent-text)', border: 'var(--accent)' }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => {
        const cardContent = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`backdrop-blur-md rounded-2xl p-5 flex flex-col group transition-all duration-200 task-card-container
              ${isDone ? 'opacity-70' : ''} 
              ${snapshot.isDragging ? 'shadow-2xl scale-105 z-[9999] cursor-grabbing' : 'cursor-grab'}`}
            style={{
              ...provided.draggableProps.style,
              backgroundColor: customColor || 'var(--input-bg)',
              border: snapshot.isDragging
                ? '2px solid var(--accent)'
                : `1px solid ${isDone ? 'var(--border)' : 'var(--border-strong)'}`,
              boxShadow: snapshot.isDragging ? `0 0 40px var(--accent-glow)` : undefined,
              zIndex: snapshot.isDragging ? 9999 : undefined,
              // Fix for portal positioning
              left: snapshot.isDragging ? (provided.draggableProps.style as any)?.left : undefined,
              top: snapshot.isDragging ? (provided.draggableProps.style as any)?.top : undefined,
            }}
            onMouseEnter={(e) => { if (!snapshot.isDragging) e.currentTarget.style.backgroundColor = customColor || 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { if (!snapshot.isDragging) e.currentTarget.style.backgroundColor = customColor || 'var(--input-bg)'; }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-wrap gap-2">
                <div
                  className="text-xs px-2.5 py-1 rounded-md font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: priorityStyle[task.priority]?.bg,
                    color: priorityStyle[task.priority]?.text,
                    border: `1px solid ${priorityStyle[task.priority]?.border}40`
                  }}
                >
                  {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                </div>
                {task.categories?.map((c: any) => (
                  <div
                    key={c.id}
                    className="text-xs px-2.5 py-1 rounded-md font-medium"
                    style={{
                      border: `1px solid ${c.color}60`,
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--surface-hover)'
                    }}
                  >
                    {c.name}
                  </div>
                ))}
              </div>

              <div className={`flex space-x-1 transition-opacity ${snapshot.isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  title="Editar Tarefa"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  title="Excluir Tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h4
              className={`text-lg font-bold mb-2 ${isDone ? 'line-through' : ''}`}
              style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}
            >
              {task.title}
            </h4>

            {task.description && (
              <p className="text-sm mb-4 line-clamp-2" style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                {task.description}
              </p>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center text-xs font-medium gap-1.5" style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                {task.dueDate ? (
                  <>
                    <Calendar size={14} />
                    <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                  </>
                ) : (
                  <span className="opacity-50">Sem prazo</span>
                )}
              </div>

              <div style={{ color: 'var(--text-muted)' }} className="cursor-grab active:cursor-grabbing">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                </svg>
              </div>
            </div>
          </div>
        );

        if (snapshot.isDragging) {
          return createPortal(cardContent, document.body);
        }

        return cardContent;
      }}
    </Draggable>
  );
}


