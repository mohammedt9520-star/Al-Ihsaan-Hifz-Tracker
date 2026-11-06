import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin-only guard: caller must present a signed-in admin JWT, not just the public anon key.
async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return false;
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '', authorization: auth },
  });
  if (!r.ok) return false;
  const u = await r.json();
  return u?.app_metadata?.role === 'admin';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (!(await isAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { students, month } = await req.json() as {
      students: Array<{ name: string; appUrl: string }>;
      month?: string;
    };

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
    const CHAT_ID   = Deno.env.get('TELEGRAM_CHAT_ID') ?? '';

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ error: 'Telegram credentials not configured.' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (!students?.length) {
      return new Response(JSON.stringify({ error: 'No students provided.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const text = [
      '\u{1F4CA} <b>Al-Ihsaan Hifz Reports</b>',
      month ? `\u{1F4C5} ${month}` : '',
      '',
      'Tap a name to view their report:',
    ].filter(l => l !== undefined).join('\n');

    // One button per student, each in its own row
    const inline_keyboard = students.map(s => ([
      { text: `\u{1F4C4} ${s.name}`, url: s.appUrl }
    ]));

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard },
        }),
      }
    );

    const result = await res.json();
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.description }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
