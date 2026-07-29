// Fixed dev-only namespace — no per-user scoping until real auth exists.
export const MEMORY_NAMESPACE = ['dev', 'memories'];

export const MAX_MEMORY_LENGTH = 150;

// How many recent messages the extraction call sees — just enough to catch a user's reply to
// the assistant's own question (e.g. "Where are you flying from?" → "Da Nang").
export const MAX_EXTRACT_MEMORY_MESSAGES = 4;

export const EXTRACT_MEMORY_SYSTEM_PROMPT = `You extract durable user preferences from a travel
planning conversation, so they can be remembered for future, unrelated requests.

Look at the most recent messages. Decide whether the user's latest message states a short,
durable fact about them — e.g. home/departure city, preferred seat class, budget range,
favorite destinations, usual travel companions. This includes short replies that answer a
question the assistant just asked (e.g. assistant: "Where are you flying from?", user:
"Da Nang" → that is a fact worth saving).

Do NOT extract one-off trip details that only apply to the current search (a specific
destination, date, or traveler count for THIS request) — only preferences that should apply to
future, unrelated requests too. Do NOT extract anything from greetings, thanks, or unrelated
chit-chat.

Return the fact as a short plain-language string (e.g. "Departure city: Da Nang"), or null if
the latest message contains no such durable fact.`;
