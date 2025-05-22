import path from "path";
import { fileURLToPath } from "url";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import simpleGit from "simple-git";

// Determine repository directory (env override or project root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_DIR = process.env.PWD || path.resolve(__dirname, "..");

// Create MCP server and register tools
const server = new McpServer({
  name: "git-mcp",
  version: "1.0.0",
});

server.tool(
  "generate_commit",
  {
    type: z.enum(["feat", "fix", "chore", "docs", "refactor"]),
    scope: z.string().optional(),
    message: z.string().min(1).max(70),
    description: z.string().optional(),
  },
  async ({ type, scope, message, description }) => {
    const header = `${type}${scope ? `(${scope})` : ""}: ${message}`;
    const body = description ? `AI:\n${description}` : "";
    return { content: [{ type: "text", text: `${header}\n\n${body}` }] };
  },
);

/**
 * Infer possible scopes from file paths
 * @param {string[]} files
 * @returns {string[]}
 */
function inferScopes(files) {
  const scopes = new Set();
  files.forEach((f) => {
    const [dir] = path.dirname(f).split(path.sep);
    if (dir?.replaceAll(".", "")) scopes.add(dir);
  });
  return Array.from(scopes);
}

server.tool(
  "diff",
  {
    repoPath: z.string().default(DEFAULT_REPO_DIR),
  },
  async ({ repoPath }) => {
    try {
      const git = simpleGit(path.normalize(repoPath));
      const diff = await git.diff();
      const stat = await git.diffSummary();
      const files = stat.files.map((f) => f.file);
      const possibleScopes = inferScopes(files);
      return { content: [{ type: "text", text: JSON.stringify({ diff, stat, files, possibleScopes }) }] };
    } catch (err) {
      return { content: [{ type: "text", text: err.message }] };
    }
  },
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
