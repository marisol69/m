import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Look {
  id: string;
  title: string;
  product_ids: string[];
  created_at: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export const LooksManagement = () => {
  const [looks, setLooks] = useState<Look[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLook, setEditingLook] = useState<Look | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    product_ids: [] as string[],
    is_active: true,
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar looks
      const { data: looksData, error: looksError } = await supabase
        .from('inspiration_looks')
        .select('*')
        .order('created_at', { ascending: false });

      if (looksError) throw looksError;
      setLooks(looksData || []);

      // Carregar produtos do Supabase
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || selectedProducts.length === 0) {
      alert('Por favor, preencha o título e selecione pelo menos 1 produto');
      return;
    }

    if (selectedProducts.length > 4) {
      alert('Pode selecionar no máximo 4 produtos por look');
      return;
    }

    try {
      const lookData = {
        title: formData.title,
        product_ids: selectedProducts,
        is_active: formData.is_active,
      };

      if (editingLook) {
        const { error } = await supabase
          .from('inspiration_looks')
          .update(lookData)
          .eq('id', editingLook.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inspiration_looks')
          .insert([lookData]);

        if (error) throw error;
      }

      setShowAddModal(false);
      setEditingLook(null);
      setFormData({ title: '', product_ids: [], is_active: true });
      setSelectedProducts([]);
      loadData();
      alert(editingLook ? 'Look atualizado com sucesso!' : 'Look criado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar look:', error);
      alert('Erro ao salvar look');
    }
  };

  const handleEdit = (look: Look) => {
    setEditingLook(look);
    setFormData({
      title: look.title,
      product_ids: look.product_ids,
      is_active: look.is_active,
    });
    setSelectedProducts(look.product_ids);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja eliminar este look?')) return;

    try {
      const { error } = await supabase
        .from('inspiration_looks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
      alert('Look eliminado com sucesso!');
    } catch (error) {
      console.error('Erro ao eliminar look:', error);
      alert('Erro ao eliminar look');
    }
  };

  const toggleActive = async (look: Look) => {
    try {
      const { error } = await supabase
        .from('inspiration_looks')
        .update({ is_active: !look.is_active })
        .eq('id', look.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleProductToggle = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      if (selectedProducts.length >= 4) {
        alert('Pode selecionar no máximo 4 produtos por look');
        return;
      }
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Looks Inspiradores</h2>
          <p className="text-gray-600">Crie combinações de produtos para inspirar os clientes</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingLook(null);
            setFormData({ title: '', product_ids: [], is_active: true });
            setSelectedProducts([]);
          }}
          className="px-6 py-3 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors font-medium whitespace-nowrap cursor-pointer flex items-center gap-2"
        >
          <i className="ri-add-line text-xl"></i>
          Criar Novo Look
        </button>
      </div>

      {/* Lista de Looks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {looks.map((look) => (
          <div key={look.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{look.title}</h3>
                <p className="text-sm text-gray-500">
                  {look.product_ids.length} produto{look.product_ids.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(look)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer ${
                    look.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {look.is_active ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>

            {/* Produtos do Look */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {look.product_ids.map((productId) => {
                const product = getProductById(productId);
                if (!product) return null;
                return (
                  <div key={productId} className="relative group">
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{product.name}</p>
                  </div>
                );
              })}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(look)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-edit-line"></i>
                Editar
              </button>
              <button
                onClick={() => handleDelete(look.id)}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-delete-bin-line"></i>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {looks.length === 0 && (
        <div className="text-center py-20">
          <i className="ri-shirt-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum look criado</h3>
          <p className="text-gray-600 mb-6">Comece a criar looks inspiradores para os seus clientes</p>
        </div>
      )}

      {/* Modal Adicionar/Editar Look */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingLook ? 'Editar Look' : 'Criar Novo Look'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLook(null);
                  setFormData({ title: '', product_ids: [], is_active: true });
                  setSelectedProducts([]);
                }}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Título do Look */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título do Look *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Look Elegante, Look Casual..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-400"
                  required
                />
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-pink-400 rounded focus:ring-pink-400 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Look ativo (visível no site)</span>
                </label>
              </div>

              {/* Seleção de Produtos */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Selecione os Produtos (máximo 4) *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedProducts.length} de 4 produtos selecionados
                </p>

                {products.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Nenhum produto disponível. Adicione produtos primeiro.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                    {products.map((product) => {
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleProductToggle(product.id)}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-pink-400 ring-2 ring-pink-200'
                              : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <div className="w-full h-32 bg-gray-100">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="p-2 bg-white">
                            <p className="text-xs font-medium text-gray-800 line-clamp-2">
                              {product.name}
                            </p>
                            <p className="text-xs text-pink-400 font-bold mt-1">
                              €{product.price.toFixed(2)}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center">
                              <i className="ri-check-line text-white text-lg"></i>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLook(null);
                    setFormData({ title: '', product_ids: [], is_active: true });
                    setSelectedProducts([]);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors font-medium whitespace-nowrap cursor-pointer"
                >
                  {editingLook ? 'Atualizar Look' : 'Criar Look'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
