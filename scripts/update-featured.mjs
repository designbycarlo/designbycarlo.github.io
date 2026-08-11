import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "index.html");

const OWNER = "designbycarlo";
const API = "https://api.github.com";
const START = "<!-- FEATURED_CARDS_START -->";
const END = "<!-- FEATURED_CARDS_END -->";
const MAX_DESC = 200;
const MAX_TOPICS = 4;
const MAX_REPOS = 8;

const TOPIC_LABELS = {
  nextjs: "Next.js",
  "next.js": "Next.js",
  react: "React",
  typescript: "TypeScript",
  javascript: "JavaScript",
  tailwindcss: "Tailwind CSS",
  "tailwind-css": "Tailwind CSS",
  zustand: "Zustand",
  supabase: "Supabase",
  pwa: "PWA",
  "dnd-kit": "@dnd-kit",
  "express-js": "Express",
  "connect-iq": "Connect IQ",
  "monkey-c": "Monkey C",
  garmin: "Garmin",
  "cloudflare-pages": "Cloudflare Pages",
  "ai-seo": "AI SEO",
  "seo-analyzer": "SEO Analyzer",
  aeo: "AEO",
  watchface: "Watch Face",
  "running-coach": "Running Coach",
  "weather-api": "Weather API",
  "radio-player": "Radio Player",
  "kanban-board": "Kanban Board",
  "project-management": "Project Management",
  minimalist: "Minimalist",
  vitest: "Vitest",
  eslint: "ESLint",
  "ai-sdk": "AI SDK",
  "gemini-ai": "Gemini AI",
  healthcare: "Healthcare",
  "medical-chatbot": "Medical Chatbot",
  vite: "Vite",
};

async function gh(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "designbycarlo-update-featured",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function listRepos(token) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await gh(
      `/users/${OWNER}/repos?per_page=100&page=${page}&sort=updated`,
      token
    );
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

function humanizeName(name) {
  return name
    .replace(/[-_.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeTopic(topic) {
  if (TOPIC_LABELS[topic]) return TOPIC_LABELS[topic];
  return topic
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(text, max) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  let cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return `${cut.replace(/[.,;:—–\s]+$/, "")}…`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function card(repo, index) {
  const number = String(index + 1).padStart(2, "0");
  const title = humanizeName(repo.name);
  const homepage = repo.homepage && repo.homepage.trim() ? repo.homepage.trim() : repo.html_url;
  const desc = truncate(repo.description, MAX_DESC);
  const tech = (repo.topics || [])
    .slice(0, MAX_TOPICS)
    .map(humanizeTopic)
    .join(" • ");
  const repoUrl = escapeHtml(repo.html_url);
  const homepageUrl = escapeHtml(homepage);
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(desc);
  const safeTech = escapeHtml(tech);

  return `\t\t\t<div
\t\t\t\tclass="group relative p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between shrink-0 w-[85%] sm:w-[calc(50%-12px)] snap-start">
\t\t\t\t<div>
\t\t\t\t\t<a href="${repoUrl}" target="_blank" rel="noreferrer"
\t\t\t\t\t\tclass="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-mono text-sm mb-4 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors duration-300">
\t\t\t\t\t\t<span class="sr-only">View ${safeTitle} repository</span>
\t\t\t\t\t\t${number}
\t\t\t\t\t</a>
\t\t\t\t\t<a href="${homepageUrl}" target="_blank" rel="noreferrer" class="font-semibold text-zinc-900 dark:text-white text-base hover:underline">${safeTitle}</a>
\t\t\t\t<p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
\t\t\t\t\t${safeDesc}
\t\t\t\t</p>
\t\t\t\t</div>
\t\t\t\t<div
\t\t\t\t\tclass="mt-6 pt-4 border-t border-zinc-100/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
\t\t\t\t\t<span>${safeTech}</span>
\t\t\t\t\t<a href="${repoUrl}" target="_blank" rel="noreferrer"
\t\t\t\t\t\tclass="text-zinc-900 dark:text-zinc-100 font-medium group-hover:translate-x-1 transition-transform">View
\t\t\t\t\t\tRepository
\t\t\t\t\t\t↗</a>
\t\t\t\t</div>
\t\t\t</div>`;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
  const token = process.env.GITHUB_TOKEN || "";
  const repos = await listRepos(token);

  const candidates = repos.filter(
    (r) =>
      !r.fork &&
      !r.archived &&
      r.stargazers_count >= 1 &&
      r.name.toLowerCase() !== `${OWNER}.github.io`
  );
  candidates.sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      String(b.pushed_at || "").localeCompare(String(a.pushed_at || ""))
  );

  const selected = candidates.slice(0, MAX_REPOS);

  const detailed = await Promise.all(
    selected.map(async (r) => {
      const detail = await gh(`/repos/${OWNER}/${r.name}`, token).catch(() => ({}));
      return { ...r, topics: Array.isArray(detail.topics) ? detail.topics : [] };
    })
  );

  const skipped = [];
  const cards = detailed
    .filter((r) => {
      const has = r.description && r.description.trim();
      if (!has) skipped.push(r.name);
      return has;
    })
    .map(card);

  if (!cards.length) {
    console.warn(
      `update-featured: no featured repos${
        skipped.length ? ` (skipped for missing description: ${skipped.join(", ")})` : ""
      } — leaving index.html unchanged`
    );
    return;
  }

  const html = await readFile(htmlPath, "utf8");
  if (!html.includes(START) || !html.includes(END)) {
    throw new Error(`markers ${START} / ${END} missing in index.html`);
  }

  const block = cards.join("\n\n");
  const updated = html.replace(
    new RegExp(`${escapeRegex(START)}[\\s\\S]*?${escapeRegex(END)}`),
    `${START}\n${block}\n${END}`
  );

  if (updated !== html) {
    await writeFile(htmlPath, updated);
    console.log(`update-featured: updated ${cards.length} featured project card(s)`);
  } else {
    console.log("update-featured: index.html already up to date");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
