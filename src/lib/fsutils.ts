import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Root of the installed package (works from dist/ after build). */
export function packageRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // dist/index.js -> package root is one level up; src/lib -> two levels up.
  let dir = here;
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Unable to locate package root");
}

export function templatesDir(): string {
  return path.join(packageRoot(), "templates");
}

export type TemplateVars = Record<string, string>;

/** Replace {{key}} placeholders. Unknown keys are left untouched. */
export function renderTemplate(content: string, vars: TemplateVars): string {
  return content.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key: string) =>
    key in vars ? (vars[key] as string) : match,
  );
}

/**
 * Recursively copy a template directory, rendering placeholders in both
 * file contents and file/directory names. Files ending in `.tpl` are
 * rendered and the suffix stripped; everything else is copied verbatim.
 */
export function copyTemplateDir(
  srcDir: string,
  destDir: string,
  vars: TemplateVars,
): string[] {
  const written: string[] = [];
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const renderedName = renderTemplate(entry.name, vars);
    const srcPath = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      written.push(
        ...copyTemplateDir(srcPath, path.join(destDir, renderedName), vars),
      );
    } else if (renderedName.endsWith(".tpl")) {
      const destPath = path.join(destDir, renderedName.slice(0, -4));
      const content = renderTemplate(fs.readFileSync(srcPath, "utf8"), vars);
      fs.writeFileSync(destPath, content, { mode: fs.statSync(srcPath).mode });
      written.push(destPath);
    } else {
      const destPath = path.join(destDir, renderedName);
      fs.copyFileSync(srcPath, destPath);
      fs.chmodSync(destPath, fs.statSync(srcPath).mode);
      written.push(destPath);
    }
  }
  return written;
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}
