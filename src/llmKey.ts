/** Valid Google AI Studio keys start with AIza */
export function isValidGeminiKey(key?: string): boolean {
  if (!key?.trim()) return false;
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(key.trim());
}

/** Valid Groq keys start with gsk_ */
export function isValidGroqKey(key?: string): boolean {
  if (!key?.trim()) return false;
  return /^gsk_[0-9A-Za-z]{20,}$/.test(key.trim());
}

/** Valid Hugging Face tokens start with hf_ */
export function isValidHuggingFaceKey(key?: string): boolean {
  if (!key?.trim()) return false;
  return /^hf_[A-Za-z0-9_-]{10,}$/.test(key.trim());
}

/** Drop placeholders and wrong-provider keys so backend .env is used. */
export function sanitizeApiKey(
  key?: string,
  provider: "groq" | "gemini" | "huggingface" = "groq"
): string {
  if (!key?.trim()) return "";
  const k = key.trim();
  if (/your-groq|your-gemini|your-huggingface|placeholder|example|apikey-here|hf_token_here/i.test(k)) return "";

  if (provider === "groq") {
    if (k.startsWith("AIza") || k.startsWith("hf_")) return "";
    if (isValidGroqKey(k)) return k;
    return k.startsWith("gsk_") ? k : "";
  }

  if (provider === "gemini") {
    if (k.startsWith("gsk_") || k.startsWith("hf_")) return "";
    if (!isValidGeminiKey(k)) return "";
    return k;
  }

  if (provider === "huggingface") {
    if (k.startsWith("gsk_") || k.startsWith("AIza")) return "";
    if (!isValidHuggingFaceKey(k)) return "";
    return k;
  }

  return "";
}
