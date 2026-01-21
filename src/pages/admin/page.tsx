import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import OverviewDashboard from './components/OverviewDashboard';
import ProductsManagement from './components/ProductsManagement';
import CategoriesManagement from './components/CategoriesManagement';
import OrdersManagement from './components/OrdersManagement';
import CustomersManagement from './components/CustomersManagement';
import HomePageManagement from './components/HomePageManagement';
import LooksManagement from './components/LooksManagement';
import MarketingManagement from './components/MarketingManagement';
import MarketingAdvanced from './components/MarketingAdvanced';
import NewsletterManagement from './components/NewsletterManagement';
import NotificationsManagement from './components/NotificationsManagement';
import SiteConfigManagement from './components/SiteConfigManagement';
import TaxShippingManagement from './components/TaxShippingManagement';
import PopupsManagement from './components/PopupsManagement';
import BannersManagement from './components/BannersManagement';
import DiscountCodesManagement from './components/DiscountCodesManagement';
import WooCommerceManagement from './components/WooCommerceManagement';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Top Bar - Botões Voltar ao Site e Dark Mode */}
      <div className={`fixed top-0 right-0 left-0 h-16 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b z-40 flex items-center justify-end px-6 gap-3`}>
        <button
          onClick={() => navigate('/')}
          className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          <i className="ri-home-line text-lg"></i>
          Voltar ao Site
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            darkMode ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          <i className={`${darkMode ? 'ri-sun-line' : 'ri-moon-line'} text-lg`}></i>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${
            sidebarOpen ? 'w-72' : 'w-20'
          } ${
            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          } border-r transition-all duration-300 z-50 overflow-y-auto`}
        >
          {/* Logo */}
          <div className="h-20 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
            {sidebarOpen ? (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                MARISOL
              </h1>
            ) : (
              <i className="ri-store-2-line text-3xl text-pink-500"></i>
            )}
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', icon: 'ri-dashboard-line', label: 'Visão Geral' },
              { id: 'homepage', icon: 'ri-home-line', label: 'Página Inicial' },
              { id: 'products', icon: 'ri-shirt-line', label: 'Produtos' },
              { id: 'categories', icon: 'ri-folder-line', label: 'Categorias' },
              { id: 'orders', icon: 'ri-shopping-bag-line', label: 'Encomendas' },
              { id: 'customers', icon: 'ri-user-line', label: 'Clientes' },
              { id: 'marketing-advanced', icon: 'ri-megaphone-line', label: 'Marketing' },
              { id: 'tax-shipping', icon: 'ri-truck-line', label: 'IVA & Envio' },
              { id: 'woocommerce', icon: 'ri-shopping-cart-line', label: 'WooCommerce' },
              { id: 'newsletter', icon: 'ri-mail-line', label: 'Newsletter' },
              { id: 'notifications', icon: 'ri-notification-line', label: 'Notificações' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${item.icon} text-xl`}></i>
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}

            {/* Logout */}
            <button
              onClick={() => {
                localStorage.removeItem('user');
                navigate('/login');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <i className="ri-logout-box-line text-xl"></i>
              {sidebarOpen && <span className="font-medium">Sair</span>}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300 p-8`}
        >
          {activeTab === 'overview' && <OverviewDashboard darkMode={darkMode} />}
          {activeTab === 'homepage' && <HomePageManagement darkMode={darkMode} />}
          {activeTab === 'products' && <ProductsManagement darkMode={darkMode} />}
          {activeTab === 'categories' && <CategoriesManagement darkMode={darkMode} />}
          {activeTab === 'orders' && <OrdersManagement darkMode={darkMode} />}
          {activeTab === 'customers' && <CustomersManagement darkMode={darkMode} />}
          {activeTab === 'marketing-advanced' && <MarketingAdvanced darkMode={darkMode} />}
          {activeTab === 'tax-shipping' && <TaxShippingManagement darkMode={darkMode} />}
          {activeTab === 'woocommerce' && <WooCommerceManagement darkMode={darkMode} />}
          {activeTab === 'newsletter' && <NewsletterManagement darkMode={darkMode} />}
          {activeTab === 'notifications' && <NotificationsManagement darkMode={darkMode} />}
        </main>
      </div>
    </div>
  );
}
