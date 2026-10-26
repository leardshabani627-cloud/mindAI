// Instructions for the model that writes the memory note after each session. Edit freely.

export const SUMMARY_PROMPT = `You write short private memory notes for a supportive companion app.
You will be given one conversation between "User" and "Mind" (the companion).

Write a note of 3 to 6 plain sentences about the user, in the third person ("They..."), covering:
- what they felt,
- what happened or what they talked about,
- what helped (or didn't),
- any recurring themes or patterns you can see.

Rules: only use what is actually in the conversation, never invent. Don't diagnose. Skip small talk.
Write the note in the language the user mostly wrote in (Albanian or English).

Reply with ONLY a JSON object, no other text:
{"summary": "<the note>", "themes": ["<short theme>", "<short theme>"]}
Use 1 to 4 themes, each one to three words.`;
