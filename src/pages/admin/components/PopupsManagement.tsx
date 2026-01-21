import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Popup {
  id: string;
  title: string;
  message: string;
  type: 'welcome' | 'promotion' | 'announcement' | 'newsletter';
  button_text: string;
  button_link: string;
  image_url?: string;
  is_active: boolean;
  show_once: boolean;
  delay_seconds: number;
  created_at: string;
}

interface PopupsManagementProps {
  darkMode: boolean;
}

export default function PopupsManagement({ darkMode }: PopupsManagementProps) {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'welcome' as Popup['type'],
    button_text: '',
    button_link: '',
    image_url: '',
    is_active: true,
    show_once: true,
    delay_seconds: 3,
  });

  useEffect(() => {
    loadPopups();
  }, []);

  const loadPopups = async () => {
    try {
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPopups(data || []);
    } catch (error) {
      console.error('Erro ao carregar popups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingPopup) {
        const { error } = await supabase
          .from('popups')
          .update(formData)
          .eq('id', editingPopup.id);

        if (error) throw error;
        alert('✅ Popup atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('popups')
          .insert([formData]);

        if (error) throw error;
        alert('✅ Popup criado com sucesso!');
      }

      setShowModal(false);
      setEditingPopup(null);
      resetForm();
      loadPopups();
    } catch (error) {
      console.error('Erro ao guardar popup:', error);
      alert('❌ Erro ao guardar popup');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja eliminar este popup?')) return;

    try {
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Popup eliminado com sucesso!');
      loadPopups();
    } catch (error) {
      console.error('Erro ao eliminar popup:', error);
      alert('❌ Erro ao eliminar popup');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('popups')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadPopups();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'welcome',
      button_text: '',
      button_link: '',
      image_url: '',
      is_active: true,
      show_once: true,
      delay_seconds: 3,
    });
  };

  const openEditModal = (popup: Popup) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      message: popup.message,
      type: popup.type,
      button_text: popup.button_text,
      button_link: popup.button_link,
      image_url: popup.image_url || '',
      is_active: popup.is_active,
      show_once: popup.show_once,
      delay_seconds: popup.delay_seconds,
    });
    setShowModal(true);
  };

  const typeLabels = {
    welcome: '👋 Boas-vindas',
    promotion: '🎉 Promoção',
    announcement: '📢 Anúncio',
    newsletter: '✉️ Newsletter',
  };

  const typeColors = {
    welcome: 'from-blue-500 to-cyan-500',
    promotion: 'from-pink-500 to-rose-500',
    announcement: 'from-purple-500 to-indigo-500',
    newsletter: 'from-green-500 to-emerald-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Gestão de Pop-ups
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure pop-ups de boas-vindas, promoções e anúncios
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPopup(null);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          Criar Pop-up
        </button>
      </div>

      {/* Grid de Popups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popups.map((popup) => (
          <div
            key={popup.id}
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${typeColors[popup.type]} text-white text-sm font-bold`}>
                {typeLabels[popup.type]}
              </div>
              <button
                onClick={() => toggleActive(popup.id, popup.is_active)}
                className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  popup.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {popup.is_active ? '✓ Ativo' : '✗ Inativo'}
              </button>
            </div>

            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {popup.title}
            </h3>
            <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {popup.message}
            </p>

            <div className={`text-xs space-y-2 mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center gap-2">
                <i className="ri-time-line"></i>
                Delay: {popup.delay_seconds}s
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-eye-line"></i>
                {popup.show_once ? 'Mostrar uma vez' : 'Mostrar sempre'}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(popup)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-edit-line mr-2"></i>
                Editar
              </button>
              <button
                onClick={() => handleDelete(popup.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {popups.length === 0 && !loading && (
        <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <i className="ri-notification-line text-6xl mb-4"></i>
          <p className="text-lg font-semibold">Nenhum pop-up criado</p>
          <p className="text-sm mt-2">Clique em "Criar Pop-up" para começar</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingPopup ? 'Editar Pop-up' : 'Criar Novo Pop-up'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                  placeholder="Ex: Bem-vindo à Marisol!"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mensagem *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                  placeholder="Ex: Ganhe 10% de desconto na sua primeira compra!"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tipo de Pop-up
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, type: key as Popup['type'] })}
                      className={`px-4 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                        formData.type === key
                          ? `bg-gradient-to-r ${typeColors[key as Popup['type']]} text-white`
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-pink-500`}
                    placeholder="Ex: Começar Agora"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Link do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-pink-500`}
                    placeholder="/products"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Imagem (URL - Opcional)
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                  placeholder="URL da imagem"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Delay (segundos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.delay_seconds}
                  onChange={(e) => setFormData({ ...formData, delay_seconds: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-pink-500`}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ativar pop-up
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_once}
                    onChange={(e) => setFormData({ ...formData, show_once: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Mostrar apenas uma vez
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPopup(null);
                  resetForm();
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-medium cursor-pointer whitespace-nowrap ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {editingPopup ? 'Atualizar' : 'Criar'} Pop-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
