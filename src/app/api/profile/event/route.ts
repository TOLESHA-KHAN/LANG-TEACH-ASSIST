import { NextResponse } from "next/server";
import { applyProgressEvent } from "@/lib/personal-kb";

type EventPayload = {
  type: "sentence_mastered" | "vision_reviewed" | "mistake_detected";
  content?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as EventPayload;

  if (!payload?.type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const profile = await applyProgressEvent(payload);
  return NextResponse.json(profile);
}
