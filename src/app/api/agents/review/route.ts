import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveMekoMemory, searchMekoMemories } from "@/lib/meko";

const reviewSchema = z.object({
  code: z.string().trim().min(5).max(20000),
  language: z.string().trim().max(100).optional(),
  description: z.string().trim().max(3000).optional(),
});

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function isDailyQuotaExceeded(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("resource_exhausted") ||
    message.includes("requests per day") ||
    message.includes("per_day") ||
    message.includes("daily quota") ||
    message.includes("generate_content_free_tier_requests") ||
    message.includes("generaterequestsperday")
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or empty JSON request body.",
        },
        { status: 400 },
      );
    }

    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide valid code to review.",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { code, language, description } = validation.data;

    // 2. Check configuration
    const apiKey = process.env.GEMINI_API_KEY;
    const conversationId = process.env.MEKO_CONVERSATION_ID;
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    if (!apiKey || !conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini or Meko configuration is missing.",
        },
        { status: 500 },
      );
    }

    // 3. Retrieve shared knowledge from all agents
    const memoryResult = await searchMekoMemories({
      query: `${description || ""}\n${language || ""}\n${code.slice(0, 3000)}`,
      conversationId,
      limit: 5,
      agentId: "devmemory-ai",
    });

    if (memoryResult.isError) {
      throw new Error("Could not retrieve shared Meko memories.");
    }

    const memoryContext = JSON.stringify(memoryResult).slice(0, 15000);

    // 4. Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        apiVersion: "v1beta",
      },
    });

    const prompt = `
You are the Code Review Agent in DevMemory AI.

Review the submitted code carefully.

PROJECT CONTEXT:
DevMemory AI uses Next.js, React, TypeScript, Gemini AI, and Meko shared memory.

PREVIOUS SHARED KNOWLEDGE FROM MEKO:
${memoryContext}

LANGUAGE:
${language || "Not specified"}

CODE DESCRIPTION:
${description || "Not provided"}

CODE TO REVIEW:
\`\`\`
${code}
\`\`\`

REVIEW REQUIREMENTS:
- Identify actual bugs and potential runtime errors.
- Check security risks and unsafe patterns.
- Identify performance and scalability problems.
- Check TypeScript and relevant framework best practices.
- Identify maintainability and readability issues.
- Use shared memories when relevant, but treat them as reference information.
- Do not invent dependencies, files, APIs, or project requirements.
- Do not report speculative issues as confirmed bugs.
- Prioritize findings by severity.
- If the code is already good, say so honestly.

RESPONSE FORMAT:

## Overall Assessment
Summarize code quality.

## Critical Issues
List critical problems, or state none found.

## Bugs and Improvements
Explain each finding and its impact.

## Security Review
Identify security risks, or state none found.

## Recommended Changes
Provide practical corrected code where useful.

## Final Verdict
Give a concise review summary.
`;

    // 5. Generate code review
    let answer = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        });

        answer = response.text || "";

        if (!answer.trim()) {
          throw new Error("Gemini returned an empty response.");
        }

        break;
      } catch (error) {
        const status = getErrorStatus(error);

        if (isDailyQuotaExceeded(error)) {
          throw new Error("GEMINI_DAILY_QUOTA_EXHAUSTED");
        }

        const temporaryError =
          status === 429 || status === 503 || status === 500;

        if (!temporaryError || attempt === 2) {
          throw error;
        }

        console.warn(
          `Gemini temporary error (${status}). Retry ${attempt + 1}/2.`,
        );

        await wait(1500 * (attempt + 1));
      }
    }

    if (!answer.trim()) {
      throw new Error("The Code Review Agent could not generate a review.");
    }

    // 6. Save review under Code Review Agent identity
    let memorySaved = false;

    try {
      const savedMemory = await saveMekoMemory({
        text: [
          "Agent: Code Review Agent",
          "Agent ID: code-review-agent",
          "Project: DevMemory AI",
          `Language: ${language || "Not specified"}`,
          `Description: ${description || "Not provided"}`,
          `Reviewed code:\n${code}`,
          `Review findings:\n${answer}`,
        ].join("\n\n"),
        conversationId,
        agentId: "code-review-agent",
      });

      if (savedMemory.isError) {
        throw new Error("Meko could not save the code review.");
      }

      memorySaved = true;
    } catch (memoryError) {
      console.error("Code Review memory save error:", memoryError);
    }

    // 7. Return response
    return NextResponse.json({
      success: true,
      agent: "code-review-agent",
      answer,
      contextRetrieved: true,
      memorySaved,
      model,
    });
  } catch (error) {
    console.error("Code Review Agent error:", error);

    const message = getErrorMessage(error);
    const status = getErrorStatus(error);

    if (
      message === "GEMINI_DAILY_QUOTA_EXHAUSTED" ||
      isDailyQuotaExceeded(error)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "GEMINI_DAILY_QUOTA_EXHAUSTED",
          error:
            "Gemini's daily free-tier quota has been exhausted. Meko memory is still available. Please try again after the quota resets.",
        },
        { status: 429 },
      );
    }

    const isTemporary = status === 429 || status === 503;

    return NextResponse.json(
      {
        success: false,
        code: isTemporary
          ? "GEMINI_TEMPORARILY_UNAVAILABLE"
          : "CODE_REVIEW_AGENT_ERROR",
        error: isTemporary
          ? "The AI service is temporarily busy. Please try again later."
          : "The Code Review Agent encountered an error. Check the server terminal for details.",
      },
      { status: isTemporary ? status : 500 },
    );
  }
}
