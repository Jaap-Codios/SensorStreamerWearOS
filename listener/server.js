/* ------------------------------------------------------------------ */
/* 1) modules                                                         */
/* ------------------------------------------------------------------ */
import dgram from "node:dgram"; // UDP listener
import express from "express"; // static file server
import http from "node:http";
import { Server } from "socket.io"; // real-time bridge

/* ------------------------------------------------------------------ */
/* 2) constants                                                       */
/* ------------------------------------------------------------------ */
const UDP_PORT = 5005; // watch → PC
const HTTP_PORT = 3000; // PC  → browser

/* ------------------------------------------------------------------ */
/* 3) web layer                                                       */
/* ------------------------------------------------------------------ */
const app = express();
const server = http.createServer(app);
const io = new Server(server); // same origin → CORS free

app.use(express.static("public")); // serves index.html, CSS, JS
server.listen(HTTP_PORT, () =>
  console.log(`Web UI ⇒ http://localhost:${HTTP_PORT}`)
);

/* ------------------------------------------------------------------ */
/* 4) UDP layer + hit detector                                        */
/* ------------------------------------------------------------------ */
const udp = dgram.createSocket("udp4");
udp.bind(UDP_PORT, "0.0.0.0");

/* ---- hit-detector thresholds (tweak for your game style) ---------- */
const THRESH_G = 8 * 9.81; // 8 g ≈ 78 m s-2 -- typical padel smash peak :contentReference[oaicite:0]{index=0}
const THRESH_JERK = 3000; // 3 000 m s-3  (≈3 g jump over 10 ms) :contentReference[oaicite:1]{index=1}
const DEAD_MS = 150; // ignore hits closer than 150 ms apart :contentReference[oaicite:2]{index=2}

/* ---- state keepers ------------------------------------------------ */
let lastHit = 0;
let prevMag = 0;

/* ---- main packet handler ----------------------------------------- */
udp.on("message", (msg, rinfo) => {
  const parts = msg.toString().trim().split(",");
  if (parts.length < 7) return; // filter junk
  const [ax, ay, az] = parts.slice(-3).map(Number);
  const mag = Math.hypot(ax, ay, az); // m s-2

  /* ------------ simple rule-based impact test -------------------- */
  const now = Date.now();
  const jerk = Math.abs(mag - prevMag) / 0.02; // Δa / Δt ; 20 ms @50 Hz
  if (mag > THRESH_G && jerk > THRESH_JERK && now - lastHit > DEAD_MS) {
    console.log("JERK!");
    io.emit("hit", { ts: now, mag }); // **NEW EVENT**
    lastHit = now;
  }
  prevMag = mag;

  /* ------------ always stream raw sample ------------------------- */
  io.emit("imu", { mag, ax, ay, az, ts: now });
});
