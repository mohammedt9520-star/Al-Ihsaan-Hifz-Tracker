import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (!(await isAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { to, subject, bodyText, bodyHtml, pdfBase64, filename, attachments } = body;

    const GMAIL_USER = Deno.env.get('GMAIL_USER');
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Email credentials not configured on server.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const toArray = Array.isArray(to) ? to : [to];
    if (toArray.length > 20) {
      return new Response(JSON.stringify({ error: 'Too many recipients' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build attachments — support single PDF or multiple
    let emailAttachments: Array<{ filename: string; content: string; encoding: string; contentType: string }> = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      emailAttachments = attachments.map((a: { filename: string; pdfBase64: string }) => ({
        filename: a.filename,
        content: a.pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf',
      }));
    } else if (pdfBase64 && filename) {
      emailAttachments = [{
        filename,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf',
      }];
    }

    const nodemailer = await import('npm:nodemailer@6.9.7');
    const transporter = nodemailer.default.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    const mailOptions: Record<string, unknown> = {
      from: `"Al-Ihsaan Hifz Tracker" <${GMAIL_USER}>`,
      to: toArray.join(', '),
      subject,
      text: bodyText,
    };
    if (bodyHtml) mailOptions.html = bodyHtml;
    if (emailAttachments.length) mailOptions.attachments = emailAttachments;

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Email error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
