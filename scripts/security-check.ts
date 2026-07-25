#!/usr/bin/env node
/**
 * OneCard security pre-flight scanner.
 * ------------------------------------------------------------------
 * Objective PASS/FAIL gate on whether the app safely handles card data.
 * Run locally or in CI:  npm run security-check
 *
 * This is a VERIFICATION tool: it detects problems, it does not fix them.
 * A FAIL is loud and sets a non-zero exit code so it can gate CI.
 *
 * It does NOT certify PCI compliance — it is a pre-flight check only.
 *
 * The only safe stored card data is: brand, last4, expiry, and a processor
 * token id. A full PAN or CVV/CVC anywhere in code, storage, logs, git history,
 * or client bundles is an automatic FAIL.
 *
 * Requires Node >= 22.6 (runs TypeScript via type-stripping). Zero runtime deps.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// ════════════════════════════════════════════════════════════════════
//  CONFIG — all tunables live here.
// ════════════════════════════════════════════════════════════════════

const ROOT = process.cwd();

/** Directories never scanned (build output, deps, vcs). */
const IGNORE_DIR_SEGMENTS = ["node_modules", ".next", ".turbo", "dist", "build", "coverage", ".git", ".vercel"];

/** File extensions that are binary / generated / irrelevant. */
const IGNORE_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".eot", ".mp4", ".webm", ".mov",
  ".pdf", ".map", ".lock", ".zip", ".gz", ".tsbuildinfo",
]);

/** Exact tracked files to skip entirely (lockfiles, etc.). */
const IGNORE_FILES = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock"]);

/**
 * Files that legitimately discuss sensitive *terms* in prose (docs and this
 * scanner). They are EXCLUDED from the field-name / logging / storage checks,
 * but are STILL scanned for real PANs and real secrets.
 */
const TERM_DOC_FILES = [
  /(^|\/)SECURITY-AUDIT\.md$/,
  /(^|\/)SECURITY-VERIFY\.md$/,
  /(^|\/)SECURITY-CHECK[^/]*$/i,
  /(^|\/)README\.md$/,
  /scripts\/security-check\.ts$/,
  // The guard itself is purpose-built to name forbidden fields.
  /lib\/assertNoRawCardData\.ts$/,
];

/**
 * Official Stripe test cards (separators stripped). These are SAFE — not a FAIL.
 * https://stripe.com/docs/testing#cards
 */
const STRIPE_TEST_CARDS = new Set([
  "4242424242424242", "4000056655665556", "5555555555554444", "2223003122003222",
  "5200828282828210", "5105105105105100", "378282246310005", "371449635398431",
  "6011111111111117", "6011000990139424", "3056930009020004", "30569309025904",
  "38520000023237", "3566002020360505", "6200000000000005", "4000002500003155",
  "4000000000009995", "4000000000000002", "4111111111111111", "4000000000000077",
  "4000000000000069", "4000000000000127", "4000000000000119", "5610591081018250",
]);

/** Identifier substrings (normalised) that imply raw card storage. */
const STRONG_FIELD_TOKENS = [
  "cardnumber", "card_number", "fullcardnumber", "full_card_number",
  "cvv", "cvc", "cardcvv", "cardcvc", "securitycode", "security_code",
  "cardsecurity", "card_security", "track1", "track2", "trackdata", "track_data",
];
/** Ambiguous tokens — only flagged in clear key/identifier context. */
const WEAK_FIELD_TOKENS = ["pan", "csc"];

/** Real-secret patterns. Placeholders (see PLACEHOLDER_RE) are exempt. */
const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "Stripe secret key", re: /sk_(?:live|test)_[A-Za-z0-9]{20,}/g },
  { name: "Stripe restricted key", re: /rk_(?:live|test)_[A-Za-z0-9]{20,}/g },
  { name: "Stripe webhook secret", re: /whsec_[A-Za-z0-9]{24,}/g },
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_\-]{30,}\b/g },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "Slack token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
];

