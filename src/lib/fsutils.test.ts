import { describe, expect, it } from "vitest";
import { renderTemplate } from "./fsutils.js";

describe("renderTemplate", () => {
  it("replaces known placeholders", () => {
    expect(renderTemplate("Hello {{name}}!", { name: "world" })).toBe(
      "Hello world!",
    );
  });

  it("replaces every occurrence of a placeholder", () => {
    expect(renderTemplate("{{a}}-{{a}}-{{b}}", { a: "x", b: "y" })).toBe(
      "x-x-y",
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(renderTemplate("{{known}} {{unknown}}", { known: "ok" })).toBe(
      "ok {{unknown}}",
    );
  });

  it("returns the content unchanged when there are no placeholders", () => {
    expect(renderTemplate("plain text", {})).toBe("plain text");
  });
});
