# Lazertur Assistente - Lu
Projeto pronto para hospedar no Vercel. Contém frontend (Vite + React) e uma função serverless em `/api/chat.js`.

## O que configurar antes de rodar / deploy
- Crie um projeto no Vercel e defina as variáveis de ambiente:
  - `OPENAI_API_KEY` = sua chave da OpenAI
  - `OPENAI_ASSISTANT_ID` = asst_G76c1xTn7IYhFQZGCfSPgpzD (opcional - você informou esse ID)
- Para deploy no Vercel, suba o repositório e a função `/api/chat.js` será tratada como endpoint serverless.

## Como rodar localmente (frontend)
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Autor
Gerado pelo assistente ChatGPT — pronto para você subir no GitHub.
