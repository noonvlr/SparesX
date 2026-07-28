/** Strip HTML / control chars for XSS-safe chat text. */
export function sanitizeChatText(input: string, maxLen = 4000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function previewFromMessage(
  type: "text" | "image",
  text?: string,
): string {
  if (type === "image") return "📷 Photo";
  return (text || "").slice(0, 120);
}
