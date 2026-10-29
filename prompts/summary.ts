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

Also write "for_you": the same note, written warmly and directly TO the person in the second person
("You felt…", "Ti u ndjeve…"), in the same language. Same facts, nothing added.

Reply with ONLY a JSON object, no other text:
{"summary": "<the note>", "for_you": "<the note, to the person>", "themes": ["<short theme>", "<short theme>"]}
Use 1 to 4 themes, each one to three words.`;

// For older notes that only have the third-person version: rewrite one to the person.
export const FOR_YOU_PROMPT = `Rewrite this private memory note so it speaks directly TO the person it's about, in the second person
("They felt overwhelmed" becomes "You felt overwhelmed"). In Albanian, change every verb to "ti":
"Ishte i lodhur" becomes "Ishe i lodhur", "ndihej vetëm" becomes "ndiheshe vetëm", "e ndihmoi" becomes "të ndihmoi",
"foli për" becomes "fole për". Keep the same language, the same facts
and roughly the same length. Other people mentioned stay in the third person. Reply with ONLY the rewritten note.`;