/** Tokens that mark a secret-looking string as an obvious placeholder. */
const PLACEHOLDER_RE = /\.\.\.|your[_-]?|placeholder|x{4,}|<[^>]+>|changeme|example|dummy|sk_test_placeholder/i;

/** Payment-route path matcher. */
const PAYMENT_ROUTE_RE = /api\/(?:stripe|payment|payments|checkout|billing)\//;

/** Server-only env names that must never be reachable from client code. */
const SERVER_SECRET_ENV_RE =
  /process\.env\.([A-Z0-9_]*(?:SECRET|PRIVATE)[A-Z0-9_]*|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|POSTMARK_SERVER_TOKEN|REWARDS_CC_RAPIDAPI_KEY)/g;

/** Logging of whole bodies / payloads / card fields. */
const RISKY_LOG_RE =
  /\b(req(?:uest)?\.body|\bbody\b|payload|JSON\.stringify|cardNumber|cvv|cvc|\.card\b(?!\s*[?.]?(?:last4|brand|exp))|paymentMethod\b(?!\.id))/i;

/** Default: should risky logging on payment routes FAIL (true) or WARN (false)? */
const FAIL_ON_PAYMENT_ROUTE_LOGGING = true;

// ════════════════════════════════════════════════════════════════════
//  Reporting primitives
// ════════════════════════════════════════════════════════════════════

type Severity = "FAIL" | "WARN" | "INFO";
interface Finding {
  severity: Severity;
  file: string;
  line?: number;
  message: string;
}

interface CheckResult {
  id: string;
  title: string;
  findings: Finding[];
  /** Non-finding informational notes (e.g., "no schema files present"). */
  notes: string[];
}

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function sev(s: Severity): string {
  if (s === "FAIL") return `${RED}${BOLD}FAIL${RESET}`;
  if (s === "WARN") return `${YELLOW}WARN${RESET}`;
  return `${DIM}INFO${RESET}`;
}

// ════════════════════════════════════════════════════════════════════
//  File discovery (tracked files only) + helpers
// ════════════════════════════════════════════════════════════════════

function listTrackedFiles(): string[] {
  let out = "";
  try {
    // Tracked files PLUS new untracked files that are not gitignored, so a secret
    // in an uncommitted file is still caught and gitignored files are skipped.
    out = execSync("git ls-files --cached --others --exclude-standard", {
      cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return [];
  }
  return out
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .filter((f) => !IGNORE_DIR_SEGMENTS.some((d) => f.split("/").includes(d)))
    .filter((f) => !IGNORE_FILES.has(f.split("/").pop() ?? f))
    .filter((f) => {
      const dot = f.lastIndexOf(".");
      const ext = dot >= 0 ? f.slice(dot) : "";
      return !IGNORE_EXT.has(ext.toLowerCase());
    });
}

function read(file: string): string {
  try {
    return readFileSync(join(ROOT, file), "utf8");
  } catch {
    return "";
  }
}

function isTermDoc(file: string): boolean {
  return TERM_DOC_FILES.some((re) => re.test(file));
}

function isCodeFile(file: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);
}

/**
 * Blank out comments (preserving newlines/offsets) so prose like
 * "// PAN, CVV, expiry" never matches a field-name pattern.
 *
 * It intentionally does NOT track string state — tracking multi-line template
 * literals is fragile and only risks DESYNC. Blanking a `//` inside a string
 * (e.g. a URL) just removes harmless content; it can never create a false
 * positive, and card field names do not legitimately live inside strings.
 */
function stripComments(src: string): string {
  let out = "";
  let inBlock = false;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (inBlock) {
      if (c === "*" && n === "/") { inBlock = false; out += "  "; i += 2; continue; }
      out += c === "\n" ? "\n" : c === "\t" ? "\t" : " ";
      i++;
      continue;
    }
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") { out += " "; i++; }
      continue;
    }
    if (c === "/" && n === "*") { inBlock = true; out += "  "; i += 2; continue; }
    out += c;
    i++;
  }
  return out;
}

function lineOf(src: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === "\n") line++;
  return line;
}

