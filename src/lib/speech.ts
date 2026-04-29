"use client";

import { Language, getLanguageConfig } from "./languages";

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speak the given text using the Web Speech API.
 * Returns a cleanup function to cancel speech.
 */
export function speak(
  text: string,
  language: Language,
  onEnd?: () => void
): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const config = getLanguageConfig(language);
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = findBestVoice(voices, config.voiceLang);
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.lang = config.voiceLang;
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  if (onEnd) utterance.onend = onEnd;

  // Voices might not be loaded yet; try after a brief delay if empty
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      const v = findBestVoice(loadedVoices, config.voiceLang);
      if (v) utterance.voice = v;
      window.speechSynthesis.speak(utterance);
    };
  } else {
    window.speechSynthesis.speak(utterance);
  }

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function findBestVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  // Exact match
  let voice = voices.find((v) => v.lang === langCode);
  if (voice) return voice;

  // Language prefix match (e.g. "ms" matches "ms-MY")
  const prefix = langCode.split("-")[0];
  voice = voices.find((v) => v.lang.startsWith(prefix));
  if (voice) return voice;

  // Fallback to English
  voice = voices.find((v) => v.lang.startsWith("en"));
  return voice ?? null;
}
