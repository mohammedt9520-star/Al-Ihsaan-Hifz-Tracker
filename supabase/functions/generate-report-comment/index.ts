import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const SYSTEM_PROMPT = `You are a caring, experienced Quran teacher writing a brief monthly comment about a student's Hifz (memorisation) progress. Write in a warm, personal tone — like a teacher who knows the student well. Keep it to 2-3 sentences. Be specific about their performance where stats allow. Avoid: AI-sounding phrases, 'showcases', 'demonstrates', 'exemplary', generic praise, or anything that sounds like a template. Never mention behaviour unless it is particularly notable. Do not start with the student's name. Sound natural and human — this should read as something a real teacher typed.`;

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }
  if (!(await isAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { name, sides, lines, absences, days, dorDays, behaviour, avg, fromDate, toDate } = await req.json();

    const userPrompt = `Student: ${name}\nPeriod: ${fromDate} to ${toDate}\nSabaq sides completed: ${sides} full sides${lines ? ' + ' + lines + ' extra lines' : ''}\nAverage per day: ${avg} sides\nDays of sabaq: ${days}\nPara Dor mornings: ${dorDays}\nAbsences: ${absences}\nBehaviour rating: ${behaviour}/5\n\nWrite a brief teacher comment for this student's monthly report.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    const data = await response.json();
    const comment = data.content?.[0]?.text?.trim() ?? '';

    return new Response(JSON.stringify({ comment }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
});
