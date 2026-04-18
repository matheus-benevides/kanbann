import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { X, Palette } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: any;
  categories: Category[];
}

// Cores pré-definidas para os cartões de tarefa
const PRESET_COLORS = [
  'transparent',
  'rgba(239, 68, 68, 0.2)',  // Red
  'rgba(249, 115, 22, 0.2)', // Orange
  'rgba(234, 179, 8, 0.2)',  // Yellow
  'rgba(34, 197, 94, 0.2)',  // Green
  'rgba(59, 130, 246, 0.2)', // Blue
  'rgba(168, 85, 247, 0.2)', // Purple
  'rgba(236, 72, 153, 0.2)', // Pink
];

export default function TaskModal({ isOpen, onClose, taskToEdit, categories }: TaskModalProps) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    categoryIds: [] as string[],
    color: 'transparent'
  });

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setFormData({
          title: taskToEdit.title || '',
          description: taskToEdit.description || '',
          priority: taskToEdit.priority || 'MEDIUM',
          dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '',
          categoryIds: taskToEdit.categories?.map((c: any) => c.id) || [],
          color: taskToEdit.color || 'transparent'
        });
      } else {
        setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '', categoryIds: [], color: 'transparent' });
      }
      setFormError('');
      setShowColorPicker(false);
    }
  }, [isOpen, taskToEdit]);

  const saveTask = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      if (taskToEdit?.id) {
        await api.put(`/tasks/${taskToEdit.id}`, taskData);
      } else {
        await api.post('/tasks', taskData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onClose();
    },
    onError: () => {
      setFormError('Erro ao salvar a tarefa. Tente novamente.');
    }
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      setFormError('O título da tarefa é obrigatório.');
      return;
    }
    saveTask.mutate(formData);
  };

  const toggleCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(cId => cId !== id)
        : [...prev.categoryIds, id]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="border border-slate-700/60 p-6 rounded-2xl shadow-2xl w-full max-w-xl animate-in zoom-in-95 duration-200 relative transition-colors"
        style={{ backgroundColor: formData.color === 'transparent' ? '#121214' : formData.color }}
      >
        <div className="absolute inset-0 bg-[#121214]/80 rounded-2xl pointer-events-none -z-10 backdrop-blur-md"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-bold text-white">
            {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full transition-colors"
                title="Cor de Fundo do Cartão"
              >
                <Palette size={18} />
              </button>
              {showColorPicker && (
                <div className="absolute right-0 top-full mt-2 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl flex gap-2 z-50">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { setFormData({ ...formData, color }); setShowColorPicker(false); }}
                      className={`w-6 h-6 rounded-full border-2 ${formData.color === color ? 'border-white' : 'border-transparent hover:scale-110'} transition-all`}
                      style={{ backgroundColor: color === 'transparent' ? '#333' : color.replace('0.2', '1') }}
                      title={color === 'transparent' ? 'Padrão' : 'Cor Customizada'}
                    >
                      {color === 'transparent' && <span className="block text-[8px] text-white">ø</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {formError && (
          <div className="text-red-400 text-sm mb-6 bg-red-500/10 p-3 rounded-xl border border-red-500/20 relative z-10">
            {formError}
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Título *</label>
            <input 
              type="text" 
              placeholder="Ex: Finalizar relatório mensal..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all placeholder:text-slate-500"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
            <textarea 
              placeholder="Detalhes adicionais..." 
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all placeholder:text-slate-500 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Categorias (Múltipla Seleção)</label>
            <div className="flex flex-wrap gap-2">
              {categories?.map(c => {
                const isSelected = formData.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected ? 'bg-opacity-20 shadow-sm' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
                    style={isSelected ? { backgroundColor: c.color, borderColor: c.color, color: '#fff' } : {}}
                  >
                    {c.name}
                  </button>
                );
              })}
              {categories?.length === 0 && <span className="text-sm text-slate-500">Nenhuma categoria criada.</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade</label>
              <select 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Data Limite (Opcional)</label>
              <input 
                type="date" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-8 border-t border-white/10 pt-6 relative z-10">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saveTask.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          >
            {saveTask.isPending ? 'Salvando...' : 'Salvar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}
