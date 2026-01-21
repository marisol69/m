import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../../../components/base/Header';
import { Footer } from '../../../components/base/Footer';
import { useCart } from '../../../contexts/CartContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (sessionId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ sessionId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOrderDetails(data.order);
        clearCart();
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121212' }}>
        <div className="text-center">
          <i className="ri-loader-4-line text-5xl animate-spin mb-4" style={{ color: '#9FBAD0' }}></i>
          <p style={{ color: '#B3B3B3' }}>A verificar pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#121212' }}>
      <Header />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl p-12 shadow-xl text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#C6A75E', borderWidth: '1px' }}>
            {/* Ícone de Sucesso */}
            <div className="w-24 h-24 bg-gradient-to-br from-[#C6A75E] to-[#B89A52] rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <i className="ri-check-line text-6xl text-white"></i>
            </div>

            {/* Título */}
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#C6A75E' }}>
              🎉 Compra Realizada com Sucesso!
            </h1>

            {/* Mensagem */}
            <p className="text-xl mb-2" style={{ color: '#F5F5F5' }}>
              Obrigada por comprar na Marisol 🤍
            </p>
            <p className="mb-8" style={{ color: '#B3B3B3' }}>
              A sua encomenda foi confirmada e será processada em breve.
            </p>

            {/* Detalhes da Encomenda */}
            {orderDetails && (
              <div className="rounded-2xl p-8 mb-8 text-left" style={{ backgroundColor: '#121212', borderColor: '#9FBAD0', borderWidth: '1px' }}>
                <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#F5F5F5' }}>
                  Informações da Encomenda
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3" style={{ borderBottomColor: '#9FBAD0', borderBottomWidth: '1px' }}>
                    <span className="font-medium" style={{ color: '#B3B3B3' }}>Número da Encomenda</span>
                    <span className="font-bold" style={{ color: '#F5F5F5' }}>#{orderDetails.order_number}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3" style={{ borderBottomColor: '#9FBAD0', borderBottomWidth: '1px' }}>
                    <span className="font-medium" style={{ color: '#B3B3B3' }}>Data</span>
                    <span className="font-semibold" style={{ color: '#F5F5F5' }}>
                      {new Date(orderDetails.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3" style={{ borderBottomColor: '#9FBAD0', borderBottomWidth: '1px' }}>
                    <span className="font-medium" style={{ color: '#B3B3B3' }}>Total Pago</span>
                    <span className="text-2xl font-bold" style={{ color: '#C6A75E' }}>
                      €{orderDetails.total_amount?.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3" style={{ borderBottomColor: '#9FBAD0', borderBottomWidth: '1px' }}>
                    <span className="font-medium" style={{ color: '#B3B3B3' }}>Método de Pagamento</span>
                    <span className="font-semibold flex items-center gap-2" style={{ color: '#F5F5F5' }}>
                      <i className="ri-bank-card-line" style={{ color: '#9FBAD0' }}></i>
                      {orderDetails.payment_method || 'Cartão'}
                    </span>
                  </div>

                  {orderDetails.shipping_address && (
                    <div className="pt-3">
                      <p className="font-medium mb-2" style={{ color: '#B3B3B3' }}>Endereço de Entrega</p>
                      <div className="rounded-lg p-4" style={{ backgroundColor: '#1A1A1A', borderColor: '#9FBAD0', borderWidth: '1px' }}>
                        <p className="font-semibold" style={{ color: '#F5F5F5' }}>{orderDetails.shipping_address.full_name}</p>
                        <p className="text-sm mt-1" style={{ color: '#B3B3B3' }}>{orderDetails.shipping_address.street}</p>
                        <p className="text-sm" style={{ color: '#B3B3B3' }}>
                          {orderDetails.shipping_address.postal_code} {orderDetails.shipping_address.city}
                        </p>
                        <p className="text-sm" style={{ color: '#B3B3B3' }}>{orderDetails.shipping_address.country}</p>
                        <p className="text-sm mt-2" style={{ color: '#B3B3B3' }}>
                          <i className="ri-phone-line mr-1"></i>
                          {orderDetails.shipping_address.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div className="pt-3">
                      <p className="font-medium mb-3" style={{ color: '#B3B3B3' }}>Produtos</p>
                      <div className="space-y-3">
                        {orderDetails.items.map((item: any, index: number) => (
                          <div key={index} className="flex gap-3 rounded-lg p-3" style={{ backgroundColor: '#1A1A1A', borderColor: '#9FBAD0', borderWidth: '1px' }}>
                            <img
                              src={item.image || item.product_image}
                              alt={item.name || item.product_name}
                              className="w-16 h-16 object-cover object-top rounded-lg"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
                                {item.name || item.product_name}
                              </p>
                              {(item.size || item.color) && (
                                <p className="text-xs mt-1" style={{ color: '#B3B3B3' }}>
                                  {item.size && `Tamanho: ${item.size}`}
                                  {item.size && item.color && ' • '}
                                  {item.color && `Cor: ${item.color}`}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs" style={{ color: '#B3B3B3' }}>Qtd: {item.quantity}</span>
                                <span className="text-sm font-bold" style={{ color: '#C6A75E' }}>
                                  €{((item.price || item.unit_price) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email de Confirmação */}
            <div className="rounded-xl p-4 mb-8" style={{ backgroundColor: '#121212', borderColor: '#9FBAD0', borderWidth: '1px' }}>
              <div className="flex items-center justify-center gap-3">
                <i className="ri-user-line text-2xl" style={{ color: '#9FBAD0' }}></i>
                <p className="text-sm" style={{ color: '#F5F5F5' }}>
                  <strong>Verifique o seu perfil!</strong><br />
                  <span style={{ color: '#B3B3B3' }}>Todos os detalhes da encomenda estão disponíveis na sua conta.</span>
                </p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {orderDetails && (
                <Link
                  to={`/account?tab=orders`}
                  className="px-8 py-4 rounded-xl font-semibold transition-all shadow-lg cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: '#9FBAD0', color: '#121212' }}
                >
                  <i className="ri-file-list-line mr-2"></i>
                  Ver Detalhes da Encomenda
                </Link>
              )}
              
              <Link
                to="/products"
                className="px-8 py-4 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: '#121212', color: '#9FBAD0', borderColor: '#9FBAD0', borderWidth: '2px' }}
              >
                <i className="ri-shopping-bag-line mr-2"></i>
                Continuar a Comprar
              </Link>
            </div>

            {/* Próximos Passos */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#121212', borderColor: '#C6A75E', borderWidth: '1px' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#F5F5F5' }}>
                O que acontece agora?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#9FBAD0' }}>
                    <span className="font-bold" style={{ color: '#121212' }}>1</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>Processamento</p>
                    <p className="text-xs mt-1" style={{ color: '#B3B3B3' }}>
                      A sua encomenda está a ser preparada
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#9FBAD0' }}>
                    <span className="font-bold" style={{ color: '#121212' }}>2</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>Envio</p>
                    <p className="text-xs mt-1" style={{ color: '#B3B3B3' }}>
                      Receberá o código de rastreio
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C6A75E' }}>
                    <span className="font-bold" style={{ color: '#121212' }}>3</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>Entrega</p>
                    <p className="text-xs mt-1" style={{ color: '#B3B3B3' }}>
                      Em 3-5 dias úteis
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Suporte */}
          <div className="mt-8 text-center">
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#121212', borderColor: '#C6A75E', borderWidth: '1px' }}>
              <div className="flex items-start gap-3 justify-center">
                <i className="ri-customer-service-2-line text-3xl" style={{ color: '#9FBAD0' }}></i>
                <div className="text-left">
                  <p className="font-semibold text-lg mb-2" style={{ color: '#F5F5F5' }}>Suporte ao Cliente</p>
                  <p className="text-sm mb-3" style={{ color: '#B3B3B3' }}>
                    <strong style={{ color: '#C6A75E' }}>IA disponível 24/7</strong><br />
                    Suporte Humano: 8:30-18:00 (Luxemburgo)
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
            <p className="mb-4" style={{ color: '#B3B3B3' }}>
              Precisa de ajuda com a sua encomenda?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 font-medium cursor-pointer"
                style={{ color: '#9FBAD0' }}
              >
                <i className="ri-customer-service-line"></i>
                Contactar Suporte
              </Link>
              <Link
                to="/support"
                className="inline-flex items-center justify-center gap-2 font-medium cursor-pointer"
                style={{ color: '#9FBAD0' }}
              >
                <i className="ri-question-line"></i>
                Centro de Ajuda
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
