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
  const [formData, setFormData] = useState({ name: '', color: '#4f46e5' });
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // As tarefas usam categorias
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
      setFormData({ name: '', color: '#4f46e5' });
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

  if (isLoading) return <div className="text-white p-8">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Categorias</h1>
          <p className="text-slate-400">Gerencie as categorias das suas tarefas.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 font-medium"
        >
          <Plus size={20} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-2 mb-6">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X size={20} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((category) => (
          <div key={category.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: category.color, boxShadow: `0 0 10px ${category.color}80` }}></div>
              <span className="text-white font-medium text-lg">{category.name}</span>
            </div>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openModal(category)}
                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja deletar esta categoria? Tarefas associadas perderão esta marcação.')) {
                    deleteCategory.mutate(category.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {(!categories || categories.length === 0) && (
          <div className="col-span-full p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
            Nenhuma categoria encontrada. Crie uma nova para organizar suas tarefas!
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-slate-700/60 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Nome</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Projetos VIP"
                  className="w-full bg-[#1a1a1e] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Cor</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-slate-300 font-mono text-sm">{formData.color.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t border-slate-800 pt-6">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={saveCategory.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 px-5 rounded-xl transition-colors shadow-lg"
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
