import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio");

  if (!(audioFile instanceof File)) {
    return NextResponse.json(
      { error: "Audio file is required." },
      { status: 400 },
    );
  }

  const upstreamFormData = new FormData();
  upstreamFormData.append("file", audioFile, audioFile.name || "recording.webm");
  upstreamFormData.append("model", "whisper-1");

  const upstreamResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstreamFormData,
  });

  if (!upstreamResponse.ok) {
    const errorPayload = await upstreamResponse.text();
    return NextResponse.json(
      { error: `Whisper request failed: ${errorPayload}` },
      { status: upstreamResponse.status },
    );
  }

  const payload = (await upstreamResponse.json()) as { text?: string };
  return NextResponse.json({ text: payload.text ?? "" });
}
