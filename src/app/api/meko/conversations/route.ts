import { NextResponse } from "next/server";
import { createMekoConversation } from "@/lib/meko";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await createMekoConversation({
      title: body.title ?? "DevMemory AI Main Project",
      sessionId: body.sessionId ?? "devmemory-ai-main",
      agentId: "devmemory-ai",
    });

    return NextResponse.json({
      success: true,
      message: "Meko conversation created successfully",
      result,
    });
  } catch (error) {
    console.error("Conversation creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not create Meko conversation.",
      },
      { status: 500 },
    );
  }
}
