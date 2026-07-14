import * as p from "@clack/prompts";
import pc from "picocolors";
import { PLUGIN_TEMPLATES, TEMPLATE_DESCRIPTIONS } from "../lib/constants.js";
import { banner, indigo } from "../lib/theme.js";

export async function listCommand(): Promise<void> {
  p.intro(banner("agkit list"));
  for (const t of PLUGIN_TEMPLATES) {
    p.log.message(`${indigo(pc.bold(t))}\n  ${TEMPLATE_DESCRIPTIONS[t]}`);
  }
  p.log.message(
    `Remote and local templates are also supported:\n  agkit add gh:owner/repo/dir my-plugin\n  agkit add gl:owner/repo#v2 my-plugin\n  agkit add https://git.company.io/team/templates.git//skill-fr my-plugin\n  agkit add ./local-template my-plugin`,
  );
  p.outro("Usage: agkit add <template|spec> <plugin-name>");
}
