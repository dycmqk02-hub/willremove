import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { paymentKey, orderId, amount } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('amount, status')
      .eq('toss_order_id', orderId)
      .single();

    if (orderError || !order) {
      return json({ error: '주문을 찾을 수 없습니다.' }, 404);
    }
    if (order.amount !== amount) {
      return json({ error: '결제 금액이 일치하지 않습니다.' }, 400);
    }
    if (order.status === 'paid') {
      return json({ success: true });
    }

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(Deno.env.get('TOSS_SECRET_KEY')! + ':'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      return json({ error: err.message || 'Toss 결제 확인 실패' }, 400);
    }

    await supabase
      .from('orders')
      .update({ status: 'paid', toss_payment_key: paymentKey })
      .eq('toss_order_id', orderId);

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
