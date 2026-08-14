import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "index.html");
const readmePath = join(root, "README.md");

const START = "<!-- README_PROJECTS_START -->";
const END = "<!-- README_PROJECTS_END -->";

async function extractProjects() {
  const html = await readFile(htmlPath, "utf8");
  const section = html.match(/<section id="projects"[\s\S]*?<\/section>/);
  if (!section) return [];

  const cards = [...section[0].matchAll(/class="group relative[\s\S]*?<\/div>\s*<\/div>/g)];
  const projects = [];

  for (const card of cards) {
    const block = card[0];
    const repo = block.match(/href="(https:\/\/(?:github|gitlab)\.com\/[^"]+)"/);
    if (!repo) continue;
    const title = block.match(/class="font-semibold[^"]*"[^>]*>([^<]+)<\/a>/);
    const desc = block.match(/<p class="mt-2[\s\S]*?>([\s\S]*?)<\/p>/);
    if (!title) continue;
    const description = desc
      ? desc[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim()
      : "";
    projects.push({
      repo: repo[1],
      title: title[1].trim(),
      description,
    });
  }
  return projects;
}

function buildList(projects) {
  return projects
    .map((p) => `- [${p.title}](${p.repo}) - ${p.description}`)
    .join("\n");
}

async function main() {
  const projects = await extractProjects();
  if (!projects.length) {
    console.error("update-readme: no featured projects found");
    process.exit(1);
  }

  const readme = await readFile(readmePath, "utf8");
  if (!readme.includes(START) || !readme.includes(END)) {
    console.error(`update-readme: markers ${START} / ${END} missing in README.md`);
    process.exit(1);
  }

  const list = buildList(projects);
  const updated = readme.replace(
    new RegExp(`${START}[\\s\\S]*?${END}`),
    `${START}\n${list}\n${END}`
  );

  if (updated !== readme) {
    await writeFile(readmePath, updated);
    console.log(`update-readme: refreshed ${projects.length} projects in README.md`);
  } else {
    console.log("update-readme: README already up to date");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
