# LinkedIn MCP Server

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Model Context Protocol](https://img.shields.io/badge/MCP-compatible-6E56CF)
![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

> A [Model Context Protocol](https://modelcontextprotocol.io) server that lets Claude — and any MCP-compatible client — **draft, format, analyze, and publish LinkedIn posts** straight from a chat.

Stop context-switching between your editor, a "best time to post" blog, and LinkedIn's composer. This server exposes five focused tools so the model can take a raw idea, shape it into a polished post, score it, generate hashtags, and (optionally) publish it to your profile — all without leaving the conversation.

---

## Features

- ✍️ **Draft** full posts from a topic, tone, and a few key points
- 🎨 **Format** raw text with clean line breaks, spacing, emojis, and hashtags
- 🏷️ **Generate** relevant, topic-aware hashtags
- 📊 **Analyze** a post and get a score plus concrete improvement suggestions
- 🚀 **Publish** to LinkedIn (or save as a draft) with configurable visibility
- 🧩 Works with **Claude Desktop** and any other MCP host over stdio
- ⚡ Bundled with **esbuild** for fast, low-memory builds

> **Note:** Four of the five tools (`draft_post`, `format_post`, `generate_hashtags`, `analyze_post`) run fully offline and need no credentials. Only `create_post` talks to the LinkedIn API and requires an access token.

---

## Available Tools

### `draft_post`
Generate a LinkedIn post template from a topic and tone.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `topic` | `string` | ✅ | — | Topic or subject of the post |
| `tone` | `string` (enum) | — | `professional` | One of `professional`, `casual`, `inspirational`, `educational`, `storytelling`, `promotional` |
| `key_points` | `string[]` | — | — | Key points to weave into the post |
| `target_audience` | `string` | — | — | Who the post is aimed at |
| `cta` | `string` | — | — | Custom call-to-action |
| `include_hashtags` | `boolean` | — | `true` | Whether to append hashtags |
| `hashtag_count` | `number` | — | `5` | Number of hashtags (0–10) |

### `format_post`
Format raw content with proper LinkedIn structure and hashtags.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | `string` | ✅ | — | Raw post text to format |
| `add_line_breaks` | `boolean` | — | `true` | Insert readable spacing and line breaks |
| `add_emojis` | `boolean` | — | `false` | Sprinkle in relevant emojis |
| `hashtags` | `string[]` | — | `[]` | Hashtags to append |

### `generate_hashtags`
Generate relevant LinkedIn hashtags for a topic.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `topic` | `string` | ✅ | — | Topic to generate hashtags for |
| `count` | `number` | — | `5` | Number of hashtags (1–10) |
| `custom_keywords` | `string[]` | — | — | Seed keywords to bias generation |

### `analyze_post`
Score a LinkedIn post and return improvement suggestions.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | `string` | ✅ | — | The post text to score and critique |

### `create_post`
Format and publish a LinkedIn post, or save it as a draft. **Requires LinkedIn API credentials.**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | `string` | ✅ | — | Post text (max 3000 characters) |
| `hashtags` | `string[]` | — | `[]` | Hashtags to include |
| `visibility` | `string` (enum) | — | `PUBLIC` | One of `PUBLIC`, `CONNECTIONS`, `LOGGED_IN` |
| `save_as_draft` | `boolean` | — | `false` | Save as a draft instead of publishing |

---

## Prerequisites

- **Node.js 18+** and npm (pnpm or yarn work too)
- An **MCP-compatible client** — e.g. [Claude Desktop](https://claude.ai/download)
- *(Only for publishing)* A **LinkedIn developer app** and an access token with the `w_member_social` scope

---

## Installation

```bash
git clone https://github.com/<your-username>/linkedin-mcp-server.git
cd linkedin-mcp-server
npm install
npm run build
```

The build step bundles `src/` into a single executable file at `dist/index.js`.

---

## Configuration

### 1. LinkedIn API credentials (for `create_post`)

1. Create an app in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps).
2. Request the **Share on LinkedIn** product to unlock the `w_member_social` scope.
3. Complete the OAuth 2.0 flow to obtain an **access token**.

Create a `.env` file in the project root:

```bash
LINKEDIN_ACCESS_TOKEN=your_access_token_here
# Optional — many setups resolve this from the token via /userinfo.
# Provide it only if your implementation expects it:
LINKEDIN_AUTHOR_URN=urn:li:person:XXXXXXXXXX
```

> ⚠️ Never commit your `.env` file or share your access token. Add `.env` to `.gitignore`.

### 2. Connect to Claude Desktop

Add the server to your Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["/absolute/path/to/linkedin-mcp-server/dist/index.js"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "your_access_token_here",
        "LINKEDIN_AUTHOR_URN": "urn:li:person:XXXXXXXXXX"
      }
    }
  }
}
```

Use an **absolute path** to `dist/index.js`, then fully **restart Claude Desktop**. The LinkedIn tools should now appear in the tools menu.

---

## Usage

Once connected, just talk to the model naturally — it will pick the right tool:

- *"Draft a LinkedIn post about shipping my first MCP server. Educational tone, aimed at junior devs, and include a CTA to star the repo."*
- *"Format this draft, add line breaks and a couple of emojis: …"*
- *"Generate 8 hashtags for a post about AI compliance for fintech."*
- *"Analyze this post and tell me how to make it stronger: …"*
- *"Publish this to LinkedIn, connections-only."*

---

## Development

### Why esbuild?

This project bundles with **esbuild** rather than `tsc`. Beyond being dramatically faster, it sidesteps the `JavaScript heap out of memory` errors that `tsc` can hit when bundling the MCP SDK and its dependencies. `tsc` is still used for type-checking only.

### Scripts

```bash
npm run build      # Bundle src/ -> dist/index.js with esbuild
npm run typecheck  # Type-check with tsc (no emit)
npm start          # Run the built server directly (stdio)
```

### Example `esbuild.config.js`

```js
import { build } from "esbuild";

build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  banner: { js: "#!/usr/bin/env node" },
}).catch(() => process.exit(1));
```

### Project structure

```
linkedin-mcp-server/
├── src/
│   ├── index.ts            # MCP server entry — stdio transport + tool registration
│   ├── tools/              # One module per tool
│   │   ├── draftPost.ts
│   │   ├── formatPost.ts
│   │   ├── generateHashtags.ts
│   │   ├── analyzePost.ts
│   │   └── createPost.ts
│   └── linkedin/           # LinkedIn API client (auth + posts)
├── dist/                   # Bundled output (esbuild)
├── esbuild.config.js
├── package.json
├── tsconfig.json
└── README.md
```

Built on top of [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk).

---

## Troubleshooting

**Tools don't appear in Claude Desktop.**
Double-check that the path in `args` is absolute, that `npm run build` succeeded, and fully quit and reopen Claude Desktop. On macOS, logs live at `~/Library/Logs/Claude/`.

**`JavaScript heap out of memory` during build.**
Use the bundled esbuild build (`npm run build`). If you reintroduce `tsc` for emitting, raise the heap limit with `NODE_OPTIONS=--max-old-space-size=4096`.

**`401 Unauthorized` from `create_post`.**
Your access token is missing, expired, or lacks the `w_member_social` scope. Regenerate it and update your `.env` / config.

---

## License

[MIT](LICENSE)

---

Built with the [Model Context Protocol](https://modelcontextprotocol.io). Contributions and issues welcome.
