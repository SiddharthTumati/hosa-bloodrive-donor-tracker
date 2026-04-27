import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlFile = path.join(__dirname, "hosa-blood-drive-accountability-form.html");
const port = Number(process.env.PORT) || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl ?? "", supabaseServiceRoleKey ?? "", {
  auth: { persistSession: false }
});

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url?.split("?")[0] ?? "/";

  if (req.method === "GET" && (urlPath === "/" || urlPath === "/index.html")) {
    fs.readFile(htmlFile, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Could not load form.");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  if (req.method === "POST" && urlPath === "/api/submit") {
    try {
      const body = await readJsonBody(req);

      const payload = {
        first_name: String(body.first_name ?? "").trim(),
        last_name: String(body.last_name ?? "").trim(),
        email: String(body.email ?? "").trim(),
        signed_up_donate: Boolean(body.signed_up_donate),
        recruited: Boolean(body.recruited),
        recruit_or_donating_statement: String(body.recruit_or_donating_statement ?? "").trim(),
        recruit_contact: String(body.recruit_contact ?? "").trim(),
        understand: Boolean(body.understand)
      };

      const missing =
        !payload.first_name ||
        !payload.last_name ||
        !payload.email ||
        !payload.recruit_or_donating_statement ||
        !payload.recruit_contact ||
        payload.understand !== true;

      if (missing) {
        sendJson(res, 400, { ok: false, error: "Missing required fields." });
        return;
      }

      const { error } = await supabase.from("blood_drive_submissions").insert([payload]);

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 200, { ok: true });
      return;
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e) });
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "0.0.0.0", () => {
  console.log("Listening on http://0.0.0.0:" + port);
});
