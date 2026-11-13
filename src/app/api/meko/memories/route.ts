import { NextResponse } from "next/server";
import { z } from "zod";
import { saveMekoMemory, searchMekoMemories } from "@/lib/meko";

const agentSchema = z.enum([
  "devmemory-ai",
  "coding-agent",
  "bug-fix-agent",
  "code-review-agent",
]);

const memorySchema = z.object({
  text: z.string().trim().min(1).max(10000),
  agentId: agentSchema.default("devmemory-ai"),
});

const searchSchema = z.object({
  query: z.string().trim().min(1).max(5000),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

function getConversationId(): string {
  const id = process.env.MEKO_CONVERSATION_ID;

  if (!id) {
    throw new Error("MEKO_CONVERSATION_ID is not configured.");
  }

  return id;
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or empty JSON request body.",
        },
        { status: 400 },
      );
    }

    const parsed = memorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid memory data.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { text, agentId } = parsed.data;

    const result = await saveMekoMemory({
      text,
      conversationId: getConversationId(),
      agentId,
    });

    if (result.isError) {
      return NextResponse.json(
        {
          success: false,
          message: "Meko could not save the memory.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Memory saved successfully.",
      agentId,
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
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;

    const parsed = searchSchema.safeParse({
      query: params.get("query"),
      limit: params.get("limit") ?? 10,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid search query.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { query, limit } = parsed.data;

    const result = await searchMekoMemories({
      query,
      conversationId: getConversationId(),
      limit,
      agentId: "devmemory-ai",
    });

    if (result.isError) {
      return NextResponse.json(
        {
          success: false,
          message: "Meko memory search failed.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shared memory search completed.",
      query,
      limit,
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
      { status: 500 },
    );
  }
}
