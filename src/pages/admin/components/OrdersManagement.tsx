import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface OrdersManagementProps {
  darkMode: boolean;
}

export default function OrdersManagement({ darkMode }: OrdersManagementProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showCreateTestOrderModal, setShowCreateTestOrderModal] = useState(false);
  const [creatingTestOrders, setCreatingTestOrders] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            email,
            full_name,
            phone
          ),
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            product_image
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar encomendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrders = async () => {
    setCreatingTestOrders(true);
    try {
      // Verificar se já existe cliente de teste
      let testCustomerId;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', 'teste@marisol.lu')
        .maybeSingle();

      if (existingCustomer) {
        testCustomerId = existingCustomer.id;
      } else {
        // Criar cliente de teste
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: 'Cliente de Teste',
            email: 'teste@marisol.lu',
            full_name: 'Cliente de Teste',
            phone: '+352 691 123 456',
            role: 'customer'
          })
          .select()
          .single();

        if (customerError) throw customerError;
        testCustomerId = newCustomer.id;
      }

      // Buscar produtos reais da base de dados para usar nas encomendas de teste
      const { data: realProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, images')
        .eq('is_active', true)
        .limit(5);

      if (productsError) throw productsError;

      // Se não houver produtos suficientes, usar produtos fictícios (sem product_id)
      const testProducts = realProducts && realProducts.length >= 3 ? [
        {
          id: realProducts[0].id,
          name: realProducts[0].name,
          image: realProducts[0].images?.[0] || 'https://readdy.ai/api/search-image?query=elegant%20evening%20dress%20fashion%20product%20simple%20white%20background%20high%20quality%20ecommerce&width=400&height=400&seq=test1&orientation=squarish',
          price: realProducts[0].price || 45.00
        },
        {
          id: realProducts[1].id,
          name: realProducts[1].name,
          image: realProducts[1].images?.[0] || 'https://readdy.ai/api/search-image?query=luxury%20leather%20handbag%20fashion%20product%20simple%20white%20background%20high%20quality%20ecommerce&width=400&height=400&seq=test2&orientation=squarish',
          price: realProducts[1].price || 65.00
        },
        {
          id: realProducts[2].id,
          name: realProducts[2].name,
          image: realProducts[2].images?.[0] || 'https://readdy.ai/api/search-image?query=elegant%20high%20heels%20shoes%20fashion%20product%20simple%20white%20background%20high%20quality%20ecommerce&width=400&height=400&seq=test3&orientation=squarish',
          price: realProducts[2].price || 55.00
        }
      ] : [
        {
          id: null, // Usar null quando não há produto real
          name: 'Vestido Elegante de Teste',
          image: 'https://readdy.ai/api/search-image?query=elegant%20evening%20dress%20fashion%20product%20simple%20white%20background%20high%20quality%20ecommerce&width=400&height=400&seq=test1&orientation=squarish',
          price: 45.00
        },
        {
          id: null,
          name: 'Bolsa de Couro de Teste',
          image: 'https://readdy.ai/api/search-image?query=luxury%20leather%20handbag%20fashion%20product%20simple%20white%20background%20high%20quality%20ecommerce&width=400&height=400&seq=test2&orientation=squarish',
          price: 65.00
        },
        {
          id: null,
          name: 'Sapatos de Salto de Teste',
          image: 'https://readdy.ai/api/search-image?query=elegant%20high%20heels%20shoes%20fashion%20product%20simple%20white%20background%20high%20quality%20ecommerce&width=400&height=400&seq=test3&orientation=squarish',
          price: 55.00
        }
      ];

      const testOrdersData = [
        {
          status: 'pending',
          payment_status: 'pending',
          label: 'Encomenda Pendente (Aguarda Pagamento)',
          products: [testProducts[0], testProducts[1]],
          subtotal: (testProducts[0].price + testProducts[1].price),
          shipping_cost: 5.00
        },
        {
          status: 'processing',
          payment_status: 'paid',
          label: 'Encomenda Em Processo (Paga, A Preparar)',
          products: [testProducts[0], testProducts[2]],
          subtotal: (testProducts[0].price + testProducts[2].price),
          shipping_cost: 5.00
        },
        {
          status: 'shipped',
          payment_status: 'paid',
          label: 'Encomenda Enviada',
          products: [testProducts[1], testProducts[2]],
          subtotal: (testProducts[1].price + testProducts[2].price),
          shipping_cost: 5.00,
          tracking: {
            carrier: 'Post Luxembourg',
            number: 'LU123456789TEST',
            url: 'https://www.post.lu/en/track-trace'
          }
        },
        {
          status: 'completed',
          payment_status: 'paid',
          label: 'Encomenda Concluída',
          products: [testProducts[0], testProducts[1], testProducts[2]],
          subtotal: (testProducts[0].price + testProducts[1].price + testProducts[2].price),
          shipping_cost: 0.00
        },
        {
          status: 'cancelled',
          payment_status: 'refunded',
          label: 'Encomenda Cancelada',
          products: [testProducts[0]],
          subtotal: testProducts[0].price,
          shipping_cost: 5.00
        }
      ];

      const createdOrders = [];

      for (const testOrder of testOrdersData) {
        const totalAmount = testOrder.subtotal + testOrder.shipping_cost;
        const taxAmount = totalAmount * 0.17;

        // Gerar número de encomenda único (formato: ORD-TIMESTAMP-RANDOM)
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Criar encomenda
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_id: testCustomerId,
            subtotal: testOrder.subtotal,
            total: totalAmount,
            tax_amount: taxAmount,
            tax_rate: 0.17,
            shipping_cost: testOrder.shipping_cost,
            status: testOrder.status,
            payment_status: testOrder.payment_status,
            payment_method: 'card',
            shipping_method: testOrder.shipping_cost === 0 ? 'free' : 'standard',
            shipping_address: {
              name: 'Cliente de Teste',
              street: 'Rua de Teste, 123',
              city: 'Luxembourg',
              postal_code: 'L-1234',
              country: 'LU',
              phone: '+352 691 123 456'
            },
            notes: `ENCOMENDA DE TESTE - ${testOrder.label}${testOrder.tracking?.carrier ? ` - Transportadora: ${testOrder.tracking.carrier}` : ''}`,
            tracking_number: testOrder.tracking?.number || null,
            is_test: true
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Criar itens da encomenda (com product_id real ou null)
        const orderItems = testOrder.products.map((product: any) => ({
          order_id: order.id,
          product_id: product.id, // Agora usa o ID real do produto ou null
          product_name: product.name,
          product_image: product.image,
          quantity: 1,
          price: product.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        createdOrders.push(testOrder.label);
      }

      alert(`✅ ${createdOrders.length} encomendas de teste criadas com sucesso!\n\n${createdOrders.join('\n')}`);
      setShowCreateTestOrderModal(false);
      await loadOrders();
    } catch (error) {
      console.error('Erro ao criar encomendas de teste:', error);
      alert(`❌ Erro ao criar encomendas de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreatingTestOrders(false);
    }
  };

  const deleteTestOrders = async () => {
    if (!confirm('⚠️ Tem certeza que deseja eliminar TODAS as encomendas de teste?')) {
      return;
    }

    try {
      // Buscar encomendas de teste
      const { data: testOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('is_test', true);

      if (!testOrders || testOrders.length === 0) {
        alert('ℹ️ Nenhuma encomenda de teste encontrada.');
        return;
      }

      const orderIds = testOrders.map(o => o.id);

      // Eliminar order_items primeiro
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Eliminar encomendas
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      alert(`✅ ${testOrders.length} encomendas de teste eliminadas com sucesso!`);
      await loadOrders();
    } catch (error) {
      console.error('Erro ao eliminar encomendas de teste:', error);
      alert('❌ Erro ao eliminar encomendas de teste');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await loadOrders();
      alert('✅ Estado atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
      alert('❌ Erro ao atualizar estado da encomenda');
    }
  };

  const updateTrackingInfo = async () => {
    if (!selectedOrder) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          tracking_number: trackingNumber,
          notes: orderNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;
      
      setSelectedOrder({
        ...selectedOrder,
        tracking_number: trackingNumber,
        notes: orderNotes
      });
      
      await loadOrders();
      alert('✅ Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar rastreamento:', error);
      alert('❌ Erro ao atualizar informações');
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setTrackingUrl(order.tracking_url || '');
    setOrderNotes(order.notes || '');
    setShowDetailsModal(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = !filterStatus || order.status === filterStatus;
    const matchesSearch = !searchTerm || 
      order.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'refunded': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '✓ Concluída';
      case 'processing': return '⏳ Em Processo';
      case 'shipped': return '📦 Enviada';
      case 'cancelled': return '✗ Cancelada';
      case 'refunded': return '↩ Reembolsada';
      default: return '⏸ Pendente';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return '✓ Pago';
      case 'pending': return '⏳ Pendente';
      case 'refunded': return '↩ Reembolsado';
      case 'failed': return '✗ Falhado';
      default: return '⏸ Pendente';
    }
  };

  // Estatísticas
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    testOrders: orders.filter(o => o.is_test).length
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            📦 Gestão de Encomendas
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            {orders.length} encomendas no total
            {stats.testOrders > 0 && (
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {stats.testOrders} de teste
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateTestOrderModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line mr-1"></i>
            Criar Encomendas de Teste
          </button>
          {stats.testOrders > 0 && (
            <button
              onClick={deleteTestOrders}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-delete-bin-line mr-1"></i>
              Eliminar Encomendas de Teste
            </button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Pendentes', status: 'pending', count: stats.pending, color: 'yellow', icon: 'ri-time-line' },
          { label: 'Em Processo', status: 'processing', count: stats.processing, color: 'blue', icon: 'ri-loader-line' },
          { label: 'Enviadas', status: 'shipped', count: stats.shipped, color: 'purple', icon: 'ri-truck-line' },
          { label: 'Concluídas', status: 'completed', count: stats.completed, color: 'green', icon: 'ri-check-line' },
          { label: 'Canceladas', status: 'cancelled', count: stats.cancelled, color: 'red', icon: 'ri-close-line' },
        ].map((stat) => (
          <div key={stat.status} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 shadow-sm border`}>
            <div className="flex items-center justify-between mb-2">
              <i className={`${stat.icon} text-2xl text-${stat.color}-500`}></i>
              <span className={`text-2xl font-bold text-${stat.color}-500`}>{stat.count}</span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🔍 Pesquisar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Email, nome ou ID da encomenda..."
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              📊 Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-pink-400 focus:border-transparent cursor-pointer`}
            >
              <option value="">Todos os estados</option>
              <option value="pending">Pendente</option>
              <option value="processing">Em Processo</option>
              <option value="shipped">Enviada</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
              <option value="refunded">Reembolsada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Encomendas */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <i className={`ri-shopping-bag-line text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhuma encomenda encontrada
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    ID
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Cliente
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Produtos
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Estado
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Pagamento
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Data
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        {order.is_test && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                            TESTE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div>
                        <p className="font-medium">{order.customers?.full_name || 'N/A'}</p>
                        <p className="text-xs">{order.customers?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-2">
                        <i className="ri-shopping-cart-line text-pink-500"></i>
                        <span>{order.order_items?.length || 0} produtos</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      €{order.total?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(order.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
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

      {/* Modal Criar Encomendas de Teste */}
      {showCreateTestOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-2xl w-full`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              🧪 Criar Encomendas de Teste
            </h2>
            
            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'} mb-2`}>
                <i className="ri-information-line mr-2"></i>
                <strong>Objetivo:</strong> Validar que todos os estados funcionam corretamente
              </p>
              <p className={`text-xs ${darkMode ? 'text-blue-300/70' : 'text-blue-700'}`}>
                Serão criadas 5 encomendas de teste com diferentes estados para validação do sistema.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    1. Encomenda Pendente
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    ⏸ Aguarda Pagamento
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  2 produtos • €110.00 + €5.00 envio
                </p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    2. Encomenda Em Processo
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    ⏳ Paga, A Preparar
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  2 produtos • €100.00 + €5.00 envio
                </p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    3. Encomenda Enviada
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    📦 Com Rastreamento
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  2 produtos • €120.00 + €5.00 envio • Post Luxembourg
                </p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    4. Encomenda Concluída
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    ✓ Finalizada
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  3 produtos • €165.00 + envio grátis
                </p>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    5. Encomenda Cancelada
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    ✗ Reembolsada
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  1 produto • €45.00 + €5.00 envio
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateTestOrderModal(false)}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={createTestOrders}
                disabled={creatingTestOrders}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {creatingTestOrders ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    A Criar...
                  </>
                ) : (
                  <>
                    <i className="ri-checkbox-circle-line mr-2"></i>
                    Criar 5 Encomendas de Teste
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Encomenda */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Encomenda #{selectedOrder.id.substring(0, 8).toUpperCase()}
                  </h2>
                  {selectedOrder.is_test && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      🧪 ENCOMENDA DE TESTE
                    </span>
                  )}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedOrder.order_items?.length || 0} produtos • 
                  Criada em {new Date(selectedOrder.created_at).toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Informações do Cliente */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-user-line mr-2 text-pink-500"></i>
                  👤 Informações do Cliente
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nome Completo</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedOrder.customers?.full_name || selectedOrder.shipping_address?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedOrder.customers?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Telefone</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedOrder.customers?.phone || selectedOrder.shipping_address?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tipo de Cliente</p>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {selectedOrder.customers ? 'Cliente Registado' : 'Compra como Convidado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Endereço de Envio */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-map-pin-line mr-2 text-pink-500"></i>
                  🏠 Endereço de Envio
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Destinatário</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedOrder.shipping_address?.name || selectedOrder.customers?.full_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Rua e Número</p>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedOrder.shipping_address?.street || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Código Postal e Cidade</p>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedOrder.shipping_address?.postal_code} {selectedOrder.shipping_address?.city}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>País</p>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedOrder.shipping_address?.country || 'LU'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos da Encomenda */}
            <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <i className="ri-shopping-bag-line mr-2 text-pink-500"></i>
                📦 Produtos da Encomenda ({selectedOrder.order_items?.length || 0})
              </h3>
              
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item: any) => (
                    <div key={item.id} className={`p-4 rounded-lg flex items-center gap-4 ${darkMode ? 'bg-gray-600' : 'bg-white border border-gray-200'}`}>
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {item.product_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Quantidade: <strong>{item.quantity}</strong>
                          </span>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Preço unitário: <strong>€{item.price?.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-pink-500">
                          €{(item.quantity * item.price).toFixed(2)}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Subtotal
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Nenhum produto encontrado
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Estado e Método de Envio */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-truck-line mr-2 text-pink-500"></i>
                  🚚 Estado & Envio
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Estado Atual</p>
                    <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  
                  <div>
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Alterar Estado</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        updateOrderStatus(selectedOrder.id, e.target.value);
                        setSelectedOrder({ ...selectedOrder, status: e.target.value });
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'
                      } cursor-pointer focus:ring-2 focus:ring-pink-400`}
                    >
                      <option value="pending">⏸ Pendente</option>
                      <option value="processing">⏳ Em Processo</option>
                      <option value="shipped">📦 Enviada</option>
                      <option value="completed">✓ Concluída</option>
                      <option value="cancelled">✗ Cancelada</option>
                      <option value="refunded">↩ Reembolsada</option>
                    </select>
                  </div>

                  <div>
                    <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Método de Envio</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedOrder.shipping_method === 'free' ? '🎁 Envio Grátis' : 
                       selectedOrder.shipping_method === 'express' ? '⚡ Envio Expresso' : 
                       '📦 Envio Standard'}
                    </p>
                  </div>

                  {selectedOrder.updated_at && (
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Última Atualização</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(selectedOrder.updated_at).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="ri-money-euro-circle-line mr-2 text-pink-500"></i>
                  💰 Resumo Financeiro
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Método de Pagamento</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedOrder.payment_method === 'card' ? '💳 Cartão' : 
                       selectedOrder.payment_method === 'paypal' ? 'PayPal' : 
                       'Outro'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Estado do Pagamento</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {getPaymentStatusLabel(selectedOrder.payment_status)}
                    </span>
                  </div>
                  <div className={`pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex justify-between mb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        €{(selectedOrder.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                    {selectedOrder.tax_amount > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>IVA (17%)</span>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          €{selectedOrder.tax_amount?.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between mb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Envio</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {selectedOrder.shipping_cost === 0 ? 'Grátis' : `€${selectedOrder.shipping_cost?.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <div className={`flex justify-between pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <span className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Total Pago</span>
                    <span className="font-bold text-2xl text-green-500">
                      €{selectedOrder.total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rastreamento */}
            <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <i className="ri-map-pin-time-line mr-2 text-pink-500"></i>
                📍 Informações de Rastreamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Número de Rastreamento
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ex: LU123456789"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-pink-400`}
                  />
                </div>
              </div>

              <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  <i className="ri-information-line mr-2"></i>
                  Links de Rastreamento Úteis:
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.post.lu/en/track-trace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-external-link-line mr-1"></i>
                    Post Luxembourg
                  </a>
                  <a
                    href="https://www.dhl.com/lu-en/home/tracking.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-external-link-line mr-1"></i>
                    DHL
                  </a>
                  <a
                    href="https://www.ups.com/track"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-external-link-line mr-1"></i>
                    UPS
                  </a>
                  <a
                    href="https://www.fedex.com/en-lu/tracking.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-external-link-line mr-1"></i>
                    FedEx
                  </a>
                </div>
              </div>

              {selectedOrder.tracking_number && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                    <i className="ri-check-line mr-2"></i>
                    Informações de Rastreamento Atuais:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong>Número:</strong> {selectedOrder.tracking_number}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={updateTrackingInfo}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-save-line mr-2"></i>
                Guardar Informações de Rastreamento
              </button>
            </div>

            {/* Notas Internas */}
            <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h3 className={`font-semibold mb-4 flex items-center ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                <i className="ri-sticky-note-line mr-2 text-yellow-500"></i>
                📝 Notas Internas da Encomenda
              </h3>
              <p className={`text-xs mb-3 ${darkMode ? 'text-yellow-300/70' : 'text-yellow-700'}`}>
                Campo privado para notas administrativas sobre esta encomenda.
              </p>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
                placeholder="Ex: Cliente pediu entrega rápida, Houve atraso, Problema resolvido..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:ring-2 focus:ring-yellow-400`}
              />
              {selectedOrder.notes && (
                <div className="mt-3 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50">
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nota Atual:
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
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
