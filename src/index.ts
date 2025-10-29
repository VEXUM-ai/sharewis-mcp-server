import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";
import {
  zenDeskTools,
  createZendeskClient,
  searchTickets,
  getTicket,
  getTicketDetails,
  getLinkedIncidents,
} from "./tools/index.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";

// ===== 再エクスポート =====
export {
  createZendeskClient,
  searchTickets,
  getTicket,
  getTicketDetails,
  getLinkedIncidents,
} from "./tools/index.js";
export type { ZendeskConfig } from "./tools/index.js";

// ===== パスとバージョン情報の取得 =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8")
);
const VERSION = packageJson.version;

// ===== メイン関数 =====
async function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // MCP サーバーを初期化
  const server = new McpServer(
    {
      name: "zendesk-mcp",
      version: VERSION,
    },
    {
      capabilities: {
        logging: {}, // ログ出力対応
      },
    }
  );

  // Zendesk 用ツールを登録
  zenDeskTools(server);

  // HTTP トランスポートを設定（Render などに対応）
  const transport = new HttpServerTransport({
    app, // Express アプリを利用
    path: "/mcp", // MCP エンドポイントパス
  });
  await server.connect(transport);

  // OAuth 設定用のダミーエンドポイント
  app.get("/oauth/config", (req, res) => {
    res.json({
      client_id: "dummy-client-id",
      authorization_url: "https://example.com/oauth/authorize",
      token_url: "https://example.com/oauth/token",
      scopes: ["read", "write"],
    });
  });

  // 動作確認用エンドポイント
  app.get("/", (req, res) => {
    res.send(`✅ Zendesk MCP Server v${VERSION} is running.`);
  });

  // サーバーを起動
  app.listen(PORT, () => {
    console.log(`✅ Zendesk MCP Server v${VERSION} running on port ${PORT}`);
    console.log(`🌐 MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}

// ===== エラー処理 =====
main().catch((error) => {
  console.error("❌ Fatal error in main():", error);
  process.exit(1);
});
