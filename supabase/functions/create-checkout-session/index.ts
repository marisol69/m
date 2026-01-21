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
    console.log('🚀 [CHECKOUT] Iniciando criação de sessão');
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      throw new Error('Configuração de pagamento inválida');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis Supabase não configuradas');
      throw new Error('Configuração do servidor inválida');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    let userId = null;
    let userEmail = null;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
          userEmail = user.email;
          console.log('✅ Utilizador autenticado:', userEmail);
        }
      } catch (e) {
        console.log('⚠️ Sem autenticação - checkout como convidado');
      }
    }

    const requestBody = await req.json();
    const { items, shippingAddress, saveCardInfo, successUrl, cancelUrl } = requestBody;

    console.log('📦 Dados recebidos:', {
      items: items?.length,
      email: shippingAddress?.email,
      userId: userId || 'guest',
      successUrl,
      cancelUrl
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Carrinho vazio');
    }

    if (!shippingAddress?.email || !shippingAddress?.full_name) {
      throw new Error('Dados de envio incompletos');
    }

    if (!successUrl || !cancelUrl) {
      throw new Error('URLs de redirecionamento não fornecidos');
    }

    let subtotal = 0;
    const lineItems = [];

    for (const item of items) {
      if (!item.name || !item.price || !item.quantity) {
        throw new Error('Produto inválido no carrinho');
      }

      subtotal += item.price * item.quantity;
      
      const description = [];
      if (item.size) description.push(`Tamanho: ${item.size}`);
      if (item.color) description.push(`Cor: ${item.color}`);
      
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            description: description.join(' • ') || undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      });
    }

    console.log('💰 Subtotal calculado:', subtotal);

    const shippingSettings = { free_shipping_threshold: 50, shipping_cost: 4.99 };

    const shippingCost = subtotal >= shippingSettings.free_shipping_threshold ? 0 : shippingSettings.shipping_cost;
    
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Envio' },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const total = subtotal + shippingCost;

    console.log('💳 Total a pagar:', total);

    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail || shippingAddress.email,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['PT', 'ES', 'FR', 'DE', 'IT', 'BE', 'NL', 'LU', 'AT', 'CH', 'GB', 'IE'],
      },
      metadata: {
        user_id: userId || 'guest',
        user_email: userEmail || shippingAddress.email,
        shipping_full_name: shippingAddress.full_name,
        shipping_email: shippingAddress.email,
        shipping_phone: shippingAddress.phone || '',
        shipping_street: shippingAddress.street || '',
        shipping_city: shippingAddress.city || '',
        shipping_postal_code: shippingAddress.postal_code || '',
        shipping_country: shippingAddress.country || '',
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        total: total.toFixed(2),
      },
      locale: 'pt',
    };

    if (saveCardInfo && userId) {
      sessionConfig.payment_intent_data = {
        setup_future_usage: 'off_session',
        metadata: {
          user_id: userId,
          order_type: 'ecommerce',
        },
      };
    }

    console.log('🔄 Criando sessão Stripe...');
    console.log('🔗 Success URL:', successUrl);
    console.log('❌ Cancel URL:', cancelUrl);
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('✅ Sessão criada com sucesso!');
    console.log('🆔 Session ID:', session.id);
    console.log('🔗 Checkout URL:', session.url);
    
    if (!session || !session.id || !session.url) {
      console.error('❌ Sessão inválida retornada pelo Stripe');
      throw new Error('Erro ao criar sessão de pagamento');
    }

    if (userId) {
      try {
        const { data: existingCustomer } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!existingCustomer) {
          await supabaseAdmin.from('customers').insert({
            id: userId,
            email: userEmail || shippingAddress.email,
            full_name: shippingAddress.full_name,
            phone: shippingAddress.phone,
            role: 'customer',
          });
          console.log('✅ Cliente criado na BD');
        }
      } catch (e) {
        console.log('⚠️ Erro ao criar cliente:', e);
      }
    }

    try {
      await supabaseAdmin.from('checkout_sessions').insert({
        stripe_session_id: session.id,
        customer_id: userId,
        amount: total,
        currency: 'eur',
        status: 'pending',
        payment_status: 'pending',
        items: items,
        shipping_address: shippingAddress,
      });
      console.log('✅ Sessão guardada na BD');
    } catch (e) {
      console.log('⚠️ Erro ao guardar sessão:', e);
    }

    console.log('🎉 Checkout criado com sucesso!');
    console.log('🚀 Cliente será redirecionado para:', session.url);

    const responseData = {
      success: true,
      sessionId: session.id,
      url: session.url,
      amount: total,
      currency: 'eur',
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO:', error.message);
    console.error('❌ Stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Erro ao processar pagamento',
      details: error.name || 'Unknown error',
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});