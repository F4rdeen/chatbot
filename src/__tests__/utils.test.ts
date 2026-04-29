import { generateId } from "@/lib/utils";

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates unique ids on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("uses crypto.randomUUID when available", () => {
    const mockUUID = "123e4567-e89b-12d3-a456-426614174000";
    const originalRandomUUID = crypto.randomUUID;
    crypto.randomUUID = jest.fn(() => mockUUID);

    const id = generateId();
    expect(id).toBe(mockUUID);

    crypto.randomUUID = originalRandomUUID;
  });

  it("falls back to Math.random when crypto.randomUUID is unavailable", () => {
    const originalCrypto = global.crypto;
    // @ts-expect-error intentionally removing crypto
    delete global.crypto;

    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    global.crypto = originalCrypto;
  });

  it("fallback id contains only alphanumeric characters", () => {
    const originalCrypto = global.crypto;
    // @ts-expect-error intentionally removing crypto
    delete global.crypto;

    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);

    global.crypto = originalCrypto;
  });
});
