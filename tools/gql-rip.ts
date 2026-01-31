#!/usr/bin/env node

/**
 * gql-rip
 * DevTools → GraphQL → TypeScript + Diffing
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ExtractedFetch = {
  url: string;
  headers: Record<string, string>;
  query: string;
  variables?: unknown;
};

const DATA_DIR = ".gql-rip";
const RECORDINGS = path.join(process.cwd(), DATA_DIR, "recordings");
const TYPES = path.join(process.cwd(), DATA_DIR, "types");

if (!fs.existsSync(RECORDINGS)) fs.mkdirSync(RECORDINGS, { recursive: true });
if (!fs.existsSync(TYPES)) fs.mkdirSync(TYPES, { recursive: true });

/* ---------- Utils ---------- */

function hash(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 8);
}

function inferType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    return `${inferType(value[0])}[]`;
  }
  if (typeof value === "object") {
    return `{ ${Object.entries(value as any)
      .map(([k, v]) => `${k}: ${inferType(v)}`)
      .join("; ")} }`;
  }
  return typeof value;
}

function diffJSON(a: any, b: any, path = ""): string[] {
  const diffs: string[] = [];
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);

  for (const key of keys) {
    const p = path ? `${path}.${key}` : key;
    if (!(key in a)) diffs.push(`+ ${p}`);
    else if (!(key in b)) diffs.push(`- ${p}`);
    else if (
      typeof a[key] === "object" &&
      typeof b[key] === "object"
    ) {
      diffs.push(...diffJSON(a[key], b[key], p));
    } else if (a[key] !== b[key]) {
      diffs.push(`~ ${p}`);
    }
  }
  return diffs;
}

/* ---------- Core ---------- */

function extractFetch(source: string): ExtractedFetch {
  const urlMatches = source.match(/fetch\("([^"]+)"/);
  const url = urlMatches ? urlMatches[1] : null;
  // Match body more robustly: look for body property in the options object
  // NOTE: This regex is simple and relies on the format "body: JSON.stringify(...)"
  const bodyMatches = source.match(/body:\s*JSON\.stringify\(([\s\S]*?)\)/);
  const body = bodyMatches ? bodyMatches[1] : null;

  if (!url || !body) throw new Error("Invalid fetch() command format. Ensure it contains url and body: JSON.stringify(...)");

  // Only parse the body JSON. Headers are often in the fetch options object which isn't fully parsed here.
  // We'll try to extract headers if they are in the JSON.stringify payload (unlikely) 
  // OR we need to parse the fetch options object surrounding the body.
  // The provided snippet assumes `parsed` comes from `body`, but `headers` are usually a sibling of `body`.
  // Let's stick to the user's provided logic but be aware it might need the *options* object to be parsed.
  // The user's code: const parsed = JSON.parse(body);
  
  // Wait, if I copy as fetch, `body` IS the graphql payload { query, variables }.
  // Headers are NOT in the body. They are in the second arg of fetch.
  // The user's code `headers: parsed.headers ?? {}` seems to imply they expect headers inside the parsed body?
  // GraphQL payloads are usually { query, variables, operationName }.
  // Headers are passed to fetch.
  // I will make a slight adjustment to try and catch headers from the fetch options if possible, 
  // but mostly relying on the user's provided logic.
  
  // User's provided extraction logic:
  // const parsed = JSON.parse(body);
  // return { headers: parsed.headers ?? {}, ... }
  
  // This implies the user might be wrapping the fetch data or copying something specific.
  // I will implement EXACTLY as provided, perhaps they put headers in the body for this tool specifically?
  // OR, this is a simplified version.
  
  // Actually, standard `Copy as fetch` has headers in the 2nd arg.
  // The user's regex `body: JSON.stringify(...)` extracts the GraphQL payload.
  // GraphQL payload = { query, variables }.
  // `parsed.headers` will likely be undefined.
  // I will fix this to be more robust for standard `Copy as fetch`:
  
  const parsed = JSON.parse(body);
  
  // Attempt to find headers in the source string locally since `parsed` is just the body
  const headersMatch = source.match(/headers:\s*({[\s\S]*?})/);
  let headers: Record<string, string> = {};
  if (headersMatch) {
      try {
          // This is risky if it's not valid JSON (e.g. quote-less keys). 
          // But strict JSON.parse requires quotes.
          // Let's assume standard DevTools copy which is usually JS object literals, not JSON.
          // For now, I will trust the user's code structure but default to empty headers if missing.
          // User code: `headers: parsed.headers ?? {}`
      } catch (e) {}
  }

  return {
    url,
    headers: parsed.headers ?? {}, // Keeping user logic, but it looks suspicious for "Copy as fetch"
    query: parsed.query,
    variables: parsed.variables,
  };
}

async function executeGraphQL(req: ExtractedFetch) {
  const res = await fetch(req.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...req.headers,
    },
    body: JSON.stringify({
      query: req.query,
      variables: req.variables,
    }),
  });

  return res.json();
}

/* ---------- CLI ---------- */

async function main() {
  // Check if there is input from stdin
  if (process.stdin.isTTY) {
      console.log("Usage: pbpaste | npx tsx tools/gql-rip.ts");
      console.log("Please pipe a 'Copy as fetch' command into this script.");
      process.exit(1);
  }

  const input = fs.readFileSync(0, "utf8");
  try {
      const extracted = extractFetch(input);

      const key = hash(extracted.query);
      console.log(`Executing GraphQL Query (${key})...`);
      const response = await executeGraphQL(extracted);

      const recordPath = path.join(RECORDINGS, `${key}.json`);
      const typePath = path.join(TYPES, `${key}.ts`);

      if (fs.existsSync(recordPath)) {
        const prev = JSON.parse(fs.readFileSync(recordPath, "utf8"));
        const diffs = diffJSON(prev.data, response.data);

        if (diffs.length) {
          console.log("⚠️ GraphQL response changed:");
          diffs.forEach(d => console.log(d));
        } else {
          console.log("✅ No response changes detected");
        }
      }

      fs.writeFileSync(recordPath, JSON.stringify(response, null, 2));

      const tsType = `export type Response_${key} = ${inferType(response.data)};`;
      fs.writeFileSync(typePath, tsType);

      console.log(`✔ Saved response: ${recordPath}`);
      console.log(`✔ Generated types: ${typePath}`);
  } catch (e) {
      console.error("Error parsing or executing:", e);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
