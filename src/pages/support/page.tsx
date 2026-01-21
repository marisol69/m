import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SupportPage() {
  const { t } = useTranslation('common');

  const supportSections = [
    {
      icon: 'ri-truck-line',
      title: 'Envios e Entregas',
      description: 'Informações sobre prazos, custos e métodos de envio.',
      link: '/shipping',
      color: 'from-pink-400 to-rose-400'
    },
    {
      icon: 'ri-arrow-left-right-line',
      title: 'Trocas e Devoluções',
      description: 'Política de trocas e devoluções de produtos.',
      link: '/returns',
      color: 'from-rose-400 to-pink-500'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Política de Privacidade',
      description: 'Como protegemos os seus dados pessoais.',
      link: '/privacy',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: 'ri-file-text-line',
      title: 'Termos e Condições',
      description: 'Termos de uso e condições de compra.',
      link: '/terms',
      color: 'from-rose-500 to-pink-400'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-customer-service-2-line text-4xl text-white"></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Apoio ao Cliente
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Estamos aqui para ajudar. Encontre todas as informações importantes sobre a sua experiência de compra na Marisol.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportSections.map((section, index) => (
              <Link
                key={index}
                to={section.link}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                  <div className={`bg-gradient-to-br ${section.color} p-8 text-white`}>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                      <i className={`${section.icon} text-3xl`}></i>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{section.title}</h3>
                  </div>
                  <div className="p-8">
                    <p className="text-gray-600 mb-4">{section.description}</p>
                    <div className="flex items-center gap-2 text-pink-400 font-medium group-hover:gap-4 transition-all">
                      <span>Saber mais</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Ainda tem dúvidas?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            A nossa equipa está disponível para ajudar com qualquer questão.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-pink-400 text-white rounded-full hover:bg-pink-500 transition-colors text-base font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-mail-line text-xl"></i>
              Contactar-nos
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-pink-400 border-2 border-pink-400 rounded-full hover:bg-pink-50 transition-colors text-base font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-question-line text-xl"></i>
              Ver FAQ
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
