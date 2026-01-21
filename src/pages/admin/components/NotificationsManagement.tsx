import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Notification {
  id: string;
  type: 'order' | 'email' | 'stock_alert' | 'system' | 'contact' | 'customer' | 'newsletter' | 'error' | 'order_new' | 'order_status' | 'order_cancelled';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  customer_email?: string;
  customer_name?: string;
  contact_subject?: string;
  order_id?: string;
  order_total?: number;
  order_status?: string;
  metadata?: any;
}

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    loadNotifications();
    
    // Subscrever para atualizações em tempo real
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        loadNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        loadNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Carregar notificações do sistema
      const { data: systemNotifications, error: systemError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (systemError) throw systemError;

      // Carregar mensagens de contato não lidas
      const { data: contactMessages, error: contactError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactError) throw contactError;

      // Converter mensagens de contato em notificações
      const contactNotifications = (contactMessages || []).map((msg: any) => ({
        id: `contact-${msg.id}`,
        type: 'contact' as const,
        title: `Nova Mensagem: ${msg.subject}`,
        message: msg.message,
        read: msg.status === 'read',
        created_at: msg.created_at,
        customer_email: msg.email,
        customer_name: msg.name,
        contact_subject: msg.subject,
        metadata: msg,
      }));

      // Combinar todas as notificações
      const allNotifications = [
        ...(systemNotifications || []),
        ...contactNotifications,
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      if (id.startsWith('contact-')) {
        const contactId = id.replace('contact-', '');
        const { error } = await supabase
          .from('contact_messages')
          .update({ status: 'read' })
          .eq('id', contactId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id);

        if (error) throw error;
      }
      
      // ✅ Atualizar imediatamente o estado local
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      
      // Recarregar para garantir sincronização
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      alert('❌ Erro ao marcar notificação como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      // Marcar todas as notificações como lidas
      const { error: notifError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (notifError) throw notifError;

      // Marcar todas as mensagens de contato como lidas
      const { error: contactError } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .neq('status', 'read');

      if (contactError) throw contactError;

      // ✅ Atualizar imediatamente o estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );

      alert('✅ Todas as notificações foram marcadas como lidas!');
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      alert('❌ Erro ao marcar notificações como lidas');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Tem certeza que deseja eliminar esta notificação?')) return;
    
    try {
      if (id.startsWith('contact-')) {
        const contactId = id.replace('contact-', '');
        const { error } = await supabase
          .from('contact_messages')
          .delete()
          .eq('id', contactId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }
      
      alert('✅ Notificação eliminada com sucesso!');
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao eliminar notificação:', error);
      alert('❌ Erro ao eliminar notificação');
    }
  };

  const deleteAllRead = async () => {
    if (!confirm('Tem certeza que deseja eliminar TODAS as notificações lidas?')) return;
    
    try {
      // Eliminar notificações lidas
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('read', true);

      if (notifError) throw notifError;

      // Eliminar mensagens de contato lidas
      const { error: contactError } = await supabase
        .from('contact_messages')
        .delete()
        .eq('status', 'read');

      if (contactError) throw contactError;

      alert('✅ Todas as notificações lidas foram eliminadas!');
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao eliminar notificações:', error);
      alert('❌ Erro ao eliminar notificações');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
      case 'order_new':
      case 'order_status':
      case 'order_cancelled':
        return 'ri-shopping-bag-line';
      case 'email': return 'ri-mail-line';
      case 'contact': return 'ri-message-3-line';
      case 'customer': return 'ri-user-add-line';
      case 'newsletter': return 'ri-mail-send-line';
      case 'stock_alert': return 'ri-alert-line';
      case 'error': return 'ri-error-warning-line';
      case 'system': return 'ri-settings-line';
      default: return 'ri-notification-line';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
      case 'order_new':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
      case 'order_status':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
      case 'order_cancelled':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
      case 'email': 
        return 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/30';
      case 'contact': 
        return 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/30';
      case 'customer': 
        return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30';
      case 'newsletter': 
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30';
      case 'stock_alert': 
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30';
      case 'error': 
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
      case 'system': 
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/30';
      default: 
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'order': return 'Encomenda';
      case 'order_new': return 'Nova Encomenda';
      case 'order_status': return 'Estado da Encomenda';
      case 'order_cancelled': return 'Encomenda Cancelada';
      case 'email': return 'Email';
      case 'contact': return 'Mensagem de Contato';
      case 'customer': return 'Cliente';
      case 'newsletter': return 'Newsletter';
      case 'stock_alert': return 'Alerta de Stock';
      case 'error': return 'Erro';
      case 'system': return 'Sistema';
      default: return type;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'all') {
      // Para o filtro "order", incluir todos os tipos de encomenda
      if (filterType === 'order') {
        if (!['order', 'order_new', 'order_status', 'order_cancelled'].includes(n.type)) {
          return false;
        }
      } else if (n.type !== filterType) {
        return false;
      }
    }
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    contacts: notifications.filter(n => n.type === 'contact').length,
    orders: notifications.filter(n => ['order', 'order_new', 'order_status', 'order_cancelled'].includes(n.type)).length,
    customers: notifications.filter(n => n.type === 'customer').length,
    newsletter: notifications.filter(n => n.type === 'newsletter').length,
    errors: notifications.filter(n => n.type === 'error').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso de Persistência */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <i className="ri-information-line text-2xl text-blue-600 dark:text-blue-400 flex-shrink-0"></i>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Sistema de Notificações em Tempo Real
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Todas as notificações são guardadas permanentemente na base de dados. Novas notificações aparecem automaticamente quando: clientes enviam mensagens, fazem compras, criam contas, subscrevem newsletter ou ocorrem erros no sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <i className="ri-notification-line text-xl text-white"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <i className="ri-mail-unread-line text-xl text-white"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.unread}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Não Lidas</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 rounded-2xl p-4 border border-pink-200 dark:border-pink-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
              <i className="ri-message-3-line text-xl text-white"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">{stats.contacts}</p>
          <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Mensagens</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <i className="ri-shopping-bag-line text-xl text-white"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.orders}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Encomendas</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <i className="ri-user-add-line text-xl text-white"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.customers}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Clientes</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <i className="ri-mail-send-line text-xl text-white"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.newsletter}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Newsletter</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl p-4 border border-red-200 dark:border-red-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <i className="ri-error-warning-line text-xl text-white"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.errors}</p>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Erros</p>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                <option value="contact">Mensagens de Contato</option>
                <option value="order">Encomendas</option>
                <option value="customer">Clientes</option>
                <option value="newsletter">Newsletter</option>
                <option value="stock_alert">Alertas de Stock</option>
                <option value="error">Erros</option>
                <option value="system">Sistema</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                <option value="unread">Não Lidas</option>
                <option value="read">Lidas</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <button
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 h-full"
            >
              <i className="ri-check-double-line text-lg"></i>
              <span className="hidden sm:inline">Marcar Todas como Lidas</span>
              <span className="sm:hidden">Marcar Lidas</span>
            </button>
            <button
              onClick={deleteAllRead}
              disabled={stats.total === stats.unread}
              className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 h-full"
            >
              <i className="ri-delete-bin-line text-lg"></i>
              <span className="hidden sm:inline">Eliminar Lidas</span>
              <span className="sm:hidden">Eliminar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-notification-off-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.read ? 'bg-pink-50/30 dark:bg-pink-900/10 border-l-4 border-pink-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Ícone do Tipo */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    <i className={`${getTypeIcon(notification.type)} text-2xl`}></i>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                              Nova
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded-lg font-medium ${getTypeColor(notification.type)}`}>
                            {getTypeName(notification.type)}
                          </span>
                          <span>
                            <i className="ri-time-line mr-1"></i>
                            {new Date(notification.created_at).toLocaleString('pt-PT')}
                          </span>
                          {notification.customer_name && (
                            <span>
                              <i className="ri-user-line mr-1"></i>
                              {notification.customer_name}
                            </span>
                          )}
                          {notification.customer_email && (
                            <span>
                              <i className="ri-mail-line mr-1"></i>
                              {notification.customer_email}
                            </span>
                          )}
                          {notification.order_id && (
                            <span>
                              <i className="ri-file-list-line mr-1"></i>
                              #{notification.order_id.substring(0, 8)}
                            </span>
                          )}
                          {notification.order_total && (
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              <i className="ri-money-euro-circle-line mr-1"></i>
                              €{notification.order_total.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setSelectedNotification(notification)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          title="Ver detalhes"
                        >
                          <i className="ri-eye-line text-xl"></i>
                        </button>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            title="Marcar como lida"
                          >
                            <i className="ri-check-line text-xl"></i>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          title="Eliminar"
                        >
                          <i className="ri-delete-bin-line text-xl"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className={`${getTypeIcon(selectedNotification.type)} text-2xl`}></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Detalhes da Notificação</h2>
                    <p className="text-sm opacity-90">{getTypeName(selectedNotification.type)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Título e Status */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedNotification.title}
                  </h3>
                  {!selectedNotification.read ? (
                    <span className="px-3 py-1 bg-pink-500 text-white text-sm font-medium rounded-full whitespace-nowrap">
                      Não Lida
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full whitespace-nowrap">
                      Lida
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Informações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Data e Hora</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedNotification.created_at).toLocaleString('pt-PT', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                {selectedNotification.customer_name && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cliente</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedNotification.customer_name}
                    </p>
                  </div>
                )}

                {selectedNotification.customer_email && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white break-all">
                      {selectedNotification.customer_email}
                    </p>
                  </div>
                )}

                {selectedNotification.contact_subject && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assunto</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedNotification.contact_subject}
                    </p>
                  </div>
                )}

                {selectedNotification.order_id && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ID da Encomenda</p>
                    <p className="font-semibold text-gray-900 dark:text-white font-mono">
                      {selectedNotification.order_id}
                    </p>
                  </div>
                )}

                {selectedNotification.order_total && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 border border-green-200 dark:border-green-700">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">Valor Total</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      €{selectedNotification.order_total.toFixed(2)}
                    </p>
                  </div>
                )}

                {selectedNotification.order_status && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estado</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedNotification.order_status}
                    </p>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!selectedNotification.read && (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="ri-check-line text-xl"></i>
                    Marcar como Lida
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteNotification(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-delete-bin-line text-xl"></i>
                  Eliminar
                </button>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
