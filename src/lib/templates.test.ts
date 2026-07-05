import { describe, expect, it } from "vitest";
import { PLUGIN_TEMPLATES } from "./constants.js";
import { resolveTemplate } from "./templates.js";

describe("resolveTemplate", () => {
  it("resolves every built-in template to a shipped directory", () => {
    for (const name of PLUGIN_TEMPLATES) {
      const t = resolveTemplate(name);
      expect(t.builtin).toBe(true);
      expect(t.label).toBe(`built-in:${name}`);
      expect(t.dir.endsWith(`plugins/${name}`)).toBe(true);
    }
  });

  it("throws on an unrecognized spec", () => {
    expect(() => resolveTemplate("definitely-not-a-template")).toThrow(
      /Unrecognized template/,
    );
  });

  it("throws when a local template path does not exist", () => {
    expect(() => resolveTemplate("./nope-does-not-exist")).toThrow(/not found/);
  });
});
