
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Termos & Condições
          </h1>
          <p className="text-sm text-gray-600 text-center mb-12">
            Última atualização: {new Date().toLocaleDateString('pt-PT')}
          </p>

          <div className="prose prose-pink max-w-none">
            <div className="bg-pink-50 rounded-lg p-6 mb-8">
              <p className="text-base text-gray-700 leading-relaxed">
                Bem-vinda à Marisol. Ao utilizar o nosso site e serviços, concorda com estes termos e condições. Por favor, leia-os atentamente.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Aceitação dos Termos
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Ao aceder e utilizar o site Marisol, concorda em cumprir estes termos e condições, todas as leis e regulamentos aplicáveis. Se não concordar com algum destes termos, não deve utilizar este site.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Uso do Site
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Ao utilizar o nosso site, compromete-se a:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Fornecer informações verdadeiras e precisas</li>
              <li>Manter a confidencialidade da sua conta</li>
              <li>Não utilizar o site para fins ilegais</li>
              <li>Não tentar aceder a áreas restritas do site</li>
              <li>Respeitar os direitos de propriedade intelectual</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Conta de Cliente
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Para fazer compras, é necessário criar uma conta. É responsável por:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Manter a segurança da sua password</li>
              <li>Todas as atividades realizadas na sua conta</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Produtos e Preços
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Esforçamo-nos para garantir que:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>As descrições dos produtos sejam precisas</li>
              <li>Os preços estejam corretos no momento da compra</li>
              <li>As imagens representem fielmente os produtos</li>
              <li>Reservamo-nos o direito de corrigir erros de preços</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Encomendas e Pagamentos
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Ao fazer uma encomenda:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Está a fazer uma oferta de compra</li>
              <li>Receberá confirmação por email</li>
              <li>O pagamento é processado de forma segura pelo Stripe</li>
              <li>Reservamo-nos o direito de recusar encomendas</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Envios e Entregas
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Os prazos de entrega são estimativas e podem variar. Não nos responsabilizamos por atrasos causados por transportadoras ou circunstâncias fora do nosso controlo.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Devoluções e Reembolsos
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Aceitamos devoluções dentro de 30 dias, conforme descrito na nossa política de devoluções. Os reembolsos serão processados para o método de pagamento original.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Propriedade Intelectual
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Todo o conteúdo do site (textos, imagens, logos, design) é propriedade da Marisol e está protegido por leis de direitos autorais. É proibida a reprodução sem autorização.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Limitação de Responsabilidade
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              A Marisol não se responsabiliza por:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Danos indiretos ou consequenciais</li>
              <li>Perda de dados ou lucros</li>
              <li>Interrupções no serviço</li>
              <li>Erros ou omissões no conteúdo</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Modificações dos Termos
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação no site.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Lei Aplicável
            </h2>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              Estes termos são regidos pelas leis do Luxemburgo. Qualquer disputa será resolvida nos tribunais competentes do Luxemburgo.
            </p>

            <div className="bg-pink-50 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contacte-nos
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-relaxed">
                Se tiver questões sobre estes termos e condições:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Email:</strong> legal@marisol.lu</p>
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
