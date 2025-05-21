# mcp-git-commit

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.js
```

This project was created using `bun init` in bun v1.2.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Using with model

```jsonc
// nvim ~/.mcp.json
{
  "mcpServers": {
    "git-commit": {
      "command": "node",
      "args": ["/Users/matiasmarani/Trabajo/mcp-git-commit/index.js"],
    },
  },
}
```

```bash
ollama server
mcphost -m ollama:qwen3:8b
```
