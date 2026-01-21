
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-600 text-center mb-12">
            Última atualização: {new Date().toLocaleDateString('pt-PT')}
          </p>

          <div className="prose prose-pink max-w-none">
            <div className="bg-pink-50 rounded-lg p-6 mb-8">
              <p className="text-base text-gray-700 leading-relaxed">
                Na Marisol, respeitamos a sua privacidade e estamos comprometidos em proteger os seus dados pessoais. Esta política explica como recolhemos, usamos e protegemos as suas informações.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Informações que Recolhemos
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Recolhemos as seguintes informações quando utiliza o nosso site:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Nome completo e informações de contacto (email, telefone)</li>
              <li>Endereço de entrega e faturação</li>
              <li>Informações de pagamento (processadas de forma segura pelo Stripe)</li>
              <li>Histórico de compras e preferências</li>
              <li>Dados de navegação e cookies</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Como Usamos as Suas Informações
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Utilizamos os seus dados para:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Processar e entregar as suas encomendas</li>
              <li>Comunicar sobre o estado das encomendas</li>
              <li>Melhorar a experiência de compra</li>
              <li>Enviar newsletters e promoções (apenas com o seu consentimento)</li>
              <li>Prevenir fraudes e garantir a segurança</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Proteção de Dados
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Implementamos medidas de segurança rigorosas para proteger os seus dados:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Encriptação SSL em todas as transações</li>
              <li>Armazenamento seguro através do Supabase</li>
              <li>Pagamentos processados de forma segura pelo Stripe</li>
              <li>Acesso restrito aos dados pessoais</li>
              <li>Backups regulares e seguros</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Partilha de Informações
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Não vendemos nem partilhamos os seus dados pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Processadores de pagamento (Stripe) para completar transações</li>
              <li>Serviços de entrega para enviar as suas encomendas</li>
              <li>Quando exigido por lei</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Os Seus Direitos
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              De acordo com o RGPD, tem direito a:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Aceder aos seus dados pessoais</li>
              <li>Corrigir informações incorretas</li>
              <li>Solicitar a eliminação dos seus dados</li>
              <li>Opor-se ao processamento dos seus dados</li>
              <li>Portabilidade dos dados</li>
              <li>Retirar o consentimento a qualquer momento</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Cookies
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Utilizamos cookies para melhorar a sua experiência no site. Os cookies ajudam-nos a:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Manter a sua sessão ativa</li>
              <li>Lembrar as suas preferências</li>
              <li>Analisar o tráfego do site</li>
              <li>Personalizar conteúdo</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Retenção de Dados
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Mantemos os seus dados pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, ou conforme exigido por lei.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Alterações a Esta Política
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas através do email ou no site.
            </p>

            <div className="bg-pink-50 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contacte-nos
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-relaxed">
                Se tiver questões sobre esta política de privacidade ou sobre como tratamos os seus dados:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Email:</strong> privacidade@marisol.lu</p>
                <p><strong>Telefone:</strong> +352 631 377 168</p>
                <p><strong>Endereço:</strong> Luxemburgo</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
