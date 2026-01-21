
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function ShippingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Envios & Entregas
          </h1>

          <div className="prose prose-pink max-w-none">
            <div className="bg-pink-50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Informação Geral de Envios
              </h2>
              <p className="text-base text-gray-700 leading-relaxed">
                Na Marisol, trabalhamos para garantir que os seus produtos cheguem de forma rápida e segura. Todos os envios são processados com o máximo cuidado e atenção aos detalhes.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Prazos de Entrega
            </h2>
            <div className="space-y-4 mb-8">
              <div className="border-l-4 border-pink-600 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Luxemburgo</h3>
                <p className="text-sm text-gray-700">2-3 dias úteis</p>
              </div>
              <div className="border-l-4 border-pink-400 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">União Europeia</h3>
                <p className="text-sm text-gray-700">5-7 dias úteis</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Custos de Envio
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-pink-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">
                      Destino
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">
                      Custo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">
                      Envio Grátis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Luxemburgo</td>
                    <td className="px-6 py-4 text-sm text-gray-700">€4.99</td>
                    <td className="px-6 py-4 text-sm text-pink-600 font-medium">
                      Compras acima de €50
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">União Europeia</td>
                    <td className="px-6 py-4 text-sm text-gray-700">€9.99</td>
                    <td className="px-6 py-4 text-sm text-pink-600 font-medium">
                      Compras acima de €100
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Rastreamento de Encomendas
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Assim que a sua encomenda for enviada, receberá um email de confirmação com:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Número de rastreamento</li>
              <li>Link para acompanhar a entrega</li>
              <li>Data estimada de chegada</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Processamento de Encomendas
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              As encomendas são processadas de segunda a sexta-feira, das 9h às 17h. Encomendas feitas após as 17h ou ao fim de semana serão processadas no próximo dia útil.
            </p>

            <div className="bg-pink-50 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Precisa de Ajuda?
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-relaxed">
                Se tiver alguma questão sobre o seu envio, não hesite em contactar-nos:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Telefone:</strong> +352 631 377 168</p>
                <p><strong>Email:</strong> contato@marisol.lu</p>
                <p><strong>Horário:</strong> 8:30 – 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
