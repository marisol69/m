import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { supabase } from '../../lib/supabase';

interface FormData {
  name: string;
  email: string;
  preferences: string[];
}

export default function Newsletter() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    preferences: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'duplicate'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Verificar se o email já existe
      const { data: existingSubscriber, error: checkError } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingSubscriber) {
        setSubmitStatus('duplicate');
        setErrorMessage('Este email já está inscrito no nosso newsletter! Continua a receber as nossas novidades e promoções exclusivas. 💙');
        setIsSubmitting(false);
        return;
      }

      // Inserir novo subscriber (removida coluna is_active)
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            preferences: formData.preferences,
            subscribed_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      // Verificar se já existe como customer
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingCustomer) {
        // Atualizar customer existente para marcar como inscrito no newsletter
        await supabase
          .from('customers')
          .update({
            is_newsletter_subscribed: true,
            newsletter_subscribed_at: new Date().toISOString()
          })
          .eq('email', formData.email);
      } else {
        // Criar novo customer
        await supabase
          .from('customers')
          .insert([
            {
              name: formData.name,
              email: formData.email,
              is_newsletter_subscribed: true,
              newsletter_subscribed_at: new Date().toISOString(),
              order_count: 0,
              total_spent: 0,
              created_at: new Date().toISOString()
            }
          ]);
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', preferences: [] });
    } catch (error: any) {
      console.error('Erro ao processar inscrição:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Ocorreu um erro ao processar a inscrição. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferenceToggle = (preference: string) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter((p) => p !== preference)
        : [...prev.preferences, preference],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl mb-8 shadow-2xl">
              <i className="ri-mail-send-line text-5xl text-white"></i>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-6">
              Newsletter Marisol
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              Receba novidades exclusivas da Marisol
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-4">
              Seja a primeira a descobrir novos produtos, promoções especiais e inspirações de moda
            </p>
          </div>

          {/* Newsletter Form */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12 lg:p-16">
              <form id="newsletter-form" data-readdy-form onSubmit={handleSubmit} className="space-y-8">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-5 py-4 text-base rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    placeholder="Digite o seu nome"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-5 py-4 text-base rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    placeholder="Digite o seu email"
                  />
                </div>

                {/* Preferences */}
                <div>
                  <label className="block text-base font-semibold text-gray-900 dark:text-white mb-4">
                    Preferências (Opcional)
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Escolha os temas que mais lhe interessam
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'newArrivals', label: 'Novidades', icon: 'ri-star-line' },
                      { id: 'promotions', label: 'Promoções', icon: 'ri-price-tag-3-line' },
                      { id: 'tips', label: 'Dicas de Moda', icon: 'ri-lightbulb-line' },
                      { id: 'events', label: 'Eventos', icon: 'ri-calendar-event-line' }
                    ].map((pref) => (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => handlePreferenceToggle(pref.id)}
                        className={`group p-5 rounded-2xl border-2 transition-all text-left ${
                          formData.preferences.includes(pref.id)
                            ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              formData.preferences.includes(pref.id)
                                ? 'border-pink-500 bg-pink-500 scale-110'
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-pink-400'
                            }`}
                          >
                            {formData.preferences.includes(pref.id) && (
                              <i className="ri-check-line text-white text-base font-bold"></i>
                            )}
                          </div>
                          <i className={`${pref.icon} text-2xl ${
                            formData.preferences.includes(pref.id)
                              ? 'text-pink-600 dark:text-pink-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}></i>
                          <span className={`font-semibold text-base ${
                            formData.preferences.includes(pref.id)
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {pref.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white text-lg font-bold rounded-2xl hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 focus:ring-4 focus:ring-pink-300 dark:focus:ring-pink-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-pink-500/50 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                      A processar...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <i className="ri-mail-send-line text-xl"></i>
                      Subscrever Newsletter
                    </span>
                  )}
                </button>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="success-message p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-3xl shadow-2xl">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl flex-shrink-0">
                        <i className="ri-checkbox-circle-line text-3xl text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-900 dark:text-green-200 mb-2">
                          Obrigada por se inscrever na Newsletter da Marisol 💕
                        </h3>
                        <p className="text-base text-green-800 dark:text-green-300 leading-relaxed">
                          Inscrição realizada com sucesso! Vai receber as nossas novidades, promoções exclusivas e inspirações de moda diretamente no seu email.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'duplicate' && (
                  <div className="duplicate-message p-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-3xl shadow-2xl">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl flex-shrink-0">
                        <i className="ri-information-line text-3xl text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-2">
                          Este email já está inscrito!
                        </h3>
                        <p className="text-base text-blue-800 dark:text-blue-300 leading-relaxed">
                          {errorMessage || 'Este email já está inscrito no nosso newsletter! Continua a receber as nossas novidades e promoções exclusivas. 💙'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-8 bg-gradient-to-br from-red-50 via-rose-50 to-red-100 dark:from-red-900/30 dark:via-rose-900/30 dark:to-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-3xl shadow-2xl">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-xl flex-shrink-0">
                        <i className="ri-error-warning-line text-3xl text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
                          Erro ao processar inscrição
                        </h3>
                        <p className="text-base text-red-800 dark:text-red-300 leading-relaxed">
                          {errorMessage || 'Ocorreu um erro ao processar a inscrição. Por favor, tente novamente.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl mb-4">
                <i className="ri-star-line text-3xl text-pink-600 dark:text-pink-400"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Novidades em Primeira Mão
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seja a primeira a conhecer as novas coleções e lançamentos
              </p>
            </div>

            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl mb-4">
                <i className="ri-price-tag-3-line text-3xl text-pink-600 dark:text-pink-400"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Promoções Exclusivas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Descontos e ofertas especiais apenas para subscritores
              </p>
            </div>

            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl mb-4">
                <i className="ri-lightbulb-line text-3xl text-pink-600 dark:text-pink-400"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Inspiração & Dicas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conselhos de moda e looks inspiradores todas as semanas
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