/** Mask a PAN: keep last 4, hide the rest. */
function maskPan(digits: string): string {
  const last4 = digits.slice(-4);
  return `${"*".repeat(Math.max(0, digits.length - 4))}${last4}`;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 1 — PAN / CVV patterns & raw-card field names
// ════════════════════════════════════════════════════════════════════

function checkPanAndFields(files: string[]): CheckResult {
  const findings: Finding[] = [];
  // Candidate: 13–19 digits with optional single space/dash separators.
  const panRe = /\d(?:[ -]?\d){12,18}/g;
  const alnum = /[A-Za-z0-9]/;

  for (const file of files) {
    const raw = read(file);
    if (!raw) continue;

    // --- PAN / Luhn (scan RAW: a PAN in a comment is still a FAIL) ---
    let m: RegExpExecArray | null;
    panRe.lastIndex = 0;
    while ((m = panRe.exec(raw)) !== null) {
      const digits = m[0].replace(/[ -]/g, "");
      if (digits.length < 13 || digits.length > 19) continue;
      if (STRIPE_TEST_CARDS.has(digits)) continue; // allowlisted test card
      // Must be a delimited value, not digits embedded in a hex hash / longer id.
      const before = raw[m.index - 1] ?? "";
      const after = raw[m.index + m[0].length] ?? "";
      if (alnum.test(before) || alnum.test(after)) continue;
      // Real card IINs start with 2–6. This excludes ms timestamps (1…) and ids.
      if (!"23456".includes(digits[0]!)) continue;
      if (!luhnValid(digits)) continue; // not a card number
      findings.push({
        severity: "FAIL",
        file,
        line: lineOf(raw, m.index),
        message: `Luhn-valid ${digits.length}-digit card-like number, not a Stripe test card: ${maskPan(digits)}`,
      });
    }

    // --- Raw-card field names (skip docs/scanner/guard; strip comments) ---
    if (isTermDoc(file) || !isCodeFile(file)) continue;
    const code = stripComments(raw);

    // Flag tokens used as IDENTIFIERS/KEYS (storage), not as UI label strings.
    //   object/type key:  cvv:   "cvv":   cvv?:
    //   assignment:       cvv =
    //   property access:  body.cvv   .cardNumber
    //   declaration:      const cvv …   { cvv }   , cvv
    for (const token of STRONG_FIELD_TOKENS) {
      const base = token.replace(/_/g, "[_-]?");
      const ctx = new RegExp(
        `\\.${base}\\b` + // property access:  body.cardNumber
          `|\\b${base}["']?\\s*\\??\\s*:` + // object/type key:  cvv:  "cvv":  cvv?:
          `|\\b${base}\\s*=(?!=)` + // assignment:  cvv =
          `|\\b(?:const|let|var)\\s+${base}\\b` + // declaration:  const cvv
          `|\\b(?:const|let|var)\\s*\\{[^{}]*\\b${base}\\b`, // destructure:  const { cvv } =
        "gi",
      );
      let fm: RegExpExecArray | null;
      while ((fm = ctx.exec(code)) !== null) {
        findings.push({
          severity: "FAIL",
          file,
          line: lineOf(code, fm.index),
          message: `Raw-card field identifier matching /${token}/ in source (implies storing card data)`,
        });
      }
    }
    // Ambiguous tokens (pan, csc): only as an object/type KEY or property access.
    for (const token of WEAK_FIELD_TOKENS) {
      const ctx = new RegExp(`\\b${token}["']?\\s*\\??\\s*:|\\.${token}\\b`, "gi");
      let fm: RegExpExecArray | null;
      while ((fm = ctx.exec(code)) !== null) {
        findings.push({
          severity: "FAIL",
          file,
          line: lineOf(code, fm.index),
          message: `Possible raw-card field "${token}" used as a stored field key`,
        });
      }
    }
  }

  return { id: "1", title: "PAN / CVV patterns & raw-card field names", findings, notes: [] };
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 2 — Secrets hygiene
// ════════════════════════════════════════════════════════════════════

function checkSecrets(files: string[]): CheckResult {
  const findings: Finding[] = [];
  const notes: string[] = [];
  let publishableSeen = false;

  for (const file of files) {
    const raw = read(file);
    if (!raw) continue;

    for (const { name, re } of SECRET_PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw)) !== null) {
        const match = m[0];
        // window around match to detect placeholder context
        const ctx = raw.slice(Math.max(0, m.index - 4), m.index + match.length + 6);
        if (PLACEHOLDER_RE.test(ctx)) continue; // obvious placeholder
        findings.push({
          severity: "FAIL",
          file,
          line: lineOf(raw, m.index),
          message: `Hardcoded ${name}: ${match.slice(0, 8)}…[REDACTED]`,
        });
      }
    }
    if (/\bpk_(?:live|test)_[A-Za-z0-9]{10,}/.test(raw)) publishableSeen = true;
  }

  if (publishableSeen) notes.push("Publishable key (pk_) present — safe for client use.");
  return { id: "2", title: "Secrets hygiene (sk_/rk_/whsec_/API keys)", findings, notes };
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 3 — Client bundle leakage
// ════════════════════════════════════════════════════════════════════

