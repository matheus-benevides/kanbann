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
        className="p-6 rounded-2xl shadow-2xl w-full max-w-xl animate-in zoom-in-95 duration-200 relative transition-colors"
        style={{ 
          backgroundColor: formData.color === 'transparent' ? 'var(--modal-bg)' : formData.color,
          border: '1px solid var(--border-strong)'
        }}
      >
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none -z-10 backdrop-blur-md"
          style={{ backgroundColor: formData.color === 'transparent' ? 'transparent' : 'var(--modal-bg)', opacity: 0.8 }}
        />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded-full transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
                title="Cor de Fundo do Cartão"
              >
                <Palette size={18} />
              </button>
              {showColorPicker && (
                <div 
                  className="absolute right-0 top-full mt-2 p-2 rounded-xl shadow-xl flex gap-2 z-50"
                  style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-strong)' }}
                >
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { setFormData({ ...formData, color }); setShowColorPicker(false); }}
                      className={`w-6 h-6 rounded-full border-2 ${formData.color === color ? 'border-white' : 'border-transparent hover:scale-110'} transition-all cursor-pointer`}
                      style={{ backgroundColor: color === 'transparent' ? 'var(--text-muted)' : color.replace('0.2', '1') }}
                      title={color === 'transparent' ? 'Padrão' : 'Cor Customizada'}
                    >
                      {color === 'transparent' && <span className="block text-[8px] text-white">ø</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {formError && (
          <div 
            className="text-sm mb-6 p-3 rounded-xl relative z-10"
            style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
          >
            {formError}
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Título *</label>
            <input 
              type="text" 
              placeholder="Ex: Finalizar relatório mensal..." 
              className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descrição</label>
            <textarea 
              placeholder="Detalhes adicionais..." 
              rows={3}
              className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Categorias (Múltipla Seleção)</label>
            <div className="flex flex-wrap gap-2">
              {categories?.map(c => {
                const isSelected = formData.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                    style={isSelected ? { 
                      backgroundColor: c.color, 
                      borderColor: c.color, 
                      color: '#fff',
                      border: `1px solid ${c.color}`
                    } : { 
                      backgroundColor: 'transparent', 
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)' 
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
              {categories?.length === 0 && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma categoria criada.</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Prioridade</label>
              <select 
                className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)'
                }}
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Data Limite (Opcional)</label>
              <input 
                type="date" 
                className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)'
                }}
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-8 pt-6 relative z-10" style={{ borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl transition-colors font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saveTask.isPending}
            className="text-white font-medium py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            style={{ 
              backgroundColor: 'var(--accent)',
              boxShadow: `0 0 15px var(--accent-glow)`
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              e.currentTarget.style.boxShadow = `0 0 20px var(--accent-glow)`;
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = `0 0 15px var(--accent-glow)`;
            }}
          >
            {saveTask.isPending ? 'Salvando...' : 'Salvar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}
