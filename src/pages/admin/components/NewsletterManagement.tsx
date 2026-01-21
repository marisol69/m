import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface NewsletterManagementProps {
  darkMode: boolean;
}

interface Subscriber {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  country?: string;
  language?: string;
  source?: string;
  status: 'active' | 'cancelled';
  created_at: string;
  customer_id?: string;
  customer?: any;
}

export default function NewsletterManagement({ darkMode }: NewsletterManagementProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'cancelled' | 'new' | 'with_purchases'>('all');
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadSubscribers();
    
    // Subscrição em tempo real
    const subscription = supabase
      .channel('newsletter_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, () => {
        loadSubscribers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSubscribers(data);
    } catch (error) {
      console.error('Erro ao carregar subscritores:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSubscribers = () => {
    const csv = ['Nome,Email,Telefone,País,Idioma,Data de Inscrição,Origem,Estado'];
    filteredSubscribers.forEach(sub => {
      csv.push(`${sub.name || ''},${sub.email},${sub.phone || ''},${sub.country || ''},${sub.language || ''},${new Date(sub.created_at).toLocaleDateString('pt-PT')},${sub.source || 'Website'},${sub.status === 'active' ? 'Ativo' : 'Cancelado'}`);
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const cancelSubscription = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta inscrição?')) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      // Criar notificação
      await supabase.from('notifications').insert({
        type: 'newsletter',
        title: 'Cancelamento de Newsletter',
        message: `Subscritor cancelou a inscrição`,
        is_read: false,
        created_at: new Date().toISOString()
      });

      alert('✅ Inscrição cancelada com sucesso!');
      loadSubscribers();
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      alert('❌ Erro ao cancelar inscrição');
    }
  };

  const reactivateSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: 'active' })
        .eq('id', id);

      if (error) throw error;

      alert('✅ Inscrição reativada com sucesso!');
      loadSubscribers();
    } catch (error) {
      console.error('Erro ao reativar inscrição:', error);
      alert('❌ Erro ao reativar inscrição');
    }
  };

  const openDetailsModal = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setShowDetailsModal(true);
  };

  const filteredSubscribers = subscribers.filter(sub => {
    // Filtro de pesquisa
    const matchesSearch = !searchTerm || 
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.country?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de tipo
    let matchesType = true;
    if (filterType === 'active') {
      matchesType = sub.status === 'active';
    } else if (filterType === 'cancelled') {
      matchesType = sub.status === 'cancelled';
    } else if (filterType === 'new') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesType = new Date(sub.created_at) >= weekAgo;
    } else if (filterType === 'with_purchases') {
      matchesType = false; // Removido temporariamente até conectar com customers
    }

    return matchesSearch && matchesType;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    cancelled: subscribers.filter(s => s.status === 'cancelled').length,
    today: subscribers.filter(s => {
      const date = new Date(s.created_at);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length,
    week: subscribers.filter(s => {
      const date = new Date(s.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length,
    withPurchases: 0, // Removido temporariamente até conectar com customers
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="ri-loader-4-line text-5xl text-pink-500 animate-spin"></i>
      </div>
    );
  }

  return (
    <div>
      {/* Aviso de Sincronização */}
      <div className={`mb-6 ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-2xl p-4 border`}>
        <div className="flex items-start gap-3">
          <i className={`ri-information-line text-xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
          <div>
            <h3 className={`font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              ✅ Sistema Sincronizado Automaticamente
            </h3>
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
              Todas as inscrições feitas no site aparecem aqui instantaneamente. Os dados são guardados permanentemente no Supabase e nunca desaparecem.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Gestão de Newsletter
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            {subscribers.length} subscritores registados
          </p>
        </div>
        <button
          onClick={exportSubscribers}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
        >
          <i className="ri-download-line mr-2"></i>
          Exportar Lista (CSV)
        </button>
      </div>

      {/* Estatísticas - 6 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <i className="ri-mail-line text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.total}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-green-600 dark:text-green-400"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.active}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ativos</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <i className="ri-close-circle-line text-2xl text-red-600 dark:text-red-400"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.cancelled}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cancelados</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <i className="ri-calendar-check-line text-2xl text-yellow-600 dark:text-yellow-400"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.today}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hoje</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <i className="ri-line-chart-line text-2xl text-purple-600 dark:text-purple-400"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.week}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Últimos 7 Dias</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
              <i className="ri-shopping-bag-line text-2xl text-pink-600 dark:text-pink-400"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.withPurchases}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Com Compras</p>
        </div>
      </div>

      {/* Filtros e Pesquisa */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border mb-6`}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pesquisar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome, email ou país..."
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Filtrar por
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm cursor-pointer`}
            >
              <option value="all">Todos os Subscritores</option>
              <option value="active">Ativos</option>
              <option value="cancelled">Cancelados</option>
              <option value="new">Novos (últimos 7 dias)</option>
              <option value="with_purchases">Com Compras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Subscritores */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}>
        {filteredSubscribers.length === 0 ? (
          <div className="text-center py-16">
            <i className={`ri-mail-line text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum subscritor encontrado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Subscritor
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Contacto
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    País / Idioma
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Data de Inscrição
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Origem
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Estado
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-6 py-4`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                          {subscriber.name ? subscriber.name[0].toUpperCase() : subscriber.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {subscriber.name || 'Sem nome'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {subscriber.email}
                      </p>
                      {subscriber.phone && (
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {subscriber.phone}
                        </p>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex flex-col gap-1">
                        {subscriber.country && (
                          <span className="inline-flex items-center gap-1">
                            <i className="ri-map-pin-line text-xs"></i>
                            {subscriber.country}
                          </span>
                        )}
                        {subscriber.language && (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <i className="ri-global-line"></i>
                            {subscriber.language.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(subscriber.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className={`px-6 py-4`}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <i className="ri-window-line"></i>
                        {subscriber.source || 'Website'}
                      </span>
                    </td>
                    <td className={`px-6 py-4`}>
                      {subscriber.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                          <i className="ri-checkbox-circle-line"></i>
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                          <i className="ri-close-circle-line"></i>
                          Cancelado
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4`}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailsModal(subscriber)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                          title="Ver Detalhes"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        {subscriber.status === 'active' ? (
                          <button
                            onClick={() => cancelSubscription(subscriber.id)}
                            className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                            title="Cancelar Inscrição"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateSubscription(subscriber.id)}
                            className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors cursor-pointer"
                            title="Reativar Inscrição"
                          >
                            <i className="ri-refresh-line"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedSubscriber && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Detalhes do Subscritor</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-2xl text-white"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações Pessoais */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-user-line text-pink-500"></i>
                  Informações Pessoais
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nome</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedSubscriber.name || 'Não fornecido'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedSubscriber.email}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Telefone</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedSubscriber.phone || 'Não fornecido'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>País</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedSubscriber.country || 'Não fornecido'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Idioma Preferido</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedSubscriber.language?.toUpperCase() || 'Não fornecido'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Data de Inscrição</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {new Date(selectedSubscriber.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações de Inscrição */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-mail-line text-pink-500"></i>
                  Informações de Inscrição
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Origem</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedSubscriber.source || 'Website'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estado</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedSubscriber.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <i className="ri-checkbox-circle-line"></i>
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <i className="ri-close-circle-line"></i>
                          Cancelado
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações de Cliente (se existir) */}
              {selectedSubscriber.customer_id && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    <i className="ri-shopping-bag-line text-pink-500"></i>
                    Cliente Registado
                  </h3>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                    <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      <i className="ri-information-line mr-2"></i>
                      Este subscritor tem uma conta de cliente registada na loja.
                    </p>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedSubscriber.status === 'active' ? (
                  <button
                    onClick={() => {
                      cancelSubscription(selectedSubscriber.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-close-line mr-2"></i>
                    Cancelar Inscrição
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      reactivateSubscription(selectedSubscriber.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Reativar Inscrição
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`flex-1 px-6 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dicas de Campanha */}
      <div className={`mt-6 ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-2xl p-6 border`}>
        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
          <i className="ri-lightbulb-line"></i>
          Ideias para Campanhas de Email
        </h3>
        <ul className={`space-y-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
          <li>• Enviar novidades sobre novos produtos e coleções</li>
          <li>• Criar campanhas sazonais (Primavera, Verão, Outono, Inverno)</li>
          <li>• Oferecer descontos exclusivos para subscritores</li>
          <li>• Partilhar dicas de moda e tendências</li>
          <li>• Anunciar promoções especiais e vendas flash</li>
          <li>• Enviar mensagens personalizadas para clientes com compras</li>
        </ul>
      </div>
    </div>
  );
}
