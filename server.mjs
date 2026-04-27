import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlFile = path.join(__dirname, "hosa-blood-drive-accountability-form.html");
const port = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  const urlPath = req.url?.split("?")[0] ?? "/";
  if (urlPath !== "/" && urlPath !== "/index.html") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  fs.readFile(htmlFile, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Could not load form.");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(data);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log("Listening on http://0.0.0.0:" + port);
});