function checkClientLeakage(files: string[]): CheckResult {
  const findings: Finding[] = [];
  const notes: string[] = [];

  for (const file of files) {
    if (!isCodeFile(file)) continue;
    const raw = read(file);
    if (!raw) continue;
    const isClient = /^\s*["']use client["']/m.test(raw);
    if (!isClient) continue;

    // server-only secret env referenced from a client component
    SERVER_SECRET_ENV_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SERVER_SECRET_ENV_RE.exec(raw)) !== null) {
      findings.push({
        severity: "FAIL",
        file,
        line: lineOf(raw, m.index),
        message: `Server-only secret env "${m[1]}" referenced in a "use client" file (would bundle to client)`,
      });
    }
    // Importing the server Stripe singleton VALUE into client code bundles the
    // secret. `import type { StoredCard }` is erased at runtime and is safe.
    const importRe = /import\s+(type\s+)?\{([^}]*)\}\s+from\s+["']@\/lib\/stripe["']/g;
    let im: RegExpExecArray | null;
    while ((im = importRe.exec(raw)) !== null) {
      const isTypeOnly = Boolean(im[1]);
      const named = im[2] ?? "";
      // Flag only a value import that pulls in the `stripe` runtime singleton.
      const importsStripeValue = !isTypeOnly && /(^|,)\s*stripe\s*(,|$)/.test(named.replace(/\btype\s+\w+/g, ""));
      if (importsStripeValue) {
        findings.push({
          severity: "FAIL",
          file,
          line: lineOf(raw, im.index),
          message: `Client component imports the server Stripe singleton value (@/lib/stripe → stripe) — secret key risk`,
        });
      }
    }
  }

  // Best-effort: scan a built client bundle for secret patterns, if present.
  const bundleDir = join(ROOT, "apps/web/.next/static");
  if (existsSync(bundleDir)) {
    const hits = scanDirForSecrets(bundleDir);
    for (const h of hits) findings.push(h);
    if (hits.length === 0) notes.push("Built client bundle (.next/static) scanned — no secret keys found.");
  } else {
    notes.push("No built client bundle found (run a production build to scan it too).");
  }

  return { id: "3", title: "Client bundle leakage", findings, notes };
}

function scanDirForSecrets(dir: string): Finding[] {
  const out: Finding[] = [];
  const walk = (d: string) => {
    let entries: string[] = [];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e);
      let s;
      try {
        s = statSync(p);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        walk(p);
      } else if (/\.(js|mjs|cjs|json|css|map)$/.test(e)) {
        const raw = readFileSync(p, "utf8");
        for (const { name, re } of SECRET_PATTERNS) {
          re.lastIndex = 0;
          const m = re.exec(raw);
          if (m && !PLACEHOLDER_RE.test(raw.slice(Math.max(0, m.index - 4), m.index + m[0].length + 6))) {
            out.push({
              severity: "FAIL",
              file: relative(ROOT, p),
              message: `${name} found inside CLIENT BUNDLE — secret leaked to browser: ${m[0].slice(0, 8)}…[REDACTED]`,
            });
          }
        }
      }
    }
  };
  walk(dir);
  return out;
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 4 — Logging of sensitive data on payment routes
// ════════════════════════════════════════════════════════════════════

