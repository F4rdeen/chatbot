/**
 * Tests for src/app/api/chat/route.ts
 *
 * We mock global.fetch so no real HTTP requests are made.
 *
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST, getFallbackMessage } from "@/app/api/chat/route";

// Helper to create a NextRequest with a JSON body
function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper to parse the response body
async function parseResponse(res: Response) {
  return res.json();
}

const mockFetchSuccess = (reply: string) =>
  jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ generated_text: reply }],
    text: async () => "",
  });

const mockFetchFailure = (status = 503) =>
  jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => "Service Unavailable",
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getFallbackMessage ───────────────────────────────────────────────────────
describe("getFallbackMessage", () => {
  it("returns English fallback for 'en'", () => {
    expect(getFallbackMessage("en")).toContain("sorry");
  });

  it("returns Malay fallback for 'ms'", () => {
    expect(getFallbackMessage("ms")).toContain("Maaf");
  });

  it("returns Tamil fallback for 'ta'", () => {
    expect(getFallbackMessage("ta")).toContain("மன்னிக்கவும்");
  });

  it("returns Manglish fallback for 'mix'", () => {
    expect(getFallbackMessage("mix")).toContain("Aiyo");
  });

  it("falls back to English for unknown language", () => {
    expect(getFallbackMessage("zz")).toContain("sorry");
  });
});

// ─── POST route handler ───────────────────────────────────────────────────────
describe("POST /api/chat", () => {
  it("returns 400 when messages is not an array", async () => {
    global.fetch = jest.fn();
    const req = makeRequest({ messages: "not an array", language: "en" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse(res);
    expect(body.error).toBe("Invalid request body");
  });

  it("returns 400 when messages array exceeds max length", async () => {
    global.fetch = jest.fn();
    const messages = Array.from({ length: 51 }, (_, i) => ({
      role: "user",
      content: `Message ${i}`,
    }));
    const req = makeRequest({ messages, language: "en" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse(res);
    expect(body.error).toBe("Too many messages");
  });

  it("returns a reply for a valid English message", async () => {
    global.fetch = mockFetchSuccess("Hello there!");
    const req = makeRequest({
      messages: [{ role: "user", content: "Hi" }],
      language: "en",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Hello there!");
  });

  it("defaults to English when language is missing", async () => {
    global.fetch = mockFetchSuccess("Response in English");
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Response in English");
  });

  it("defaults to English when language is unknown/invalid", async () => {
    global.fetch = mockFetchSuccess("Fallback response");
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
      language: "xx",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Fallback response");
  });

  it("handles Malay language correctly", async () => {
    global.fetch = mockFetchSuccess("Halo!");
    const req = makeRequest({
      messages: [{ role: "user", content: "Apa khabar" }],
      language: "ms",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Halo!");
  });

  it("handles Tamil language correctly", async () => {
    global.fetch = mockFetchSuccess("வணக்கம்!");
    const req = makeRequest({
      messages: [{ role: "user", content: "வணக்கம்" }],
      language: "ta",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toBe("வணக்கம்!");
  });

  it("handles Manglish language correctly", async () => {
    global.fetch = mockFetchSuccess("Eh hello lah!");
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello lah" }],
      language: "mix",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Eh hello lah!");
  });

  it("returns fallback when HuggingFace API fails", async () => {
    global.fetch = mockFetchFailure();
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
      language: "en",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect(body.reply).toContain("sorry");
  });

  it("returns Malay fallback when HuggingFace API fails for ms", async () => {
    global.fetch = mockFetchFailure();
    const req = makeRequest({
      messages: [{ role: "user", content: "Halo" }],
      language: "ms",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toContain("Maaf");
  });

  it("strips template tokens from the reply", async () => {
    global.fetch = mockFetchSuccess("Clean response<|endoftext|>");
    const req = makeRequest({
      messages: [{ role: "user", content: "Test" }],
      language: "en",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Clean response");
  });

  it("returns fallback when generated_text is empty", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ generated_text: "" }],
    });
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
      language: "en",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toContain("sorry");
  });

  it("returns fallback when fetch throws a network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
      language: "en",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toContain("sorry");
  });

  it("handles alternative generated_text format (object not array)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated_text: "Direct object response" }),
    });
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
      language: "en",
    });
    const res = await POST(req);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Direct object response");
  });

  it("filters out invalid message entries", async () => {
    global.fetch = mockFetchSuccess("Filtered reply");
    const req = makeRequest({
      messages: [
        { role: "user", content: "Valid message" },
        { role: "user", content: "" },       // empty content – invalid
        { content: "Missing role" },           // no role – invalid
        { role: "hacker", content: "Bad role" }, // invalid role
        null,                                   // null – invalid
      ],
      language: "en",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Filtered reply");

    // Verify only the valid message was forwarded to HuggingFace
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    // system prompt + 1 valid user message
    expect(sentBody.inputs).toContain("Valid message");
    expect(sentBody.inputs).not.toContain("Bad role");
  });

  it("includes Authorization header when HUGGINGFACE_API_KEY is set", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-token-123";
    global.fetch = mockFetchSuccess("Authenticated reply");
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
      language: "en",
    });
    await POST(req);
    const fetchInit = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(fetchInit.headers.Authorization).toBe("Bearer test-token-123");
    delete process.env.HUGGINGFACE_API_KEY;
  });

  it("omits Authorization header when HUGGINGFACE_API_KEY is not set", async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    global.fetch = mockFetchSuccess("Unauthenticated reply");
    const req = makeRequest({
      messages: [{ role: "user", content: "Hello" }],
      language: "en",
    });
    await POST(req);
    const fetchInit = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(fetchInit.headers.Authorization).toBeUndefined();
  });

  it("returns 200 for an empty valid messages array", async () => {
    global.fetch = mockFetchSuccess("System-only reply");
    const req = makeRequest({ messages: [], language: "en" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("includes assistant messages in the prompt context", async () => {
    global.fetch = mockFetchSuccess("Follow-up reply");
    const req = makeRequest({
      messages: [
        { role: "assistant", content: "How can I help?" },
        { role: "user", content: "Tell me more" },
      ],
      language: "en",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect(body.reply).toBe("Follow-up reply");

    // Verify both assistant and user messages were included in the prompt
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody.inputs).toContain("How can I help?");
    expect(sentBody.inputs).toContain("Tell me more");
    // The assistant message should use the <|assistant|> ChatML tag
    expect(sentBody.inputs).toContain("<|assistant|>");
  });
});
