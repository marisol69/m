import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

type SubTab = 'theme' | 'homepage' | 'menus' | 'pages' | 'popups' | 'images' | 'texts';

export default function SiteBuilderManagement() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('theme');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Theme State
  const [theme, setTheme] = useState({
    primary_color: '#9FBAD0',
    secondary_color: '#C6A75E',
    background_color: '#121212',
    card_background: '#1A1A1A',
    text_primary: '#F5F5F5',
    text_secondary: '#B3B3B3',
    font_family: 'Inter',
    logo_url: '',
    favicon_url: ''
  });

  // Homepage Sections State
  const [sections, setSections] = useState<any[]>([]);

  // Menus State
  const [menus, setMenus] = useState<any[]>([]);

  // Popups State
  const [popups, setPopups] = useState<any[]>([]);

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState({
    site_name: 'Arisol',
    site_description: { pt: '', en: '', fr: '', de: '' },
    contact_email: 'info@arisol.lu',
    contact_phone: '+352 123 456 789',
    contact_address: 'Luxembourg',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    pinterest_url: '',
    hero_title: { pt: '', en: '', fr: '', de: '' },
    hero_subtitle: { pt: '', en: '', fr: '', de: '' },
    hero_image: '',
    hero_button_text: { pt: '', en: '', fr: '', de: '' },
    hero_button_link: '',
    about_title: { pt: '', en: '', fr: '', de: '' },
    about_content: { pt: '', en: '', fr: '', de: '' },
    about_image: '',
    footer_text: { pt: '', en: '', fr: '', de: '' },
    show_newsletter: true,
    show_social_media: true
  });

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'theme') {
        const { data } = await supabase.from('site_theme').select('*').single();
        if (data) setTheme(data);
      } else if (activeSubTab === 'homepage') {
        const { data } = await supabase.from('homepage_sections').select('*').order('display_order');
        if (data) setSections(data);
      } else if (activeSubTab === 'menus') {
        const { data } = await supabase.from('navigation_menus').select('*').order('display_order');
        if (data) setMenus(data);
      } else if (activeSubTab === 'popups') {
        const { data } = await supabase.from('popups').select('*').order('created_at', { ascending: false });
        if (data) setPopups(data);
      } else if (activeSubTab === 'texts' || activeSubTab === 'images') {
        const { data } = await supabase.from('site_settings').select('*').single();
        if (data) setSiteSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setLoading(false);
  };

  const saveTheme = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('site_theme')
        .update(theme)
        .eq('id', '00000000-0000-0000-0000-000000000001');
      
      if (!error) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Aplicar tema em tempo real
        applyThemeToSite();
      }
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      alert('Erro ao salvar tema');
    }
    setLoading(false);
  };

  const applyThemeToSite = () => {
    document.documentElement.style.setProperty('--color-primary', theme.primary_color);
    document.documentElement.style.setProperty('--color-secondary', theme.secondary_color);
    document.documentElement.style.setProperty('--color-bg', theme.background_color);
    document.documentElement.style.setProperty('--color-card', theme.card_background);
    document.documentElement.style.setProperty('--color-text-primary', theme.text_primary);
    document.documentElement.style.setProperty('--color-text-secondary', theme.text_secondary);
  };

  const updateSection = async (sectionId: string, updates: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update(updates)
        .eq('id', sectionId);
      
      if (!error) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        loadData();
      }
    } catch (error) {
      console.error('Erro ao atualizar seção:', error);
    }
    setLoading(false);
  };

  const toggleSection = async (sectionId: string, currentState: boolean) => {
    await updateSection(sectionId, { is_active: !currentState });
  };

  const reorderSections = async (sectionId: string, newOrder: number) => {
    await updateSection(sectionId, { display_order: newOrder });
  };

  const saveSiteSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(siteSettings);
      
      if (!error) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    }
    setLoading(false);
  };

  const addNewPopup = async () => {
    const newPopup = {
      title: { pt: 'Novo Pop-up', en: 'New Popup', fr: 'Nouveau Popup', de: 'Neues Popup' },
      content: { pt: '', en: '', fr: '', de: '' },
      is_active: false,
      popup_type: 'center',
      display_trigger: 'page_load',
      delay_seconds: 3
    };

    const { error } = await supabase.from('popups').insert(newPopup);
    if (!error) loadData();
  };

  const deletePopup = async (popupId: string) => {
    if (confirm('Tem certeza que deseja eliminar este pop-up?')) {
      const { error } = await supabase.from('popups').delete().eq('id', popupId);
      if (!error) loadData();
    }
  };

  const renderThemeEditor = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-2xl p-6 border border-pink-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <i className="ri-palette-line text-2xl text-pink-600"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Identidade Visual da Marca</h3>
            <p className="text-sm text-gray-600">Configure as cores e estilo do site Arisol</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="ri-drop-line mr-2 text-blue-500"></i>
            Cor Principal (Baby Blue)
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={theme.primary_color}
              onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
              className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.primary_color}
              onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              placeholder="#9FBAD0"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Botões, links, ícones, destaques</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="ri-vip-crown-line mr-2 text-yellow-600"></i>
            Cor Secundária (Dourado)
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={theme.secondary_color}
              onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
              className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.secondary_color}
              onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              placeholder="#C6A75E"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Detalhes premium, bordas especiais</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="ri-contrast-2-line mr-2 text-gray-700"></i>
            Fundo Principal (Preto Suave)
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={theme.background_color}
              onChange={(e) => setTheme({ ...theme, background_color: e.target.value })}
              className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.background_color}
              onChange={(e) => setTheme({ ...theme, background_color: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              placeholder="#121212"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Fundo geral do site</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="ri-layout-line mr-2 text-gray-600"></i>
            Fundo de Cards
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={theme.card_background}
              onChange={(e) => setTheme({ ...theme, card_background: e.target.value })}
              className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.card_background}
              onChange={(e) => setTheme({ ...theme, card_background: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              placeholder="#1A1A1A"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Produtos, menus, seções</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="ri-text mr-2 text-gray-800"></i>
            Texto Principal
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={theme.text_primary}
              onChange={(e) => setTheme({ ...theme, text_primary: e.target.value })}
              className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.text_primary}
              onChange={(e) => setTheme({ ...theme, text_primary: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              placeholder="#F5F5F5"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Títulos, textos principais</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="ri-text mr-2 text-gray-500"></i>
            Texto Secundário
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={theme.text_secondary}
              onChange={(e) => setTheme({ ...theme, text_secondary: e.target.value })}
              className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.text_secondary}
              onChange={(e) => setTheme({ ...theme, text_secondary: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              placeholder="#B3B3B3"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Descrições, legendas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          <i className="ri-image-line mr-2 text-pink-600"></i>
          Logotipo e Favicon
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL do Logotipo</label>
            <input
              type="text"
              value={theme.logo_url}
              onChange={(e) => setTheme({ ...theme, logo_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">Logotipo com "M" em baby blue e "Arisol" em branco</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL do Favicon</label>
            <input
              type="text"
              value={theme.favicon_url}
              onChange={(e) => setTheme({ ...theme, favicon_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">Ícone que aparece na aba do navegador</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={saveTheme}
          disabled={loading}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {loading ? (
            <><i className="ri-loader-4-line animate-spin mr-2"></i>A guardar...</>
          ) : (
            <><i className="ri-save-line mr-2"></i>Guardar Tema e Aplicar ao Site</>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
          <div>
            <p className="font-semibold text-green-800">Tema guardado com sucesso!</p>
            <p className="text-sm text-green-600">As alterações foram aplicadas ao site em tempo real.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderHomepageEditor = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <i className="ri-layout-grid-line text-2xl text-blue-600"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Seções da Página Inicial</h3>
            <p className="text-sm text-gray-600">Ative, desative ou reordene as seções do site</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => reorderSections(section.id, section.display_order - 1)}
                    disabled={index === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                  >
                    <i className="ri-arrow-up-line text-gray-600"></i>
                  </button>
                  <button
                    onClick={() => reorderSections(section.id, section.display_order + 1)}
                    disabled={index === sections.length - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                  >
                    <i className="ri-arrow-down-line text-gray-600"></i>
                  </button>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    {section.title?.pt || section.section_type}
                  </h4>
                  <p className="text-sm text-gray-500">Ordem: {section.display_order}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.is_active}
                    onChange={() => toggleSection(section.id, section.is_active)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {section.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título (PT)</label>
                <input
                  type="text"
                  value={section.title?.pt || ''}
                  onChange={(e) => {
                    const updated = { ...section, title: { ...section.title, pt: e.target.value } };
                    updateSection(section.id, { title: updated.title });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtítulo (PT)</label>
                <input
                  type="text"
                  value={section.subtitle?.pt || ''}
                  onChange={(e) => {
                    const updated = { ...section, subtitle: { ...section.subtitle, pt: e.target.value } };
                    updateSection(section.id, { subtitle: updated.subtitle });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPopupsEditor = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <i className="ri-notification-badge-line text-2xl text-purple-600"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Pop-ups e Anúncios</h3>
              <p className="text-sm text-gray-600">Crie promoções e avisos para os clientes</p>
            </div>
          </div>
          <button
            onClick={addNewPopup}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>Novo Pop-up
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {popups.map((popup) => (
          <div key={popup.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-800 mb-1">
                  {popup.title?.pt || 'Sem título'}
                </h4>
                <p className="text-sm text-gray-600">{popup.content?.pt || 'Sem conteúdo'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  popup.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {popup.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  onClick={() => deletePopup(popup.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span><i className="ri-time-line mr-1"></i>Atraso: {popup.delay_seconds}s</span>
              <span><i className="ri-eye-line mr-1"></i>Tipo: {popup.popup_type}</span>
              <span><i className="ri-cursor-line mr-1"></i>Gatilho: {popup.display_trigger}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTextsEditor = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <i className="ri-file-text-line text-2xl text-green-600"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Textos do Site</h3>
            <p className="text-sm text-gray-600">Edite todos os textos em múltiplos idiomas</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ri-home-heart-line text-pink-600"></i>
            Seção Hero (Página Inicial)
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal (PT)</label>
              <input
                type="text"
                value={siteSettings.hero_title?.pt || ''}
                onChange={(e) => setSiteSettings({
                  ...siteSettings,
                  hero_title: { ...siteSettings.hero_title, pt: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="Bem-vinda à Arisol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo (PT)</label>
              <input
                type="text"
                value={siteSettings.hero_subtitle?.pt || ''}
                onChange={(e) => setSiteSettings({
                  ...siteSettings,
                  hero_subtitle: { ...siteSettings.hero_subtitle, pt: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="Moda feminina elegante e sofisticada"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Botão (PT)</label>
              <input
                type="text"
                value={siteSettings.hero_button_text?.pt || ''}
                onChange={(e) => setSiteSettings({
                  ...siteSettings,
                  hero_button_text: { ...siteSettings.hero_button_text, pt: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="Explorar Coleção"
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ri-information-line text-blue-600"></i>
            Sobre Nós
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título (PT)</label>
              <input
                type="text"
                value={siteSettings.about_title?.pt || ''}
                onChange={(e) => setSiteSettings({
                  ...siteSettings,
                  about_title: { ...siteSettings.about_title, pt: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="Sobre a Arisol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo (PT)</label>
              <textarea
                value={siteSettings.about_content?.pt || ''}
                onChange={(e) => setSiteSettings({
                  ...siteSettings,
                  about_content: { ...siteSettings.about_content, pt: e.target.value }
                })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="Conte a história da marca Arisol..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ri-layout-bottom-line text-purple-600"></i>
            Rodapé
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Rodapé (PT)</label>
            <textarea
              value={siteSettings.footer_text?.pt || ''}
              onChange={(e) => setSiteSettings({
                ...siteSettings,
                footer_text: { ...siteSettings.footer_text, pt: e.target.value }
              })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="© 2024 Arisol. Todos os direitos reservados."
            />
          </div>
        </div>
      </div>

      <button
        onClick={saveSiteSettings}
        disabled={loading}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
      >
        {loading ? (
          <><i className="ri-loader-4-line animate-spin mr-2"></i>A guardar...</>
        ) : (
          <><i className="ri-save-line mr-2"></i>Guardar Todos os Textos</>
        )}
      </button>
    </div>
  );

  const renderImagesEditor = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <i className="ri-image-2-line text-2xl text-orange-600"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Imagens do Site</h3>
            <p className="text-sm text-gray-600">Altere banners, hero, categorias e produtos</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Imagem Hero (Página Inicial)</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
            <input
              type="text"
              value={siteSettings.hero_image || ''}
              onChange={(e) => setSiteSettings({ ...siteSettings, hero_image: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="https://..."
            />
            {siteSettings.hero_image && (
              <div className="mt-4">
                <img
                  src={siteSettings.hero_image}
                  alt="Hero Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Imagem Sobre Nós</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
            <input
              type="text"
              value={siteSettings.about_image || ''}
              onChange={(e) => setSiteSettings({ ...siteSettings, about_image: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="https://..."
            />
            {siteSettings.about_image && (
              <div className="mt-4">
                <img
                  src={siteSettings.about_image}
                  alt="About Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={saveSiteSettings}
        disabled={loading}
        className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
      >
        {loading ? (
          <><i className="ri-loader-4-line animate-spin mr-2"></i>A guardar...</>
        ) : (
          <><i className="ri-save-line mr-2"></i>Guardar Imagens</>
        )}
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          <i className="ri-tools-line mr-3 text-pink-600"></i>
          Site Builder
        </h1>
        <p className="text-gray-600">
          Controlo total sobre design, conteúdo e experiência do site Marisol
        </p>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-8 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveSubTab('theme')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'theme'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-palette-line mr-2"></i>Tema e Cores
          </button>
          <button
            onClick={() => setActiveSubTab('homepage')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'homepage'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-layout-grid-line mr-2"></i>Seções da Home
          </button>
          <button
            onClick={() => setActiveSubTab('texts')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'texts'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-file-text-line mr-2"></i>Textos
          </button>
          <button
            onClick={() => setActiveSubTab('images')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'images'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-image-2-line mr-2"></i>Imagens
          </button>
          <button
            onClick={() => setActiveSubTab('popups')}
            className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'popups'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="ri-notification-badge-line mr-2"></i>Pop-ups
          </button>
        </div>
      </div>

      {/* Content */}
      {activeSubTab === 'theme' && renderThemeEditor()}
      {activeSubTab === 'homepage' && renderHomepageEditor()}
      {activeSubTab === 'texts' && renderTextsEditor()}
      {activeSubTab === 'images' && renderImagesEditor()}
      {activeSubTab === 'popups' && renderPopupsEditor()}
    </div>
  );
}
