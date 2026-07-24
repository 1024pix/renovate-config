#!/usr/bin/env node
/**
 * Generates a Renovate preset JSON for a GitHub monorepo,
 * when npm packages share a common CHANGELOG.md
 *
 * Usage:
 *   node scripts/generate-preset-monorepo.js <owner/repo> <packagesDir> [outputFile]
 *
 * Environment:
 *   GITHUB_TOKEN  Recommended to avoid GitHub API rate limits (60 req/h without, 5000 with)
 *
 * Example:
 *   GITHUB_TOKEN=ghp_xxx node scripts/generate-preset-monorepo.js open-telemetry/opentelemetry-js experimental presets/open-telemetry-experimental.json
 *   GITHUB_TOKEN=ghp_xxx node scripts/generate-preset-monorepo.js open-telemetry/opentelemetry-js api presets/open-telemetry-api.json
 *   GITHUB_TOKEN=ghp_xxx node scripts/generate-preset-monorepo.js open-telemetry/opentelemetry-js semantic-conventions presets/open-telemetry-semantic-conventions.json
 */

"use strict";

const { writeFileSync } = require("fs");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));

if (!args[0] || args[0] === "--help") {
  console.error(
    "Usage: node scripts/generate-preset-monorepo.js <owner/repo> [outputFile] [--branch=<branch>]",
  );
  console.error(
    "  GITHUB_TOKEN env var is recommended to avoid API rate limits",
  );
  process.exit(args[0] === "--help" ? 0 : 1);
}

const [repoArg, packagesDir, outputFile] = args;
const [owner, repo] = repoArg.split("/");
if (!owner || !repo) {
  console.error('Error: repository must be in "owner/repo" format');
  process.exit(1);
}
if (!packagesDir) {
  console.error('Error: packagesDir must be specified');
  process.exit(1);
}

const GITHUB_API = "https://api.github.com";
const token = process.env.GITHUB_TOKEN;

const apiHeaders = {
  "Accept": "application/vnd.github+json",
  "User-Agent": "renovate-config-preset-generator",
  "X-GitHub-Api-Version": "2022-11-28",
  "Authorization": `Bearer ${token}`,
};

async function githubGet(path) {
  const url = `${GITHUB_API}${path}`;
  const res = await fetch(url, { headers: apiHeaders });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${url} → ${res.status}: ${body}`);
  }
  return res.json();
}

// Uses raw.githubusercontent.com to avoid REST API rate limits for file content
async function getFileContent(branch, filePath) {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encoded}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status}`);
  }
  return res.text();
}

// Directories that should never contain publishable packages
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "test",
  "__tests__",
  "__fixtures__",
  "fixtures",
  "examples",
  "benchmark",
  "benchmarks",
]);

async function main() {
  // Accept an optional --branch flag, otherwise resolve via API
  const branchFlag = process.argv.find((a) => a.startsWith("--branch="));
  let branch = branchFlag ? branchFlag.slice("--branch=".length) : null;

  if (!branch) {
    console.error(`Fetching metadata for ${owner}/${repo}...`);
    const repoData = await githubGet(`/repos/${owner}/${repo}`);
    branch = repoData.default_branch;
  }
  console.error(`Branch: ${branch}`);

  console.error("Fetching repository file tree (recursive)...");
  const treeData = await githubGet(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );

  if (treeData.truncated) {
    console.error(
      "Warning: tree is truncated — large repo. Some packages may be missing.",
    );
  }

  const packageJsonPaths = treeData.tree
    .filter(({ type, path }) => {
      if (type !== "blob") return false;
      if (!path.startsWith(packagesDir)) return false;
      // Must end with /package.json (skip the root package.json)
      if (!path.includes("/") || !path.endsWith("/package.json")) return false;
      const parts = path.split("/");
      return !parts.some((p) => SKIP_DIRS.has(p));
    })
    .map(({ path }) => path)
    .sort();

  console.error(
    `Found ${packageJsonPaths.length} package.json files to process`,
  );

  /** @type {Array<{name: string, rootDir: string}>} */
  const packages = [];

  for (let i = 0; i < packageJsonPaths.length; i++) {
    const filePath = packageJsonPaths[i];
    process.stderr.write(
      `\r  [${i + 1}/${packageJsonPaths.length}] ${filePath.slice(0, 70).padEnd(70)}`,
    );

    try {
      const content = await getFileContent(branch, filePath);
      const pkg = JSON.parse(content);

      // Skip private packages and packages without a name
      if (!pkg.name || pkg.private === true) continue;

      const rootDir = filePath.split("/")[0];
      packages.push({ name: pkg.name, rootDir });
    } catch (err) {
      process.stderr.write(`\n  Error on ${filePath}: ${err.message}\n`);
    }
  }
  process.stderr.write("\n");

  // Group packages by root-level directory, sort names within each group
  /** @type {Map<string, string[]>} */
  const groups = new Map();
  for (const { name, rootDir } of packages) {
    if (!groups.has(rootDir)) groups.set(rootDir, []);
    groups.get(rootDir).push(name);
  }

  const sourceUrl = `https://github.com/${owner}/${repo}`;

  const packageRules = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sourceDirectory, names]) => ({
      matchDatasources: ["npm"],
      matchPackageNames: names.sort(),
      sourceUrl,
      sourceDirectory,
    }));

  const output = {
    $schema: "https://docs.renovatebot.com/renovate-schema.json",
    packageRules,
  };

  const json = JSON.stringify(output, null, 2) + "\n";

  if (outputFile) {
    writeFileSync(outputFile, json, "utf-8");
    console.error(`Preset written to ${outputFile}`);
  } else {
    process.stdout.write(json);
  }

  console.error(
    `Done. ${packageRules.length} rules covering ${packages.length} packages.`,
  );
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
