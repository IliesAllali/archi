#!/usr/bin/env node
/**
 * Arbo MCP Setup — connects Claude Code to arbo.patchou.cloud
 *
 * Usage:
 *   npm run setup:mcp               → production (arbo.patchou.cloud)
 *   npm run setup:mcp -- --local    → local dev  (localhost:3000)
 *   npm run setup:mcp -- --reset    → remove existing config and reconfigure
 */

import { createInterface } from "readline"
import { execSync } from "child_process"

const MCP_NAME = "arbo"

// ─── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const isLocal = args.includes("--local")
const isReset = args.includes("--reset")
const BASE = isLocal ? "http://localhost:3000" : "https://arbo.patchou.cloud"

// ─── Colors (works in PowerShell, CMD, and unix terminals) ────────────────────

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log = (msg = "") => console.log(`  ${msg}`)
const ok = (msg) => log(`${c.green}+${c.reset} ${msg}`)
const fail = (msg) => { log(`${c.red}x ${msg}${c.reset}`); process.exit(1) }
const info = (msg) => log(`${c.dim}${msg}${c.reset}`)

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((r) => rl.question(`  ${question}`, (a) => { rl.close(); r(a.trim()) }))
}

function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(`  ${question}`)

    // Non-TTY (piped input): fall back to plain readline
    if (!process.stdin.isTTY) {
      const rl = createInterface({ input: process.stdin, output: process.stdout })
      rl.question("", (a) => { rl.close(); resolve(a.trim()) })
      return
    }

    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding("utf8")

    let pw = ""
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener("data", onData)
        process.stdout.write("\n")
        resolve(pw)
      } else if (ch === "\u0003") {
        process.stdout.write("\n")
        process.exit(1)
      } else if (ch === "\u007f" || ch === "\b") {
        if (pw.length) { pw = pw.slice(0, -1); process.stdout.write("\b \b") }
      } else {
        pw += ch
        process.stdout.write("*")
      }
    }
    process.stdin.on("data", onData)
  })
}

function parseCookies(headers) {
  const pairs = []
  let csrf = null
  for (const raw of headers.getSetCookie?.() ?? []) {
    const [kv] = raw.split(";")
    pairs.push(kv.trim())
    if (kv.startsWith("arbo_csrf=")) csrf = kv.split("=").slice(1).join("=")
  }
  return { cookie: pairs.join("; "), csrf }
}

function mcpExists() {
  try {
    const out = execSync("claude mcp list", { encoding: "utf8", stdio: "pipe" })
    return out.includes(MCP_NAME)
  } catch { return false }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log()
  log(`${c.bold}Arbo MCP Setup${c.reset}  ${c.dim}${isLocal ? "local" : BASE}${c.reset}`)
  console.log()

  // Reset existing config if requested
  if (isReset) {
    try { execSync(`claude mcp remove ${MCP_NAME}`, { stdio: "pipe" }) } catch {}
    ok("Removed existing MCP config")
  } else if (mcpExists()) {
    log(`${c.yellow}MCP '${MCP_NAME}' is already configured.${c.reset}`)
    log(`Run with --reset to reconfigure.`)
    console.log()
    process.exit(0)
  }

  // 1. Credentials
  const email = await ask("Email: ")
  const password = await askPassword("Password: ")
  if (!email || !password) fail("Email and password are required.")

  // 2. Login
  info("Authenticating...")
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  })
  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}))
    fail(err.error || `Login failed (${loginRes.status})`)
  }

  const { cookie, csrf } = parseCookies(loginRes.headers)
  if (!cookie.includes("arbo_access")) fail("No session cookie received.")

  const { user } = await loginRes.json()
  ok(`${user.name} (${user.email})`)

  // 3. Create account-level MCP token (access to all user's projects)
  info("Creating account MCP token...")
  const tokenRes = await fetch(`${BASE}/api/me/mcp-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
    body: JSON.stringify({ name: `Claude Code (${new Date().toLocaleDateString()})` }),
  })
  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}))
    fail(err.error || `Token creation failed (${tokenRes.status})`)
  }

  const { token } = await tokenRes.json()
  ok(`Token: ${token.slice(0, 12)}${"*".repeat(8)}`)

  // 5. Register MCP in Claude Code (native Streamable HTTP, no mcp-remote needed)
  info("Registering MCP server...")

  const mcpCmd = `claude mcp add ${MCP_NAME} -s user --transport streamable-http "${BASE}/api/mcp" --header "Authorization: Bearer ${token}"`

  try {
    execSync(mcpCmd, { stdio: "pipe" })
    ok("MCP registered")
  } catch {
    log(`${c.yellow}Auto-config failed. Run manually:${c.reset}`)
    console.log()
    log(mcpCmd)
    console.log()
    process.exit(1)
  }

  // Done
  console.log()
  log(`${c.green}${c.bold}Ready.${c.reset} Restart Claude Code to activate.\n`)
  log(`${c.dim}Tools: list_projects, get_project, create_project,`)
  log(`create_node, bulk_create_nodes, update_node, delete_node${c.reset}`)
  console.log()
}

main().catch((err) => { fail(err.message) })
