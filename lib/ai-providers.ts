export type AiProvider = "anthropic" | "openai" | "mistral";
export type AiSpeed = "fast" | "quality";

export const AI_PROVIDERS: { id: AiProvider; label: string; placeholder: string; url: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-...", url: "https://console.anthropic.com/settings/keys" },
  { id: "openai", label: "OpenAI (GPT-4o)", placeholder: "sk-...", url: "https://platform.openai.com/api-keys" },
  { id: "mistral", label: "Mistral", placeholder: "...", url: "https://console.mistral.ai/api-keys" },
];

export function getStoredSpeed(): AiSpeed {
  if (typeof window === "undefined") return "fast";
  return (localStorage.getItem(`${STORAGE_PREFIX}speed`) as AiSpeed) || "fast";
}

export function storeSpeed(speed: AiSpeed) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}speed`, speed);
}

const STORAGE_PREFIX = "arbo_ai_";

export function getStoredProvider(): AiProvider {
  if (typeof window === "undefined") return "anthropic";
  return (localStorage.getItem(`${STORAGE_PREFIX}provider`) as AiProvider) || "anthropic";
}

export function storeProvider(provider: AiProvider) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}provider`, provider);
}

export function getStoredApiKey(provider?: AiProvider): string {
  if (typeof window === "undefined") return "";
  const p = provider || getStoredProvider();
  // Migration: old key was stored as arbo_anthropic_key
  if (p === "anthropic") {
    const legacy = localStorage.getItem("arbo_anthropic_key");
    if (legacy) {
      localStorage.setItem(`${STORAGE_PREFIX}key_anthropic`, legacy);
      localStorage.removeItem("arbo_anthropic_key");
      return legacy;
    }
  }
  return localStorage.getItem(`${STORAGE_PREFIX}key_${p}`) || "";
}

export function storeApiKey(key: string, provider?: AiProvider) {
  if (typeof window === "undefined") return;
  const p = provider || getStoredProvider();
  if (key.trim()) {
    localStorage.setItem(`${STORAGE_PREFIX}key_${p}`, key.trim());
  }
}

export function getProviderConfig(provider: AiProvider) {
  return AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];
}
