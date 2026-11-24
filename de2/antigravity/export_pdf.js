// Zero-dependency PDF Exporter using Node 24 built-in WebSocket + Chrome DevTools Protocol (Page.printToPDF)
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];

function findBrowser() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Neither Chrome nor Edge found");
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForDebugger(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch (_) {}
    await sleep(250);
  }
  throw new Error("Timed out waiting for Chrome DevTools Protocol");
}

function createCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();

    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const id = nextId++;
          return new Promise((res, rej) => {
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        close() { ws.close(); }
      });
    });

    ws.addEventListener("message", ev => {
      const msg = JSON.parse(ev.data.toString());
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
    });

    ws.addEventListener("error", reject);
  });
}

async function renderHtmlToPdf(port, htmlPath, outPdfPath) {
  const fileUrl = "file:///" + htmlPath.replace(/\\/g, "/");
  const targetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(fileUrl)}`, { method: "PUT" });
  const target = await targetRes.json();
  const cdp = await createCdpClient(target.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // Wait until document readyState === 'complete' and all images/fonts loaded
  for (let i = 0; i < 30; i++) {
    const check = await cdp.send("Runtime.evaluate", {
      expression: "document.readyState === 'complete' && Array.from(document.images).every(img => img.complete)",
      returnByValue: true
    });
    if (check.result && check.result.value === true) break;
    await sleep(250);
  }
  await sleep(500);

  const pdf = await cdp.send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false
  });

  const buf = Buffer.from(pdf.data, "base64");
  fs.writeFileSync(outPdfPath, buf);
  console.log(`Saved PDF (${buf.length} bytes): ${outPdfPath}`);
  cdp.close();
}

(async () => {
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
  fs.mkdirSync(outDir, { recursive: true });

  const browserBin = findBrowser();
  const port = 9345;
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy_cdp_pdf_"));

  const proc = spawn(browserBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitForDebugger(port);
    await renderHtmlToPdf(
      port,
      path.join(__dirname, "design_pdf", "Ban_Thiet_Ke_Giao_Dien_De2.html"),
      path.join(outDir, "01_Ban_Thiet_Ke_Giao_Dien_De2.pdf")
    );
    await renderHtmlToPdf(
      port,
      path.join(__dirname, "docs", "Ban_Thuyet_Minh_De2_In_A4.html"),
      path.join(outDir, "03_Ban_Thuyet_Minh_De2.pdf")
    );
  } finally {
    proc.kill();
  }
})();
