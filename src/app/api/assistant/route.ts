import { NextResponse } from "next/server";
import { readProfile } from "@/lib/personal-kb";

type VisionPayload = {
  name: string;
  mimeType: string;
  dataUrl: string;
};

type ChatPayload = {
  role: "user" | "assistant";
  content: string;
  visionFiles?: VisionPayload[];
};

type RequestPayload = {
  messages: ChatPayload[];
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as RequestPayload;
  if (!Array.isArray(body.messages) || !body.messages.length) {
    return NextResponse.json(
      { error: "messages array is required." },
      { status: 400 },
    );
  }

  const profile = await readProfile();
  const memoryPrompt = `You are a language tutor. Start from weak points when relevant. Weak points: ${
    profile.weakPoints.slice(0, 5).join("; ") || "none"
  }. Learned words: ${profile.learnedWords.slice(0, 8).join(", ") || "none"}.`;

  const conversationInput = body.messages.map((message) => {
    const contentBlocks: Array<Record<string, string>> = [
      {
        type: "input_text",
        text: message.content,
      },
    ];

    if (message.role === "user" && message.visionFiles?.length) {
      for (const visionFile of message.visionFiles) {
        contentBlocks.push({
          type: "input_image",
          image_url: visionFile.dataUrl,
        });
      }
    }

    return {
      role: message.role,
      content: contentBlocks,
    };
  });

  const input = [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text: memoryPrompt,
        },
      ],
    },
    ...conversationInput,
  ];

  const upstreamResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input,
      temperature: 0.5,
    }),
  });

  if (!upstreamResponse.ok) {
    const errorPayload = await upstreamResponse.text();
    return NextResponse.json(
      { error: `Assistant request failed: ${errorPayload}` },
      { status: upstreamResponse.status },
    );
  }

  const payload = (await upstreamResponse.json()) as { output_text?: string };
  return NextResponse.json({ reply: payload.output_text ?? "I could not generate a response." });
}
