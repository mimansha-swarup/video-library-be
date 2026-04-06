// Usage:
//   npx ts-node src/scripts/generate-ai-note.ts --lesson-id <id> --transcript-file <path>
//   npx ts-node src/scripts/generate-ai-note.ts --lesson-id <id> --transcript "raw text here"
//
// Reads a transcript, summarizes it with Claude, and updates lessons/{lessonId}
// with aiNotes, transcript, and aiNotesUpdatedAt fields.

import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import admin from 'firebase-admin';
import { config } from '../config/env';

// ---------------------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    }),
  });
}

const db = admin.firestore();

// ---------------------------------------------------------------------------
// AI summarization
// ---------------------------------------------------------------------------
async function generateNote(transcript: string, lessonTitle?: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const context = lessonTitle ? `The lesson is titled "${lessonTitle}".\n\n` : '';
  const prompt =
    `${context}` +
    `You are an expert note-taker for software engineering lectures. ` +
    `Below is a transcript from a video lesson. Your job is to produce high-quality, well-structured study notes that a developer can use to understand and revise the topic without watching the video again.\n\n` +
    `Follow this exact structure in Markdown:\n\n` +
    `## Overview\n` +
    `A concise 3-5 sentence summary of what the lesson covers and why it matters.\n\n` +
    `## Key Concepts\n` +
    `For each major concept covered, write a short heading and a clear 1-3 sentence explanation. Include any definitions, mental models, or analogies the instructor used.\n\n` +
    `## How It Works\n` +
    `Step-by-step explanation of the main mechanism, technique, or workflow taught. Use numbered steps or sub-sections where appropriate.\n\n` +
    `## Code / Examples\n` +
    `Include any code snippets, commands, or concrete examples mentioned. If no code was shown, describe the examples in detail.\n\n` +
    `## Common Pitfalls & Best Practices\n` +
    `List any warnings, gotchas, or best practices the instructor highlighted.\n\n` +
    `## Quick Recap\n` +
    `3-5 bullet points summarising the most important things to remember from this lesson.\n\n` +
    `Rules:\n` +
    `- Use the instructor's own terminology and phrasing where possible\n` +
    `- Do not pad with filler — every sentence should add value\n` +
    `- If a section has nothing relevant, omit it rather than writing "N/A"\n` +
    `- Format code blocks with the correct language tag (e.g. \`\`\`js)\n\n` +
    `Transcript:\n${transcript}`;

  console.log('[info] Sending transcript to Claude…');
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const note = (message.content[0] as { text: string }).text;
  console.log(`[ok] Note generated (${note.length} characters)`);
  return note;
}

// ---------------------------------------------------------------------------
// Firestore update
// ---------------------------------------------------------------------------
async function saveLessonAiNote(lessonId: string, aiNotes: string, transcript: string): Promise<void> {
  const lessonRef = db.collection('lessons').doc(lessonId);
  const snap = await lessonRef.get();

  if (!snap.exists) {
    console.error(`[error] Lesson '${lessonId}' not found in Firestore.`);
    process.exit(1);
  }

  await lessonRef.update({
    aiNotes,
    transcript,
    aiNotesUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[ok] lessons/${lessonId} updated with aiNotes + transcript`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const lessonId = get('--lesson-id');
  const transcriptFile = get('--transcript-file');
  const transcriptInline = get('--transcript');

  if (!lessonId) {
    console.error('Usage: ts-node src/scripts/generate-ai-note.ts --lesson-id <id> --transcript-file <path>');
    process.exit(1);
  }
  if (!transcriptFile && !transcriptInline) {
    console.error('[error] Provide --transcript-file <path> or --transcript "text"');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[error] ANTHROPIC_API_KEY is not set in .env');
    process.exit(1);
  }

  const transcript = transcriptFile
    ? fs.readFileSync(transcriptFile, 'utf-8').trim()
    : transcriptInline!.trim();

  return { lessonId, transcript };
}

async function main() {
  const { lessonId, transcript } = parseArgs();

  // Fetch lesson title for better AI context
  const lessonSnap = await db.collection('lessons').doc(lessonId).get();
  const lessonTitle = lessonSnap.exists ? (lessonSnap.data()?.title as string | undefined) : undefined;
  if (lessonTitle) console.log(`[info] Lesson: "${lessonTitle}"`);

  const aiNotes = await generateNote(transcript, lessonTitle);

  console.log('\n' + '='.repeat(60));
  console.log('GENERATED NOTE PREVIEW');
  console.log('='.repeat(60));
  console.log(aiNotes.slice(0, 800) + (aiNotes.length > 800 ? '…' : ''));
  console.log('='.repeat(60) + '\n');

  await saveLessonAiNote(lessonId, aiNotes, transcript);
  console.log('[done]');
}

main().catch((err) => {
  console.error('[error]', err.message);
  process.exit(1);
});
