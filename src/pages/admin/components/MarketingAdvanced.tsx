import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  order_count: number;
  total_spent: number;
  is_newsletter_subscribed: boolean;
  created_at: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp';
  subject?: string;
  message: string;
  created_at: string;
}

interface MessageHistory {
  id: string;
  customer_ids: string[];
  customer_names: string[];
  channel: 'email' | 'whatsapp';
  template_name: string;
  sent_at: string;
}

interface MarketingAdvancedProps {
  darkMode: boolean;
}

export default function MarketingAdvanced({ darkMode }: MarketingAdvancedProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'templates' | 'history'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [history, setHistory] = useState<MessageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'with_orders' | 'without_orders'>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'whatsapp'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadCustomers(),
      loadTemplates(),
      loadHistory()
    ]);
    setLoading(false);
  };

  const loadCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setCustomers(data);
    }
  };

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'marketing_templates')
      .single();
    
    if (data?.value) {
      setTemplates(data.value as MessageTemplate[]);
    } else {
      // Templates padrão se não existirem
      const defaultTemplates: MessageTemplate[] = [
        {
          id: '1',
          name: 'Promoção Exclusiva VIP',
          channel: 'email',
          subject: '🎁 40% OFF Exclusivo para Ti!',
          message: 'Olá {{name}}!\n\nComo cliente VIP, tens acesso exclusivo a 40% de desconto em toda a loja!\n\nUsa o código: VIP40\n\nVálido até ao fim do mês.\n\nObrigada,\nEquipa Marisol',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Novidades na Loja',
          channel: 'email',
          subject: '✨ Novidades Acabaram de Chegar!',
          message: 'Olá {{name}}!\n\nTemos novidades incríveis na nossa loja!\n\nVem descobrir as novas coleções e aproveita 20% de desconto na primeira compra.\n\nCódigo: NOVO20\n\nBoas compras!\nEquipa Marisol',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Agradecimento',
          channel: 'email',
          subject: '💖 Obrigada pela tua Compra!',
          message: 'Olá {{name}}!\n\nQueremos agradecer a tua confiança e preferência!\n\nComo agradecimento, tens 15% de desconto na próxima compra.\n\nCódigo: OBRIGADA15\n\nAté breve!\nEquipa Marisol',
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Promoção WhatsApp',
          channel: 'whatsapp',
          message: '🎉 Olá {{name}}!\n\nPromoção EXCLUSIVA para ti!\n\n✨ 30% OFF em produtos selecionados\n🚚 Envio GRÁTIS acima de €100\n\nVem ver: https://marisol.lu\n\nEquipa Marisol 💙',
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Novidade WhatsApp',
          channel: 'whatsapp',
          message: '✨ Olá {{name}}!\n\nNovas coleções acabaram de chegar! 🛍️\n\nVem descobrir e aproveita 20% OFF:\nhttps://marisol.lu\n\nEquipa Marisol 💙',
          created_at: new Date().toISOString()
        }
      ];
      setTemplates(defaultTemplates);
      // Guardar templates padrão
      await supabase
        .from('site_settings')
        .upsert({
          key: 'marketing_templates',
          value: defaultTemplates
        });
    }
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'marketing_history')
      .single();
    
    if (data?.value) {
      setHistory(data.value as MessageHistory[]);
    }
  };

  // Filtrar clientes
  const getFilteredCustomers = () => {
    let filtered = customers;

    // Filtro por tipo
    if (filterType === 'vip') {
      filtered = filtered.filter(c => c.is_newsletter_subscribed);
    } else if (filterType === 'with_orders') {
      filtered = filtered.filter(c => c.order_count > 0);
    } else if (filterType === 'without_orders') {
      filtered = filtered.filter(c => c.order_count === 0);
    }

    // Filtro por pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Estatísticas
  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.is_newsletter_subscribed).length,
    withOrders: customers.filter(c => c.order_count > 0).length,
    withoutOrders: customers.filter(c => c.order_count === 0).length
  };

  // Selecionar clientes
  const toggleCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleAll = () => {
    const filtered = getFilteredCustomers();
    if (selectedCustomers.size === filtered.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filtered.map(c => c.id)));
    }
  };

  // Enviar mensagem
  const handleSendMessage = (channel: 'email' | 'whatsapp') => {
    setSelectedChannel(channel);
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!selectedTemplate || selectedCustomers.size === 0) return;

    const selectedCustomersList = customers.filter(c => selectedCustomers.has(c.id));

    if (selectedChannel === 'email') {
      // Email
      const emails = selectedCustomersList.map(c => c.email).join(',');
      const subject = selectedTemplate.subject || '';
      const body = selectedTemplate.message.replace(/{{name}}/g, '');
      
      window.location.href = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      // WhatsApp - abrir para cada cliente
      selectedCustomersList.forEach(customer => {
        const message = selectedTemplate.message.replace(/{{name}}/g, customer.name);
        const phone = customer.phone?.replace(/\D/g, '');
        if (phone) {
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
      });
    }

    // Guardar histórico
    const newHistoryEntry: MessageHistory = {
      id: Date.now().toString(),
      customer_ids: Array.from(selectedCustomers),
      customer_names: selectedCustomersList.map(c => c.name),
      channel: selectedChannel,
      template_name: selectedTemplate.name,
      sent_at: new Date().toISOString()
    };

    const updatedHistory = [newHistoryEntry, ...history];
    setHistory(updatedHistory);

    await supabase
      .from('site_settings')
      .upsert({
        key: 'marketing_history',
        value: updatedHistory
      });

    setShowMessageModal(false);
    setSelectedCustomers(new Set());
    setSelectedTemplate(null);
  };

  // Templates
  const saveTemplate = async () => {
    if (!editingTemplate) return;

    let updatedTemplates;
    if (templates.find(t => t.id === editingTemplate.id)) {
      // Editar existente
      updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      );
    } else {
      // Novo template
      const newTemplate = {
        ...editingTemplate,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      updatedTemplates = [...templates, newTemplate];
    }

    setTemplates(updatedTemplates);
    await supabase
      .from('site_settings')
      .upsert({
        key: 'marketing_templates',
        value: updatedTemplates
      });

    setShowTemplateModal(false);
    setEditingTemplate(null);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tens a certeza que queres eliminar este template?')) return;

    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);

    await supabase
      .from('site_settings')
      .upsert({
        key: 'marketing_templates',
        value: updatedTemplates
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="ri-loader-4-line text-5xl text-pink-500 animate-spin"></i>
      </div>
    );
  }

  const filteredCustomers = getFilteredCustomers();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Marketing Profissional
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Gerir clientes, templates e campanhas de marketing
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <i className="ri-group-line text-2xl text-white"></i>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Clientes VIP</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.vip}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <i className="ri-vip-crown-line text-2xl text-white"></i>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">Newsletter = VIP 👑</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Com Compras</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.withOrders}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <i className="ri-shopping-bag-3-line text-2xl text-white"></i>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Sem Compras</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.withoutOrders}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <i className="ri-user-add-line text-2xl text-white"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm mb-6`}>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'customers'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="ri-group-line mr-2"></i>
            Clientes ({filteredCustomers.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'templates'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="ri-file-text-line mr-2"></i>
            Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="ri-history-line mr-2"></i>
            Histórico ({history.length})
          </button>
        </div>

        {/* Conteúdo dos Tabs */}
        <div className="p-6">
          {/* TAB: CLIENTES */}
          {activeTab === 'customers' && (
            <div>
              {/* Filtros e Pesquisa */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, email ou telefone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-800'
                      } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                    />
                  </div>
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className={`px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                >
                  <option value="all">Todos os Clientes</option>
                  <option value="vip">👑 Clientes VIP (Newsletter)</option>
                  <option value="with_orders">Com Compras</option>
                  <option value="without_orders">Sem Compras</option>
                </select>
              </div>

              {/* Botões de Ação */}
              {selectedCustomers.size > 0 && (
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => handleSendMessage('email')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all whitespace-nowrap"
                  >
                    <i className="ri-mail-line text-lg"></i>
                    Enviar Email ({selectedCustomers.size})
                  </button>
                  <button
                    onClick={() => handleSendMessage('whatsapp')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all whitespace-nowrap"
                  >
                    <i className="ri-whatsapp-line text-lg"></i>
                    Enviar WhatsApp ({selectedCustomers.size})
                  </button>
                </div>
              )}

              {/* Tabela de Clientes */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                          onChange={toggleAll}
                          className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer"
                        />
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Cliente
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Contacto
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Tipo
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Compras
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Total Gasto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className={`border-t ${
                          darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                        } transition-colors`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.has(customer.id)}
                            onChange={() => toggleCustomer(customer.id)}
                            className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <i className="ri-mail-line text-gray-400"></i>
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <i className="ri-phone-line text-gray-400"></i>
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {customer.is_newsletter_subscribed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 text-white whitespace-nowrap">
                              <i className="ri-vip-crown-fill"></i>
                              VIP
                            </span>
                          ) : customer.order_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white whitespace-nowrap">
                              <i className="ri-repeat-line"></i>
                              Recorrente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 text-white whitespace-nowrap">
                              <i className="ri-user-add-line"></i>
                              Novo
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {customer.order_count}
                        </td>
                        <td className={`px-4 py-4 font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          €{(customer.total_spent || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredCustomers.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-user-search-line text-5xl text-gray-400 mb-3"></i>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Nenhum cliente encontrado
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TEMPLATES */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Criar e gerir templates de mensagens reutilizáveis
                </p>
                <button
                  onClick={() => {
                    setEditingTemplate({
                      id: '',
                      name: '',
                      channel: 'email',
                      subject: '',
                      message: '',
                      created_at: ''
                    });
                    setShowTemplateModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all whitespace-nowrap"
                >
                  <i className="ri-add-line text-lg"></i>
                  Novo Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6 border-2 border-transparent hover:border-pink-500 transition-all`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {template.name}
                          </h3>
                          {template.channel === 'email' ? (
                            <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                              <i className="ri-mail-line mr-1"></i>
                              Email
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                              <i className="ri-whatsapp-line mr-1"></i>
                              WhatsApp
                            </span>
                          )}
                        </div>
                        {template.subject && (
                          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {template.subject}
                          </p>
                        )}
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-3`}>
                          {template.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Editar
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm whitespace-nowrap"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-file-text-line text-5xl text-gray-400 mb-3"></i>
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    Ainda não tens templates
                  </p>
                  <button
                    onClick={() => {
                      setEditingTemplate({
                        id: '',
                        name: '',
                        channel: 'email',
                        subject: '',
                        message: '',
                        created_at: ''
                      });
                      setShowTemplateModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all whitespace-nowrap"
                  >
                    Criar Primeiro Template
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTÓRICO */}
          {activeTab === 'history' && (
            <div>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Histórico de todas as mensagens enviadas
              </p>

              <div className="space-y-4">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {entry.channel === 'email' ? (
                          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                            <i className="ri-mail-line text-xl text-white"></i>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <i className="ri-whatsapp-line text-xl text-white"></i>
                          </div>
                        )}
                        <div>
                          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {entry.template_name}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {entry.channel === 'email' ? 'Email' : 'WhatsApp'} · {entry.customer_names.length} destinatários
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(entry.sent_at).toLocaleString('pt-PT')}
                      </span>
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>Destinatários:</strong> {entry.customer_names.join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {history.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-history-line text-5xl text-gray-400 mb-3"></i>
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ainda não enviaste mensagens
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Enviar Mensagem */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {selectedChannel === 'email' ? '📧 Enviar Email' : '💬 Enviar WhatsApp'}
                </h2>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  Enviar para <strong>{selectedCustomers.size}</strong> cliente(s)
                </p>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Escolher Template
                </label>
                <div className="space-y-2">
                  {templates
                    .filter(t => t.channel === selectedChannel)
                    .map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                            : darkMode
                            ? 'border-gray-700 bg-gray-700 hover:border-gray-600'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold mb-1">{template.name}</div>
                        {template.subject && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {template.subject}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                          {template.message}
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {selectedTemplate && (
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                    <i className="ri-information-line mr-1"></i>
                    Pré-visualização
                  </p>
                  {selectedTemplate.subject && (
                    <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedTemplate.subject}
                    </p>
                  )}
                  <p className={`text-sm whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTemplate.message.replace(/{{name}}/g, '[Nome do Cliente]')}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedTemplate(null);
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg border ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors whitespace-nowrap`}
                >
                  Cancelar
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!selectedTemplate}
                  className={`flex-1 px-6 py-3 rounded-lg text-white transition-colors whitespace-nowrap ${
                    selectedTemplate
                      ? selectedChannel === 'email'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedChannel === 'email' ? '📧 Enviar Email' : '💬 Enviar WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Template */}
      {showTemplateModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {editingTemplate.id ? 'Editar Template' : 'Novo Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome do Template *
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Ex: Promoção de Verão"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Canal *
                </label>
                <select
                  value={editingTemplate.channel}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, channel: e.target.value as 'email' | 'whatsapp' })}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                >
                  <option value="email">📧 Email</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                </select>
              </div>

              {editingTemplate.channel === 'email' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assunto *
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    placeholder="Ex: 🎁 Oferta Exclusiva para Ti!"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-800'
                    } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mensagem *
                </label>
                <textarea
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                  placeholder="Escreve a tua mensagem aqui... Usa {{name}} para inserir o nome do cliente automaticamente."
                  rows={8}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Usa <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{'{{name}}'}</code> para personalizar com o nome do cliente
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg border ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors whitespace-nowrap`}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!editingTemplate.name || !editingTemplate.message || (editingTemplate.channel === 'email' && !editingTemplate.subject)}
                  className={`flex-1 px-6 py-3 rounded-lg text-white transition-colors whitespace-nowrap ${
                    editingTemplate.name && editingTemplate.message && (editingTemplate.channel === 'whatsapp' || editingTemplate.subject)
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <i className="ri-save-line mr-2"></i>
                  Guardar Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
