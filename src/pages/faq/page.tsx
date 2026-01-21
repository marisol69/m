
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function FAQPage() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Como posso fazer uma encomenda?',
      answer: 'Para fazer uma encomenda, basta navegar pelos nossos produtos, adicionar os itens desejados ao carrinho e seguir o processo de checkout. É necessário ter uma conta para finalizar a compra.'
    },
    {
      question: 'Quais são os métodos de pagamento aceites?',
      answer: 'Aceitamos pagamentos via Stripe, incluindo cartões de crédito/débito (Visa, Mastercard), Google Pay, Apple Pay e PayPal.'
    },
    {
      question: 'Quanto tempo demora a entrega?',
      answer: 'As entregas no Luxemburgo são realizadas em 2-3 dias úteis. Receberá um email de confirmação com o número de rastreamento assim que a encomenda for enviada.'
    },
    {
      question: 'Posso devolver ou trocar um produto?',
      answer: 'Sim! Aceitamos devoluções e trocas até 30 dias após a compra, desde que o produto esteja em perfeitas condições e com a etiqueta original. Consulte a nossa política de trocas e devoluções para mais detalhes.'
    },
    {
      question: 'Como posso acompanhar a minha encomenda?',
      answer: 'Após o envio, receberá um email com o número de rastreamento. Pode também verificar o estado da sua encomenda na área "Histórico de Compras" da sua conta.'
    },
    {
      question: 'Os produtos têm garantia?',
      answer: 'Todos os nossos produtos têm garantia de qualidade. Em caso de defeito de fabrico, entre em contacto connosco dentro de 30 dias para resolvermos a situação.'
    },
    {
      question: 'Como posso alterar ou cancelar a minha encomenda?',
      answer: 'Se precisar alterar ou cancelar a encomenda, contacte-nos o mais rápido possível. Se a encomenda ainda não tiver sido enviada, faremos as alterações necessárias.'
    },
    {
      question: 'Posso guardar produtos nos favoritos?',
      answer: 'Sim! Basta clicar no ícone de coração nos produtos que gosta. Os seus favoritos ficam guardados na sua conta e pode acedê-los a qualquer momento.'
    },
    {
      question: 'Como funciona a newsletter?',
      answer: 'Ao subscrever a nossa newsletter, receberá 10% de desconto na primeira compra e ficará a par das novidades, promoções exclusivas e lançamentos. Pode cancelar a subscrição a qualquer momento.'
    },
    {
      question: 'Têm loja física?',
      answer: 'Atualmente operamos apenas online, o que nos permite oferecer os melhores preços e uma seleção mais ampla de produtos. Estamos disponíveis por telefone e email para qualquer questão.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Perguntas Frequentes
          </h1>
          <p className="text-base text-gray-600 text-center mb-12">
            Encontre respostas para as questões mais comuns sobre a Marisol
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-pink-50 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-gray-900 text-left text-base">
                    {faq.question}
                  </span>
                  <i
                    className={`ri-arrow-down-s-line text-xl text-pink-600 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  ></i>
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-pink-50 border-t border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-pink-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Ainda tem dúvidas?
            </h2>
            <p className="text-base text-gray-700 mb-6">
              A nossa equipa está pronta para ajudar!
            </p>
            <a
              href="/contact"
              className="inline-block bg-pink-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-pink-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Entre em Contacto
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
