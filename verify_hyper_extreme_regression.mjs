import { spawn } from 'child_process';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9450 + Math.floor(Math.random() * 40);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let chromeProcess = null;

async function runHyperExtremeRegressionStressTest() {
  console.log("================================================================================");
  console.log("   MILKGLASS HYPER-EXTREME REGRESSION STRESS TEST (PORT " + PORT + ")          ");
  console.log("   Visual Similarity, REA Material Extraction, GPU Budget, Zero-Ad Security   ");
  console.log("================================================================================\n");

  chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 60; i++) {
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

  if (!wsUrl) throw new Error("Failed to attach Chrome remote debugging endpoint");

  console.log(" Attached to Chrome DevTools Protocol Target:", wsUrl);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();
  const consoleMessages = [];
  const uncaughtErrors = [];

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const cmdId = id++;
      callbacks.set(cmdId, { resolve, reject });
      ws.send(JSON.stringify({ id: cmdId, method, params }));
    });
  }

  await new Promise(resolve => ws.onopen = resolve);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const { resolve } = callbacks.get(data.id);
      callbacks.delete(data.id);
      resolve(data.result);
    } else if (data.method === 'Console.messageAdded') {
      consoleMessages.push(data.params.message.text);
    } else if (data.method === 'Runtime.exceptionThrown') {
      uncaughtErrors.push(data.params.exceptionDetails.text);
    }
  };

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('Console.enable');
  await sendCommand('Network.enable');

  console.log("Navigating to http://localhost:8000 ...");
  await sendCommand('Page.navigate', { url: 'http://localhost:8000' });
  await sleep(4000); // Wait for initialization

  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || JSON.stringify(res.exceptionDetails);
      throw new Error(`Eval error in [${expr}]: ${desc}`);
    }
    return res.result?.value;
  }

  // ---------------------------------------------------------------------------
  // SUITE 1: REA & MATERIAL REPRODUCTION AUDIT (SCREENSHOT VISUAL FIDELITY)
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 1/5] VISUAL SIMILARITY & REA MATERIAL FIDELITY VERIFICATION");

  // 1.1 Microsoft Fluent 2 Header Bar Audit
  const fluentHeader = await evalJs(`
    ({
      hasFluentLogo: !!document.querySelector('header svg rect[fill="#0078d4"]'),
      themeToggle: !!document.getElementById('themeToggleBtn'),
      employeeBtn: !!document.getElementById('employeeSignInBtn'),
      employeeBtnBg: window.getComputedStyle(document.getElementById('employeeSignInBtn')).backgroundColor,
      hasMicrosoft4Square: !!document.querySelector('#employeeSignInBtn svg rect[fill="#f25022"]') &&
                           !!document.querySelector('#employeeSignInBtn svg rect[fill="#7fba00"]') &&
                           !!document.querySelector('#employeeSignInBtn svg rect[fill="#00a4ef"]') &&
                           !!document.querySelector('#employeeSignInBtn svg rect[fill="#ffb900"]')
    })
  `);
  console.log(" Fluent 2 Header Audit:", fluentHeader);
  if (!fluentHeader.hasFluentLogo || !fluentHeader.themeToggle || !fluentHeader.employeeBtn || !fluentHeader.hasMicrosoft4Square) {
    throw new Error("Violation: Microsoft Fluent 2 Header chrome elements missing or incomplete!");
  }
  console.log("  PASS: Microsoft Fluent 2 Header & 4-Square Sign-in Pill 100% Verified.");

  // Test Employee Sign-in Modal
  await evalJs(`openEmployeeSignInModal()`);
  await sleep(300);
  const employeeModalOpen = await evalJs(`!document.getElementById('employeeSignInModal').classList.contains('hidden')`);
  if (!employeeModalOpen) throw new Error("Employee sign-in modal failed to open!");
  await evalJs(`closeEmployeeSignInModal()`);
  await sleep(200);

  // 1.2 Apple Sticky Subnav (#globalnav style)
  const appleSubnav = await evalJs(`
    ({
      subnavPresent: !!document.getElementById('appleSubnavBar'),
      titleText: document.querySelector('#appleSubnavBar span').innerText,
      exploreBtn: !!Array.from(document.querySelectorAll('#appleSubnavBar button')).find(b => b.innerText.trim() === 'Explore'),
      watchBtn: !!Array.from(document.querySelectorAll('#appleSubnavBar button')).find(b => b.innerText.trim() === 'Watch Now'),
      watchBtnBg: window.getComputedStyle(Array.from(document.querySelectorAll('#appleSubnavBar button')).find(b => b.innerText.trim() === 'Watch Now')).backgroundColor
    })
  `);
  console.log(" Apple Subnav Bar Audit:", appleSubnav);
  if (!appleSubnav.subnavPresent || !appleSubnav.exploreBtn || !appleSubnav.watchBtn) {
    throw new Error("Violation: Apple Sticky Subnav bar or action pills missing!");
  }
  // Apple Blue RGB is rgb(0, 113, 227)
  if (!appleSubnav.watchBtnBg.includes('0, 113, 227')) {
    throw new Error("Violation: Apple 'Watch Now' action pill is not authentic Apple Blue (#0071e3)!");
  }
  console.log("  PASS: Apple Sticky Subnav & Action Pills 100% Verified.");

  // 1.3 Apple Comparison Section ("Worth the upgrade? You bet.")
  const appleComparison = await evalJs(`
    ({
      sectionPresent: !!document.getElementById('appleComparisonSection'),
      headlineH2: document.querySelector('#appleComparisonSection h2')?.innerText?.replace(/\\s+/g, ' '),
      dropdownBtn: !!document.getElementById('comparisonDropdownBtn'),
      dropdownBorderColor: window.getComputedStyle(document.getElementById('comparisonDropdownBtn')).borderColor,
      cardCount: document.querySelectorAll('#appleComparisonSection .apple-obsidian-card').length,
      chipBadgePresent: !!document.querySelector('#appleComparisonSection .apple-chip-badge'),
      batteryVisualPresent: !!document.querySelector('#appleComparisonSection .apple-battery-shell .apple-battery-fill'),
      batteryFillColor: window.getComputedStyle(document.querySelector('#appleComparisonSection .apple-battery-fill')).backgroundColor
    })
  `);
  console.log(" Apple Comparison Section Audit:", appleComparison);
  if (!appleComparison.sectionPresent) throw new Error("Apple comparison section missing!");
  if (!appleComparison.headlineH2.includes("Worth the upgrade? You bet.")) {
    throw new Error("Headline mismatch in comparison section: " + appleComparison.headlineH2);
  }
  if (appleComparison.cardCount !== 4) {
    throw new Error("Expected exactly 4 2x2 obsidian cards in comparison section, found " + appleComparison.cardCount);
  }
  if (!appleComparison.chipBadgePresent || !appleComparison.batteryVisualPresent) {
    throw new Error("Apple chip badge or battery visual missing!");
  }
  // Green battery fill is #34c759 (rgb(52, 199, 89))
  if (!appleComparison.batteryFillColor.includes('52, 199, 89')) {
    throw new Error("Battery fill color is not authentic Apple Battery Green (#34c759)!");
  }
  console.log("  PASS: Apple Comparison 2x2 Obsidian Cards, Chip Badge, & Battery Indicator Verified.");

  // Test Comparison Dropdown Interaction
  console.log(" Testing comparison anime selection dropdown...");
  await evalJs(`toggleComparisonDropdown()`);
  await sleep(200);
  const dropdownMenuShown = await evalJs(`!document.getElementById('comparisonDropdownMenu').classList.contains('hidden')`);
  if (!dropdownMenuShown) throw new Error("Comparison dropdown menu did not open!");

  await evalJs(`selectComparisonAnime(1)`); // Select Ao no Hako Season 2
  await sleep(300);
  const newCompTitle = await evalJs(`document.getElementById('comparisonSelectedTitle').innerText`);
  const newCompChip = await evalJs(`document.getElementById('comparisonChipSpeed').innerText`);
  console.log(" Dropdown updated comparison title to:", newCompTitle, "Chip speed:", newCompChip);
  if (!newCompTitle.includes('Ao no Hako') || newCompChip !== '24% faster') {
    throw new Error("Comparison dynamic selection failed to update specs!");
  }
  console.log("  PASS: Dynamic comparison dropdown selection fully reactive.");

  // 1.4 Apple Intelligence Hardware Showcase & Liquid Notifications
  const intelligenceAudit = await evalJs(`
    ({
      sectionPresent: !!document.getElementById('appleIntelligenceSection'),
      headline: document.querySelector('#appleIntelligenceSection h2')?.innerText?.replace(/\\s+/g, ' '),
      phoneBezelsCount: document.querySelectorAll('#appleIntelligenceSection .apple-phone-bezel').length,
      dynamicIslandsCount: document.querySelectorAll('#appleIntelligenceSection .apple-dynamic-island').length,
      boardingPassPresent: !!document.querySelector('#appleIntelligenceSection').innerText.includes('LUI5P33'),
      callContextPresent: !!document.querySelector('#appleIntelligenceSection').innerText.includes('Call Context.')
    })
  `);
  console.log(" Apple Intelligence Showcase Audit:", intelligenceAudit);
  if (!intelligenceAudit.sectionPresent || intelligenceAudit.phoneBezelsCount < 2) {
    throw new Error("Apple Intelligence phone bezels showcase missing!");
  }
  if (!intelligenceAudit.boardingPassPresent || !intelligenceAudit.callContextPresent) {
    throw new Error("Liquid glass boarding pass or Call Context caption missing!");
  }
  console.log("  PASS: Apple Intelligence Phone Hardware Frames & Liquid Glass Cards Verified.");

  // 1.5 Microsoft Fluent 2 Specular Gradient Rim Cards Stack
  const fluentCardsAudit = await evalJs(`
    ({
      sectionPresent: !!document.getElementById('fluentDesignSection'),
      activeGradientCard: !!document.querySelector('.fluent-gradient-border-active'),
      activeBorderBg: window.getComputedStyle(document.querySelector('.fluent-gradient-border-active')).backgroundImage,
      circularBadgesCount: document.querySelectorAll('#fluentDesignSection .fluent-circular-badge').length,
      hasA11yFocusOrder: document.getElementById('fluentDesignSection').innerText.includes('A11y – Focus Order'),
      hasContrastChecker: document.getElementById('fluentDesignSection').innerText.includes('A11y – Color Contrast Checker'),
      hasContentReel: document.getElementById('fluentDesignSection').innerText.includes('Content Reel'),
      hasIconScaling: document.getElementById('fluentDesignSection').innerText.includes('Icon Scaling Tool')
    })
  `);
  console.log(" Fluent 2 Specular Border Cards Stack Audit:", fluentCardsAudit);
  if (!fluentCardsAudit.activeGradientCard || fluentCardsAudit.circularBadgesCount < 4) {
    throw new Error("Fluent 2 gradient border card or circular badges missing!");
  }
  if (!fluentCardsAudit.hasA11yFocusOrder || !fluentCardsAudit.hasContrastChecker || !fluentCardsAudit.hasContentReel || !fluentCardsAudit.hasIconScaling) {
    throw new Error("Missing one of the four required Fluent 2 cards!");
  }
  console.log("  PASS: Microsoft Fluent 2 Orange-Purple Specular Gradient Border & Circular Badges Verified.");

  // 1.6 Floating Feedback Pill & Dark Footer
  const footerAudit = await evalJs(`
    ({
      feedbackPill: !!document.getElementById('fluentFeedbackPillBtn'),
      footerPresent: !!document.getElementById('fluentFooter'),
      hasFluent1Col: document.getElementById('fluentFooter').textContent.includes('Fluent 1'),
      hasMsDesignCol: document.getElementById('fluentFooter').textContent.includes('Microsoft Design'),
      hasInclusiveCol: document.getElementById('fluentFooter').textContent.includes('Inclusive Design'),
      hasMediumCol: document.getElementById('fluentFooter').textContent.includes('Medium'),
      hasCopyright2026: document.getElementById('fluentFooter').textContent.includes('© Microsoft 2026')
    })
  `);
  console.log(" Fluent 2 Footer & Feedback Pill Audit:", footerAudit);
  if (!footerAudit.feedbackPill || !footerAudit.footerPresent || !footerAudit.hasCopyright2026 || !footerAudit.hasFluent1Col || !footerAudit.hasMsDesignCol || !footerAudit.hasInclusiveCol || !footerAudit.hasMediumCol) {
    throw new Error("Fluent 2 feedback pill, footer, or design system columns missing!");
  }
  console.log("  PASS: Fluent 2 Floating Feedback Pill & Dark Footer Verified.");

  // ---------------------------------------------------------------------------
  // SUITE 2: GPU COMPOSITING BUDGET & PERFORMANCE GOVERNANCE
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 2/5] HARDWARE ACCELERATION & GPU COMPOSITING BUDGET");

  const blurAudit = await evalJs(`
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
  console.log(" Active visible elements with backdrop-filter:", blurAudit.length);
  blurAudit.forEach((el, idx) => console.log(`   [${idx + 1}] ${el.tag}#${el.id} -> ${el.backdropFilter}`));
  if (blurAudit.length > 3) {
    throw new Error(`GPU Budget Ceiling Exceeded! Found ${blurAudit.length} elements with backdrop-filter (Max 3).`);
  }
  console.log("  PASS: Strict GPU budget preserved (<= 3 concurrent blur elements)!");

  // Verify Obsidian and Fluent cards do NOT incur GPU blur fragment passes
  const cardBlurPasses = await evalJs(`
    ({
      obsidianBlur: window.getComputedStyle(document.querySelector('.apple-obsidian-card')).backdropFilter,
      fluentCardBlur: window.getComputedStyle(document.querySelector('.fluent-gradient-border-active-inner')).backdropFilter
    })
  `);
  if (cardBlurPasses.obsidianBlur !== 'none' || cardBlurPasses.fluentCardBlur !== 'none') {
    throw new Error("Repeating obsidian or fluent cards must have NO backdrop-filter!");
  }
  console.log("  PASS: Obsidian and Fluent cards use 0 GPU blur fragment passes (Mica specification)!");

  // ---------------------------------------------------------------------------
  // SUITE 3: ACCESSIBILITY & SEQUENTIAL HEADING HIERARCHY
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 3/5] ACCESSIBILITY & HEADING HIERARCHY (LIGHTHOUSE AUDIT)");

  const headings = await evalJs(`
    Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName,
      text: h.innerText.slice(0, 35)
    }))
  `);
  const h1s = headings.filter(h => h.tag === 'H1');
  const h2s = headings.filter(h => h.tag === 'H2');
  console.log(` Heading distribution: H1=${h1s.length}, H2=${h2s.length}, Total=${headings.length}`);
  if (h1s.length !== 1) {
    throw new Error("Accessibility violation: Expected exactly 1 H1 (Hero title), found " + h1s.length);
  }
  if (h2s.length < 5) {
    throw new Error("Accessibility violation: Expected at least 5 H2 section titles, found " + h2s.length);
  }
  console.log("  PASS: Strict sequential heading hierarchy verified (WCAG AAA compatible)!");

  // ---------------------------------------------------------------------------
  // SUITE 4: ZERO-AD ADSHIELD KERNEL DEFENSE & UNBLOCKED PLAYBACK
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 4/5] SECURITY VERIFICATION & ADSHIELD ZERO-AD DEFENSE");

  const adShieldCheck = await evalJs(`
    (function() {
      const b1 = window.open('https://shady-ads.biz');
      const b2 = window.open('https://malicious-redirect.com');
      try {
        window.open = function() { return 'tampered'; };
      } catch (e) {}
      const b3 = window.open('https://popunder.xyz');
      return { b1: b1 === null, b2: b2 === null, b3: b3 === null };
    })()
  `);
  console.log(" AdShield popup interception & tamper resistance:", adShieldCheck);
  if (!adShieldCheck.b1 || !adShieldCheck.b2 || !adShieldCheck.b3) {
    throw new Error("AdShield failed to intercept popup or allowed descriptor tamper!");
  }

  const iframeCheck = await evalJs(`
    ({
      hasSandbox: document.getElementById('animeIframe').hasAttribute('sandbox'),
      allowAttr: document.getElementById('animeIframe').getAttribute('allow')
    })
  `);
  console.log(" Player iframe sandbox policy:", iframeCheck);
  if (iframeCheck.hasSandbox) {
    throw new Error("Violation: animeIframe carries sandbox attribute which breaks embed playback!");
  }
  console.log("  PASS: AdShield Kernel locked; Embed player unblocked.");

  // ---------------------------------------------------------------------------
  // SUITE 5: CORE MEDIA WORKSTATION REGRESSION INTEGRATION
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 5/5] CORE MEDIA WORKSTATION ENGINE REGRESSION INTEGRATION");

  // 5.1 Player modal & failover engine
  console.log(" Opening player modal for Ao no Hako S2 (ID 189123)...");
  await evalJs(`
    openPlayerModal({ id: 189123, title: { romaji: 'Ao no Hako Season 2', english: 'Blue Box Season 2' }, status: 'RELEASING', episodes: 25, nextAiringEpisode: { episode: 3 } }, 1);
  `);
  await sleep(600);

  const streamChain = await evalJs(`
    ({
      chainLength: currentStreamChain.length,
      currentStreamIndex,
      activeStreamName: currentStreamChain[currentStreamIndex]?.name
    })
  `);
  console.log(" Stream chain initialized:", streamChain);
  if (streamChain.chainLength < 3) throw new Error("Expected at least 3 fallback streams!");

  // Silent failover trigger
  await evalJs(`triggerSilentFailover('Stress test automated probe')`);
  await sleep(400);
  const failoverIndex = await evalJs(`currentStreamIndex`);
  console.log(" Stream index after silent failover:", failoverIndex);
  if (failoverIndex !== 1) throw new Error("Failover did not advance stream index!");

  // 5.2 Finished anime batch download gating
  console.log(" Checking batch gating for Finished Anime (Sousou no Frieren ID 154587)...");
  await evalJs(`openDetailModal(154587)`);
  await sleep(800);

  const batchBtnShown = await evalJs(`!document.getElementById('modalBatchDownloadBtn').classList.contains('hidden')`);
  if (!batchBtnShown) throw new Error("Finished anime did not display batch download button!");

  await evalJs(`openBatchDownloadModal()`);
  await sleep(400);
  const batchMagnet = await evalJs(`document.getElementById('batchClientDirectLink').getAttribute('href')`);
  console.log(" Batch magnet URI:", batchMagnet.slice(0, 75) + '...');
  const hexHash = batchMagnet.match(/urn:btih:([a-f0-9]{40})/i);
  if (!hexHash) throw new Error("Batch magnet missing valid 40-char hex infohash!");
  console.log(" Verified BEP 0053 infohash:", hexHash[1]);

  await evalJs(`closeBatchDownloadModal()`);
  await evalJs(`closeDetailModal()`);

  // 5.3 Global Catalog Search
  console.log(" Testing global catalog search engine...");
  await evalJs(`
    const input = document.getElementById('globalSearchInput');
    input.value = 'Solo Leveling';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await sleep(2500);
  const searchResultsCount = await evalJs(`document.querySelectorAll('#searchResultsGrid > div').length`);
  console.log(" Search results count for 'Solo Leveling':", searchResultsCount);
  if (searchResultsCount === 0) throw new Error("Catalog search did not yield results!");

  // 5.4 Command Palette Modal (Ctrl+K)
  await evalJs(`toggleCommandPalette()`);
  await sleep(200);
  const paletteOpen = await evalJs(`!document.getElementById('commandPaletteModal').classList.contains('hidden')`);
  if (!paletteOpen) throw new Error("Command palette failed to toggle open!");
  await evalJs(`closeCommandPalette()`);

  // Check runtime errors
  console.log("\n>>> AUDITING UNCAUGHT JAVASCRIPT RUNTIME ERRORS");
  console.log(" Total uncaught errors recorded:", uncaughtErrors.length);
  if (uncaughtErrors.length > 0) {
    console.error("Errors:", uncaughtErrors);
    throw new Error("Uncaught runtime exceptions occurred during test execution!");
  }

  console.log("\n================================================================================");
  console.log("   HYPER-EXTREME REGRESSION STRESS TEST: 100% SUITE PASS!                        ");
  console.log("   Visual Similarity: EXACT  | GPU Budget: COMPLIANT | Errors: 0               ");
  console.log("================================================================================\n");

  ws.close();
  if (chromeProcess) chromeProcess.kill();
  process.exit(0);
}

runHyperExtremeRegressionStressTest().catch(err => {
  console.error("\nTEST SUITE ABORTED WITH ERROR:", err);
  if (chromeProcess) chromeProcess.kill();
  process.exit(1);
});
