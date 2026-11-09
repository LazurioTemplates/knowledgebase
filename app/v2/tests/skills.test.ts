import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { splitFrontmatter } from "../src/pages";

// The module's procedures for agents: skills in .agents/skills (Codex) with a
// byte-for-byte mirror in .claude/skills (Claude Code), each named by its
// directory, with a description that says when to use it, and listed in the
// module's AGENTS.md.
const root = resolve(import.meta.dir, "../../..");
const canonical = join(root, ".agents/skills");
const mirror = join(root, ".claude/skills");

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
const tree = (directory: string) =>
  files(directory)
    .map((file) => relative(directory, file).split(sep).join("/"))
    .sort();

const skills = readdirSync(canonical).filter((name) =>
  statSync(join(canonical, name)).isDirectory(),
);

describe("skills for agents", () => {
  test("the module carries its skills", () => {
    expect(skills.sort()).toEqual([
      "knowledgebase-add-term",
      "knowledgebase-record-decision",
      "knowledgebase-search",
      "knowledgebase-write-procedure",
    ]);
  });

  test(".claude/skills mirrors .agents/skills byte for byte", () => {
    expect(tree(mirror)).toEqual(tree(canonical));
    for (const path of tree(canonical)) {
      expect(readFileSync(join(mirror, path), "utf8"), path).toBe(
        readFileSync(join(canonical, path), "utf8"),
      );
    }
  });

  test("every skill is named by its directory and says when to use it", () => {
    for (const skill of skills) {
      const { frontmatter, body } = splitFrontmatter(
        readFileSync(join(canonical, skill, "SKILL.md"), "utf8"),
      );
      expect(frontmatter.name, skill).toBe(skill);
      expect(String(frontmatter.description ?? ""), skill).toStartWith("Use ");
      expect(body, skill).toContain("## When to use");
      expect(body, skill).toContain("## Verification");
    }
  });

  test("AGENTS.md names every skill", () => {
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    for (const skill of skills) expect(agents, skill).toContain(`\`${skill}\``);
  });
});
