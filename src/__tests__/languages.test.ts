import { LANGUAGES, getLanguageConfig } from "@/lib/languages";

describe("LANGUAGES", () => {
  it("contains exactly 4 language entries", () => {
    expect(LANGUAGES).toHaveLength(4);
  });

  it("has correct codes for all languages", () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["en", "ms", "ta", "mix"]);
  });

  it("every language entry has all required fields", () => {
    for (const lang of LANGUAGES) {
      expect(typeof lang.code).toBe("string");
      expect(typeof lang.label).toBe("string");
      expect(typeof lang.flag).toBe("string");
      expect(typeof lang.voiceLang).toBe("string");
      expect(typeof lang.placeholder).toBe("string");
      expect(typeof lang.greeting).toBe("string");
      expect(lang.label.length).toBeGreaterThan(0);
      expect(lang.flag.length).toBeGreaterThan(0);
      expect(lang.voiceLang.length).toBeGreaterThan(0);
      expect(lang.placeholder.length).toBeGreaterThan(0);
      expect(lang.greeting.length).toBeGreaterThan(0);
    }
  });

  it("English entry has correct values", () => {
    const en = LANGUAGES.find((l) => l.code === "en");
    expect(en).toBeDefined();
    expect(en!.voiceLang).toBe("en-US");
    expect(en!.flag).toBe("🇬🇧");
    expect(en!.greeting).toContain("Hello");
  });

  it("Malay entry has correct values", () => {
    const ms = LANGUAGES.find((l) => l.code === "ms");
    expect(ms).toBeDefined();
    expect(ms!.voiceLang).toBe("ms-MY");
    expect(ms!.flag).toBe("🇲🇾");
  });

  it("Tamil entry has correct values", () => {
    const ta = LANGUAGES.find((l) => l.code === "ta");
    expect(ta).toBeDefined();
    expect(ta!.voiceLang).toBe("ta-IN");
    expect(ta!.flag).toBe("🇮🇳");
  });

  it("Manglish entry uses en-US voice", () => {
    const mix = LANGUAGES.find((l) => l.code === "mix");
    expect(mix).toBeDefined();
    expect(mix!.voiceLang).toBe("en-US");
  });
});

describe("getLanguageConfig", () => {
  it("returns English config for 'en'", () => {
    const config = getLanguageConfig("en");
    expect(config.code).toBe("en");
    expect(config.label).toBe("English");
  });

  it("returns Malay config for 'ms'", () => {
    const config = getLanguageConfig("ms");
    expect(config.code).toBe("ms");
  });

  it("returns Tamil config for 'ta'", () => {
    const config = getLanguageConfig("ta");
    expect(config.code).toBe("ta");
  });

  it("returns Manglish config for 'mix'", () => {
    const config = getLanguageConfig("mix");
    expect(config.code).toBe("mix");
  });

  it("falls back to English for an unknown code", () => {
    // Type cast to test the fallback
    const config = getLanguageConfig("xx" as never);
    expect(config.code).toBe("en");
  });
});
