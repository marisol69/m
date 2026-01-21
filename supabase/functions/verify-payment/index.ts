import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 [VERIFY] Iniciando verificação de pagamento');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe não configurado');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase não configurado');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Sessão expirada');
    }

    console.log('✅ [VERIFY] Usuário autenticado:', user.id);

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('Session ID não fornecido');
    }

    console.log('🔍 [VERIFY] Verificando sessão:', sessionId);

    // Obter sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer', 'line_items'],
    });

    console.log('✅ [VERIFY] Sessão recuperada do Stripe');
    console.log('💳 [VERIFY] Status de pagamento:', session.payment_status);

    if (session.payment_status !== 'paid') {
      throw new Error('Pagamento não confirmado');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se já existe encomenda
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingOrder) {
      console.log('✅ [VERIFY] Encomenda já existe:', existingOrder.order_number);
      
      // Buscar items da encomenda
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', existingOrder.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          order: {
            ...existingOrder,
            items: orderItems || []
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('📦 [VERIFY] Criando nova encomenda...');

    // Obter dados da sessão guardada (CORRIGIDO: usando stripe_session_id)
    const { data: checkoutSession } = await supabaseAdmin
      .from('checkout_sessions')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (!checkoutSession) {
      console.error('❌ [VERIFY] Sessão não encontrada no banco');
      throw new Error('Sessão não encontrada');
    }

    console.log('✅ [VERIFY] Sessão encontrada no banco');

    // Gerar número de encomenda
    const orderNumber = `ARS${Date.now()}`;

    console.log('📝 [VERIFY] Número da encomenda:', orderNumber);

    // Criar encomenda
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: user.id,
        order_number: orderNumber,
        status: 'processing',
        total_amount: checkoutSession.amount,
        currency: 'eur',
        payment_method: 'card',
        payment_status: 'paid',
        stripe_session_id: sessionId,
        stripe_payment_intent_id: (session.payment_intent as any)?.id,
        shipping_address: checkoutSession.shipping_address,
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ [VERIFY] Erro ao criar encomenda:', orderError);
      throw orderError;
    }

    console.log('✅ [VERIFY] Encomenda criada:', order.id);

    // Criar items da encomenda
    const orderItems = checkoutSession.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id?.toString() || null,
      product_name: item.name,
      product_image: item.image,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      size: item.size,
      color: item.color,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ [VERIFY] Erro ao criar items:', itemsError);
    } else {
      console.log('✅ [VERIFY] Items criados:', orderItems.length);
    }

    // Guardar método de pagamento se solicitado
    const metadata = session.metadata || {};
    if (metadata.save_card_info === 'true' && session.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          (session.payment_intent as any).id
        );

        if (paymentIntent.payment_method) {
          const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentIntent.payment_method as string
          );

          if (paymentMethod.card) {
            // Verificar se já existe
            const { data: existingCard } = await supabaseAdmin
              .from('saved_payment_methods')
              .select('*')
              .eq('customer_id', user.id)
              .eq('last4', paymentMethod.card.last4)
              .eq('exp_month', paymentMethod.card.exp_month)
              .eq('exp_year', paymentMethod.card.exp_year)
              .single();

            if (!existingCard) {
              // Verificar se é o primeiro cartão
              const { data: existingCards } = await supabaseAdmin
                .from('saved_payment_methods')
                .select('id')
                .eq('customer_id', user.id);

              await supabaseAdmin.from('saved_payment_methods').insert({
                customer_id: user.id,
                stripe_payment_method_id: paymentMethod.id,
                card_brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                exp_month: paymentMethod.card.exp_month,
                exp_year: paymentMethod.card.exp_year,
                is_default: !existingCards || existingCards.length === 0,
              });

              console.log('✅ [VERIFY] Método de pagamento guardado');
            }
          }
        }
      } catch (e) {
        console.log('⚠️ [VERIFY] Erro ao guardar método de pagamento:', e.message);
      }
    }

    // Atualizar status da sessão
    await supabaseAdmin
      .from('checkout_sessions')
      .update({ 
        status: 'completed',
        payment_status: 'paid'
      })
      .eq('stripe_session_id', sessionId);

    console.log('✅ [VERIFY] Sessão atualizada');

    // Criar notificação para admin
    try {
      await supabaseAdmin.from('notifications').insert({
        type: 'new_order',
        title: 'Nova Encomenda',
        message: `Nova encomenda #${orderNumber} no valor de €${checkoutSession.amount.toFixed(2)}`,
        data: { order_id: order.id, order_number: orderNumber },
      });
      console.log('✅ [VERIFY] Notificação criada');
    } catch (e) {
      console.log('⚠️ [VERIFY] Erro ao criar notificação:', e.message);
    }

    // Retornar detalhes completos da encomenda
    const orderWithItems = {
      ...order,
      items: orderItems,
    };

    console.log('✅ [VERIFY] Verificação concluída com sucesso!');

    return new Response(
      JSON.stringify({ success: true, order: orderWithItems }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ [VERIFY] Erro:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});