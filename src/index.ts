import { startServer } from "./server.js";

startServer().catch((err) => {
  console.error("[LinkedIn MCP] Fatal error:", err);
  process.exit(1);
});