import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface CategoriesManagementProps {
  darkMode?: boolean;
}

export default function CategoriesManagement({ darkMode = false }: CategoriesManagementProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'subcategories'>('categories');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: '',
    category_id: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, subcategoriesData] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('subcategories').select('*').order('display_order'),
      ]);

      if (categoriesData.data) setCategories(categoriesData.data);
      if (subcategoriesData.data) setSubcategories(subcategoriesData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      alert('Por favor, preencha o nome da categoria');
      return;
    }

    try {
      // Gerar slug a partir do nome
      const slug = categoryForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const categoryData = {
        ...categoryForm,
        slug: slug,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([categoryData]);
        if (error) throw error;
      }

      setShowAddCategoryModal(false);
      setEditingCategory(null);
      resetCategoryForm();
      await loadData();
      alert(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria adicionada com sucesso! Agora aparece no site.');
    } catch (error) {
      console.error('Erro ao guardar categoria:', error);
      alert('Erro ao guardar categoria');
    }
  };

  const handleSaveSubcategory = async () => {
    if (!subcategoryForm.name || !subcategoryForm.category_id) {
      alert('Por favor, preencha o nome e selecione uma categoria');
      return;
    }

    try {
      // Gerar slug a partir do nome
      let slug = subcategoryForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Verificar se o slug já existe nesta categoria
      if (!editingSubcategory) {
        const { data: existingSlugs } = await supabase
          .from('subcategories')
          .select('slug')
          .eq('category_id', subcategoryForm.category_id)
          .like('slug', `${slug}%`);

        if (existingSlugs && existingSlugs.length > 0) {
          // Se o slug já existe, adicionar um número
          const slugNumbers = existingSlugs
            .map(s => {
              const match = s.slug.match(new RegExp(`^${slug}-(\\d+)$`));
              return match ? parseInt(match[1]) : (s.slug === slug ? 0 : null);
            })
            .filter(n => n !== null) as number[];
          
          const nextNumber = slugNumbers.length > 0 ? Math.max(...slugNumbers) + 1 : 1;
          slug = `${slug}-${nextNumber}`;
        }
      }

      const subcategoryData = {
        ...subcategoryForm,
        slug: slug,
      };

      if (editingSubcategory) {
        const { error } = await supabase
          .from('subcategories')
          .update(subcategoryData)
          .eq('id', editingSubcategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subcategories').insert([subcategoryData]);
        if (error) throw error;
      }

      setShowAddSubcategoryModal(false);
      setEditingSubcategory(null);
      resetSubcategoryForm();
      await loadData();
      alert(editingSubcategory ? 'Subcategoria atualizada com sucesso!' : 'Subcategoria adicionada com sucesso! Agora aparece no site.');
    } catch (error: any) {
      console.error('Erro ao guardar subcategoria:', error);
      
      // Mensagem de erro mais clara
      if (error.code === '23505') {
        alert('Já existe uma subcategoria com este nome nesta categoria. Por favor, escolha outro nome.');
      } else {
        alert('Erro ao guardar subcategoria: ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja eliminar esta categoria? Todas as subcategorias e produtos associados também serão eliminados.')) return;

    try {
      // Primeiro, eliminar todos os produtos desta categoria
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('category_id', id);

      if (productsError) throw productsError;

      // Depois, eliminar todas as subcategorias
      const { error: subcategoriesError } = await supabase
        .from('subcategories')
        .delete()
        .eq('category_id', id);

      if (subcategoriesError) throw subcategoriesError;

      // Finalmente, eliminar a categoria
      const { error: categoryError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (categoryError) throw categoryError;

      await loadData();
      alert('Categoria e todos os produtos associados eliminados com sucesso!');
    } catch (error) {
      console.error('Erro ao eliminar categoria:', error);
      alert('Erro ao eliminar categoria');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja eliminar esta subcategoria? Todos os produtos associados também serão eliminados.')) return;

    try {
      // Primeiro, eliminar todos os produtos desta subcategoria
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('subcategory_id', id);

      if (productsError) throw productsError;

      // Depois, eliminar a subcategoria
      const { error: subcategoryError } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (subcategoryError) throw subcategoryError;

      await loadData();
      alert('Subcategoria e todos os produtos associados eliminados com sucesso!');
    } catch (error) {
      console.error('Erro ao eliminar subcategoria:', error);
      alert('Erro ao eliminar subcategoria');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      name: '',
      description: '',
      category_id: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
  };

  const openEditCategoryModal = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      image_url: category.image_url || '',
      display_order: category.display_order || 0,
      is_active: category.is_active !== false,
    });
    setShowAddCategoryModal(true);
  };

  const openEditSubcategoryModal = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name || '',
      description: subcategory.description || '',
      category_id: subcategory.category_id || '',
      image_url: subcategory.image_url || '',
      display_order: subcategory.display_order || 0,
      is_active: subcategory.is_active !== false,
    });
    setShowAddSubcategoryModal(true);
  };

  const getSubcategoryCount = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId).length;
  };

  const filteredSubcategories = selectedCategoryFilter
    ? subcategories.filter(sub => sub.category_id === selectedCategoryFilter)
    : subcategories;

  const groupedSubcategories = categories.map(category => ({
    category,
    subcategories: subcategories.filter(sub => sub.category_id === category.id)
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="ri-loader-4-line text-5xl text-pink-500 animate-spin"></i>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Gestão de Categorias
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            {categories.length} categorias e {subcategories.length} subcategorias
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'categories' ? 'subcategories' : 'categories')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'subcategories'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
            }`}
          >
            <i className={`${viewMode === 'categories' ? 'ri-folder-line' : 'ri-folder-open-line'} mr-2`}></i>
            {viewMode === 'categories' ? 'Ver Subcategorias' : 'Ver Categorias'}
          </button>
        </div>
      </div>

      {/* Categories View */}
      {viewMode === 'categories' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
            >
              <option value="">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                resetCategoryForm();
                setEditingCategory(null);
                setShowAddCategoryModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Adicionar Categoria
            </button>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Categoria
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Descrição
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Subcategorias
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Estado
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {categories.map((category) => (
                    <tr key={category.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="ri-folder-line text-xl text-white"></i>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {category.name}
                            </h3>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {category.description || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          <i className="ri-folder-open-line"></i>
                          {getSubcategoryCount(category.id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          category.is_active !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          <i className={`${category.is_active !== false ? 'ri-check-line' : 'ri-close-line'}`}></i>
                          {category.is_active !== false ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditCategoryModal(category)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {categories.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-folder-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nenhuma categoria encontrada
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Subcategories View */}
      {viewMode === 'subcategories' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-purple-400 focus:border-transparent cursor-pointer`}
            >
              <option value="">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-8">
            {groupedSubcategories.map(({ category, subcategories: catSubcategories }) => (
              <div key={category.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <i className="ri-folder-line text-2xl text-white"></i>
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {category.name}
                      </h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {catSubcategories.length} subcategorias
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      resetSubcategoryForm();
                      setSubcategoryForm({ ...subcategoryForm, category_id: category.id });
                      setEditingSubcategory(null);
                      setShowAddSubcategoryModal(true);
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Adicionar Subcategoria
                  </button>
                </div>

                {catSubcategories.length === 0 ? (
                  <p className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Nenhuma subcategoria nesta categoria
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {catSubcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border p-4 hover:shadow-md transition-shadow`}
                      >
                        {subcategory.image_url && (
                          <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-pink-100 to-blue-100 dark:from-gray-600 dark:to-gray-500">
                            <img
                              src={subcategory.image_url}
                              alt={subcategory.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {subcategory.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subcategory.is_active !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {subcategory.is_active !== false ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        {subcategory.description && (
                          <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {subcategory.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditSubcategoryModal(subcategory)}
                            className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-edit-line mr-1"></i>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Adicionar/Editar Categoria */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-2xl w-full`}>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {editingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Descrição
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                    className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer"
                  />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Categoria Ativa</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handleSaveCategory}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-save-line mr-2"></i>
                {editingCategory ? 'Guardar Alterações' : 'Adicionar Categoria'}
              </button>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar/Editar Subcategoria */}
      {showAddSubcategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-2xl w-full`}>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {editingSubcategory ? 'Editar Subcategoria' : 'Adicionar Subcategoria'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Categoria *
                </label>
                <select
                  value={subcategoryForm.category_id}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })}
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
                  Nome da Subcategoria *
                </label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Descrição
                </label>
                <textarea
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  URL da Imagem
                </label>
                <input
                  type="text"
                  value={subcategoryForm.image_url}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, image_url: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subcategoryForm.is_active}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, is_active: e.target.checked })}
                    className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400 cursor-pointer"
                  />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Subcategoria Ativa</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handleSaveSubcategory}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-save-line mr-2"></i>
                {editingSubcategory ? 'Guardar Alterações' : 'Adicionar Subcategoria'}
              </button>
              <button
                onClick={() => {
                  setShowAddSubcategoryModal(false);
                  setEditingSubcategory(null);
                  resetSubcategoryForm();
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
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
