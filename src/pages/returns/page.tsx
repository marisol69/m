
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function ReturnsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Trocas & Devoluções
          </h1>

          <div className="prose prose-pink max-w-none">
            <div className="bg-pink-50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                A Sua Satisfação é a Nossa Prioridade
              </h2>
              <p className="text-base text-gray-700 leading-relaxed">
                Na Marisol, queremos que fique completamente satisfeita com a sua compra. Se por algum motivo não estiver satisfeita, aceitamos devoluções e trocas dentro de 30 dias.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Política de Devolução
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <i className="ri-check-line text-xl text-pink-600 mr-3 mt-1 flex-shrink-0"></i>
                <p className="text-base text-gray-700">
                  <strong>30 dias</strong> para devolver ou trocar produtos
                </p>
              </div>
              <div className="flex items-start">
                <i className="ri-check-line text-xl text-pink-600 mr-3 mt-1 flex-shrink-0"></i>
                <p className="text-base text-gray-700">
                  Produtos devem estar em <strong>perfeitas condições</strong>, sem uso
                </p>
              </div>
              <div className="flex items-start">
                <i className="ri-check-line text-xl text-pink-600 mr-3 mt-1 flex-shrink-0"></i>
                <p className="text-base text-gray-700">
                  <strong>Etiquetas originais</strong> devem estar intactas
                </p>
              </div>
              <div className="flex items-start">
                <i className="ri-check-line text-xl text-pink-600 mr-3 mt-1 flex-shrink-0"></i>
                <p className="text-base text-gray-700">
                  Embalagem original preservada sempre que possível
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Como Fazer uma Devolução
            </h2>
            <div className="space-y-6 mb-8">
              <div className="flex">
                <div className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Entre em Contacto</h3>
                  <p className="text-sm text-gray-700">
                    Contacte-nos por email ou telefone para iniciar o processo de devolução. Forneça o número da encomenda e o motivo da devolução.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Prepare o Produto</h3>
                  <p className="text-sm text-gray-700">
                    Embale o produto cuidadosamente na embalagem original, incluindo todas as etiquetas e acessórios.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Envie o Produto</h3>
                  <p className="text-sm text-gray-700">
                    Envie o produto para o endereço que forneceremos. Recomendamos usar um serviço de envio com rastreamento.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Reembolso ou Troca</h3>
                  <p className="text-sm text-gray-700">
                    Após recebermos e inspecionarmos o produto, processaremos o reembolso ou troca em até 5 dias úteis.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Produtos Não Elegíveis para Devolução
            </h2>
            <ul className="list-disc list-inside space-y-2 mb-8 text-sm text-gray-700">
              <li>Produtos de higiene pessoal (perfumes, maquilhagem) abertos ou usados</li>
              <li>Produtos em promoção final (quando especificado)</li>
              <li>Produtos personalizados ou feitos por encomenda</li>
              <li>Produtos danificados por uso inadequado</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Custos de Devolução
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Produto com defeito</span>
                  <span className="text-sm font-bold text-pink-600">Grátis</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Erro no envio</span>
                  <span className="text-sm font-bold text-pink-600">Grátis</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Mudança de ideias</span>
                  <span className="text-sm text-gray-700">Cliente paga o envio</span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Trocas
            </h2>
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Se desejar trocar um produto por outro tamanho ou cor, o processo é o mesmo da devolução. Assim que recebermos o produto original, enviaremos o novo item sem custos adicionais de envio.
            </p>

            <div className="bg-pink-50 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Precisa de Ajuda?
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-relaxed">
                A nossa equipa está disponível para ajudar com qualquer questão sobre devoluções ou trocas:
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
