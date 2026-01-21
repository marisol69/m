import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

export const Footer = () => {
  const { t } = useTranslation('common');
  
  // 🔥 CONECTAR SITE_SETTINGS AO FOOTER
  const [siteSettings, setSiteSettings] = useState({
    store_name: 'Marisol',
    store_phone: '+352 631 377 168',
    store_email: 'contact@marisol.com',
    store_address: 'Luxembourg',
    business_hours: 'Seg-Sex: 8:30-18:00',
    facebook_url: 'https://www.facebook.com/share/17rap6944w/?mibextid=wwXIfr',
    instagram_url: 'https://www.instagram.com/marisol.store.eu?igsh=MWU2dzM2a20yMmhzOA%3D%3D&utm_source=qr',
    store_whatsapp: '+352631377168',
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
          store_address: data.store_address || 'Luxembourg',
          business_hours: data.business_hours || 'Seg-Sex: 8:30-18:00',
          facebook_url: data.facebook_url || 'https://www.facebook.com/share/17rap6944w/?mibextid=wwXIfr',
          instagram_url: data.instagram_url || 'https://www.instagram.com/marisol.store.eu?igsh=MWU2dzM2a20yMmhzOA%3D%3D&utm_source=qr',
          store_whatsapp: data.store_whatsapp || '+352631377168',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do footer:', error);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-t border-pink-100/30 dark:border-slate-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo e Descrição - CONECTADO AO SITE_SETTINGS */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-xl shadow-lg group-hover:shadow-pink-500/50 transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-bold text-white">{siteSettings.store_name.charAt(0)}</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{siteSettings.store_name}</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Elegância atemporal para mulheres que valorizam qualidade e estilo. Descubra a nossa coleção exclusiva.
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href={siteSettings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer group"
              >
                <i className="ri-facebook-fill text-xl text-gray-600 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors"></i>
              </a>
              <a
                href={siteSettings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer group"
              >
                <i className="ri-instagram-line text-xl text-gray-600 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors"></i>
              </a>
              <a
                href="https://www.vinted.lu/member/61971821-marianapereira"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer group"
              >
                <i className="ri-shopping-bag-line text-xl text-gray-600 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors"></i>
              </a>
            </div>
          </div>

          {/* Menu Principal */}
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-600 rounded-full"></div>
              Menu
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Produtos
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contactos - CONECTADO AO SITE_SETTINGS */}
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-600 rounded-full"></div>
              Contacto
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-9 h-9 flex items-center justify-center bg-pink-100 dark:bg-slate-800 rounded-lg group-hover:bg-pink-200 dark:group-hover:bg-slate-700 transition-colors">
                  <i className="ri-mail-line text-pink-600 dark:text-pink-400"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Email</p>
                  <a href={`mailto:${siteSettings.store_email}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer font-medium">
                    {siteSettings.store_email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-9 h-9 flex items-center justify-center bg-pink-100 dark:bg-slate-800 rounded-lg group-hover:bg-pink-200 dark:group-hover:bg-slate-700 transition-colors">
                  <i className="ri-phone-line text-pink-600 dark:text-pink-400"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Telefone</p>
                  <a href={`tel:${siteSettings.store_phone.replace(/\s/g, '')}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer font-medium">
                    {siteSettings.store_phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-9 h-9 flex items-center justify-center bg-pink-100 dark:bg-slate-800 rounded-lg group-hover:bg-pink-200 dark:group-hover:bg-slate-700 transition-colors">
                  <i className="ri-time-line text-pink-600 dark:text-pink-400"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Horário</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{siteSettings.business_hours}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Informações Legais */}
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-600 rounded-full"></div>
              Informações
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Privacidade
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Termos e Condições
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Envios e Entregas
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-2 group">
                  <i className="ri-arrow-right-s-line text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Devoluções e Trocas
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Selos de Confiança */}
        <div className="border-t border-pink-100/50 dark:border-slate-700/50 pt-8">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-600 rounded-full"></div>
            Selos de Confiança
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <i className="ri-shield-check-line text-green-500 text-lg"></i>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <i className="ri-bank-card-line text-blue-500 text-lg"></i>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Stripe Payments</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <i className="ri-truck-line text-purple-500 text-lg"></i>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Envio Rápido</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <i className="ri-arrow-go-back-line text-orange-500 text-lg"></i>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Devoluções Fáceis</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} Marisol. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
