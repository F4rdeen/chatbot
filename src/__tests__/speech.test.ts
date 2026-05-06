/**
 * Tests for src/lib/speech.ts
 *
 * The speech module depends on the Web Speech API (window.speechSynthesis).
 * We mock it fully so tests run in a Node.js/jsdom environment.
 */

// speech.ts has "use client" – the module must be imported after mocks are set up.

const mockCancel = jest.fn();
const mockSpeak = jest.fn();
const mockGetVoices = jest.fn();

const mockVoices: Partial<SpeechSynthesisVoice>[] = [
  { lang: "en-US", name: "Google US English" },
  { lang: "ms-MY", name: "Google Bahasa Melayu" },
  { lang: "ta-IN", name: "Google Tamil" },
];

// Mock SpeechSynthesisUtterance since jsdom does not implement it
class MockSpeechSynthesisUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

beforeEach(() => {
  jest.resetModules();
  mockCancel.mockClear();
  mockSpeak.mockClear();
  mockGetVoices.mockClear();

  // Install the utterance mock globally
  Object.defineProperty(global, "SpeechSynthesisUtterance", {
    value: MockSpeechSynthesisUtterance,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, "speechSynthesis", {
    value: {
      cancel: mockCancel,
      speak: mockSpeak,
      getVoices: mockGetVoices.mockReturnValue(mockVoices),
      onvoiceschanged: null,
    },
    writable: true,
    configurable: true,
  });
});

describe("speak", () => {
  it("calls speechSynthesis.cancel then speak", async () => {
    const { speak } = await import("@/lib/speech");
    speak("Hello", "en");
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
  });

  it("passes an utterance with correct lang for English", async () => {
    const { speak } = await import("@/lib/speech");
    speak("Hello world", "en");
    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe("en-US");
    expect(utterance.text).toBe("Hello world");
  });

  it("passes an utterance with correct lang for Malay", async () => {
    const { speak } = await import("@/lib/speech");
    speak("Halo", "ms");
    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe("ms-MY");
  });

  it("passes an utterance with correct lang for Tamil", async () => {
    const { speak } = await import("@/lib/speech");
    speak("வணக்கம்", "ta");
    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe("ta-IN");
  });

  it("sets rate, pitch, and volume on the utterance", async () => {
    const { speak } = await import("@/lib/speech");
    speak("Test", "en");
    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    expect(utterance.rate).toBe(0.95);
    expect(utterance.pitch).toBe(1.05);
    expect(utterance.volume).toBe(1);
  });

  it("attaches onEnd callback to utterance.onend", async () => {
    const { speak } = await import("@/lib/speech");
    const onEnd = jest.fn();
    speak("Test", "en", onEnd);
    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    expect(utterance.onend).toBe(onEnd);
  });

  it("returns a cleanup function that cancels speech", async () => {
    const { speak } = await import("@/lib/speech");
    const cleanup = speak("Test", "en");
    mockCancel.mockClear();
    cleanup();
    expect(mockCancel).toHaveBeenCalled();
  });

  it("queues speech via onvoiceschanged when voices list is empty", async () => {
    mockGetVoices.mockReturnValue([]);
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel: mockCancel,
        speak: mockSpeak,
        getVoices: mockGetVoices,
        onvoiceschanged: null,
      },
      writable: true,
      configurable: true,
    });

    const { speak } = await import("@/lib/speech");
    speak("Test", "en");

    // Speech should not have been called yet
    expect(mockSpeak).not.toHaveBeenCalled();

    // Simulate voices loaded
    mockGetVoices.mockReturnValue(mockVoices);
    (window.speechSynthesis as unknown as { onvoiceschanged: () => void }).onvoiceschanged?.();

    expect(mockSpeak).toHaveBeenCalled();
  });

  it("returns a no-op when speechSynthesis is not available", async () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { speak } = await import("@/lib/speech");
    const cleanup = speak("Test", "en");
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup()).not.toThrow();
  });

  it("Manglish uses en-US voice lang", async () => {
    const { speak } = await import("@/lib/speech");
    speak("Eh hello lah", "mix");
    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe("en-US");
  });

  it("uses a prefix-matched voice when no exact voice match exists", async () => {
    // Provide a voice list without an exact "en-US" match, but with an "en-*" variant.
    // speak("Test", "en") resolves voiceLang to "en-US"; findBestVoice will
    // fall through the exact-match branch and succeed on the prefix-match branch.
    mockGetVoices.mockReturnValue([{ lang: "en-AU", name: "English Australia" }]);

    const { speak } = await import("@/lib/speech");
    speak("Test", "en");

    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    // The utterance lang is always set from config.voiceLang
    expect(utterance.lang).toBe("en-US");
    // But the voice should have been matched by prefix to "en-AU"
    expect(utterance.voice).toMatchObject({ lang: "en-AU" });
  });
});

describe("stopSpeaking", () => {
  it("calls speechSynthesis.cancel", async () => {
    const { stopSpeaking } = await import("@/lib/speech");
    stopSpeaking();
    expect(mockCancel).toHaveBeenCalled();
  });

  it("does nothing when speechSynthesis is not available", async () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { stopSpeaking } = await import("@/lib/speech");
    expect(() => stopSpeaking()).not.toThrow();
  });
});
