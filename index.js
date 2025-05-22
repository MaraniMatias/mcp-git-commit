import path from "path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import simpleGit from "simple-git";

// const REPO_DIR = process.env.PWD;
// if (!REPO_DIR) {
//   console.error("Please set PWD environment variable to the root of the repository");
//   process.exit(1);
// }

const server = new McpServer({
  name: "git-commit",
  version: "1.0.0",
});

server.tool(
  "generate git commit",
  {
    type: z.enum(["feat", "fix", "chore", "docs", "refactor"]),
    scope: z.string().optional(),
    message: z.string().min(1).max(70),
    description: z.string().optional(),
  },
  async ({ type, description, scope, message }) => ({
    content: [
      {
        type: "text",
        text: `${type}${scope ? `(${scope})` : ""}: ${message}\n\nAI:\n${description || ""}`,
      },
    ],
  }),
);

/**
 * Obtiene diff completo de git como texto
 * @param {import("simple-git").SimpleGit} git
 * @returns {Promise<{diff:string, stat: import("simple-git").repo.diffSummary}>}
 */
function getDiffText(git) {
  return async () => {
    try {
      const diff = await git.diff();
      const stat = await git.diffSummary();
      return { diff, stat };
    } catch (err) {
      throw new Error(`Error obteniendo diff: ${err}`);
    }
  };
}

/**
 * Inferir posibles scopes a partir de las rutas de archivos modificados
 * @param {string[]} files
 * @returns {string}
 */
function inferScopes(files) {
  const scopes = Array.from(
    new Set(files.map((f) => path.dirname(f).split(path.sep)[0]?.replaceAll(".", "")).filter(Boolean)),
  );
  return scopes.length ? scopes : [];
}

server.tool(
  "get git diff",
  {
    repoPath: z.string(),
  },
  async ({ repoPath }) => {
    const git = simpleGit(path.normalize(repoPath));
    const { diff, stat } = await getDiffText(git)();
    const files = stat.files.map((f) => f.file);
    const possibleScopes = inferScopes(files);

    return {
      content: [
        {
          diff,
          stat,
          files,
          possibleScopes,
        },
      ],
    };
  },
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
