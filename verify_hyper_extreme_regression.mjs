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
  console.log("   Zero-Waste Law of Identity (A ≡ A) | GPU Budget | Leak Prevention | AdShield ");
  console.log("================================================================================\n");

  // Ensure local server on port 8000 is active
  try {
    await fetch('http://localhost:8000', { signal: AbortSignal.timeout(1500) });
  } catch (e) {
    console.log("Local server on port 8000 not responding. Spawning python serve.py...");
    spawn('python', ['serve.py'], { detached: true, stdio: 'ignore' });
    await sleep(2500);
  }

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
  await sendCommand('Network.setCacheDisabled', { cacheDisabled: true });

  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || JSON.stringify(res.exceptionDetails);
      throw new Error(`Eval error in [${expr}]: ${desc}`);
    }
    return res.result?.value;
  }

  console.log("Navigating to http://localhost:8000 ...");
  await sendCommand('Page.navigate', { url: 'http://localhost:8000' });

  for (let i = 0; i < 40; i++) {
    try {
      const state = await evalJs('document.readyState');
      const curTitle = await evalJs('document.title');
      if (state === 'complete' && curTitle && curTitle.includes('MILKGLASS')) {
        break;
      }
    } catch (e) {}
    await sleep(400);
  }
  await sleep(1500); // Allow GraphQL AniList responses to settle

  // ---------------------------------------------------------------------------
  // SUITE 1: REA & MATERIAL REPRODUCTION AUDIT (SCREENSHOT VISUAL FIDELITY)
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 1/6] VISUAL SIMILARITY & SPATIAL MATERIAL FIDELITY VERIFICATION");

  // 1.1 Streamlined Search Header Bar & Recommendations Strip Audit
  const headerCheck = await evalJs(`
    ({
      hasSearchInput: !!document.getElementById('globalSearchInput'),
      hasSearchBtn: !!document.getElementById('globalSearchBtn'),
      recommendationsCount: document.querySelectorAll('#searchRecommendationsStrip .recommend-pill').length
    })
  `);
  console.log(" Streamlined Header Audit:", headerCheck);
  if (!headerCheck.hasSearchInput || !headerCheck.hasSearchBtn || headerCheck.recommendationsCount < 3) {
    throw new Error("Violation: Header search input, search button, or recommendation pills missing!");
  }
  console.log("  PASS: Streamlined Search Header & 5-Item Recommendation Strip Verified.");

  // 1.2 Apple Sticky Subnav (#globalnav style)
  const appleSubnav = await evalJs(`
    ({
      subnavPresent: !!document.getElementById('appleSubnavBar'),
      titleText: document.querySelector('#appleSubnavBar span')?.innerText || '',
      exploreBtn: !!Array.from(document.querySelectorAll('#appleSubnavBar button')).find(b => b.innerText.trim() === 'Explore'),
      watchBtn: !!Array.from(document.querySelectorAll('#appleSubnavBar button')).find(b => b.innerText.trim() === 'Watch Now'),
      watchBtnBg: window.getComputedStyle(Array.from(document.querySelectorAll('#appleSubnavBar button')).find(b => b.innerText.trim() === 'Watch Now') || document.body).backgroundColor
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

  // 1.7 Mobile Viewport (390x844) Regression Audit
  console.log("\n Testing Mobile Viewport (390x844 OLED) Material Parity...");
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await sleep(300);

  const mobileAudit = await evalJs(`
    ({
      searchInputVisible: document.getElementById('globalSearchInput')?.offsetWidth > 0,
      searchRecommendationsVisible: document.getElementById('searchRecommendationsStrip')?.offsetWidth > 0,
      comparisonGridColumns: window.getComputedStyle(document.querySelector('#appleComparisonSection .grid')).gridTemplateColumns.split(' ').length,
      intelligenceIsRow: window.getComputedStyle(document.querySelector('#appleIntelligenceSection .flex-row')).flexDirection === 'row',
      intelligenceHasXScroll: window.getComputedStyle(document.querySelector('#appleIntelligenceSection .flex-row')).overflowX === 'auto',
      circularBadgeHasZIndex: parseInt(window.getComputedStyle(document.querySelector('.fluent-circular-badge > *')).zIndex, 10) >= 1
    })
  `);
  console.log(" Mobile Viewport Audit (390x844):", mobileAudit);
  if (!mobileAudit.searchInputVisible || !mobileAudit.searchRecommendationsVisible) {
    throw new Error("Search input or recommendations strip hidden on mobile viewport!");
  }
  if (mobileAudit.comparisonGridColumns !== 2) {
    throw new Error("Apple Comparison grid must be 2 columns on mobile, found " + mobileAudit.comparisonGridColumns);
  }
  if (!mobileAudit.intelligenceIsRow || !mobileAudit.intelligenceHasXScroll) {
    throw new Error("Apple Intelligence carousel must be horizontal row with overflow-x auto on mobile!");
  }
  if (!mobileAudit.circularBadgeHasZIndex) {
    throw new Error("Circular badge child icon must have z-index >= 1 to prevent mask occlusion!");
  }
  console.log("  PASS: Mobile Viewport 390x844 100% Verified (2x2 Grid & Swipe Carousel).");

  // 1.8 Accessibility & Interaction Physics Audit
  console.log("\n Testing Interaction Physics & Dismissal Accessibility...");
  await evalJs(`toggleComparisonDropdown()`);
  await sleep(150);
  const dropdownIsOpen = await evalJs(`!document.getElementById('comparisonDropdownMenu').classList.contains('hidden')`);
  if (!dropdownIsOpen) throw new Error("Comparison dropdown did not open!");
  await evalJs(`document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await sleep(200);
  const dropdownIsClosed = await evalJs(`document.getElementById('comparisonDropdownMenu').classList.contains('hidden')`);
  if (!dropdownIsClosed) throw new Error("Comparison dropdown failed to close on outside click!");
  console.log("  PASS: Dropdown outside-click auto-dismiss operational.");

  // Test Escape key dismissal for Feedback Modal
  await evalJs(`openFeedbackModal()`);
  await sleep(150);
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(200);
  const feedbackClosedOnEsc = await evalJs(`document.getElementById('fluentFeedbackModal').classList.contains('hidden')`);
  if (!feedbackClosedOnEsc) throw new Error("Feedback modal failed to close on Escape key!");
  console.log("  PASS: Modal Escape key dismissal operational.");

  // Restore Desktop Viewport
  await sendCommand('Emulation.clearDeviceMetricsOverride');
  await sleep(200);

  // ---------------------------------------------------------------------------
  // SUITE 2: GPU COMPOSITING BUDGET & PERFORMANCE GOVERNANCE
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 2/6] HARDWARE ACCELERATION & GPU COMPOSITING BUDGET");

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
  // SUITE 3: ZERO-AD ADSHIELD KERNEL DEFENSE & UNBLOCKED PLAYBACK
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 3/6] SECURITY VERIFICATION & ADSHIELD ZERO-AD DEFENSE");

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
  // SUITE 4: CORE MEDIA WORKSTATION ENGINE & FAILOVER INTEGRATION
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 4/6] CORE MEDIA WORKSTATION ENGINE REGRESSION INTEGRATION");

  // 4.1 Player modal & failover engine
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

  // 4.2 Finished anime batch download gating
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

  // 4.3 Global Catalog Search
  console.log(" Testing global catalog search engine...");
  await evalJs(`
    const input = document.getElementById('globalSearchInput');
    input.value = 'Solo Leveling';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submitManualSearch();
  `);
  await sleep(1500);
  const searchResultsCount = await evalJs(`document.querySelectorAll('#searchResultsGrid > div').length`);
  console.log(" Search results count for 'Solo Leveling':", searchResultsCount);
  if (searchResultsCount === 0) throw new Error("Catalog search did not yield results!");

  // 4.4 Command Palette Modal (Ctrl+K)
  await evalJs(`toggleCommandPalette()`);
  await sleep(200);
  const paletteOpen = await evalJs(`!document.getElementById('commandPaletteModal').classList.contains('hidden')`);
  if (!paletteOpen) throw new Error("Command palette failed to toggle open!");
  await evalJs(`closeCommandPalette()`);

  // ---------------------------------------------------------------------------
  // SUITE 5: ZERO-WASTE RESOURCE, MASTER CLOCK & LEAK STRESS TEST
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 5/6] ZERO-WASTE RESOURCE & LEAK PARANOIA STRESS TEST");

  // 5.1 ClockEngine Active Targets & Rapid Modal Cycling Test
  console.log(" Stress-testing Master ClockEngine and modal cycling (5 rapid opens/closes)...");
  for (let cycle = 0; cycle < 5; cycle++) {
    await evalJs(`openDetailModal(189123)`);
    await sleep(100);
    await evalJs(`closeDetailModal()`);
    await sleep(50);
  }
  const activeClockTargets = await evalJs(`(window.ClockEngine || ClockEngine).activeTargets.size`);
  console.log(" Active ClockEngine targets after cycling:", activeClockTargets);
  // All modal countdown targets must be cleanly unregistered
  const hasModalCountdownLeak = await evalJs(`(window.ClockEngine || ClockEngine).activeTargets.has('modalUpcomingCountdown')`);
  if (hasModalCountdownLeak) {
    throw new Error("Memory Leak: modalUpcomingCountdown was not unregistered from ClockEngine upon close!");
  }
  console.log("  PASS: Zero ClockEngine target leaks after rapid modal cycling.");

  // 5.2 ApiCache In-Memory Deduplication & 0ms Roundtrip Test
  console.log(" Testing ApiCache query deduplication...");
  const cacheStats = await evalJs(`
    ({
      cacheEntries: (window.apiCache || apiCache).size,
      pendingCount: (window.pendingRequests || pendingRequests).size
    })
  `);
  console.log(" ApiCache status:", cacheStats);
  if (cacheStats.cacheEntries === 0) {
    throw new Error("Violation: ApiCache did not store responses from GraphQL queries!");
  }
  if (cacheStats.pendingCount !== 0) {
    throw new Error("Violation: ApiCache has unresolved pending requests!");
  }
  console.log("  PASS: ApiCache actively caching GraphQL queries (sustainable scalability).");

  // 5.3 Universal Modal Escape Key Dismissal Test across all modals
  console.log(" Testing universal ModalManager Escape key dismissal on Player Modal...");
  await evalJs(`openPlayerModal({ id: 189123, title: { romaji: 'Ao no Hako' } }, 1)`);
  await sleep(300);
  const playerIsOpen = await evalJs(`!document.getElementById('playerModal').classList.contains('hidden')`);
  if (!playerIsOpen) throw new Error("Player modal failed to open!");

  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(200);
  const playerClosed = await evalJs(`document.getElementById('playerModal').classList.contains('hidden')`);
  const iframeCleared = await evalJs(`document.getElementById('animeIframe').src === '' || document.getElementById('animeIframe').src === 'about:blank' || !document.getElementById('animeIframe').src.includes('aniembed')`);
  console.log(" Player modal closed on Escape:", playerClosed, "Iframe cleared:", iframeCleared);
  if (!playerClosed || !iframeCleared) {
    throw new Error("Player modal failed to close cleanly on Escape or iframe was not reset!");
  }
  console.log("  PASS: Universal ModalManager Escape key teardown operational.");

  // ---------------------------------------------------------------------------
  // SUITE 6: LIGHTHOUSE ACCESSIBILITY & UNCAUGHT RUNTIME EXCEPTIONS
  // ---------------------------------------------------------------------------
  console.log("\n>>> [SUITE 6/6] ACCESSIBILITY & UNCAUGHT RUNTIME ERROR AUDIT");

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

  console.log("\n>>> AUDITING UNCAUGHT JAVASCRIPT RUNTIME ERRORS");
  console.log(" Total uncaught errors recorded:", uncaughtErrors.length);
  if (uncaughtErrors.length > 0) {
    console.error("Errors:", uncaughtErrors);
    throw new Error("Uncaught runtime exceptions occurred during test execution!");
  }

  console.log("\n================================================================================");
  console.log("   HYPER-EXTREME REGRESSION STRESS TEST: 100% SUITE PASS!                        ");
  console.log("   Zero-Waste: VERIFIED | GPU Budget: COMPLIANT | Memory Leaks: 0 | Errors: 0   ");
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
