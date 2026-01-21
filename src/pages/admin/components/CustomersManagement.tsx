import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface CustomersManagementProps {
  darkMode: boolean;
}

export default function CustomersManagement({ darkMode }: CustomersManagementProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, new, recurring, vip
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          email,
          full_name,
          phone,
          role,
          created_at,
          notes
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Carregar estatísticas para cada cliente
      if (data) {
        const customersWithStats = await Promise.all(
          data.map(async (customer) => {
            const { data: orders } = await supabase
              .from('orders')
              .select('id, total_amount, created_at')
              .eq('customer_id', customer.id);

            const { data: newsletter } = await supabase
              .from('newsletter_subscribers')
              .select('id')
              .eq('email', customer.email)
              .maybeSingle();

            const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
            const orderCount = orders?.length || 0;
            const lastPurchase = orders?.[0]?.created_at;
            
            // Determinar tipo de cliente
            let customerType = 'new';
            if (orderCount === 0) customerType = 'new';
            else if (orderCount >= 1 && orderCount < 3) customerType = 'recurring';
            else if (orderCount >= 3 || totalSpent >= 300) customerType = 'vip';

            return {
              ...customer,
              orderCount,
              totalSpent,
              lastPurchase,
              customerType,
              isNewsletterSubscribed: !!newsletter,
            };
          })
        );
        setCustomers(customersWithStats);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes. Por favor, verifique as permissões no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetails = async (customer: any) => {
    try {
      // Carregar encomendas com produtos
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            product_image
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      // Carregar favoritos com detalhes dos produtos
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name_pt,
            price,
            images
          )
        `)
        .eq('user_id', customer.id);

      // Carregar endereços
      const { data: addressesData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', customer.id);

      // Verificar inscrição na newsletter
      const { data: newsletterData } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('email', customer.email)
        .maybeSingle();

      setSelectedCustomer({
        ...customer,
        orders: ordersData || [],
        favorites: favoritesData || [],
        addresses: addressesData || [],
        newsletterInfo: newsletterData,
      });
      setCustomerNotes(customer.notes || '');
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      alert('Erro ao carregar detalhes do cliente');
    }
  };

  const saveCustomerNotes = async () => {
    if (!selectedCustomer) return;

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ notes: customerNotes })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      alert('✅ Notas guardadas com sucesso!');
      loadCustomers();
    } catch (error) {
      console.error('Erro ao guardar notas:', error);
      alert('❌ Erro ao guardar notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0) {
      // Desmarcar todos
      setSelectedCustomers(new Set());
    } else {
      // Marcar todos
      const allIds = new Set(filteredCustomers.map(c => c.id));
      setSelectedCustomers(allIds);
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const deleteSelectedCustomers = async () => {
    setDeleting(true);
    try {
      const customerIds = Array.from(selectedCustomers);
      
      // Para cada cliente, eliminar em cascata
      for (const customerId of customerIds) {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) continue;

        // 1. Eliminar endereços
        await supabase
          .from('addresses')
          .delete()
          .eq('user_id', customerId);

        // 2. Eliminar favoritos
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', customerId);

        // 3. Eliminar itens do carrinho
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', customerId);

        // 4. Obter encomendas do cliente
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', customerId);

        if (orders && orders.length > 0) {
          const orderIds = orders.map(o => o.id);

          // 5. Eliminar itens das encomendas
          await supabase
            .from('order_items')
            .delete()
            .in('order_id', orderIds);

          // 6. Eliminar encomendas
          await supabase
            .from('orders')
            .delete()
            .eq('customer_id', customerId);
        }

        // 7. Desinscrever da newsletter
        await supabase
          .from('newsletter_subscribers')
          .delete()
          .eq('email', customer.email);

        // 8. Finalmente, eliminar o cliente
        await supabase
          .from('customers')
          .delete()
          .eq('id', customerId);
      }

      alert(`✅ ${customerIds.length} cliente(s) eliminado(s) com sucesso!`);
      setShowDeleteConfirm(false);
      setSelectedCustomers(new Set());
      loadCustomers();
    } catch (error) {
      console.error('Erro ao eliminar clientes:', error);
      alert('❌ Erro ao eliminar clientes. Verifique as permissões no Supabase.');
    } finally {
      setDeleting(false);
    }
  };

  const getCustomerTypeBadge = (type: string) => {
    const badges = {
      new: { text: 'Novo Cliente', color: 'bg-blue-100 text-blue-700' },
      recurring: { text: 'Cliente Recorrente', color: 'bg-green-100 text-green-700' },
      vip: { text: 'Cliente VIP', color: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' },
    };
    const badge = badges[type as keyof typeof badges] || badges.new;
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || customer.customerType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Estatísticas
  const stats = {
    total: customers.length,
    new: customers.filter(c => c.customerType === 'new').length,
    recurring: customers.filter(c => c.customerType === 'recurring').length,
    vip: customers.filter(c => c.customerType === 'vip').length,
    newsletter: customers.filter(c => c.isNewsletterSubscribed).length,
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
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          👥 Gestão de Clientes
        </h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          {customers.length} clientes registados
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-700/30' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'} rounded-2xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <i className="ri-user-line text-2xl text-white"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.total}
          </p>
          <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            Total de Clientes
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-800/40 border-cyan-700/30' : 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'} rounded-2xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
              <i className="ri-user-add-line text-2xl text-white"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.new}
          </p>
          <p className={`text-sm ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
            Novos Clientes
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-700/30' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'} rounded-2xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <i className="ri-repeat-line text-2xl text-white"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.recurring}
          </p>
          <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
            Recorrentes
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-yellow-900/40 to-amber-800/40 border-yellow-700/30' : 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200'} rounded-2xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
              <i className="ri-vip-crown-line text-2xl text-white"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.vip}
          </p>
          <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
            Clientes VIP
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'} rounded-2xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <i className="ri-mail-line text-2xl text-white"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.newsletter}
          </p>
          <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
            Newsletter
          </p>
        </div>
      </div>

      {/* Pesquisa e Filtros */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🔍 Pesquisar Cliente
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome ou email..."
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              📊 Filtrar por Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
            >
              <option value="all">Todos os Clientes</option>
              <option value="new">Novos Clientes</option>
              <option value="recurring">Clientes Recorrentes</option>
              <option value="vip">Clientes VIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botões de Ação com Selecionados */}
      {selectedCustomers.size > 0 && (
        <div className={`${darkMode ? 'bg-pink-900/30 border-pink-700/50' : 'bg-pink-50 border-pink-200'} rounded-2xl p-4 mb-6 border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-multiple-line text-xl text-white"></i>
              </div>
              <div>
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {selectedCustomers.size} cliente(s) selecionado(s)
                </p>
                <p className={`text-xs ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                  Escolha uma ação para aplicar aos clientes selecionados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCustomers(new Set())}
                className={`px-4 py-2 rounded-lg border-2 ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                } transition-colors cursor-pointer whitespace-nowrap font-medium`}
              >
                <i className="ri-close-line mr-1"></i>
                Cancelar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-delete-bin-line mr-1"></i>
                Eliminar Selecionados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Clientes */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16">
            <i className={`ri-user-line text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum cliente encontrado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={selectAllCustomers}
                      className="w-5 h-5 text-pink-500 border-gray-300 rounded focus:ring-pink-400 cursor-pointer"
                    />
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Cliente
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Email
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Encomendas
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total Gasto
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Tipo
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Última Compra
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="w-5 h-5 text-pink-500 border-gray-300 rounded focus:ring-pink-400 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                          {customer.full_name?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {customer.full_name || 'N/A'}
                          </p>
                          {customer.isNewsletterSubscribed && (
                            <span className="text-xs text-purple-500">
                              <i className="ri-mail-check-line mr-1"></i>
                              Newsletter
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {customer.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-green-500">
                        €{customer.totalSpent.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getCustomerTypeBadge(customer.customerType)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {customer.lastPurchase 
                        ? new Date(customer.lastPurchase).toLocaleDateString('pt-PT')
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewCustomerDetails(customer)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Eliminação */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md w-full`}>
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-4xl text-white"></i>
            </div>
            <h2 className={`text-2xl font-bold text-center mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              ⚠️ Confirmar Eliminação
            </h2>
            <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Tem a certeza que deseja eliminar <strong className="text-red-500">{selectedCustomers.size} cliente(s)</strong>?
            </p>
            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-red-900/30 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                <strong>⚠️ Atenção:</strong> Esta ação é irreversível e irá eliminar:
              </p>
              <ul className={`text-sm mt-2 space-y-1 ml-4 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                <li>• Dados pessoais dos clientes</li>
                <li>• Histórico de encomendas</li>
                <li>• Endereços guardados</li>
                <li>• Produtos favoritos</li>
                <li>• Inscrições na newsletter</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } disabled:opacity-50`}
              >
                <i className="ri-close-line mr-2"></i>
                Cancelar
              </button>
              <button
                onClick={deleteSelectedCustomers}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    A Eliminar...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line mr-2"></i>
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes COMPLETO do Cliente */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-5xl w-full my-8`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedCustomer.full_name?.charAt(0).toUpperCase() || selectedCustomer.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {selectedCustomer.full_name || 'N/A'}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedCustomer.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Pessoais */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-user-line text-xl text-pink-500"></i>
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Nome Completo</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedCustomer.full_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Email</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Telefone</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedCustomer.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Data de Registo</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {new Date(selectedCustomer.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Estado da Conta</p>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      ✓ Ativa
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Tipo de Cliente</p>
                    {getCustomerTypeBadge(selectedCustomer.customerType)}
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-pink-900/30 border border-pink-700/30' : 'bg-pink-50 border border-pink-200'}`}>
                  <p className="text-3xl font-bold text-pink-500 mb-1">
                    {selectedCustomer.orders?.length || 0}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>Encomendas</p>
                </div>
                <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-green-900/30 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
                  <p className="text-3xl font-bold text-green-500 mb-1">
                    €{selectedCustomer.orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0).toFixed(2) || '0.00'}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Total Gasto</p>
                </div>
                <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-purple-900/30 border border-purple-700/30' : 'bg-purple-50 border border-purple-200'}`}>
                  <p className="text-3xl font-bold text-purple-500 mb-1">
                    {selectedCustomer.favorites?.length || 0}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Favoritos</p>
                </div>
                <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-blue-900/30 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className="text-3xl font-bold text-blue-500 mb-1">
                    €{selectedCustomer.orders?.length > 0 
                      ? (selectedCustomer.orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) / selectedCustomer.orders.length).toFixed(2)
                      : '0.00'
                    }
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Ticket Médio</p>
                </div>
              </div>

              {/* Histórico de Encomendas COMPLETO */}
              {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    <i className="ri-shopping-bag-line text-xl text-pink-500"></i>
                    Histórico de Encomendas ({selectedCustomer.orders.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((order: any) => (
                      <div key={order.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600 border border-gray-500' : 'bg-white border border-gray-200'}`}>
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleOrderExpanded(order.id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                              <i className="ri-file-list-3-line text-2xl text-pink-500"></i>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                  Encomenda #{order.id.substring(0, 8).toUpperCase()}
                                </p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {order.status === 'completed' ? '✓ Entregue' :
                                   order.status === 'shipped' ? '📦 Enviado' :
                                   order.status === 'processing' ? '⏳ Processamento' :
                                   order.status === 'cancelled' ? '✗ Cancelado' :
                                   '⏸ Pendente'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                  <i className="ri-calendar-line mr-1"></i>
                                  {new Date(order.created_at).toLocaleDateString('pt-PT')}
                                </span>
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                  <i className="ri-shopping-cart-line mr-1"></i>
                                  {order.order_items?.length || 0} produtos
                                </span>
                                {order.payment_method && (
                                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                    <i className="ri-bank-card-line mr-1"></i>
                                    {order.payment_method === 'card' ? 'Cartão' : order.payment_method}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-xl font-bold text-green-500">
                              €{order.total_amount?.toFixed(2)}
                            </p>
                            <i className={`ri-arrow-${expandedOrders.has(order.id) ? 'up' : 'down'}-s-line text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                          </div>
                        </div>

                        {/* Produtos da Encomenda (Expansível) */}
                        {expandedOrders.has(order.id) && order.order_items && order.order_items.length > 0 && (
                          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                            <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              Produtos Encomendados:
                            </p>
                            <div className="space-y-2">
                              {order.order_items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-3">
                                  {item.product_image && (
                                    <img
                                      src={item.product_image}
                                      alt={item.product_name}
                                      className="w-12 h-12 rounded object-cover"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {item.product_name}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Quantidade: {item.quantity} × €{item.price?.toFixed(2)}
                                    </p>
                                  </div>
                                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    €{(item.quantity * item.price).toFixed(2)}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Informações de Envio */}
                            {order.shipping_address && (
                              <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                                <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  📍 Enviado para:
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {order.shipping_address.name}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {order.shipping_address.street}, {order.shipping_address.city}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {order.shipping_address.postal_code}, {order.shipping_address.country}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Endereços */}
              {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    <i className="ri-map-pin-line text-xl text-pink-500"></i>
                    Endereços Guardados ({selectedCustomer.addresses.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCustomer.addresses.map((address: any) => (
                      <div key={address.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600 border border-gray-500' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {address.full_name}
                          </p>
                          {address.is_default && (
                            <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full font-medium">
                              Principal
                            </span>
                          )}
                        </div>
                        <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <p>{address.street}</p>
                          <p>{address.postal_code} {address.city}</p>
                          <p>{address.country}</p>
                          {address.phone && (
                            <p className="mt-2">
                              <i className="ri-phone-line mr-1"></i>
                              {address.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos Favoritos */}
              {selectedCustomer.favorites && selectedCustomer.favorites.length > 0 && (
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    <i className="ri-heart-line text-xl text-pink-500"></i>
                    Produtos Favoritos ({selectedCustomer.favorites.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedCustomer.favorites.map((fav: any) => (
                      <div key={fav.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600 border border-gray-500' : 'bg-white border border-gray-200'}`}>
                        {fav.products?.images?.[0] && (
                          <img
                            src={fav.products.images[0]}
                            alt={fav.products.name_pt}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                        )}
                        <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-800'} line-clamp-2`}>
                          {fav.products?.name_pt || 'Produto'}
                        </p>
                        <p className="text-xs text-pink-500 font-bold mt-1">
                          €{fav.products?.price?.toFixed(2)}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          {new Date(fav.created_at).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações de Marketing */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-mail-line text-xl text-pink-500"></i>
                  Comunicação & Marketing
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Newsletter
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Subscrição de email marketing
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedCustomer.newsletterInfo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedCustomer.newsletterInfo ? '✓ Inscrito' : '✗ Não Inscrito'}
                    </span>
                  </div>
                  {selectedCustomer.newsletterInfo && (
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Data de Inscrição: {new Date(selectedCustomer.newsletterInfo.created_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas Internas (Admin) */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                  <i className="ri-sticky-note-line text-xl text-yellow-500"></i>
                  📝 Notas Internas (Privadas)
                </h3>
                <p className={`text-xs mb-3 ${darkMode ? 'text-yellow-300/70' : 'text-yellow-700'}`}>
                  Estas notas são privadas e apenas visíveis para administradores. Use para registar preferências, problemas ou observações sobre o cliente.
                </p>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ex: Cliente VIP, Teve problema numa encomenda, Preferências específicas..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                  } focus:ring-2 focus:ring-yellow-400 focus:border-transparent`}
                />
                <button
                  onClick={saveCustomerNotes}
                  disabled={savingNotes}
                  className="mt-3 px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {savingNotes ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      A Guardar...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2"></i>
                      Guardar Notas
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-close-line mr-2"></i>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
