# mcp-git-commit

![./test_imge.png](./test_imge.png)

https://github.com/modelcontextprotocol/typescript-sdk

[modelcontextprotocol.io](https://modelcontextprotocol.io/introduction)

[typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)


To install dependencies:

[https://www.npmjs.com/package/simple-git](https://www.npmjs.com/package/simple-git)

```bash
bun install
```

To run:

```bash
bun start
```

To dev:

```bash
bun dev
```

This project was created using `bun init` in bun v1.2.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Using with model

```jsonc
// nvim ~/.mcp.json
{
  "mcpServers": {
    "git-commit": {
      "command": "node",
      "args": ["../../mcp-git-commit/index.js"],
      "env": {
        "PWD": "",
      },
    },
  },
}
```

```bash
ollama server
mcphost -m ollama:qwen3:8b
```
