import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function AboutPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <Header />

      <main className="flex-1 pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative py-32 px-6">
          <div className="absolute inset-0">
            <img
              src="https://readdy.ai/api/search-image?query=elegant%20minimalist%20luxury%20fashion%20accessories%20pink%20rose%20gold%20aesthetic%20clean%20white%20background%20designer%20handbag%20perfume%20bottle%20jewelry%20sophisticated%20feminine%20style%20premium%20quality%20products%20beautiful%20professional%20photography%20soft%20natural%20lighting%20delicate%20textures%20high-end%20fashion%20brand%20modern%20simple%20composition&width=1920&height=800&seq=about-hero-elegant-v3&orientation=landscape"
              alt="Sobre a Marisol"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              Sobre a Marisol
            </h1>
            <p className="text-xl md:text-2xl text-white drop-shadow-md max-w-3xl mx-auto leading-relaxed">
              Elegância, qualidade e estilo que definem a sua personalidade única
            </p>
          </div>
        </section>

        {/* Quem Somos */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-6">Quem Somos</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-rose-400 mx-auto rounded-full"></div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-12 shadow-lg">
              <div className="space-y-6 text-base text-gray-700 leading-relaxed">
                <p>
                  A Marisol nasceu da paixão pela moda feminina e pelo universo da beleza. Acreditamos que cada mulher é única e que a forma como se veste, cuida de si e se expressa tem um impacto direto na sua confiança e bem-estar.
                </p>
                <p>
                  A nossa loja é totalmente online, criada para oferecer uma experiência de compra moderna, prática e segura, acessível a mulheres em toda a Europa. Selecionamos cuidadosamente cada produto, combinando elegância, qualidade e conforto, sempre com atenção às necessidades reais do dia a dia feminino.
                </p>
                <p>
                  Na Marisol, mais do que vender produtos, queremos acompanhar cada mulher em diferentes momentos da sua vida, ajudando-a a sentir-se confiante, bonita e valorizada.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nossa Missão, Visão & Valores */}
        <section className="py-20 px-6 bg-gradient-to-br from-pink-50 to-rose-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-6">
                  <i className="ri-compass-3-line text-3xl text-pink-600"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossa Missão</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Valorizar a mulher através da moda e da beleza, oferecendo produtos que aumentem a autoestima, a confiança e o bem-estar.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-6">
                  <i className="ri-eye-line text-3xl text-pink-600"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossa Visão</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Tornar a Marisol uma marca de referência na Europa em moda feminina online, reconhecida pela elegância, qualidade e experiência do cliente.
                </p>
              </div>
            </div>

            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Nossos Valores</h3>
              <div className="w-24 h-1 bg-pink-400 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { icon: 'ri-sparkling-line', text: 'Elegância' },
                { icon: 'ri-shield-check-line', text: 'Confiança' },
                { icon: 'ri-star-line', text: 'Qualidade' },
                { icon: 'ri-heart-line', text: 'Respeito pela mulher' },
                { icon: 'ri-lock-line', text: 'Segurança e transparência' },
                { icon: 'ri-group-line', text: 'Inclusão e diversidade' },
              ].map((value, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className={`${value.icon} text-2xl text-pink-600`}></i>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{value.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* O Que Nos Diferencia */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">O Que Nos Diferencia</h2>
              <div className="w-24 h-1 bg-pink-400 mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Porquê escolher a Marisol?
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: 'ri-checkbox-circle-line',
                  title: 'Curadoria cuidadosa de produtos',
                  desc: 'Cada item é selecionado pensando em qualidade, estilo e funcionalidade',
                },
                {
                  icon: 'ri-shirt-line',
                  title: 'Coleções versáteis',
                  desc: 'Peças pensadas para o dia a dia e ocasiões especiais',
                },
                {
                  icon: 'ri-computer-line',
                  title: 'Loja 100% online',
                  desc: 'Moderna, fácil de usar e acessível de qualquer lugar',
                },
                {
                  icon: 'ri-shield-check-line',
                  title: 'Compra simples e segura',
                  desc: 'Processo de checkout rápido com pagamentos protegidos',
                },
                {
                  icon: 'ri-customer-service-2-line',
                  title: 'Atendimento dedicado',
                  desc: 'Suporte personalizado e atencioso para todas as suas dúvidas',
                },
                {
                  icon: 'ri-global-line',
                  title: 'Multilíngue',
                  desc: 'Plataforma preparada para clientes internacionais',
                },
              ].map((item, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                    <i className={`${item.icon} text-2xl text-pink-600`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* A Nossa Equipa */}
        <section className="py-20 px-6 bg-gradient-to-br from-pink-50 to-rose-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">A Nossa Equipa</h2>
              <div className="w-24 h-1 bg-pink-400 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-pink-200/50 dark:border-gray-700/50">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 dark:from-pink-500 dark:to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-white">M</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Mariana Pereira
                </h3>
                <p className="text-pink-600 dark:text-pink-400 font-semibold text-center mb-4">
                  CEO – Fundadora da Marisol
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 leading-relaxed">
                  Responsável pela visão da marca, seleção de produtos e estratégia da Marisol.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <i className="ri-mail-line text-pink-600 dark:text-pink-400"></i>
                  <a href="mailto:contacto@marisol.com" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer">
                    contacto@marisol.com
                  </a>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-pink-200/50 dark:border-gray-700/50">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-white">C</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Claudio Pereira
                </h3>
                <p className="text-pink-600 dark:text-pink-400 font-semibold text-center mb-4">
                  COO – Tecnologia & Sistemas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 leading-relaxed">
                  Responsável pela parte técnica, inovação digital e funcionamento da plataforma online.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <i className="ri-mail-line text-pink-600 dark:text-pink-400"></i>
                  <a href="mailto:jokadas69@gmail.com" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer">
                    jokadas69@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compromisso com as Clientes */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-hand-heart-line text-4xl text-pink-600"></i>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Compromisso com as Clientes
            </h2>
            <div className="w-24 h-1 bg-pink-400 mx-auto rounded-full mb-8"></div>
            <p className="text-base text-gray-700 leading-relaxed">
              Cada cliente da Marisol é tratada com atenção, respeito e cuidado. Trabalhamos diariamente para garantir uma experiência de compra segura, transparente e agradável, desde o primeiro clique até à entrega do produto. Estamos sempre disponíveis para ouvir, melhorar e evoluir, porque acreditamos que uma marca forte constrói-se com confiança e proximidade.
            </p>
          </div>
        </section>

        {/* Confiança & Segurança */}
        <section className="py-20 px-6 bg-gradient-to-br from-pink-50 to-rose-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Confiança & Segurança</h2>
              <div className="w-24 h-1 bg-pink-400 mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                A sua segurança e privacidade são uma prioridade para nós.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { icon: 'ri-secure-payment-line', text: 'Pagamentos seguros via Stripe' },
                { icon: 'ri-shield-check-line', text: 'Proteção de dados (GDPR)' },
                { icon: 'ri-lock-2-line', text: 'Certificado SSL' },
                { icon: 'ri-file-list-3-line', text: 'Políticas claras de envio e devolução' },
                { icon: 'ri-customer-service-line', text: 'Suporte ao cliente disponível' },
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className={`${item.icon} text-2xl text-pink-600`}></i>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Encerramento Elegante */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-pink-400 to-rose-400 rounded-3xl p-12 text-white">
              <i className="ri-heart-3-line text-5xl mb-6 inline-block"></i>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Marisol é mais do que uma loja online.
              </h2>
              <p className="text-xl md:text-2xl font-light mb-8">
                É um espaço criado para mulheres que valorizam elegância, autenticidade e bem-estar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/products"
                  className="inline-block px-8 py-4 bg-white text-pink-600 font-semibold rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Explorar Produtos
                </Link>
                <Link
                  to="/contact"
                  className="inline-block px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Falar Connosco
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Informações no Fundo */}
        <section className="py-16 px-6 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Estamos Aqui Para Si</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-8 shadow-lg">
                <i className="ri-time-line text-4xl text-pink-600 mb-4"></i>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Horário de Atendimento</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-lg text-gray-900 font-semibold mb-1">8:30 – 18:00</p>
                    <p className="text-sm text-gray-600">Segunda a Sexta-feira</p>
                    <p className="text-sm text-gray-600">Horário de Luxemburgo</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-pink-200">
                  <p className="text-sm text-gray-700">
                    <i className="ri-phone-line mr-1 text-pink-600"></i>
                    <a href="tel:+352631377168" className="hover:text-pink-600 transition-colors cursor-pointer font-medium">
                      +352 631 377 168
                    </a>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 shadow-lg">
                <i className="ri-customer-service-2-line text-4xl text-pink-600 mb-4"></i>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Precisa de Ajuda?</h4>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/contact"
                    className="inline-block px-6 py-2 bg-pink-400 text-white font-semibold rounded-full hover:bg-pink-500 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Contactar-nos
                  </Link>
                  <Link
                    to="/newsletter"
                    className="inline-block px-6 py-2 bg-white border-2 border-pink-400 text-pink-600 font-semibold rounded-full hover:bg-pink-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Subscrever Newsletter
                  </Link>
                </div>
                <div className="mt-4 pt-4 border-t border-pink-200 dark:border-gray-700 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <i className="ri-mail-line mr-1 text-pink-600 dark:text-pink-400"></i>
                    <a href="mailto:contacto@marisol.com" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer">
                      contacto@marisol.com
                    </a>
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <a href="https://www.facebook.com/share/17rap6944w/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors cursor-pointer">
                      <i className="ri-facebook-fill text-pink-600 dark:text-pink-400"></i>
                    </a>
                    <a href="https://www.instagram.com/marisol.store.eu?igsh=MWU2dzM2a20yMmhzOA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors cursor-pointer">
                      <i className="ri-instagram-line text-pink-600 dark:text-pink-400"></i>
                    </a>
                    <a href="https://www.vinted.lu/member/61971821-marianapereira" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors cursor-pointer">
                      <i className="ri-shopping-bag-line text-pink-600 dark:text-pink-400"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}