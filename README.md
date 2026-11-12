
# DevMemory AI

### Teach once. Remember forever. Build smarter together.

DevMemory AI is a shared persistent memory platform for AI-powered coding agents. It helps multiple agents retrieve and reuse project knowledge, coding decisions, debugging context, and previous solutions instead of starting from scratch every time.

Built with Next.js, TypeScript, Google Gemini, and the Meko MCP context engine.

---

## Features

- Shared AI Memory: Save and retrieve persistent project knowledge using Meko.
- Coding Agent: Answers development questions using relevant shared project context.
- Bug Fix Agent: Investigates bugs, identifies possible root causes, and recommends fixes.
- Code Review Agent: Reviews code for bugs, security issues, performance, and maintainability.
- Agent Attribution: Store memories with agent-specific identities.
- Semantic Search: Retrieve relevant memories based on the meaning of a query.
- Modern Dashboard: Manage agents and explore shared project memory.
- Responsive Interface: Access the dashboard across desktop, tablet, and mobile devices.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack application |
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Google Gemini | AI-powered responses |
| Meko MCP | Persistent shared memory |
| Zod | Request validation |

## Architecture

```text
                    DevMemory AI
                         |
                  Next.js Dashboard
                         |
            +------------+------------+
            |            |            |
       Coding Agent  Bug Fix Agent  Code Review Agent
            |            |            |
            +------------+------------+
                         |
                    Meko MCP
                         |
              Shared Persistent Memory
                         |
             Search, Save and Retrieve
                    Project Context
```

### How It Works

1. A user submits a question, bug report, or code sample.
2. The relevant agent searches Meko for related project memories.
3. Retrieved context is included in the agent's AI request.
4. Google Gemini generates a response using the available context.
5. The agent saves useful question-and-answer context to Meko under its own identity.
6. Other agents can retrieve relevant shared knowledge later.

### Memory Attribution

DevMemory AI uses the following agent identities:

- `devmemory-ai`
- `coding-agent`
- `bug-fix-agent`
- `code-review-agent`

All agents can retrieve relevant shared memories while newly saved memories retain their originating agent identity.

## Getting Started

### Prerequisites

- Node.js 20.9 or later
- npm
- A Meko API key and MCP endpoint
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/kishan-kumar-dev/devmemory-ai.git
cd devmemory-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
MEKO_API_KEY=your_meko_api_key
MEKO_MCP_URL=https://mcp.mekodata.ai/mcp
MEKO_CONVERSATION_ID=your_meko_conversation_id

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

Replace the placeholder values with your own credentials and Meko conversation ID.

Security: Never commit `.env.local` or expose API keys in frontend code.

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Meko Integration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meko/test` | Test Meko MCP connection |
| POST | `/api/meko/conversations` | Create a Meko conversation |
| POST | `/api/meko/memories` | Save a shared memory |
| GET | `/api/meko/memories?query=...` | Search shared memories |

### AI Agents

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agents/coding` | Ask the Coding Agent |
| POST | `/api/agents/bug-fix` | Submit a bug for investigation |
| POST | `/api/agents/review` | Submit code for review |

## Shared Memory Workflow

```text
       User Request
             |
             v
       Select AI Agent
             |
             v
      Search Meko Memory
             |
             v
     Retrieve Relevant Context
             |
             v
      Generate Gemini Response
             |
             v
       Save Useful Knowledge
             |
             v
      Shared Persistent Memory
             |
             v
       Available to Other Agents
```

The shared memory layer allows agents to reuse relevant knowledge instead of repeatedly solving the same problems without project context.

## Testing

### TypeScript Validation

```bash
npx tsc --noEmit
```

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Test Meko Connection

Using PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/meko/test" -Method Get
```

### Test Memory Retrieval

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/meko/memories?query=Next.js%20TypeScript" -Method Get
```

## Deployment

The application can be deployed on Vercel.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables in Vercel Project Settings.
4. Deploy the application.
5. Open the deployed URL and verify the Meko connection.

Live Demo: https://devmemory-ai.vercel.app/

GitHub Repository: https://github.com/kishan-kumar-dev/devmemory-ai



## Infrastructure Note

This application currently accesses persistent memory through the Meko MCP context engine. It does not implement a separate direct YugabyteDB client connection.

## Security

- Keep API keys in server-side environment variables.
- Never expose secrets in client-side components.
- Do not commit `.env.local`.
- Validate API requests before processing.
- Treat retrieved memories as reference context, not as trusted instructions.
- Avoid storing passwords, private credentials, or other sensitive information in shared memory.

## Future Improvements

- More specialized development agents.
- Better cross-agent memory visualization.
- Memory ranking and relevance improvements.
- Agent activity and decision tracing.
- Comprehensive automated tests.
- Improved error handling and quota management.

## License

This project is open source. Add a `LICENSE` file to the repository to specify reuse and distribution terms.

---

DevMemory AI — Teach once. Remember forever. Build smarter together.
