import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../../components/base/Header';
import { Footer } from '../../../components/base/Footer';

export default function CheckoutErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorMessage = searchParams.get('message') || 'Ocorreu um erro ao processar o pagamento';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#121212' }}>
      <Header />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-12 shadow-xl text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#9FBAD0', borderWidth: '1px' }}>
            {/* Ícone de Erro */}
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <i className="ri-close-circle-line text-6xl text-white"></i>
            </div>

            {/* Título */}
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#F5F5F5' }}>
              ❌ Algo correu mal
            </h1>

            {/* Mensagem */}
            <p className="text-lg mb-8" style={{ color: '#B3B3B3' }}>
              {errorMessage}
            </p>

            {/* Possíveis Causas */}
            <div className="rounded-2xl p-6 mb-8 text-left" style={{ backgroundColor: '#121212', borderColor: '#9FBAD0', borderWidth: '1px' }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#F5F5F5' }}>
                <i className="ri-information-line" style={{ color: '#9FBAD0' }}></i>
                Possíveis causas:
              </h2>
              <ul className="space-y-2 text-sm" style={{ color: '#B3B3B3' }}>
                <li className="flex items-start gap-2">
                  <i className="ri-arrow-right-s-line mt-0.5" style={{ color: '#9FBAD0' }}></i>
                  <span>Cartão recusado ou sem saldo suficiente</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-arrow-right-s-line mt-0.5" style={{ color: '#9FBAD0' }}></i>
                  <span>Erro de conexão durante o processamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-arrow-right-s-line mt-0.5" style={{ color: '#9FBAD0' }}></i>
                  <span>Autenticação 3D Secure falhou</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-arrow-right-s-line mt-0.5" style={{ color: '#9FBAD0' }}></i>
                  <span>Dados do cartão incorretos</span>
                </li>
              </ul>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => navigate('/checkout')}
                className="px-8 py-4 rounded-xl font-semibold transition-all shadow-lg cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: '#9FBAD0', color: '#121212' }}
              >
                <i className="ri-refresh-line mr-2"></i>
                Tentar Novamente
              </button>
              
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: '#121212', color: '#9FBAD0', borderColor: '#9FBAD0', borderWidth: '2px' }}
              >
                <i className="ri-customer-service-line mr-2"></i>
                Contactar Suporte
              </button>
            </div>

            {/* Suporte ao Cliente */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#121212', borderColor: '#C6A75E', borderWidth: '1px' }}>
              <div className="flex items-start gap-3 justify-center">
                <i className="ri-customer-service-2-line text-3xl" style={{ color: '#9FBAD0' }}></i>
                <div className="text-left">
                  <p className="font-semibold text-lg mb-2" style={{ color: '#F5F5F5' }}>Precisa de Ajuda?</p>
                  <p className="text-sm mb-3" style={{ color: '#B3B3B3' }}>
                    <strong style={{ color: '#C6A75E' }}>Suporte IA 24/7</strong><br />
                    Humano: 8:30-18:00 (Luxemburgo)
                  </p>
                  <div className="space-y-2 text-sm">
                    <p style={{ color: '#9FBAD0' }}>
                      <i className="ri-phone-line mr-2"></i>
                      <a href="tel:+352631377168" className="hover:underline cursor-pointer">+352 631 377 168</a>
                    </p>
                    <p style={{ color: '#9FBAD0' }}>
                      <i className="ri-mail-line mr-2"></i>
                      <a href="mailto:contact@marisol.com" className="hover:underline cursor-pointer">contact@marisol.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Voltar ao Carrinho */}
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 mt-6 cursor-pointer"
              style={{ color: '#B3B3B3' }}
            >
              <i className="ri-arrow-left-line"></i>
              Voltar ao Carrinho
            </Link>
          </div>

          {/* Garantias de Segurança */}
          <div className="mt-8 rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#1A1A1A', borderColor: '#9FBAD0', borderWidth: '1px' }}>
            <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: '#F5F5F5' }}>
              A sua segurança é a nossa prioridade
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#121212' }}>
                  <i className="ri-shield-check-line text-2xl" style={{ color: '#C6A75E' }}></i>
                </div>
                <p className="text-sm font-medium" style={{ color: '#F5F5F5' }}>Pagamento Seguro</p>
                <p className="text-xs mt-1" style={{ color: '#B3B3B3' }}>Encriptação SSL</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#121212' }}>
                  <i className="ri-lock-line text-2xl" style={{ color: '#9FBAD0' }}></i>
                </div>
                <p className="text-sm font-medium" style={{ color: '#F5F5F5' }}>Dados Protegidos</p>
                <p className="text-xs mt-1" style={{ color: '#B3B3B3' }}>Tecnologia segura</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#121212' }}>
                  <i className="ri-customer-service-2-line text-2xl" style={{ color: '#9FBAD0' }}></i>
                </div>
                <p className="text-sm font-medium" style={{ color: '#F5F5F5' }}>Suporte 24/7</p>
                <p className="text-xs mt-1" style={{ color: '#B3B3B3' }}>Sempre disponível</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
