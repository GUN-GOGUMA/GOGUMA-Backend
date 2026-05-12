<div align="center">
  <img src="https://raw.githubusercontent.com/GUN-GOGUMA/.github/refs/heads/main/profile/GUNGOGUMA.png" width="100" height="100">
  <h1>GOGUMA Backend</h1>
</div>

Chatbot backend project for serving multiple channels through one server.

## Why this stack

This project uses `TypeScript + Fastify` because:

1. It works well for webhook and API based chatbot integrations.
2. It keeps the server structure simple while still scaling cleanly.
3. It connects neatly to Gemini through a dedicated service layer.

## Current structure

```text
src
|- app.ts
|- config.ts
|- server.ts
|- routes
|  |- chat.ts
|- services
|  |- botConfigService.ts
|  |- geminiService.ts
|  |- knowledgeRetrievalService.ts
|  |- promptSafetyService.ts
|- types
|  |- bot.ts
|  |- chat.ts
data
|- bots
   |- gsm-guide.json
examples
|- chat-demo.html
|- request-demo.js
```

## Environment variables

Copy `.env.example` to `.env` and fill in your key.

```env
PORT=3000
HOST=0.0.0.0
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-2.5-flash
DEFAULT_BOT_ID=gsm-guide
```

## Run

```bash
npm install
npm run dev
```

## API example

`POST /chat/respond`

```json
{
  "botId": "gsm-guide",
  "channelId": "room-1",
  "message": "Tell me some dorm life tips.",
  "metadata": {
    "locale": "en-US"
  }
}
```

`botId` is optional. If you omit it, the server uses `DEFAULT_BOT_ID`.

Example response:

```json
{
  "ok": true,
  "data": {
    "reply": "Dorm life goes more smoothly when you keep shared spaces clean and agree on basic room rules early.",
    "model": "gemini-2.5-flash",
    "sources": [
      {
        "id": "dorm-001",
        "title": "기숙사 생활 기본 팁"
      }
    ]
  }
}
```

## Examples

[chat-demo.html](C:/Users/master/Desktop/project/GOGUMA-Backend/examples/chat-demo.html)

- Browser demo page for testing the API manually.
- Lets you edit `serverUrl`, `botId`, `channelId`, `message`, and `metadata` in a form.

[request-demo.js](C:/Users/master/Desktop/project/GOGUMA-Backend/examples/request-demo.js)

- Minimal `fetch` example for calling `/chat/respond`.
- Useful as a starting point for frontend or server-to-server integration.

## Bot configuration

The client sends `channelId`, `message`, and `metadata`, and can optionally send `botId`.

If `botId` is omitted, the server loads the bot from `DEFAULT_BOT_ID`.
If `botId` is included, the server uses that bot configuration instead.
Personality and knowledge always stay on the server.

Example bot file:

[gsm-guide.json](C:/Users/master/Desktop/project/GOGUMA-Backend/data/bots/gsm-guide.json)

## Injection resistance

This structure is safer than passing prompt data from the client because:

1. `personality` and `knowledgeBase` are loaded server-side.
2. The user message is treated as untrusted input.
3. Only retrieved knowledge snippets are passed as allowed evidence.
4. The model is instructed to refuse answers outside the registered data.
5. Suspicious prompt-injection style patterns are stripped from user input and knowledge documents before prompting.
6. Replies must return structured citations that reference only retrieved source IDs.
7. If the model returns invalid structure or invalid citations, the server falls back to the bot fallback message.

## Why the new reply check is better

The previous fallback rule could reject valid short answers or strongly paraphrased answers because it depended on token overlap with the retrieved text.

The current rule is more tolerant because:

1. The model returns structured JSON instead of free-form text.
2. The model must cite source IDs from the retrieved knowledge.
3. The server validates the cited source IDs instead of relying on word overlap alone.

This keeps the safety boundary while allowing short, normal answers to pass when they are properly cited.

## Next recommended steps

1. Add channel-specific webhook adapters as separate routes.
2. Add authentication and signature verification where each channel needs it.
3. Move bot config and knowledge from JSON files into a database plus vector search.
