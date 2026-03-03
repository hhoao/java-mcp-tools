import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, normalize } from "node:path";

import * as vscode from "vscode";

const DEFAULT_MAVEN_REPO = join(homedir(), ".m2", "repository");

function expandHome(p: string): string {
  if (p.startsWith("~")) {
    return p.length === 1 ? homedir() : join(homedir(), p.slice(2));
  }
  return p;
}

function parseLocalRepositoryFromXml(xmlPath: string): string | null {
  try {
    const xml = readFileSync(xmlPath, "utf8");
    const m = xml.match(/<localRepository>([^<]*)<\/localRepository>/);
    if (m) {
      return expandHome(normalize(m[1].trim()));
    }
  } catch {
    // ignore
  }
  return null;
}

export function getMavenLocalRepository(): string {
  const config = vscode.workspace.getConfiguration("java");
  const userSettings = config.get<string>("configuration.maven.userSettings");
  if (userSettings && existsSync(userSettings)) {
    const repo = parseLocalRepositoryFromXml(userSettings);
    if (repo) return repo;
  }
  const globalSettings = config.get<string>("configuration.maven.globalSettings");
  if (globalSettings && existsSync(globalSettings)) {
    const repo = parseLocalRepositoryFromXml(globalSettings);
    if (repo) return repo;
  }
  return DEFAULT_MAVEN_REPO;
}

function findJarByNameUnder(dir: string, fileName: string): string | null {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isFile() && e.name === fileName) return full;
    if (e.isDirectory() && !e.name.startsWith(".")) {
      const found = findJarByNameUnder(full, fileName);
      if (found) return found;
    }
  }
  return null;
}

export function resolveJarFromMaven(jarNameOrPath: string): string | null {
  const repo = getMavenLocalRepository();
  const normalized = normalize(jarNameOrPath).replace(/^\/+/, "");
  const withJar = normalized.toLowerCase().endsWith(".jar") ? normalized : `${normalized}.jar`;
  if (normalized.includes("/")) {
    let candidate = join(repo, normalized);
    if (!candidate.toLowerCase().endsWith(".jar")) candidate += ".jar";
    return existsSync(candidate) ? candidate : null;
  }
  return findJarByNameUnder(repo, withJar) ?? null;
}
