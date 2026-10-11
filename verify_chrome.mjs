import { spawn } from 'child_process';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9340 + Math.floor(Math.random() * 50);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let chromeProcess = null;

async function runTests() {
  console.log("=== INITIATING CHROME DEVTOOLS AUTOMATION (PORT " + PORT + ") ===");
  
  // 1. Launch Chrome Headless with Remote Debugging on Isolated Port
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
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const pageTarget = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      // Chrome starting up
    }
  }

  if (!wsUrl) {
    throw new Error("Failed to find Chrome page target WebSocketDebuggerUrl");
  }

  console.log("Connected to Chrome CDP Target WebSocket:", wsUrl);

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

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

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

  console.log("Navigating to http://localhost:8000 ...");
  await sendCommand('Page.navigate', { url: 'http://localhost:8000' });
  await sleep(3500); // Wait for GraphQL AniList responses

  // Helper evaluate
  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || JSON.stringify(res.exceptionDetails);
      console.error("Full exceptionDetails:", desc);
      throw new Error(`Eval error in [${expr}]: ${desc}`);
    }
    return res.result?.value;
  }

  console.log("\n--- TEST SUITE 1: SECURITY VERIFICATION & ADSHIELD ZERO-AD DEFENSE ---");
  const title = await evalJs('document.title');
  console.log("Page title:", title);

  const adBlocked = await evalJs(`
    (function() {
      const blocked1 = window.open('https://malicious-ads.com');
      const blocked2 = window.open('https://betting-popunder.xyz');
      
      // Test tamper resistance
      try {
        window.open = function() { return 'overwritten'; };
      } catch (e) {}
      const blocked3 = window.open('https://rogue-affiliate.net');

      return {
        blocked1IsNull: (blocked1 === null),
        blocked2IsNull: (blocked2 === null),
        blocked3IsNull: (blocked3 === null)
      };
    })()
  `);
  console.log("AdShield window.open interception & tamper resistance:", adBlocked);
  if (!adBlocked.blocked1IsNull || !adBlocked.blocked2IsNull || !adBlocked.blocked3IsNull) {
    throw new Error("AdShield did not block malicious popup or allow tamper!");
  }

  const iframeCheck = await evalJs(`
    ({
      hasSandbox: document.getElementById('animeIframe').hasAttribute('sandbox'),
      sandboxAttr: document.getElementById('animeIframe').getAttribute('sandbox'),
      allowAttr: document.getElementById('animeIframe').getAttribute('allow')
    })
  `);
  console.log("Iframe Configuration Check (Ensuring unblocked embed playback):", iframeCheck);
  if (iframeCheck.hasSandbox) {
    throw new Error("Violation: Iframe still carries sandbox attribute which triggers 'cannot be embedded in a sandboxed frame' block!");
  }

  console.log("\n--- TEST SUITE 2: SMART BACKEND AUTO-ROUTING & SILENT FAILOVER ENGINE ---");
  // 1. Verify manual CDN buttons are removed to avoid confusing users
  const manualCdnUiCheck = await evalJs(`
    ({
      selectorBarPresent: !!document.getElementById('cdnSelectorBar'),
      buttonGroupPresent: !!document.getElementById('cdnProviderButtonGroup'),
      quickFailoverPresent: !!document.getElementById('quickFailoverBtn'),
      autoRoutingBadge: !!document.getElementById('streamStatusBadge')
    })
  `);
  console.log("Manual CDN buttons removed check:", manualCdnUiCheck);
  if (manualCdnUiCheck.selectorBarPresent || manualCdnUiCheck.buttonGroupPresent || manualCdnUiCheck.quickFailoverPresent) {
    throw new Error("Violation: Manual CDN selector buttons still present in UI!");
  }
  if (!manualCdnUiCheck.autoRoutingBadge) {
    throw new Error("Violation: Stream auto-routing status badge missing!");
  }

  // 2. Open player modal for Ao no Hako S2 (ID: 189123, Episode 1)
  console.log("Opening player modal for Ao no Hako S2 (Ep 1)...");
  await evalJs(`
    openPlayerModal({ id: 189123, title: { romaji: 'Ao no Hako Season 2', english: 'Blue Box Season 2' }, status: 'RELEASING', episodes: 25, nextAiringEpisode: { episode: 3 } }, 1);
  `);
  await sleep(600);

  // 3. Test Stream Chain resolution
  const streamChainResult = await evalJs(`
    ({
      chainLength: currentStreamChain.length,
      currentStreamIndex,
      activeStreamName: currentStreamChain[currentStreamIndex]?.name,
      activeStreamUrl: currentStreamChain[currentStreamIndex]?.url,
      iframeSrc: document.getElementById('animeIframe').src
    })
  `);
  console.log("Stream Chain Initial Status:", streamChainResult);
  if (streamChainResult.chainLength < 3) {
    throw new Error("Expected at least 3 fallback streams in currentStreamChain!");
  }

  // 4. Test Subtitle Toggle (ID -> EN -> ID)
  console.log("Testing player subtitle switching...");
  await evalJs(`setPlayerSubtitle('en')`);
  await sleep(400);
  const subEnActive = await evalJs(`currentSubtitlePref === 'en'`);
  const enStreamName = await evalJs(`currentStreamChain[currentStreamIndex]?.name`);
  console.log("Subtitle switched to EN:", subEnActive, "Active Stream:", enStreamName);

  await evalJs(`setPlayerSubtitle('id')`);
  await sleep(400);
  const subIdActive = await evalJs(`currentSubtitlePref === 'id'`);
  const idStreamName = await evalJs(`currentStreamChain[currentStreamIndex]?.name`);
  console.log("Subtitle switched back to ID:", subIdActive, "Active Stream:", idStreamName);

  // 5. Test Episode Navigation Controls
  console.log("Testing Episode Navigation buttons...");
  const epIndicatorBefore = await evalJs(`document.getElementById('playerEpIndicator').innerText`);
  const prevDisabledInitially = await evalJs(`document.getElementById('prevEpBtn').disabled`);
  console.log("Initial Ep Indicator:", epIndicatorBefore, "Prev disabled on Ep 1:", prevDisabledInitially);
  if (!prevDisabledInitially) throw new Error("Prev episode button should be disabled on Ep 1!");

  // Navigate to Ep 2
  await evalJs(`navigateEpisode(1)`);
  await sleep(500);
  const epIndicatorAfterNext = await evalJs(`document.getElementById('playerEpIndicator').innerText`);
  console.log("Ep Indicator after Next click:", epIndicatorAfterNext);
  if (epIndicatorAfterNext !== 'Ep 2') throw new Error("Expected Ep 2 after navigating forward!");

  // Navigate back to Ep 1
  await evalJs(`navigateEpisode(-1)`);
  await sleep(500);
  const epIndicatorReset = await evalJs(`document.getElementById('playerEpIndicator').innerText`);
  console.log("Ep Indicator after Prev click:", epIndicatorReset);
  if (epIndicatorReset !== 'Ep 1') throw new Error("Expected Ep 1 after navigating backward!");

  // 6. Test Automated Silent Failover Execution
  console.log("Testing Intelligent Automated Failover...");
  const streamIdxBeforeFailover = await evalJs(`currentStreamIndex`);
  await evalJs(`triggerSilentFailover('Automated health watchdog ping')`);
  await sleep(500);

  const failoverBannerText = await evalJs(`document.getElementById('cdnFailoverText').innerText`);
  const streamIdxAfterFailover = await evalJs(`currentStreamIndex`);
  const activeStreamAfterFailover = await evalJs(`currentStreamChain[currentStreamIndex]?.name`);
  console.log("Silent Failover Status Banner:", failoverBannerText);
  console.log("Stream Index before:", streamIdxBeforeFailover, "after:", streamIdxAfterFailover, "Name:", activeStreamAfterFailover);
  if (streamIdxBeforeFailover === streamIdxAfterFailover) {
    throw new Error("Failover did not advance stream index!");
  }
  if (!failoverBannerText.includes('backup edge stream')) {
    throw new Error("Failover banner text does not indicate failover!");
  }

  console.log("\n--- TEST SUITE 3: STRICT BATCH DOWNLOAD LOGIC & GATING ---");
  // Test ONGOING Anime (Ao no Hako S2 - ID 189123)
  console.log("Opening detail modal for ONGOING anime (Ao no Hako S2)...");
  await evalJs(`openDetailModal(189123)`);
  await sleep(1000);

  const ongoingBatchBtnHidden = await evalJs(`
    document.getElementById('modalBatchDownloadBtn').classList.contains('hidden')
  `);
  const ongoingLockedNoticeShown = await evalJs(`
    !document.getElementById('modalBatchLockedNotice').classList.contains('hidden')
  `);
  console.log("Ongoing anime - Batch Download Button Hidden:", ongoingBatchBtnHidden);
  console.log("Ongoing anime - Batch Locked Notice Shown:", ongoingLockedNoticeShown);

  if (!ongoingBatchBtnHidden || !ongoingLockedNoticeShown) {
    throw new Error("Strict rule violated! Ongoing anime showed batch download button or did not show locked notice!");
  }

  // Attempting to invoke openBatchDownloadModal on ongoing anime
  await evalJs(`openBatchDownloadModal()`);
  await sleep(300);
  const batchModalStillHidden = await evalJs(`
    document.getElementById('batchDownloadModal').classList.contains('hidden')
  `);
  console.log("Batch Modal prevented for ongoing show:", batchModalStillHidden);
  if (!batchModalStillHidden) throw new Error("Batch modal was improperly opened for ongoing anime!");

  // Test FINISHED Anime (Sousou no Frieren - ID 154587)
  console.log("Opening detail modal for FINISHED anime (Sousou no Frieren - ID 154587)...");
  await evalJs(`openDetailModal(154587)`);
  await sleep(1000);

  const finishedBatchBtnShown = await evalJs(`
    !document.getElementById('modalBatchDownloadBtn').classList.contains('hidden')
  `);
  const finishedLockedNoticeHidden = await evalJs(`
    document.getElementById('modalBatchLockedNotice').classList.contains('hidden')
  `);
  console.log("Finished anime - Batch Download Button Shown:", finishedBatchBtnShown);
  console.log("Finished anime - Batch Locked Notice Hidden:", finishedLockedNoticeHidden);

  if (!finishedBatchBtnShown || !finishedLockedNoticeHidden) {
    throw new Error("Strict rule violated! Finished anime did not display batch download button!");
  }

  // Click Batch Download Button on Finished Anime
  console.log("Clicking Batch Download button on finished anime...");
  await evalJs(`openBatchDownloadModal()`);
  await sleep(500);

  const batchModalOpened = await evalJs(`
    !document.getElementById('batchDownloadModal').classList.contains('hidden')
  `);
  console.log("Batch Download Modal Opened:", batchModalOpened);

  // Test Batch Resolution Switching (1080p -> 720p -> 480p -> 360p)
  const batch1080Size = await evalJs(`document.getElementById('batchTotalPackageSize').innerText`);
  console.log("Batch 1080p Size:", batch1080Size);

  await evalJs(`switchBatchResolution('720p')`);
  const batch720Size = await evalJs(`document.getElementById('batchTotalPackageSize').innerText`);
  console.log("Batch 720p Size:", batch720Size);

  await evalJs(`switchBatchResolution('480p')`);
  const batch480Size = await evalJs(`document.getElementById('batchTotalPackageSize').innerText`);
  console.log("Batch 480p Size:", batch480Size);

  await evalJs(`switchBatchResolution('360p')`);
  const batch360Size = await evalJs(`document.getElementById('batchTotalPackageSize').innerText`);
  console.log("Batch 360p Size:", batch360Size);

  // Test Batch Magnet URI Spec (Valid 40-char Hex Infohash & Public Trackers)
  const batchMagnetHref = await evalJs(`document.getElementById('batchClientDirectLink').getAttribute('href')`);
  console.log("Batch Magnet URI sample:", batchMagnetHref.slice(0, 85) + '...');
  const batchHashMatch = batchMagnetHref.match(/urn:btih:([a-f0-9]{40})/i);
  if (!batchHashMatch) {
    throw new Error("Batch magnet does not contain a valid 40-character hexadecimal infohash! Value: " + batchMagnetHref);
  }
  if (!batchMagnetHref.includes('&tr=')) {
    throw new Error("Batch magnet is missing announce trackers!");
  }
  console.log("Verified Batch Infohash (40-char hex):", batchHashMatch[1]);

  // Test Batch Episode Table Breakdown
  const episodeRowsCount = await evalJs(`
    document.querySelectorAll('#batchEpisodeListContainer > div').length
  `);
  console.log("Episode breakdown rows in batch modal:", episodeRowsCount);
  if (episodeRowsCount !== 28) throw new Error("Expected 28 episodes in Frieren batch, got " + episodeRowsCount);

  // Test Single Magnet Infohash in Batch Table Row
  const sampleRowMagnet = await evalJs(`
    document.querySelector('#batchEpisodeListContainer a[data-safe-download="true"]').getAttribute('href')
  `);
  const rowHashMatch = sampleRowMagnet.match(/urn:btih:([a-f0-9]{40})/i);
  if (!rowHashMatch) {
    throw new Error("Episode row magnet does not contain valid 40-char hex infohash!");
  }
  console.log("Verified Episode Row Infohash:", rowHashMatch[1]);

  // Test Copy Batch Magnet
  await evalJs(`copyBatchMagnet()`);
  await sleep(300);
  const toastText = await evalJs(`document.getElementById('toastMessage').innerText`);
  console.log("Toast feedback for batch magnet copy:", toastText);

  // Test Batch Manifest Descriptor Download
  await evalJs(`downloadBatchDescriptor()`);
  await sleep(300);
  const manifestToast = await evalJs(`document.getElementById('toastMessage').innerText`);
  console.log("Toast feedback for batch manifest download:", manifestToast);

  await evalJs(`closeBatchDownloadModal()`);

  console.log("\n--- TEST SUITE 4: INDIVIDUAL EPISODE RESOLUTION EXPORT SPECIFICATION ---");
  await evalJs(`openPlayerModal(currentAnimeData, 1)`);
  await sleep(500);

  await evalJs(`toggleDownloadPanel()`);
  await sleep(300);
  const dlPanelShown = await evalJs(`!document.getElementById('downloadPanel').classList.contains('hidden')`);
  console.log("Individual Download Panel shown:", dlPanelShown);

  await evalJs(`switchDownloadResolution('1080p')`);
  const dl1080Title = await evalJs(`document.getElementById('specResolutionTitle').innerText`);
  const dl1080Size = await evalJs(`document.getElementById('specEstimatedSize').innerText`);
  console.log("Download 1080p:", dl1080Title, dl1080Size);

  await evalJs(`switchDownloadResolution('720p')`);
  const dl720Title = await evalJs(`document.getElementById('specResolutionTitle').innerText`);
  const dl720Size = await evalJs(`document.getElementById('specEstimatedSize').innerText`);
  console.log("Download 720p:", dl720Title, dl720Size);

  await evalJs(`switchDownloadResolution('480p')`);
  const dl480Title = await evalJs(`document.getElementById('specResolutionTitle').innerText`);
  const dl480Size = await evalJs(`document.getElementById('specEstimatedSize').innerText`);
  console.log("Download 480p:", dl480Title, dl480Size);

  await evalJs(`switchDownloadResolution('360p')`);
  const dl360Title = await evalJs(`document.getElementById('specResolutionTitle').innerText`);
  const dl360Size = await evalJs(`document.getElementById('specEstimatedSize').innerText`);
  console.log("Download 360p:", dl360Title, dl360Size);

  // Test Individual Magnet InfoHash
  const singleMagnetHref = await evalJs(`document.getElementById('directMagnetClientLink').getAttribute('href')`);
  const singleHashMatch = singleMagnetHref.match(/urn:btih:([a-f0-9]{40})/i);
  if (!singleHashMatch) throw new Error("Single episode magnet missing valid 40-char infohash!");
  console.log("Verified Individual Episode Infohash:", singleHashMatch[1]);

  // Test 4-Node Mirror Cluster in Download Panel
  const mirrors = await evalJs(`({
    nyaa: document.getElementById('mirrorNyaaLink').getAttribute('href'),
    otaku: document.getElementById('mirrorOtakuLink').getAttribute('href'),
    samehada: document.getElementById('mirrorSamehadaLink').getAttribute('href'),
    kurama: document.getElementById('mirrorKuramaLink').getAttribute('href')
  })`);
  console.log("4-Node Regional Mirror Cluster Endpoints:", mirrors);
  if (!mirrors.nyaa.includes('nyaa.si') || !mirrors.otaku.includes('otakudesu') || !mirrors.samehada.includes('samehadaku') || !mirrors.kurama.includes('kuramanime')) {
    throw new Error("Mirror URLs missing proper domain endpoints!");
  }

  // Test Player Panel Batch Gateway (Anime Frieren is FINISHED)
  const playerBatchAccessVisible = await evalJs(`
    !document.getElementById('playerBatchAccessContainer').classList.contains('hidden')
  `);
  console.log("Player Panel Batch Gateway shown for finished anime:", playerBatchAccessVisible);
  if (!playerBatchAccessVisible) throw new Error("Player batch access gateway not visible for finished anime!");

  // Test copy magnet individual
  await evalJs(`document.getElementById('copyEpisodeMagnetBtn').click()`);
  await sleep(300);
  const singleToast = await evalJs(`document.getElementById('toastMessage').innerText`);
  console.log("Toast feedback for individual magnet copy:", singleToast);

  // Test Individual Descriptor Manifest Download
  await evalJs(`downloadEpisodeDescriptor()`);
  await sleep(300);
  const epManifestToast = await evalJs(`document.getElementById('toastMessage').innerText`);
  console.log("Toast feedback for individual manifest download:", epManifestToast);

  await evalJs(`closePlayerModal()`);

  console.log("\n--- TEST SUITE 5: SEARCH ENGINE CATALOG ---");
  await evalJs(`
    const input = document.getElementById('globalSearchInput');
    input.value = 'Solo Leveling';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await sleep(2500);

  const searchResultsCount = await evalJs(`
    document.querySelectorAll('#searchResultsGrid > div').length
  `);
  console.log("Search Results Count for 'Solo Leveling':", searchResultsCount);
  if (searchResultsCount === 0) throw new Error("Search engine did not return results!");

  console.log("\n--- UNCAUGHT RUNTIME ERRORS CHECK ---");
  console.log("Total uncaught errors:", uncaughtErrors.length);
  if (uncaughtErrors.length > 0) {
    console.error("Uncaught errors detected:", uncaughtErrors);
    throw new Error("Uncaught errors occurred during test suite execution!");
  }

  console.log("\n=== ALL AUTOMATION TESTS PASSED 100% SUCCESSFULLY! ===");

  ws.close();
  if (chromeProcess) chromeProcess.kill();
  process.exit(0);
}

runTests().catch(err => {
  console.error("TEST FAILED:", err);
  if (chromeProcess) chromeProcess.kill();
  process.exit(1);
});
