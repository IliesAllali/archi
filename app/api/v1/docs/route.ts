export const dynamic = "force-dynamic"

/**
 * API documentation page — serves HTML at GET /api/v1/docs
 */

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arbo API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e; background: #fafafa; line-height: 1.6; }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 32px; }
    h2 { font-size: 1.4rem; margin-top: 40px; margin-bottom: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
    h3 { font-size: 1.1rem; margin-top: 24px; margin-bottom: 8px; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1a1a2e; color: #e0e0e0; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; font-size: 0.85rem; line-height: 1.5; }
    pre code { background: none; padding: 0; color: inherit; }
    .method { display: inline-block; font-weight: 700; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px; margin-right: 8px; color: white; }
    .get { background: #10b981; }
    .post { background: #3b82f6; }
    .put { background: #f59e0b; }
    .patch { background: #8b5cf6; }
    .delete { background: #ef4444; }
    .endpoint { display: flex; align-items: center; margin: 8px 0; font-family: monospace; font-size: 0.95rem; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
    th { font-weight: 600; background: #f5f5f5; }
    .scope { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .warn { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 12px 0; }
  </style>
</head>
<body>

<h1>Arbo API</h1>
<p class="subtitle">Visual sitemap builder. Create and manage sitemap trees programmatically.</p>

<h2>Authentication</h2>
<p>All requests require a Bearer token from your project's AI token settings.</p>
<pre><code>Authorization: Bearer arbo_xxxxxxxxxxxxx</code></pre>
<p>Create tokens in <strong>Project Settings &rarr; AI Tokens</strong>. Each token is scoped to a single project.</p>

<h3>Scopes</h3>
<table>
  <tr><th>Scope</th><th>Permissions</th></tr>
  <tr><td><span class="scope">read</span></td><td>GET endpoints only</td></tr>
  <tr><td><span class="scope">write:nodes</span></td><td>+ Create, update, delete nodes</td></tr>
  <tr><td><span class="scope">write:project</span></td><td>+ Modify project metadata</td></tr>
  <tr><td><span class="scope">admin</span></td><td>+ Bulk import, all operations</td></tr>
</table>

<h3>Rate Limits</h3>
<p>60 requests per minute per token. Returns <code>429</code> with <code>Retry-After</code> header when exceeded.</p>

<h2>Endpoints</h2>

<h3>Project</h3>
<div class="endpoint"><span class="method get">GET</span> /api/v1/projects/{id}</div>
<p>Get project with all pages. <span class="scope">read</span></p>

<h3>Nodes (Pages)</h3>
<div class="endpoint"><span class="method get">GET</span> /api/v1/projects/{id}/nodes</div>
<p>List all active pages. <span class="scope">read</span></p>

<div class="endpoint"><span class="method post">POST</span> /api/v1/projects/{id}/nodes</div>
<p>Add a page. <span class="scope">write:nodes</span></p>
<pre><code>{
  "label": "Contact",
  "type": "form",
  "priority": "secondary",
  "parentId": "node_abc123",
  "description": "Contact form with email and phone"
}</code></pre>

<div class="endpoint"><span class="method get">GET</span> /api/v1/projects/{id}/nodes/{nid}</div>
<p>Get a single page. <span class="scope">read</span></p>

<div class="endpoint"><span class="method put">PUT</span> /api/v1/projects/{id}/nodes/{nid}</div>
<p>Update a page (partial update). <span class="scope">write:nodes</span></p>

<div class="endpoint"><span class="method delete">DELETE</span> /api/v1/projects/{id}/nodes/{nid}?cascade=true</div>
<p>Soft delete. Without <code>cascade</code>, children are reparented. <span class="scope">write:nodes</span></p>

<h3>Bulk Operations</h3>

<div class="endpoint"><span class="method patch">PATCH</span> /api/v1/projects/{id}/nodes/bulk</div>
<p>Update multiple pages at once. <span class="scope">write:nodes</span></p>
<pre><code>{
  "nodes": [
    { "id": "abc", "label": "New Label" },
    { "id": "def", "type": "landing" }
  ]
}</code></pre>

<div class="endpoint"><span class="method post">POST</span> /api/v1/projects/{id}/import</div>
<p>Import a full sitemap tree. Uses <code>temp_id</code> for parent references. <span class="scope">admin</span></p>
<pre><code>{
  "nodes": [
    { "temp_id": "home", "parent_temp_id": null, "label": "Accueil", "type": "home" },
    { "temp_id": "about", "parent_temp_id": "home", "label": "A propos" },
    { "temp_id": "contact", "parent_temp_id": "home", "label": "Contact", "type": "form" }
  ]
}</code></pre>

<div class="warn">
  <strong>Async imports:</strong> Imports with &gt;50 nodes return <code>202 Accepted</code> with a <code>jobId</code>.
  Poll <code>GET /api/v1/jobs/{jobId}</code> for status.
</div>

<h3>History</h3>
<div class="endpoint"><span class="method get">GET</span> /api/v1/projects/{id}/history</div>
<p>List version snapshots (max 10, FIFO). <span class="scope">read</span></p>

<h3>Jobs</h3>
<div class="endpoint"><span class="method get">GET</span> /api/v1/jobs/{jobId}</div>
<p>Poll async job status. Returns <code>status</code>: pending, running, done, failed.</p>

<h3>Health</h3>
<div class="endpoint"><span class="method get">GET</span> /api/health</div>
<p>No auth required. Returns <code>{ status, db, uptime, timestamp }</code>.</p>

<h2>Response Format</h2>
<pre><code>// Success
{ "success": true, "data": { ... }, "meta": { "timestamp": "...", "action": "...", "actor": "..." } }

// Error
{ "success": false, "error": { "code": "INSUFFICIENT_SCOPE", "message": "..." } }</code></pre>

<h2>MCP Server</h2>
<p>Arbo also exposes an MCP server at <code>/api/mcp</code> for Claude Desktop, Claude Code, and Cursor.</p>
<pre><code>// Claude Desktop config
{
  "mcpServers": {
    "arbo": {
      "url": "https://arbo.patchou.cloud/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_TOKEN" }
    }
  }
}</code></pre>

<h2>OpenAPI Schema</h2>
<p>Download the full OpenAPI 3.1 spec: <a href="/api/v1/openapi.json">/api/v1/openapi.json</a></p>

</body>
</html>`

export async function GET() {
  return new Response(HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
