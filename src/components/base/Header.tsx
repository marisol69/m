import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SearchBar } from '../feature/SearchBar';
import { supabase } from '../../lib/supabase';

export const Header = () => {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { favorites } = useFavorites();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // 🔥 CONECTAR SITE_SETTINGS
  const [siteSettings, setSiteSettings] = useState({
    store_name: 'Marisol',
    store_phone: '+352 631 377 168',
    store_email: 'contact@marisol.com',
  });

  useEffect(() => {
    loadSiteSettings();
  }, []);

  const loadSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (data) {
        setSiteSettings({
          store_name: data.store_name || 'Marisol',
          store_phone: data.store_phone || '+352 631 377 168',
          store_email: data.store_email || 'contact@marisol.com',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setShowMobileMenu(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo - CONECTADO AO SITE_SETTINGS */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-xl shadow-lg group-hover:shadow-pink-500/50 transition-all duration-300 group-hover:scale-110">
              <span className="text-2xl font-bold text-white">{siteSettings.store_name.charAt(0)}</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent hidden sm:inline">{siteSettings.store_name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/products"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-pink-500 after:to-rose-500 hover:after:w-full after:transition-all after:duration-300"
            >
              Produtos
            </Link>
            <Link
              to="/about"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-pink-500 after:to-rose-500 hover:after:w-full after:transition-all after:duration-300"
            >
              Sobre Nós
            </Link>
            <Link
              to="/contact"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-pink-500 after:to-rose-500 hover:after:w-full after:transition-all after:duration-300"
            >
              Contacto
            </Link>
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearch}
              placeholder="Pesquisar produtos..."
              isScrolled={true}
            />
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 transition-all duration-300 cursor-pointer hover:scale-110 shadow-sm"
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              <i className={`${darkMode ? 'ri-sun-line' : 'ri-moon-line'} text-xl text-gray-700 dark:text-gray-200`}></i>
            </button>

            <Link to="/favorites" className="relative cursor-pointer p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-110 shadow-sm">
              <i className="ri-heart-line text-xl text-gray-700 dark:text-gray-200"></i>
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-lg animate-pulse">
                  {favorites.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative cursor-pointer p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-110 shadow-sm">
              <i className="ri-shopping-cart-line text-xl text-gray-700 dark:text-gray-200"></i>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-lg animate-pulse">
                  {items.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <i className="ri-arrow-down-s-line text-gray-700 dark:text-gray-200"></i>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-slide-up">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {user.full_name || 'Utilizador'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
                    >
                      <i className="ri-user-line text-lg"></i>
                      Minha Conta
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
                      >
                        <i className="ri-dashboard-line text-lg"></i>
                        Dashboard Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <i className="ri-logout-box-line text-lg"></i>
                      Terminar Sessão
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="cursor-pointer p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-110 shadow-sm">
                <i className="ri-user-line text-xl text-gray-700 dark:text-gray-200"></i>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-3 cursor-pointer rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-110 shadow-sm"
          >
            <i className={`${showMobileMenu ? 'ri-close-line' : 'ri-menu-line'} text-2xl text-gray-700 dark:text-gray-200`}></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-slate-700 pt-4 animate-slide-up">
            {/* Mobile Search */}
            <div className="mb-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                placeholder="Pesquisar produtos..."
                isScrolled={true}
              />
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2 mb-4">
              <Link
                to="/products"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-pink-600 rounded-xl transition-colors cursor-pointer"
              >
                Produtos
              </Link>
              <Link
                to="/about"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-pink-600 rounded-xl transition-colors cursor-pointer"
              >
                Sobre Nós
              </Link>
              <Link
                to="/contact"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-pink-600 rounded-xl transition-colors cursor-pointer"
              >
                Contacto
              </Link>
            </nav>

            {/* Mobile Icons */}
            <div className="flex items-center justify-around py-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={toggleDarkMode}
                className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-xl">
                  <i className={`${darkMode ? 'ri-sun-line' : 'ri-moon-line'} text-2xl text-gray-700 dark:text-gray-200`}></i>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{darkMode ? 'Claro' : 'Escuro'}</span>
              </button>

              <button
                onClick={() => {
                  navigate('/cart');
                  setShowMobileMenu(false);
                }}
                className="relative flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-xl">
                  <i className="ri-shopping-cart-line text-2xl text-gray-700 dark:text-gray-200"></i>
                </div>
                {items.length > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {items.length}
                  </span>
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">Carrinho</span>
              </button>

              <button
                onClick={() => {
                  navigate('/favorites');
                  setShowMobileMenu(false);
                }}
                className="relative flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-xl">
                  <i className="ri-heart-line text-2xl text-gray-700 dark:text-gray-200"></i>
                </div>
                {favorites.length > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {favorites.length}
                  </span>
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">Favoritos</span>
              </button>

              {user ? (
                <Link 
                  to="/account" 
                  onClick={() => setShowMobileMenu(false)} 
                  className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Conta</span>
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setShowMobileMenu(false)} 
                  className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-xl">
                    <i className="ri-user-line text-2xl text-gray-700 dark:text-gray-200"></i>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Entrar</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
