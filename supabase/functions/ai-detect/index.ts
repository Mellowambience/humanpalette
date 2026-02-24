import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const HIVE_API_KEY = Deno.env.get('HIVE_API_KEY');
const AI_OR_NOT_KEY = Deno.env.get('AI_OR_NOT_API_KEY');

async function scoreWithHive(imageUrl: string) {
  const form = new FormData();
  form.append('url', imageUrl);
  const res = await fetch('https://api.thehive.ai/api/v2/task/sync', { method: 'POST', headers: { Authorization: `Token ${HIVE_API_KEY}` }, body: form });
  if (!res.ok) throw new Error(`Hive API error: ${res.status}`);
  const data = await res.json();
  const classes: { class: string; score: number }[] = data?.status?.[0]?.response?.output?.[0]?.classes ?? [];
  const aiClass = classes.find((c) => c.class === 'ai_generated');
  const notAiClass = classes.find((c) => c.class === 'not_ai_generated');
  let score = 50;
  if (aiClass) score = Math.round(aiClass.score * 100);
  else if (notAiClass) score = Math.round((1 - notAiClass.score) * 100);
  return { score, raw: data };
}

async function scoreWithAiOrNot(imageUrl: string) {
  const res = await fetch('https://api.aiornot.com/v1/reports/image', { method: 'POST', headers: { Authorization: `Bearer ${AI_OR_NOT_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ object: imageUrl }) });
  if (!res.ok) throw new Error(`AI-or-Not API error: ${res.status}`);
  const data = await res.json();
  const aiConfidence: number = data?.report?.ai?.confidence ?? 0.5;
  const verdict: string = data?.report?.verdict ?? 'unknown';
  const score = verdict === 'human' ? Math.round((1 - aiConfidence) * 100 * 0.3) : Math.round(aiConfidence * 100);
  return { score, raw: data };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { artwork_id, image_url } = await req.json();
  if (!artwork_id || !image_url) return new Response(JSON.stringify({ error: 'artwork_id and image_url are required' }), { status: 400 });

  let result: { score: number; raw: unknown };
  let provider: string;
  try {
    if (HIVE_API_KEY) { result = await scoreWithHive(image_url); provider = 'hive'; }
    else if (AI_OR_NOT_KEY) { result = await scoreWithAiOrNot(image_url); provider = 'ai_or_not'; }
    else return new Response(JSON.stringify({ error: 'No AI detection API key configured.' }), { status: 503 });

    await supabase.from('artworks').update({ ai_score: result.score }).eq('id', artwork_id);
    return new Response(JSON.stringify({ ok: true, artwork_id, ai_score: result.score, provider, raw: result.raw }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
