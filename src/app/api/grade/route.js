import { NextResponse } from "next/server";

export async function POST(request) {
  const { essay, activity } = await request.json();

  const strictnessLabel = activity.strictness < 33 ? "lenient and encouraging" : activity.strictness < 66 ? "balanced" : "strict and demanding";

  const prompt = `You are an ESL writing assessor. Grade this ${activity.cefrLevel} level ${activity.taskType}.
Be ${strictnessLabel} in your grading.

Writing prompt: ${activity.prompt}

Student essay:
${essay}

Respond ONLY with a JSON object in this exact format, no other text:
{
  "scores": {
    "Task Achievement": 7,
    "Coherence & Cohesion": 7,
    "Vocabulary": 7,
    "Grammar": 7
  },
  "overall": 7,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "comment": "A short encouraging teacher comment."
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  const feedback = JSON.parse(clean);
  return NextResponse.json(feedback);
}