function checkLogging(files: string[]): CheckResult {
  const findings: Finding[] = [];
  const paymentRoutes = files.filter((f) => PAYMENT_ROUTE_RE.test(f) && isCodeFile(f) && !isTermDoc(f));

  for (const file of paymentRoutes) {
    const code = stripComments(read(file));
    const lines = code.split("\n");
    lines.forEach((ln, i) => {
      if (!/\bconsole\.(log|info|warn|error|debug)\s*\(/.test(ln)) return;
      if (RISKY_LOG_RE.test(ln)) {
        findings.push({
          severity: FAIL_ON_PAYMENT_ROUTE_LOGGING ? "FAIL" : "WARN",
          file,
          line: i + 1,
          message: `Payment-route log may include sensitive data: ${ln.trim().slice(0, 90)}`,
        });
      }
    });
  }

  return { id: "4", title: "Logging of sensitive data on payment routes", findings, notes: [] };
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 5 — Browser storage of card data
// ════════════════════════════════════════════════════════════════════

function checkBrowserStorage(files: string[]): CheckResult {
  const findings: Finding[] = [];
  const storageRe = /(localStorage|sessionStorage)\.setItem\s*\(([^)]*)\)|document\.cookie\s*=([^;]*)/g;

  for (const file of files) {
    if (!isCodeFile(file) || isTermDoc(file)) continue;
    const code = stripComments(read(file));
    let m: RegExpExecArray | null;
    storageRe.lastIndex = 0;
    while ((m = storageRe.exec(code)) !== null) {
      const payload = `${m[2] ?? ""}${m[3] ?? ""}`;
      if (
        STRONG_FIELD_TOKENS.some((t) => new RegExp(`\\b${t.replace(/_/g, "[_-]?")}\\b`, "i").test(payload)) ||
        /\b(card[_-]?number|cvv|cvc|security[_-]?code)\b/i.test(payload)
      ) {
        findings.push({
          severity: "FAIL",
          file,
          line: lineOf(code, m.index),
          message: `Browser storage write references a card field: ${m[0].slice(0, 80)}`,
        });
      }
    }
  }

  return { id: "5", title: "Browser storage of card data", findings, notes: [] };
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 6 — .env & git hygiene (+ git-history secret scan)
// ════════════════════════════════════════════════════════════════════

function checkEnvAndGit(files: string[]): CheckResult {
  const findings: Finding[] = [];
  const notes: string[] = [];

  // (a) .gitignore must ignore .env files (but not .env.example)
  const gitignore = read(".gitignore");
  if (!/^\.env(\b|$|\*)/m.test(gitignore) && !/(^|\n)\.env\b/.test(gitignore)) {
    findings.push({ severity: "FAIL", file: ".gitignore", message: "`.env` is not gitignored" });
  } else {
    notes.push(".env files are gitignored.");
  }

  // (b) any tracked .env file other than .env.example
  for (const f of files) {
    const base = f.split("/").pop() ?? f;
    if (/^\.env/.test(base) && base !== ".env.example") {
      findings.push({ severity: "FAIL", file: f, message: "A real .env file is tracked by git" });
    }
  }

  // (c) .env.example must contain only placeholders
  for (const f of files) {
    if (!/(^|\/)\.env\.example$/.test(f)) continue;
    const raw = read(f);
    for (const { name, re } of SECRET_PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw)) !== null) {
        const ctx = raw.slice(Math.max(0, m.index - 4), m.index + m[0].length + 6);
        if (PLACEHOLDER_RE.test(ctx)) continue;
        findings.push({ severity: "FAIL", file: f, line: lineOf(raw, m.index), message: `Real ${name} in ${f} (should be a placeholder)` });
      }
    }
  }

  // (d) git history: any .env (non-example) ever committed
  try {
    const added = execSync("git log --all --diff-filter=A --name-only --pretty=format:", {
      cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    });
    const envFiles = new Set(
      added.split("\n").map((s) => s.trim()).filter((s) => /(^|\/)\.env/.test(s) && !/\.env\.example$/.test(s)),
    );
    for (const ef of envFiles) {
      findings.push({
        severity: "FAIL",
        file: ef,
        message: `A .env file was committed at some point in git history — rotate any keys and purge history (git filter-repo / BFG)`,
      });
    }
  } catch {
    notes.push("Could not enumerate git history for .env files.");
  }

  // (e) git history: secret patterns ever committed
  try {
    const patch = execSync("git log --all -p --no-color", {
      cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024,
    });
    const onlyAdded = patch
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .join("\n");
    for (const { name, re } of SECRET_PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(onlyAdded)) !== null) {
        const ctx = onlyAdded.slice(Math.max(0, m.index - 6), m.index + m[0].length + 6);
        if (PLACEHOLDER_RE.test(ctx)) continue;
        findings.push({
          severity: "FAIL",
          file: "<git history>",
          message: `${name} found in git history (${m[0].slice(0, 8)}…[REDACTED]) — rotate the key and purge history`,
        });
      }
    }
  } catch {
    notes.push("Could not scan git history patches for secrets.");
  }

  return { id: "6", title: ".env & git hygiene (incl. git-history secret scan)", findings, notes };
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 7 — CVV never stored (schema / models / migrations)
// ════════════════════════════════════════════════════════════════════

