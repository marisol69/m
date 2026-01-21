import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface DashboardOverviewProps {
  darkMode: boolean;
}

export default function DashboardOverview({ darkMode }: DashboardOverviewProps) {
  const [stats, setStats] = useState({
    totalSales: 0,
    todayOrders: 0,
    totalCustomers: 0,
    activeProducts: 0,
    outOfStock: 0,
    totalRevenue: 0,
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topFavorites, setTopFavorites] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, customersData, favoritesData] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('favorites').select('product_id'),
      ]);

      // Calcular estatísticas
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersData.data?.filter(o => o.created_at?.startsWith(today)).length || 0;
      const totalRevenue = ordersData.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const outOfStock = productsData.data?.filter(p => (p.stock || 0) === 0).length || 0;

      setStats({
        totalSales: ordersData.data?.length || 0,
        todayOrders,
        totalCustomers: customersData.data?.length || 0,
        activeProducts: productsData.data?.filter(p => p.is_active !== false).length || 0,
        outOfStock,
        totalRevenue,
      });

      // Top produtos mais vendidos
      const productSales = productsData.data?.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5) || [];
      setTopProducts(productSales);

      // Top produtos mais adicionados aos gostos
      const favoriteCounts: { [key: string]: number } = {};
      favoritesData.data?.forEach(fav => {
        favoriteCounts[fav.product_id] = (favoriteCounts[fav.product_id] || 0) + 1;
      });
      
      const topFavIds = Object.entries(favoriteCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);
      
      const topFavProducts = productsData.data?.filter(p => topFavIds.includes(p.id)) || [];
      setTopFavorites(topFavProducts);

      // Pedidos recentes
      const recent = ordersData.data?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5) || [];
      setRecentOrders(recent);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
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
          Visão Geral
        </h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Resumo rápido da sua loja Marisol
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="ri-shopping-bag-line text-2xl text-blue-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.totalSales}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total de Vendas</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i className="ri-calendar-check-line text-2xl text-green-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.todayOrders}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pedidos de Hoje</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="ri-user-line text-2xl text-orange-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.totalCustomers}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total de Clientes</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <i className="ri-shirt-line text-2xl text-pink-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.activeProducts}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Produtos Ativos</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <i className="ri-alert-line text-2xl text-red-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {stats.outOfStock}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Produtos Sem Stock</p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i className="ri-money-euro-circle-line text-2xl text-purple-600"></i>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            €{stats.totalRevenue.toFixed(2)}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Receita Total</p>
        </div>
      </div>

      {/* Gráficos e Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Produtos Mais Vendidos */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <i className="ri-fire-line text-red-500 mr-2"></i>
            Produtos Mais Vendidos
          </h2>
          {topProducts.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum produto vendido ainda
            </p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className={`flex items-center gap-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-blue-100 text-blue-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {product.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.sales_count || 0} vendas
                    </p>
                  </div>
                  <p className="font-bold text-pink-500">€{product.price?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos Mais Adicionados aos Gostos */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <i className="ri-heart-line text-pink-500 mr-2"></i>
            Produtos Mais Desejados
          </h2>
          {topFavorites.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum produto nos gostos ainda
            </p>
          ) : (
            <div className="space-y-4">
              {topFavorites.map((product, index) => (
                <div key={product.id} className={`flex items-center gap-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <i className="ri-heart-fill text-pink-500"></i>
                  </div>
                  <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {product.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.category}
                    </p>
                  </div>
                  <p className="font-bold text-pink-500">€{product.price?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pedidos Recentes */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <i className="ri-time-line text-blue-500 mr-2"></i>
          Pedidos Recentes
        </h2>
        {recentOrders.length === 0 ? (
          <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum pedido ainda
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Cliente
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Estado
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {recentOrders.map((order) => (
                  <tr key={order.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      #{order.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {order.customer_email}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      €{order.total_amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'completed' ? 'Concluído' :
                         order.status === 'processing' ? 'A processar' :
                         order.status === 'shipped' ? 'Enviado' : 'Pendente'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(order.created_at).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
