import { NextResponse } from "next/server";

function structureDeterministically(note: string) {
  const normalized = note.trim().replace(/\s+/g, " ");
  const ageMatch = normalized.match(/\b(child|adolescent|young adult|adult|older adult)\b/i);
  const onsetMatch = normalized.match(/\b(?:for|since)\s+([^.,;]+)/i);
  return {
    ...(ageMatch ? { ageGroup: ageMatch[1] } : {}),
    ...(normalized ? { complaint: normalized.slice(0, 160) } : {}),
    ...(onsetMatch ? { onsetText: onsetMatch[1].trim() } : {}),
    historyMentions: [],
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { note?: unknown } | null;
  if (!body || typeof body.note !== "string" || !body.note.trim()) {
    return NextResponse.json({ error: "A non-empty fictional note is required." }, { status: 400 });
  }
  return NextResponse.json({
    draft: structureDeterministically(body.note),
    requiresHumanConfirmation: true,
    verificationStatus: "unverified",
  });
}
