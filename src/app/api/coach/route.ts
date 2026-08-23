import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * The AI Coach turn. The client sends its message plus the learning context it
 * fetched from the services — it never sends raw progress data it assembled
 * itself, and it never decides what the weakness is (§18).
 */
export const runtime = 'nodejs';
export const maxDuration = 60;

const ContextSchema = z.object({
  currentBand: z.number().min(0).max(9),
  targetBand: z.number().min(0).max(9),
  examDate: z.string().nullable(),
  weeksToExam: z.number().int().nonnegative().nullable(),
  minutesPerDay: z.number().int().positive(),
  weakSkills: z.array(
    z.object({
      skillId: z.string(),
      name: z.string(),
      band: z.number(),
      accuracy: z.number(),
    }),
  ),
  recentMistakes: z.array(
    z.object({ patternId: z.string(), title: z.string(), count: z.number().int() }),
  ),
  recentAttempts: z.array(
    z.object({
      attemptId: z.string(),
      title: z.string(),
      band: z.number(),
      submittedAt: z.string(),
    }),
  ),
  studyMinutesLast7Days: z.number().int().nonnegative(),
});

const RequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: ContextSchema,
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'That request was not valid.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: 'The coach is not configured on this deployment.',
        retryable: false,
      },
      { status: 503 },
    );
  }

  // With a key present, call the model here with `context` in the system prompt
  // and map the reply onto CoachMessage — including its structured
  // recommendations, so the client renders real rows rather than parsed prose.
  return NextResponse.json(
    { error: 'Live coaching is not wired up in this build.', retryable: false },
    { status: 501 },
  );
}
