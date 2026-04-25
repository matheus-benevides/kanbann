import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function Categories() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3b82f6' });
  const [error, setError] = useState('');

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    }
  });

  const saveCategory = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, data);
      } else {
        await api.post('/categories', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      closeModal();
    },
    onError: () => {
      setError('Erro ao salvar categoria.');
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      setError('Erro ao excluir categoria.');
    }
  });

  const openModal = (category?: Category) => {
    setError('');
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, color: category.color });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', color: '#3b82f6' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    saveCategory.mutate(formData);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p className="mt-4 font-medium" style={{ color: 'var(--accent-text)' }}>Carregando...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Categorias</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie as categorias das suas tarefas.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="text-white flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-lg font-medium cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
        >
          <Plus size={20} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {error && !isModalOpen && (
        <div 
          className="p-4 rounded-xl flex items-center gap-2 mb-6"
          style={{ backgroundColor: 'var(--danger-subtle)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto cursor-pointer"><X size={20} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((category) => (
          <div 
            key={category.id} 
            className="backdrop-blur-xl p-5 rounded-2xl flex items-center justify-between group transition-colors"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full shadow-lg" 
                style={{ backgroundColor: category.color, boxShadow: `0 0 10px ${category.color}80` }}
              />
              <span className="font-medium text-lg" style={{ color: 'var(--text-primary)' }}>{category.name}</span>
            </div>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openModal(category)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-text)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja deletar esta categoria? Tarefas associadas perderão esta marcação.')) {
                    deleteCategory.mutate(category.id);
                  }
                }}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {(!categories || categories.length === 0) && (
          <div 
            className="col-span-full p-8 text-center border border-dashed rounded-2xl"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-strong)' }}
          >
            Nenhuma categoria encontrada. Crie uma nova para organizar suas tarefas!
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 relative"
            style={{ backgroundColor: 'var(--modal-bg)', border: '1px solid var(--border-strong)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button 
                onClick={closeModal} 
                className="transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div 
                className="text-sm mb-4 p-3 rounded-xl"
                style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
              >
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Projetos VIP"
                  className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Cor</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{formData.color.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={closeModal}
                className="px-4 py-2 rounded-xl transition-colors font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={saveCategory.isPending}
                className="text-white font-medium py-2 px-5 rounded-xl transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {saveCategory.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
