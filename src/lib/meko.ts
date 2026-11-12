import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

// Validate environment variables
const envSchema = z.object({
  MEKO_API_KEY: z.string().min(1),
  MEKO_MCP_URL: z.string().url(),
});

// Supported agent identities
const agentIdSchema = z.enum([
  "devmemory-ai",
  "coding-agent",
  "bug-fix-agent",
  "code-review-agent",
]);

// Validate tool inputs
const conversationSchema = z.object({
  title: z.string().optional(),
  sessionId: z.string().min(1),
  agentId: agentIdSchema.default("devmemory-ai"),
});

const saveMemorySchema = z.object({
  text: z.string().min(1),
  conversationId: z.string().min(1),
  agentId: agentIdSchema.default("devmemory-ai"),
});

const searchMemorySchema = z.object({
  query: z.string().min(1),
  conversationId: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(10),
  agentId: agentIdSchema.default("devmemory-ai"),
});

// Create an authenticated Meko MCP connection
async function withMekoClient<T>(
  callback: (client: Client) => Promise<T>,
): Promise<T> {
  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    throw new Error("Meko environment variables are missing or invalid.");
  }

  const client = new Client({
    name: "devmemory-ai",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(
    new URL(env.data.MEKO_MCP_URL),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${env.data.MEKO_API_KEY}`,
          "User-Agent": "devmemory-ai/1.0",
        },
      },
    },
  );

  try {
    await client.connect(transport);
    return await callback(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}

// Discover available Meko tools
export async function getMekoTools() {
  return withMekoClient(async (client) => {
    const result = await client.listTools();

    return result.tools
      .filter((tool) =>
        ["conversation_create", "memory_add", "memory_search"].includes(
          tool.name,
        ),
      )
      .map((tool) => ({
        name: tool.name,
        inputSchema: tool.inputSchema,
      }));
  });
}

// Create or reconnect to a Meko conversation
export async function createMekoConversation(input: {
  title?: string;
  sessionId: string;
  agentId?: z.infer<typeof agentIdSchema>;
}) {
  const data = conversationSchema.parse(input);

  return withMekoClient(async (client) => {
    return client.callTool({
      name: "conversation_create",
      arguments: {
        title: data.title,
        session_id: data.sessionId,
        agent_id: data.agentId,
      },
    });
  });
}

// Save a memory in Meko
export async function saveMekoMemory(input: {
  text: string;
  conversationId: string;
  agentId?: z.infer<typeof agentIdSchema>;
}) {
  const data = saveMemorySchema.parse(input);

  return withMekoClient(async (client) => {
    return client.callTool({
      name: "memory_add",
      arguments: {
        text: data.text,
        conversation_id: data.conversationId,
        agent_id: data.agentId,
      },
    });
  });
}

// Search shared memories across agents in Meko
export async function searchMekoMemories(input: {
  query: string;
  conversationId: string;
  limit?: number;
  agentId?: z.infer<typeof agentIdSchema>;
}) {
  const data = searchMemorySchema.parse(input);

  return withMekoClient(async (client) => {
    return client.callTool({
      name: "memory_search",
      arguments: {
        query: data.query,
        conversation_id: data.conversationId,
        run_id: data.conversationId,
        limit: data.limit,
        agent_id: data.agentId,
      },
    });
  });
}
