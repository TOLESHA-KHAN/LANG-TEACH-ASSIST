import { NextResponse } from "next/server";
import { readProfile } from "@/lib/personal-kb";

export async function GET() {
  const profile = await readProfile();
  return NextResponse.json(profile);
}
