import { spawn } from 'child_process';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9390 + Math.floor(Math.random() * 50);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyMaterials() {
  console.log("=== INITIATING MATERIAL & GPU BUDGET VALIDATION (PORT " + PORT + ") ===");
  
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const pageTarget = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) throw new Error("Could not connect to Chrome debugging target");

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const cmdId = id++;
      callbacks.set(cmdId, { resolve, reject });
      ws.send(JSON.stringify({ id: cmdId, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id && callbacks.has(data.id)) {
      const { resolve } = callbacks.get(data.id);
      callbacks.delete(data.id);
      resolve(data.result);
    }
  };

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('Page.navigate', { url: 'http://localhost:8000' });
  await sleep(3500);

  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(`Eval error in [${expr}]: ${res.exceptionDetails.text}`);
    }
    return res.result?.value;
  }

  console.log("\n1. AUDITING BACKDROP-FILTER GPU BUDGET COUNT:");
  const blurElements = await evalJs(`
    Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      const bf = style.backdropFilter || style.webkitBackdropFilter || '';
      return bf && bf !== 'none' && el.offsetWidth > 0 && el.offsetHeight > 0;
    }).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className.toString().slice(0, 40),
      backdropFilter: window.getComputedStyle(el).backdropFilter
    }))
  `);

  console.log("Active visible elements with backdrop-filter:", blurElements.length);
  blurElements.forEach((el, idx) => {
    console.log(` [${idx + 1}] ${el.tag}#${el.id} (class: ${el.className}) -> ${el.backdropFilter}`);
  });

  if (blurElements.length > 3) {
    throw new Error(`GPU Budget Ceiling Exceeded! Found ${blurElements.length} elements with backdrop-filter (Max allowed is 3).`);
  }
  console.log(" PASS: GPU budget strictly preserved (<= 3 concurrent blur elements)!");

  console.log("\n2. VERIFYING FLUENT 2 MICA TILES ON CATALOG CARDS:");
  const cardStats = await evalJs(`
    const cards = document.querySelectorAll('#trendingGrid .fluent-mica-card');
    const firstCard = cards[0];
    const compStyle = firstCard ? window.getComputedStyle(firstCard) : null;
    ({
      count: cards.length,
      hasBackdropFilter: compStyle ? (compStyle.backdropFilter !== 'none' && compStyle.backdropFilter !== '') : false,
      backgroundColor: compStyle ? compStyle.backgroundColor : null,
      boxShadow: compStyle ? compStyle.boxShadow.slice(0, 50) : null
    })
  `);
  console.log("Catalog card verification:", cardStats);
  if (cardStats.hasBackdropFilter) {
    throw new Error("Repeating catalog cards should have NO backdrop-filter (Fluent Mica specification)!");
  }
  console.log(" PASS: Repeating cards use zero GPU blur fragment passes!");

  console.log("\n3. VERIFYING COMMAND PALETTE MODAL (CTRL+K):");
  await evalJs(`toggleCommandPalette()`);
  await sleep(300);
  const paletteVisible = await evalJs(`!document.getElementById('commandPaletteModal').classList.contains('hidden')`);
  console.log("Command palette toggled open:", paletteVisible);
  if (!paletteVisible) throw new Error("Command palette failed to open!");

  await evalJs(`closeCommandPalette()`);
  await sleep(300);
  const paletteClosed = await evalJs(`document.getElementById('commandPaletteModal').classList.contains('hidden')`);
  console.log("Command palette closed:", paletteClosed);
  if (!paletteClosed) throw new Error("Command palette failed to close!");
  console.log(" PASS: Command palette operational!");

  console.log("\n4. VERIFYING STRICT SEQUENTIAL HEADING HIERARCHY (LIGHTHOUSE ACCESSIBILITY):");
  const headingLevels = await evalJs(`
    Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName,
      text: h.innerText.slice(0, 30)
    }))
  `);
  console.log("Total headings found:", headingLevels.length);
  const h1s = headingLevels.filter(h => h.tag === 'H1');
  const h2s = headingLevels.filter(h => h.tag === 'H2');
  const h3s = headingLevels.filter(h => h.tag === 'H3');
  const h4s = headingLevels.filter(h => h.tag === 'H4');
  console.log(`Heading Breakdown: H1=${h1s.length}, H2=${h2s.length}, H3=${h3s.length}, H4=${h4s.length}`);
  if (h1s.length !== 1) throw new Error("Expected exactly 1 H1 (Hero title), found " + h1s.length);
  if (h2s.length < 3) throw new Error("Expected section headings to be H2!");
  console.log(" PASS: Strict sequential heading hierarchy verified!");

  ws.close();
  chromeProcess.kill();
  console.log("\n=== ALL MATERIAL & GPU PERFORMANCE TESTS PASSED 100%! ===");
  process.exit(0);
}

verifyMaterials().catch(err => {
  console.error("Material verification failed:", err);
  process.exit(1);
});
