/**
 * Serverless API endpoint for Vercel / other Node server.
 * Expects environment variables:
 *   OPENAI_API_KEY - your API key
 *   OPENAI_ASSISTANT_ID - (optional) assistant id (e.g. asst_...)
 *
 * Note: set these in Vercel dashboard (Project Settings > Environment Variables).
 *
 * This handler will try to call the Assistants endpoint if OPENAI_ASSISTANT_ID is present.
 * Otherwise it falls back to the chat completions via the official OpenAI SDK approach.
 */

import fetch from 'node-fetch'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { message } = req.body || {}
  if (!message) return res.status(400).json({ error: 'Missing message' })

  const API_KEY = process.env.OPENAI_API_KEY
  const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID // use the assistant id the user provided
  if (!API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  try{
    if (ASSISTANT_ID) {
      // Using the Assistants API endpoint (best effort - ensure your environment supports it)
      const assistantUrl = `https://api.openai.com/v1/assistants/${ASSISTANT_ID}/message`
      const payload = {
        input: {
          role: "user",
          content: message
        }
      }
      const r = await fetch(assistantUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const j = await r.json()
      // The structure may differ depending on the API response shape; try to extract text:
      const reply = j?.output?.[0]?.content?.[0]?.text || j?.error?.message || JSON.stringify(j)
      return res.status(200).json({ reply })
    } else {
      // Fallback to Chat Completions (gpt-3.5-turbo / gpt-4o-mini)
      const url = 'https://api.openai.com/v1/chat/completions'
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é Lu, assistente virtual da Lazertur.' },
            { role: 'user', content: message }
          ],
          max_tokens: 500
        })
      })
      const j = await r.json()
      const reply = j?.choices?.[0]?.message?.content || j?.error?.message || JSON.stringify(j)
      return res.status(200).json({ reply })
    }
  }catch(err){
    console.error('API error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
