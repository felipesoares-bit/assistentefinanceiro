// api/chat.js
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Habilita CORS básico (ajuste a origem conforme necessário)
const withCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  withCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY não configurada' });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Campo "message" é obrigatório' });
    }

    // --- Modo Assistants (se houver ID) ---
    if (ASSISTANT_ID) {
      // 1) cria thread
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const thread = await threadRes.json();

      // 2) adiciona mensagem do usuário
      await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'user', content: message })
      });

      // 3) cria run
      let run = await (await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assistant_id: ASSISTANT_ID })
      })).json();

      // 4) poll até completar (timeout simples)
      const started = Date.now();
      while (run.status !== 'completed') {
        if (['failed', 'cancelled', 'expired'].includes(run.status)) {
          return res.status(500).json({ error: `Run ${run.status}` });
        }
        if (Date.now() - started > 60_000) {
          return res.status(504).json({ error: 'Timeout ao aguardar resposta do Assistente' });
        }
        await new Promise(r => setTimeout(r, 1000));
        run = await (await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
        })).json();
      }

      // 5) pega última resposta
      const msgs = await (await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages?limit=1`, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
      })).json();

      const ai = msgs.data?.[0]?.content?.[0]?.text?.value || '(sem conteúdo)';
      return res.status(200).json({ reply: ai, threadId: thread.id });
    }

    // --- Fallback Chat Completions ---
    const completion = await (await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente útil.' },
          { role: 'user', content: message }
        ]
      })
    })).json();

    const ai = completion.choices?.[0]?.message?.content || '(sem conteúdo)';
    return res.status(200).json({ reply: ai });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro inesperado no servidor' });
  }
}
