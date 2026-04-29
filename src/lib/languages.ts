export type Language = "en" | "ms" | "ta" | "mix";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: Language;
  timestamp: Date;
}

export const LANGUAGES = [
  {
    code: "en" as Language,
    label: "English",
    flag: "🇬🇧",
    voiceLang: "en-US",
    placeholder: "Type your message in English…",
    greeting: "Hello! How can I help you today?",
  },
  {
    code: "ms" as Language,
    label: "Bahasa Melayu",
    flag: "🇲🇾",
    voiceLang: "ms-MY",
    placeholder: "Taip mesej anda dalam Bahasa Melayu…",
    greeting: "Halo! Apa yang boleh saya bantu hari ini?",
  },
  {
    code: "ta" as Language,
    label: "தமிழ்",
    flag: "🇮🇳",
    voiceLang: "ta-IN",
    placeholder: "தமிழில் உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்…",
    greeting: "வணக்கம்! இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?",
  },
  {
    code: "mix" as Language,
    label: "Manglish Mix",
    flag: "🌏",
    voiceLang: "en-US",
    placeholder: "Jom type anything lah – English, Melayu, Tamil boleh!",
    greeting: "Eh hello! What can I help you with lah? Ask me anything okay!",
  },
] as const;

export function getLanguageConfig(code: Language) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
