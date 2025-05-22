// MCP Server imports
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Feature imports
import os from "os";
import path from "path";
import simpleGit from "simple-git";

const DEFAULT_REPO_DIR = process.env.PWD;

const server = new McpServer({
  name: "git-mcp",
  version: "1.0.0",
});

server.tool(
  "generate_commit",
  {
    type: z.enum(["feat", "fix", "chore", "docs", "refactor"]).describe("Type of commit"),
    scope: z.string().optional().describe("Scope of commit"),
    message: z.string().min(1).max(140).describe("Message of commit"),
    description: z.string().optional().describe("Description of commit"),
  },
  async ({ type, scope, message, description }) => {
    const header = `${type}${scope ? `(${scope})` : ""}: ${message}`;
    const body = description ? `AI:\n${description}` : "";

    return {
      content: [
        {
          type: "text",
          text: `${header}\n\n${body}`,
        },
      ],
    };
  },
);

/**
 * Infer possible scopes from file paths
 * @param {string[]} files - List of files with champes
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
    repoPath: z.string().default(DEFAULT_REPO_DIR).describe("Path to git repository"),
  },
  async ({ repoPath }) => {
    try {
      const git = simpleGit(path.normalize(repoPath));
      const diff = await git.diff();
      const stat = await git.diffSummary();
      const files = stat.files.map((f) => f.file);
      const possibleScopes = inferScopes(files);

      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, "git-diff.md");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ diff, stat, files, possibleScopes }),
          },
          {
            type: "resource",
            resource: {
              uri: tmpFile,
              text: `# Git diff\n\`\`\`diff\n${diff}\n\`\`\`\n`,
              mimeType: "text/markdown",
            },
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: err.message }] };
    }
  },
);

server.prompt(
  "prompt_git_commit",
  {
    repoPath: z.string().default(DEFAULT_REPO_DIR).describe("Path to git repository"),
  },
  ({ repoPath }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please analice this diff on "${repoPath}", for generate a commit messages, type, scope and commit description`,
        },
      },
    ],
  }),
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
