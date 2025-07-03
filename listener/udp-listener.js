// udp-listener.js  — ES Module-variant (Node ≥18 met "type":"module" of .mjs)
import dgram from "dgram"; // core UDP API
import { Buffer } from "node:buffer";

const PORT = 5005; // SensorStreamerWearOS default :contentReference[oaicite:2]{index=2}
const HOST = "0.0.0.0"; // alle netwerkinterfaces

const server = dgram.createSocket("udp4"); // IPv4 socket

server.on("error", (err) => {
  console.error("❌  UDP-fout:", err);
  server.close();
});

server.on("listening", () => {
  const addr = server.address();
  console.log(`✅  Luistert op ${addr.address}:${addr.port}`);
});

server.on("message", (msg, rinfo) => {
  // Toon eerste 80 bytes zodat de console leesbaar blijft
  console.log(
    `[${new Date().toISOString()}] ${rinfo.address}:${rinfo.port} → ${msg
      .toString("utf8")
      .slice(0, 80)}`
  );
});

server.bind(PORT, HOST); // start de socket :contentReference[oaicite:3]{index=3}
