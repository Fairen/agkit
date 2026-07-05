import { describe, expect, it } from "vitest";
import { KEBAB_CASE_RE, RESERVED_MARKETPLACE_NAMES } from "./constants.js";

describe("KEBAB_CASE_RE", () => {
  it.each([
    "a",
    "abc",
    "my-plugin",
    "tdd-coach",
    "a1-b2c3",
  ])("accepts %s", (name) => {
    expect(KEBAB_CASE_RE.test(name)).toBe(true);
  });

  it.each([
    "",
    "-x",
    "x-",
    "My-Plugin",
    "my_plugin",
    "my--plugin",
    "a b",
  ])("rejects %s", (name) => {
    expect(KEBAB_CASE_RE.test(name)).toBe(false);
  });
});

describe("RESERVED_MARKETPLACE_NAMES", () => {
  it("blocks the official Anthropic/Claude marketplace names", () => {
    expect(RESERVED_MARKETPLACE_NAMES).toContain("anthropic-marketplace");
    expect(RESERVED_MARKETPLACE_NAMES).toContain("claude-code-marketplace");
  });
});
