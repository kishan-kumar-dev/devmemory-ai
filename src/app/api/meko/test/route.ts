import { connection, NextResponse } from "next/server";
import { getMekoTools } from "@/lib/meko";

export async function GET() {
  await connection();

  try {
    const tools = await getMekoTools();

    return NextResponse.json({
      success: true,
      message: "Connected to Meko successfully!",
      toolCount: tools.length,
      tools,
    });
  } catch (error) {
    console.error("Meko connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Meko connection failed. Check server logs.",
      },
      { status: 500 },
    );
  }
}
