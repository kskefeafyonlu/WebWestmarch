import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import dotenv from "dotenv";
import { WorldRoom } from "./rooms/WorldRoom.js";

dotenv.config();

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck & status endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "online",
    service: "WebWestmarch Game Server",
    timestamp: Date.now(),
  });
});

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
    pingInterval: 5000,
    pingMaxRetries: 3,
  }),
});

// Register Colyseus Game Rooms
gameServer.define("world", WorldRoom);

gameServer.listen(port).then(() => {
  console.log(`=========================================`);
  console.log(`🗡️  WebWestmarch Authoritative Server`);
  console.log(`🌐  Listening on ws://localhost:${port}`);
  console.log(`🏥  Healthcheck: http://localhost:${port}/health`);
  console.log(`=========================================`);
});
