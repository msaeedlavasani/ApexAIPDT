/**
 * DPT-PROVIDER-004.F — DPT MCP Client
 *
 * Minimal MCP JSON-RPC 2.0 client for testing the DPT MCP Server.
 * Spawns server as child process, communicates via stdio.
 */

import { spawn } from "child_process";
import { randomUUID } from "crypto";

export class DPTMCPClient {
  constructor({ server_path, store }) {
    this.server_path = server_path;
    this.store = store;
    this.server = null;
    this.pending = new Map();
    this.buffer = "";
    this.connected = false;
  }

  /**
   * Connect by spawning the server as a child process.
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.server = spawn("node", [this.server_path], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      });

      this.server.stdout.on("data", (data) => {
        this.buffer += data.toString();
        this._processBuffer();
      });

      this.server.stderr.on("data", (data) => {
        // Server errors — log but don't fail
      });

      this.server.on("error", reject);
      this.server.on("close", () => {
        this.connected = false;
      });

      // Initialize handshake
      this.sendRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "dpt-mcp-test-client", version: "0.1.0" },
      }).then((result) => {
        this.connected = true;
        // Send initialized notification
        this.sendNotification("notifications/initialized", {});
        resolve(result);
      }).catch(reject);
    });
  }

  /**
   * Disconnect from the server.
   */
  disconnect() {
    if (this.server) {
      this.server.kill();
      this.server = null;
    }
    this.connected = false;
  }

  /**
   * Send a JSON-RPC 2.0 request and wait for response.
   */
  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const request = { jsonrpc: "2.0", id, method, params };

      this.pending.set(id, { resolve, reject });

      const raw = JSON.stringify(request) + "\n";
      this.server.stdin.write(raw);
    });
  }

  /**
   * Send a JSON-RPC 2.0 notification (no response expected).
   */
  sendNotification(method, params = {}) {
    const notification = { jsonrpc: "2.0", method, params };
    const raw = JSON.stringify(notification) + "\n";
    this.server.stdin.write(raw);
  }

  /**
   * Call an MCP tool.
   */
  async callTool(name, args = {}) {
    const result = await this.sendRequest("tools/call", { name, arguments: args });
    return result.result ?? result;
  }

  /**
   * List available tools.
   */
  async listTools() {
    const result = await this.sendRequest("tools/list");
    return result.result?.tools ?? [];
  }

  /**
   * Process buffered responses.
   */
  _processBuffer() {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response = JSON.parse(line);
        const pending = this.pending.get(response.id);
        if (pending) {
          this.pending.delete(response.id);
          if (response.error) {
            pending.reject(response.error);
          } else {
            pending.resolve(response);
          }
        }
      } catch {
        // Ignore parse errors for notifications
      }
    }
  }
}

/**
 * Create a client that communicates directly with a store (no child process).
 * Useful for in-process testing.
 */
export class DPTMCPDirectClient {
  constructor({ store }) {
    this.store = store;
    this.connected = false;
  }

  async connect() {
    this.connected = true;
    return { serverInfo: { name: "dpt-mcp-server", version: "0.1.0" } };
  }

  disconnect() {
    this.connected = false;
  }

  async callTool(name, args = {}) {
    const { handleRequest } = await import("./dpt-mcp-server.mjs");
    const request = {
      jsonrpc: "2.0",
      id: randomUUID(),
      method: "tools/call",
      params: { name, arguments: args },
    };
    const response = handleRequest(request, this.store);
    return response?.result ?? { isError: true, content: [{ type: "text", text: "No response" }] };
  }

  async listTools() {
    const { DPT_TOOLS } = await import("./dpt-mcp-server.mjs");
    return DPT_TOOLS;
  }
}
