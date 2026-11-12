import { NextResponse } from "next/server";
import { z } from "zod";
import { saveMekoMemory, searchMekoMemories } from "@/lib/meko";

const agentSchema = z.enum(["devmemory-ai", "coding-agent", "bug-fix-agent"]);

const memorySchema = z.object({
  text: z.string().trim().min(1).max(10000),
  agentId: agentSchema.default("devmemory-ai"),
});

const searchSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

function getConversationId() {
  const id = process.env.MEKO_CONVERSATION_ID;

  if (!id) {
    throw new Error("MEKO_CONVERSATION_ID is not configured.");
  }

  return id;
}

export async function POST(request: Request) {
  try {
    const body = memorySchema.parse(await request.json());

    const result = await saveMekoMemory({
      text: body.text,
      conversationId: getConversationId(),
      agentId: body.agentId,
    });

    if (result.isError) {
      throw new Error("Meko could not save the memory.");
    }

    return NextResponse.json({
      success: true,
      message: "Memory saved successfully.",
      agentId: body.agentId,
      result,
    });
  } catch (error) {
    console.error("Memory save failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Could not save memory.",
      },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;

    const input = searchSchema.parse({
      query: params.get("query"),
      limit: params.get("limit") ?? 10,
    });

    const result = await searchMekoMemories({
      query: input.query,
      conversationId: getConversationId(),
      limit: input.limit,
      agentId: "devmemory-ai",
    });

    if (result.isError) {
      throw new Error("Meko memory search failed.");
    }

    return NextResponse.json({
      success: true,
      message: "Shared memory search completed.",
      result,
    });
  } catch (error) {
    console.error("Memory search failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Could not search memories.",
      },
      { status: 400 },
    );
  }
}
