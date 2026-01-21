import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface ProductsManagementProps {
  darkMode?: boolean;
}

export default function ProductsManagement({ darkMode = false }: ProductsManagementProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name_pt: '',
    name_en: '',
    name_fr: '',
    name_de: '',
    description: '',
    price: '',
    category_id: '',
    subcategory_id: '',
    colors: [] as string[],
    sizes: [] as string[],
    stock: '',
    images: [] as string[],
    is_active: true,
    is_on_sale: false,
    sale_price: '',
    discount_percentage: 0,
  });

  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    loadData();
    loadFiltersData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, subcategoriesData] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('subcategories').select('*').order('name'),
      ]);

      if (productsData.data) setProducts(productsData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
      if (subcategoriesData.data) setSubcategories(subcategoriesData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiltersData = async () => {
    try {
      // Carregar todas as cores únicas dos produtos
      const { data: productsData } = await supabase.from('products').select('colors');
      const colorsSet = new Set<string>();
      productsData?.forEach((product: any) => {
        if (product.colors && Array.isArray(product.colors)) {
          product.colors.forEach((color: string) => colorsSet.add(color));
        }
      });
      setAvailableColors(Array.from(colorsSet).sort());

      // Carregar todos os tamanhos únicos dos produtos
      const sizesSet = new Set<string>();
      productsData?.forEach((product: any) => {
        if (product.sizes && Array.isArray(product.sizes)) {
          product.sizes.forEach((size: string) => sizesSet.add(size));
        }
      });
      setAvailableSizes(Array.from(sizesSet).sort());
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name_pt || !formData.price) {
      alert('❌ Nome e preço são obrigatórios');
      return;
    }

    if (!formData.category_id) {
      alert('❌ Por favor, selecione uma categoria');
      return;
    }

    if (formData.images.length === 0) {
      alert('❌ Adicione pelo menos uma imagem');
      return;
    }

    setSaving(true);
    try {
      const productData: any = {
        name_pt: formData.name_pt,
        name_en: formData.name_en || formData.name_pt,
        name_fr: formData.name_fr || formData.name_pt,
        name_de: formData.name_de || formData.name_pt,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category: formData.category_id,
        category_id: formData.category_id,
        description: formData.description || '',
        images: formData.images,
        colors: formData.colors,
        sizes: formData.sizes,
        is_active: formData.is_active,
        is_on_sale: formData.is_on_sale,
        sale_price: formData.is_on_sale && formData.sale_price ? parseFloat(formData.sale_price) : null,
        discount_percentage: formData.is_on_sale ? formData.discount_percentage : 0,
        updated_at: new Date().toISOString()
      };

      if (formData.subcategory_id) {
        productData.subcategory_id = formData.subcategory_id;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        alert('✅ Produto atualizado com sucesso!');
      } else {
        const insertData = {
          ...productData,
          created_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('products')
          .insert([insertData]);
        if (error) throw error;
        alert('✅ Produto adicionado com sucesso!');
      }

      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
      await loadData();
      await loadFiltersData();
    } catch (error: any) {
      console.error('Erro ao guardar produto:', error);
      alert(`❌ Erro ao guardar produto: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('❌ Tem certeza que deseja eliminar este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('✅ Produto eliminado com sucesso!');
      await loadData();
      await loadFiltersData();
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao eliminar produto');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      alert('❌ Por favor, selecione pelo menos um produto');
      return;
    }

    if (!confirm(`❌ Tem certeza que deseja eliminar ${selectedProducts.length} produto(s)?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;

      alert(`✅ ${selectedProducts.length} produto(s) eliminado(s) com sucesso!`);
      setSelectedProducts([]);
      await loadData();
      await loadFiltersData();
    } catch (error) {
      console.error('Erro ao eliminar produtos:', error);
      alert('❌ Erro ao eliminar produtos');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedProducts.length === 0) {
      alert('❌ Por favor, selecione pelo menos um produto');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: true })
        .in('id', selectedProducts);

      if (error) throw error;

      alert(`✅ ${selectedProducts.length} produto(s) ativado(s) com sucesso!`);
      setSelectedProducts([]);
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao ativar produtos');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedProducts.length === 0) {
      alert('❌ Por favor, selecione pelo menos um produto');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .in('id', selectedProducts);

      if (error) throw error;

      alert(`✅ ${selectedProducts.length} produto(s) desativado(s) com sucesso!`);
      setSelectedProducts([]);
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao desativar produtos');
    }
  };

  const handleDuplicateProduct = async (product: any) => {
    try {
      const newProduct = {
        ...product,
        id: undefined,
        name_pt: `${product.name_pt} (Cópia)`,
        name_en: `${product.name_en || product.name_pt} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('products').insert([newProduct]);
      if (error) throw error;

      alert('✅ Produto duplicado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      alert('❌ Erro ao duplicar produto');
    }
  };

  const toggleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name_pt: '',
      name_en: '',
      name_fr: '',
      name_de: '',
      description: '',
      price: '',
      category_id: '',
      subcategory_id: '',
      colors: [],
      sizes: [],
      stock: '',
      images: [],
      is_active: true,
      is_on_sale: false,
      sale_price: '',
      discount_percentage: 0,
    });
    setColorInput('');
    setSizeInput('');
    setImageInput('');
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name_pt: product.name_pt || '',
      name_en: product.name_en || '',
      name_fr: product.name_fr || '',
      name_de: product.name_de || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      colors: product.colors || [],
      sizes: product.sizes || [],
      stock: product.stock?.toString() || '',
      images: product.images || [],
      is_active: product.is_active !== false,
      is_on_sale: product.is_on_sale || false,
      sale_price: product.sale_price?.toString() || '',
      discount_percentage: product.discount_percentage || 0,
    });
    setShowAddModal(true);
  };

  const addColor = () => {
    if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
      setFormData({ ...formData, colors: [...formData.colors, colorInput.trim()] });
      setColorInput('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim())) {
      setFormData({ ...formData, sizes: [...formData.sizes, sizeInput.trim()] });
      setSizeInput('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({ ...formData, images: [...formData.images, imageInput.trim()] });
      setImageInput('');
    }
  };

  const removeImage = (url: string) => {
    setFormData({ ...formData, images: formData.images.filter(img => img !== url) });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name_pt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category_id === filterCategory;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && product.is_active !== false) ||
      (filterStatus === 'inactive' && product.is_active === false) ||
      (filterStatus === 'out_ofstock' && (product.stock || 0) === 0) ||
      (filterStatus === 'onsale' && product.is_on_sale);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const availableSubcategories = subcategories.filter(sub => sub.category_id === formData.category_id);

  // Estatísticas
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active !== false).length;
  const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
  const onSale = products.filter(p => p.is_on_sale).length;
  const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="ri-loader-4-line text-5xl text-pink-500 animate-spin"></i>
      </div>
    );
  }

  return (
    <div>
      {/* Header com Estatísticas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Gestão de Produtos
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Gerir todos os produtos da sua loja
            </p>
          </div>
          <div className="flex gap-3">
            {selectedProducts.length > 0 && (
              <>
                <button
                  onClick={handleBulkActivate}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-eye-line mr-2"></i>
                  Ativar
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-eye-off-line mr-2"></i>
                  Desativar
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Eliminar ({selectedProducts.length})
                </button>
              </>
            )}
            <button
              onClick={() => {
                resetForm();
                setEditingProduct(null);
                setShowAddModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Adicionar Produto
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <i className="ri-shopping-bag-line text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ativos</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{activeProducts}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <i className="ri-eye-line text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Esgotados</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{outOfStock}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <i className="ri-close-circle-line text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock Baixo</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{lowStock}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <i className="ri-alert-line text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Em Promoção</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{onSale}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <i className="ri-discount-percent-line text-white text-2xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pesquisar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome do produto..."
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
            >
              <option value="">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
            >
              <option value="">Todos os estados</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="outofstock">Sem Stock</option>
              <option value="onsale">Em Promoção</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Seleção
            </label>
            <button
              onClick={selectAllProducts}
              className={`w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                  ? 'bg-pink-500 text-white border-pink-500'
                  : darkMode
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
            >
              {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                ? '✓ Todos Selecionados'
                : 'Selecionar Todos'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const categoryName = categories.find(c => c.id === product.category_id)?.name || 'Sem categoria';
          const subcategoryName = product.subcategory_id ? subcategories.find(s => s.id === product.subcategory_id)?.name : null;
          
          return (
            <div
              key={product.id}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all ${
                selectedProducts.includes(product.id) ? 'ring-4 ring-pink-500' : ''
              }`}
            >
              <div className="relative aspect-square w-full">
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/400'}
                  alt={product.name_pt}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-2 left-2">
                  <button
                    onClick={() => toggleSelectProduct(product.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      selectedProducts.includes(product.id)
                        ? 'bg-pink-500 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    }`}
                  >
                    {selectedProducts.includes(product.id) ? (
                      <i className="ri-checkbox-line text-xl"></i>
                    ) : (
                      <i className="ri-checkbox-blank-line text-xl"></i>
                    )}
                  </button>
                </div>
                {product.is_active === false && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                      Inativo
                    </span>
                  </div>
                )}
                {product.is_on_sale && (
                  <div className="absolute top-12 right-2">
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      -{product.discount_percentage}% OFF
                    </span>
                  </div>
                )}
                {(product.stock || 0) === 0 ? (
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                      Esgotado
                    </span>
                  </div>
                ) : (product.stock || 0) <= 10 && (
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                      Stock Baixo ({product.stock})
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className={`font-semibold mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {product.name_pt}
                </h3>
                <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {categoryName}{subcategoryName ? ` › ${subcategoryName}` : ''}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {product.is_on_sale && product.sale_price ? (
                      <>
                        <span className="text-xs line-through text-gray-400">€{product.price?.toFixed(2)}</span>
                        <span className="text-lg font-bold text-green-500 ml-2">€{product.sale_price?.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-pink-500">€{product.price?.toFixed(2)}</span>
                    )}
                  </div>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Stock: {product.stock || 0}
                  </span>
                </div>

                {/* Cores e Tamanhos */}
                {(product.colors?.length > 0 || product.sizes?.length > 0) && (
                  <div className="mb-3 space-y-1">
                    {product.colors?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cores:</span>
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                          {product.colors.slice(0, 3).join(', ')}{product.colors.length > 3 ? '...' : ''}
                        </span>
                      </div>
                    )}
                    {product.sizes?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tamanhos:</span>
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                          {product.sizes.slice(0, 4).join(', ')}{product.sizes.length > 4 ? '...' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button
                    onClick={() => handleDuplicateProduct(product)}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center"
                  >
                    <i className="ri-file-copy-line"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-12 text-center shadow-sm border`}>
          <i className={`ri-shirt-line text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum produto encontrado
          </p>
        </div>
      )}

      {/* Modal Adicionar/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto`}>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {editingProduct ? '✏️ Editar Produto' : '➕ Adicionar Produto'}
            </h2>
            
            <div className="space-y-6">
              {/* Nome em Português (obrigatório) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome do Produto (Português) *
                </label>
                <input
                  type="text"
                  value={formData.name_pt}
                  onChange={(e) => setFormData({ ...formData, name_pt: e.target.value })}
                  placeholder="Ex: Vestido Elegante"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>

              {/* Outros idiomas (opcional) */}
              <details className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                <summary className={`cursor-pointer font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📝 Traduções (Opcional)
                </summary>
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Nome em Inglês"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400`}
                  />
                  <input
                    type="text"
                    value={formData.name_fr}
                    onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                    placeholder="Nome em Francês"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400`}
                  />
                  <input
                    type="text"
                    value={formData.name_de}
                    onChange={(e) => setFormData({ ...formData, name_de: e.target.value })}
                    placeholder="Nome em Alemão"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400`}
                  />
                </div>
              </details>

              {/* Preço e Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    💰 Preço Normal *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    📦 Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                  />
                </div>
              </div>

              {/* Promoção */}
              <div className={`p-6 rounded-xl border-2 ${formData.is_on_sale ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      🏷️ Produto em Promoção
                    </label>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Ative para definir preço promocional
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_on_sale: !formData.is_on_sale })}
                    className={`relative w-16 h-8 rounded-full transition-all cursor-pointer ${
                      formData.is_on_sale ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        formData.is_on_sale ? 'translate-x-8' : ''
                      }`}
                    ></span>
                  </button>
                </div>

                {formData.is_on_sale && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          💵 Preço Promocional *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.sale_price}
                          onChange={(e) => {
                            const salePrice = parseFloat(e.target.value);
                            const originalPrice = parseFloat(formData.price);
                            const discount = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
                            setFormData({ 
                              ...formData, 
                              sale_price: e.target.value,
                              discount_percentage: discount
                            });
                          }}
                          placeholder="0.00"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'
                          } focus:ring-2 focus:ring-green-400`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          📊 Desconto (%)
                        </label>
                        <input
                          type="number"
                          value={formData.discount_percentage}
                          onChange={(e) => {
                            const discount = parseInt(e.target.value) || 0;
                            const originalPrice = parseFloat(formData.price);
                            const salePrice = originalPrice * (1 - discount / 100);
                            setFormData({ 
                              ...formData, 
                              discount_percentage: discount,
                              sale_price: salePrice.toFixed(2)
                            });
                          }}
                          placeholder="0"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'
                          } focus:ring-2 focus:ring-green-400`}
                        />
                      </div>
                    </div>

                    {/* Pré-visualização */}
                    {formData.price && formData.sale_price && (
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                          📌 Pré-visualização:
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-lg line-through ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            €{parseFloat(formData.price).toFixed(2)}
                          </span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            €{parseFloat(formData.sale_price).toFixed(2)}
                          </span>
                          <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                            -{formData.discount_percentage}% OFF
                          </span>
                        </div>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          💰 Poupança: €{(parseFloat(formData.price) - parseFloat(formData.sale_price)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Categoria e Subcategoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    📂 Categoria *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
                  >
                    <option value="">Selecionar categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    📁 Subcategoria (Opcional)
                  </label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                    disabled={!formData.category_id}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer disabled:opacity-50`}
                  >
                    <option value="">Selecionar subcategoria</option>
                    {availableSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  {!formData.category_id && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ℹ️ Selecione uma categoria primeiro
                    </p>
                  )}
                </div>
              </div>

              {/* Cores */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  🎨 Cores Disponíveis
                </label>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ℹ️ Novas cores são adicionadas automaticamente aos filtros da loja
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    placeholder="Ex: Preto, Azul Marinho, Rosa Claro..."
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                  />
                  <button
                    onClick={addColor}
                    type="button"
                    className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap font-medium"
                  >
                    <i className="ri-add-line mr-1"></i> Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map((color, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium"
                    >
                      {color}
                      <button
                        onClick={() => removeColor(color)}
                        type="button"
                        className="hover:text-pink-900 dark:hover:text-pink-100 cursor-pointer"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </span>
                  ))}
                  {formData.colors.length === 0 && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Nenhuma cor adicionada
                    </p>
                  )}
                </div>
              </div>

              {/* Tamanhos */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📏 Tamanhos Disponíveis
                </label>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ℹ️ Novos tamanhos são adicionados automaticamente aos filtros da loja
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    placeholder="Ex: XS, S, M, L, XL, 36, 38, Único..."
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                  />
                  <button
                    onClick={addSize}
                    type="button"
                    className="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap font-medium"
                  >
                    <i className="ri-add-line mr-1"></i> Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((size, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      {size}
                      <button
                        onClick={() => removeSize(size)}
                        type="button"
                        className="hover:text-blue-900 dark:hover:text-blue-100 cursor-pointer"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </span>
                  ))}
                  {formData.sizes.length === 0 && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Nenhum tamanho adicionado
                    </p>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📝 Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Descreva as características, materiais, detalhes do produto..."
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>

              {/* Imagens */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  🖼️ Imagens do Produto * (mínimo 1)
                </label>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  📌 A primeira imagem será a imagem principal
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    placeholder="Cole o URL da imagem aqui..."
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                  />
                  <button
                    onClick={addImage}
                    type="button"
                    className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap font-medium"
                  >
                    <i className="ri-add-line mr-1"></i> Adicionar
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                        <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-1 rounded text-xs font-bold">
                            Principal
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeImage(url)}
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg hover:bg-red-600"
                      >
                        <i className="ri-close-line text-lg"></i>
                      </button>
                    </div>
                  ))}
                </div>
                {formData.images.length === 0 && (
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <i className={`ri-image-line text-5xl mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Nenhuma imagem adicionada
                    </p>
                  </div>
                )}
              </div>

              {/* Estado do Produto */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    👁️ Produto Ativo
                  </label>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formData.is_active ? 'Visível na loja' : 'Oculto dos clientes'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative w-16 h-8 rounded-full transition-all cursor-pointer ${
                    formData.is_active ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      formData.is_active ? 'translate-x-8' : ''
                    }`}
                  ></span>
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                type="button"
                className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-2xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 text-lg"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>A guardar...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line mr-2"></i>
                    {editingProduct ? 'Guardar Alterações' : 'Adicionar Produto'}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                type="button"
                disabled={saving}
                className={`px-6 py-4 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-lg ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
