import { useState } from 'react';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { supabase } from '../../lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const faqs = [
    {
      question: 'Como acompanho a minha encomenda?',
      answer: 'Após a confirmação do pagamento, receberá um email com o número de rastreamento. Pode também acompanhar o estado da sua encomenda na área "Minha Conta".',
    },
    {
      question: 'Quais são os métodos de pagamento?',
      answer: 'Aceitamos pagamentos seguros via Stripe, incluindo cartões de crédito/débito (Visa, Mastercard) e outros métodos como Google Pay e Apple Pay disponíveis na sua região.',
    },
    {
      question: 'Posso trocar ou devolver um produto?',
      answer: 'Sim! Tem 30 dias para devolver ou trocar produtos. Os artigos devem estar em perfeito estado, com etiquetas originais. Consulte a nossa política de devoluções para mais detalhes.',
    },
    {
      question: 'Em quanto tempo recebo a minha encomenda?',
      answer: 'O prazo de entrega varia entre 3 a 7 dias úteis para Portugal e 5 a 10 dias úteis para outros países da Europa, após a confirmação do pagamento.',
    },
    {
      question: 'Preciso de criar conta para comprar?',
      answer: 'Não é obrigatório, mas recomendamos criar uma conta para acompanhar as suas encomendas, guardar favoritos e ter uma experiência de compra mais rápida.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.message.length > 500) {
      alert('A mensagem não pode exceder 500 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Salvar no Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            status: 'new',
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
        alert('Erro ao enviar mensagem. Por favor, tente novamente.');
      } else {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail) {
      alert('Por favor, insira o seu email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      alert('Por favor, insira um email válido.');
      return;
    }

    setNewsletterSubmitting(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append('email', newsletterEmail);

      const response = await fetch('https://readdy.ai/api/form/d5fdohr10k7tbp4q4av1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      });

      if (response.ok) {
        setNewsletterSuccess(true);
        setNewsletterEmail('');
        setTimeout(() => setNewsletterSuccess(false), 5000);
      } else {
        alert('Erro ao subscrever. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao subscrever. Por favor, tente novamente.');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <Header />

      <main className="flex-1">
        {/* Banner */}
        <section className="relative h-[300px] sm:h-[400px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://readdy.ai/api/search-image?query=elegant%20feminine%20customer%20service%20desk%20with%20soft%20pink%20and%20gold%20tones%2C%20modern%20minimalist%20office%20interior%2C%20natural%20lighting%2C%20professional%20atmosphere%2C%20luxury%20boutique%20reception%20area%2C%20sophisticated%20workspace%20design&width=1920&height=400&seq=contact-banner-marisol&orientation=landscape"
              alt="Contacto Marisol"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
          </div>
          <div className="relative z-10 text-center text-white px-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">Contacto</h1>
            <p className="text-lg sm:text-xl md:text-2xl font-light">Estamos aqui para ajudar</p>
          </div>
        </section>

        {/* Introdução */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Tem alguma dúvida, sugestão ou precisa de ajuda?<br className="hidden sm:inline" />
              A equipa Marisol está disponível para apoiar em todas as etapas da sua experiência de compra.
            </p>
          </div>
        </section>

        {/* Informações de Contacto */}
        <section className="py-12 px-4 sm:px-6 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white text-center mb-8 sm:mb-12">Como Nos Contactar</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-gray-700 text-center hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-map-pin-line text-3xl text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Localização</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Luxemburgo
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-gray-700 text-center hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-mail-line text-3xl text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Email da Loja</h3>
                <a
                  href="mailto:contacto@marisol.com"
                  className="text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors cursor-pointer font-medium"
                >
                  contacto@marisol.com
                </a>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-pink-100 dark:border-gray-700 text-center hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-customer-service-line text-3xl text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Suporte Técnico</h3>
                <a
                  href="mailto:jokadas69@gmail.com"
                  className="text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors cursor-pointer font-medium"
                >
                  jokadas69@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Horário de Atendimento */}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-12 shadow-xl border border-pink-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-time-line text-4xl text-white"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Horário de Atendimento</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-rose-400 mx-auto rounded-full"></div>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-user-line text-3xl text-pink-600 dark:text-pink-400"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">👤 Suporte</h3>
                  <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p className="text-lg font-semibold">8:30 – 18:00</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Horário de Luxemburgo</p>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm">
                        <i className="ri-mail-line mr-2 text-pink-600 dark:text-pink-400"></i>
                        <a href="mailto:contacto@marisol.com" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer">
                          contacto@marisol.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de Contacto */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl p-6 sm:p-12 shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white text-center mb-4">Envie-nos uma Mensagem</h2>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-8 sm:mb-12">Responderemos o mais breve possível</p>

              {submitSuccess && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-8 flex items-center gap-3">
                  <i className="ri-checkbox-circle-line text-2xl text-green-600 dark:text-green-400"></i>
                  <p className="text-sm sm:text-base text-green-700 dark:text-green-400">
                    A sua mensagem foi enviada com sucesso. Responderemos o mais breve possível.
                  </p>
                </div>
              )}

              <form id="contact-form" data-readdy-form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="O seu nome"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="seuemail@exemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assunto *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="Encomendas">Encomendas</option>
                    <option value="Pagamentos">Pagamentos</option>
                    <option value="Envios & Entregas">Envios & Entregas</option>
                    <option value="Trocas & Devoluções">Trocas & Devoluções</option>
                    <option value="Produto">Produto</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensagem * <span className="text-xs text-gray-500 dark:text-gray-400">(máximo 500 caracteres)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    maxLength={500}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Escreva a sua mensagem aqui..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {formData.message.length}/500 caracteres
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-200 dark:hover:shadow-pink-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      A enviar...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line mr-2"></i>
                      Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-pink-100 via-rose-100 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-8 sm:p-12 flex flex-col justify-center text-white">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                    <i className="ri-mail-line text-3xl sm:text-4xl"></i>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                    Subscreva a Newsletter
                  </h2>
                  <p className="text-base sm:text-lg mb-6 text-white/90">
                    Ganhe 10% na sua primeira compra
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-3">
                      <i className="ri-check-line text-xl"></i>
                      <span>Acesso antecipado a novas coleções</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <i className="ri-check-line text-xl"></i>
                      <span>Promoções exclusivas</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <i className="ri-check-line text-xl"></i>
                      <span>Inspiração de looks e tendências</span>
                    </li>
                  </ul>
                </div>

                <div className="p-8 sm:p-12 flex flex-col justify-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">
                    Junte-se à Marisol
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
                    Receba novidades exclusivas diretamente no seu email.
                  </p>

                  {newsletterSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-6 flex items-center gap-3">
                      <i className="ri-checkbox-circle-line text-2xl text-green-600 dark:text-green-400"></i>
                      <p className="text-green-700 dark:text-green-400 text-sm">
                        Obrigada por se juntar à Marisol 💗
                      </p>
                    </div>
                  )}

                  <form id="newsletter-form" data-readdy-form onSubmit={handleNewsletterSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="newsletter-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="newsletter-email"
                        name="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="seuemail@exemplo.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={newsletterSubmitting}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-200 dark:hover:shadow-pink-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                    >
                      {newsletterSubmitting ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          A subscrever...
                        </>
                      ) : (
                        <>
                          <i className="ri-mail-send-line mr-2"></i>
                          Subscrever Newsletter
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">Perguntas Frequentes</h2>
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className={`ri-${showFAQ ? 'arrow-up' : 'arrow-down'}-s-line text-xl`}></i>
                {showFAQ ? 'Ocultar' : 'Ver'} Perguntas Frequentes
              </button>
            </div>

            {showFAQ && (
              <div className="space-y-4 animate-fadeIn">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group"
                  >
                    <summary className="px-4 sm:px-6 py-4 font-semibold text-gray-800 dark:text-white cursor-pointer hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between text-sm sm:text-base">
                      <span>{faq.question}</span>
                      <i className="ri-arrow-down-s-line text-xl text-pink-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-2"></i>
                    </summary>
                    <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600 text-sm sm:text-base">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Encerramento */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-heart-line text-4xl sm:text-5xl text-white"></i>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              A sua satisfação é importante para nós
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-95">
              Não hesite em contactar a Marisol sempre que precisar.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mb-8">
              <a
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-white text-pink-500 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:shadow-xl transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-shopping-bag-line text-xl"></i>
                Ver Produtos
              </a>
            </div>
            
            {/* Redes Sociais */}
            <div className="pt-8 border-t border-white/20">
              <p className="text-lg font-semibold mb-4">Siga-nos nas Redes Sociais</p>
              <div className="flex items-center justify-center gap-4">
                <a 
                  href="https://www.facebook.com/share/17rap6944w/?mibextid=wwXIfr" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 cursor-pointer"
                  title="Facebook"
                >
                  <i className="ri-facebook-fill text-2xl text-white"></i>
                </a>
                <a 
                  href="https://www.instagram.com/marisol.store.eu?igsh=MWU2dzM2a20yMmhzOA%3D%3D&utm_source=qr" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 cursor-pointer"
                  title="Instagram"
                >
                  <i className="ri-instagram-line text-2xl text-white"></i>
                </a>
                <a 
                  href="https://www.vinted.lu/member/61971821-marianapereira" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 cursor-pointer"
                  title="Vinted"
                >
                  <i className="ri-shopping-bag-line text-2xl text-white"></i>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
