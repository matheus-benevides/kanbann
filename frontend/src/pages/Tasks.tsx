import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { format } from 'date-fns';
import { Plus, Check, Clock, Trash2, Calendar, Edit2, AlertCircle, X, Search, Filter } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import TaskModal from '../components/TaskModal';

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

  const priorityColors: Record<string, string> = {
    'HIGH': 'bg-red-500/20 text-red-400 border-red-500/50',
    'MEDIUM': 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    'LOW': 'bg-blue-500/20 text-blue-400 border-blue-500/50'
  };

  const onDragEnd = (result: DropResult) => {
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

  if (tasksLoading) return <div className="text-white p-8">Carregando quadro Kanban...</div>;

  return (
    <div className={`-m-8 p-8 flex-1 transition-colors duration-500 overflow-y-auto`}>
      <div className="min-h-full">
        {/* Cabeçalho, Pesquisa e Filtros */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-3xl font-bold text-white">Quadro de Tarefas</h2>
            
            <button 
              onClick={() => openForm()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 font-medium"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nova Tarefa</span>
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 shadow-lg">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar tarefas..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-colors"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full appearance-none bg-black/20 border border-white/5 rounded-xl pl-10 pr-8 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
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
                  className="w-full appearance-none bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
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

        {globalError && (
          <div className="bg-red-500/10 backdrop-blur border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center justify-between mb-6 shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>{globalError}</span>
            </div>
            <button onClick={() => setGlobalError('')}><X size={20} /></button>
          </div>
        )}

        {/* Quadro Kanban */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Coluna PENDING */}
            <Droppable droppableId="PENDING">
              {(provided, snapshot) => (
                <div 
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col min-h-[500px] transition-colors ${snapshot.isDraggingOver ? 'bg-white/10 border-indigo-500/50 ring-2 ring-indigo-500/30 ring-inset' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                      <h3 className="text-xl font-bold text-white">Pendentes</h3>
                    </div>
                    <span className="bg-white/10 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                      {pendingTasks.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {pendingTasks.map((task, index) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        index={index} 
                        priorityColors={priorityColors}
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
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col min-h-[500px] transition-colors ${snapshot.isDraggingOver ? 'bg-white/10 border-emerald-500/50 ring-2 ring-emerald-500/30 ring-inset' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                      <h3 className="text-xl font-bold text-white">Concluídas</h3>
                    </div>
                    <span className="bg-white/10 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                      {doneTasks.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {doneTasks.map((task, index) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        index={index} 
                        priorityColors={priorityColors}
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

        <TaskModal 
          isOpen={isFormOpen} 
          onClose={closeForm} 
          taskToEdit={tasks?.find(t => t.id === editingTaskId)}
          categories={categories || []} 
        />

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#121214] border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
              <h3 className="text-xl font-bold text-white mb-2">Excluir Tarefa?</h3>
              <p className="text-slate-400 mb-6">Tem certeza que deseja excluir esta tarefa? Essa ação não pode ser desfeita.</p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteTask.mutate(deleteConfirmId)}
                  disabled={deleteTask.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
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

function TaskCard({ task, index, priorityColors, onEdit, onDelete }: any) {
  const isDone = task.status === 'DONE';
  const customColor = task.color && task.color !== 'transparent' ? task.color : null;
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`backdrop-blur-md border rounded-2xl p-5 flex flex-col group transition-all duration-200
            ${isDone ? 'border-slate-800/80 opacity-70' : 'border-white/10'} 
            ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500/80 scale-105 z-50 !rotate-3 cursor-grabbing' : 'hover:scale-[1.01] hover:shadow-lg cursor-grab hover:bg-white/5'}
            ${!customColor ? 'bg-black/40' : ''}`}
          style={{ 
            ...provided.draggableProps.style,
            backgroundColor: customColor ? customColor : undefined
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-wrap gap-2">
              <div className={`text-xs px-2.5 py-1 rounded-md border ${priorityColors[task.priority]} font-medium uppercase tracking-wider`}>
                {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
              </div>
              {task.categories?.map((c: any) => (
                <div key={c.id} className="text-xs px-2.5 py-1 rounded-md border border-slate-600/50 text-slate-200 font-medium bg-slate-800/80" style={{ borderColor: c.color }}>
                  {c.name}
                </div>
              ))}
            </div>
            
            <div className={`flex space-x-1 transition-opacity ${snapshot.isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
              <button onClick={onEdit} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Editar Tarefa">
                <Edit2 size={16} />
              </button>
              <button onClick={onDelete} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Excluir Tarefa">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          <h4 className={`text-lg font-bold text-white mb-2 ${isDone ? 'line-through text-slate-400' : ''}`}>
            {task.title}
          </h4>

          {task.description && (
            <p className={`text-sm mb-4 line-clamp-2 ${isDone ? 'text-slate-500' : 'text-slate-300'}`}>
              {task.description}
            </p>
          )}
          
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/10">
            <div className={`flex items-center text-xs font-medium gap-1.5 ${isDone ? 'text-slate-500' : 'text-slate-300'}`}>
              {task.dueDate ? (
                <>
                  <Calendar size={14} />
                  <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                </>
              ) : (
                <span className="opacity-50">Sem prazo</span>
              )}
            </div>
            
            <div className="text-slate-400/50 group-hover:text-slate-300 cursor-grab active:cursor-grabbing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
              </svg>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