function checkCvvNeverStored(files: string[]): CheckResult {
  const findings: Finding[] = [];
  const notes: string[] = [];
  const persistenceRe = /\.prisma$|\.sql$|migrations?\/|schema|model|entity|\.dto\./i;
  const cvvRe = /\b(cvv|cvc|card_?security|security_?code)\b/i;

  let schemaFound = false;
  for (const f of files) {
    if (!persistenceRe.test(f)) continue;
    if (isTermDoc(f)) continue;
    schemaFound = true;
    const code = stripComments(read(f));
    let m: RegExpExecArray | null;
    cvvRe.lastIndex = 0;
    while ((m = cvvRe.exec(code)) !== null) {
      findings.push({
        severity: "FAIL",
        file: f,
        line: lineOf(code, m.index),
        message: `Persisted CVV/security-code field "${m[0]}" — CVV must never be stored`,
      });
    }
  }
  if (!schemaFound) notes.push("No database schema/model/migration files found yet (nothing persists CVV).");
  return { id: "7", title: "CVV never stored (schema / models / migrations)", findings, notes };
}

// ════════════════════════════════════════════════════════════════════
//  CHECK 8 — Server-side raw-card guard present on payment routes
// ════════════════════════════════════════════════════════════════════

function checkGuard(files: string[]): CheckResult {
  const findings: Finding[] = [];
  const notes: string[] = [];

  const guardFile = files.find((f) => /lib\/assertNoRawCardData\.ts$/.test(f));
  if (!guardFile || !/export function assertNoRawCardData/.test(read(guardFile))) {
    findings.push({
      severity: "FAIL",
      file: guardFile ?? "apps/web/src/lib/assertNoRawCardData.ts",
      message: "Server-side raw-card guard (assertNoRawCardData) is missing",
    });
    return { id: "8", title: "Server-side raw-card guard on payment routes", findings, notes };
  }
  notes.push(`Guard present: ${guardFile}`);

  // Every payment route that reads a request body must reference the guard.
  const routes = files.filter(
    (f) => PAYMENT_ROUTE_RE.test(f) && /route\.(ts|js)$/.test(f) && !/webhook/.test(f),
  );
  for (const f of routes) {
    const raw = read(f);
    const readsBody = /request\.(json|text|formData)\s*\(/.test(raw);
    if (!readsBody) continue;
    if (!/assertNoRawCardData/.test(raw)) {
      findings.push({
        severity: "FAIL",
        file: f,
        message: "Payment route reads a request body but does not call assertNoRawCardData()",
      });
    }
  }

  // Webhook should verify the Stripe signature and fail closed without a secret.
  // constructEvent accepts an empty secret, so `?? ""` / missing-env paths are an auth bypass.
  const webhook = files.find((f) => PAYMENT_ROUTE_RE.test(f) && /webhook\/route\.(ts|js)$/.test(f));
  if (webhook) {
    const webhookSource = read(webhook);
    if (!/webhooks\.constructEvent/.test(webhookSource)) {
      findings.push({
        severity: "FAIL",
        file: webhook,
        message: "Webhook route does not verify the Stripe signature (stripe.webhooks.constructEvent)",
      });
    } else {
      notes.push("Webhook verifies the Stripe signature.");
    }
    const defaultsEmptySecret =
      /STRIPE_WEBHOOK_SECRET\s*\?\?\s*["']["']/.test(webhookSource) ||
      /STRIPE_WEBHOOK_SECRET\s*\|\|\s*["']["']/.test(webhookSource);
    const failsClosedWithoutSecret =
      /STRIPE_WEBHOOK_SECRET/.test(webhookSource) &&
      (/!webhookSecret/.test(webhookSource) ||
        /!.*STRIPE_WEBHOOK_SECRET/.test(webhookSource) ||
        /Webhook not configured/.test(webhookSource)) &&
      /503/.test(webhookSource);
    if (defaultsEmptySecret || !failsClosedWithoutSecret) {
      findings.push({
        severity: "FAIL",
        file: webhook,
        message:
          "Webhook must fail closed when STRIPE_WEBHOOK_SECRET is missing/empty (do not default to \"\")",
      });
    } else {
      notes.push("Webhook fails closed when STRIPE_WEBHOOK_SECRET is unset.");
    }
  }

  return { id: "8", title: "Server-side raw-card guard on payment routes", findings, notes };
}

// ════════════════════════════════════════════════════════════════════
//  Runner
// ════════════════════════════════════════════════════════════════════

function main(): void {
  const files = listTrackedFiles();

  const results: CheckResult[] = [
    checkPanAndFields(files),
    checkSecrets(files),
    checkClientLeakage(files),
    checkLogging(files),
    checkBrowserStorage(files),
    checkEnvAndGit(files),
    checkCvvNeverStored(files),
    checkGuard(files),
  ];

  console.log(`\n${BOLD}OneCard security pre-flight scanner${RESET}`);
  console.log(`${DIM}Scanned ${files.length} tracked files. This is a pre-flight gate, NOT PCI certification.${RESET}\n`);

  let failCount = 0;
  let warnCount = 0;

  for (const r of results) {
    const fails = r.findings.filter((f) => f.severity === "FAIL").length;
    const warns = r.findings.filter((f) => f.severity === "WARN").length;
    failCount += fails;
    warnCount += warns;
    const status = fails > 0 ? `${RED}${BOLD}FAIL${RESET}` : warns > 0 ? `${YELLOW}WARN${RESET}` : `${GREEN}ok${RESET}`;
    console.log(`${BOLD}Check ${r.id}${RESET} — ${r.title}  [${status}]`);
    for (const f of r.findings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      console.log(`  ${sev(f.severity)}  ${loc}\n        ${f.message}`);
    }
    for (const note of r.notes) console.log(`  ${DIM}· ${note}${RESET}`);
    console.log("");
  }

  const pass = failCount === 0;
  const banner = pass
    ? `${GREEN}${BOLD}  PASS  ${RESET}`
    : `${RED}${BOLD}  FAIL  ${RESET}`;
  console.log("─".repeat(64));
  console.log(`${banner}  ${failCount} failure(s), ${warnCount} warning(s) across ${results.length} checks.`);
  console.log(
    `${DIM}Pre-flight only. Real-money / real-user use still requires Stripe live\nonboarding, a completed PCI SAQ, and a professional security/privacy review.${RESET}\n`,
  );

  process.exitCode = pass ? 0 : 1;
}

main();
