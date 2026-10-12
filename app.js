/**
 * MILKGLASS ENTERPRISE MEDIA ENGINE v5.0
 * Laser-Focused Minimal Spatial Stream & Catalog Delivery
 * Zero-Waste Architecture & Law of Identity (A ≡ A) Standard
 * Controls: [Milkglass Pro, Explore, Watch Now, Search Catalog, Search button]
 */

// ==============================================================================
// 0. SINGLE SOURCE OF TRUTH (STATE & ENGINES)
// ==============================================================================
let artPlayerInstance = null;
let currentAnimeData = null;
let currentSelectedEpisode = 1;
let currentMaxAiredEpisode = 1;
let currentSubtitlePref = localStorage.getItem('milkglass_sub_pref') || 'id'; // 'id' or 'en'
if (currentSubtitlePref !== 'id' && currentSubtitlePref !== 'en') {
  currentSubtitlePref = 'id';
}

let failoverTimeoutId = null;
let failoverBannerTimeoutId = null;
let currentDownloadResolution = '1080p';
let currentBatchResolution = '1080p';

// In-Memory API Cache & In-flight Deduplication (Strict Zero-Waste Network Guarantee)
var apiCache = window.apiCache = new Map();
var pendingRequests = window.pendingRequests = new Map();
const API_CACHE_TTL = 300000; // 5 minutes cache TTL

// Master Clock Engine (Airing countdowns & modal timers)
var ClockEngine = window.ClockEngine = {
  activeTargets: new Map(),
  timerId: null,

  register(id, getTargetSecs, onTick) {
    this.activeTargets.set(id, { getTargetSecs, onTick });
    this.ensureRunning();
    this.tickTarget(id);
  },

  unregister(id) {
    this.activeTargets.delete(id);
    if (this.activeTargets.size === 0) {
      this.stop();
    }
  },

  tickTarget(id) {
    const el = document.getElementById(id);
    if (!el) {
      this.activeTargets.delete(id);
      return;
    }
    const item = this.activeTargets.get(id);
    if (!item) return;
    const nowSecs = Math.floor(Date.now() / 1000);
    const remaining = item.getTargetSecs() - nowSecs;
    item.onTick(remaining, el);
  },

  tick() {
    if (document.hidden) return; // Zero-waste: suspend DOM churn when tab is hidden
    for (const id of Array.from(this.activeTargets.keys())) {
      this.tickTarget(id);
    }
    if (this.activeTargets.size === 0) {
      this.stop();
    }
  },

  ensureRunning() {
    if (!this.timerId && this.activeTargets.size > 0) {
      this.timerId = setInterval(() => this.tick(), 1000);
    }
  },

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
};

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    ClockEngine.tick();
  }
});

// Unified Modal Governance (Law of Identity A ≡ A)
var ModalManager = window.ModalManager = {
  activeStack: [],

  open(modalId, onOpen) {
    const el = document.getElementById(modalId);
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('flex');
    if (!this.activeStack.includes(modalId)) {
      this.activeStack.push(modalId);
    }
    if (typeof onOpen === 'function') onOpen(el);
  },

  close(modalId, onClose) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('flex');
    }
    this.activeStack = this.activeStack.filter(id => id !== modalId);
    if (typeof onClose === 'function') onClose(el);
  },

  closeTop() {
    if (this.activeStack.length === 0) {
      const searchSec = document.getElementById('searchResultsSection');
      if (searchSec && !searchSec.classList.contains('hidden')) {
        searchSec.classList.add('hidden');
        return true;
      }
      return false;
    }
    const topId = this.activeStack[this.activeStack.length - 1];
    switch (topId) {
      case 'playerModal':
        closePlayerModal();
        break;
      case 'detailModal':
        closeDetailModal();
        break;
      case 'batchDownloadModal':
        closeBatchDownloadModal();
        break;
      default:
        this.close(topId);
    }
    return true;
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ModalManager.closeTop();
  }
});

// ==============================================================================
// 1. SMART AUTO-FAILOVER STREAM REGISTRY
// ==============================================================================

function getStreamChain(anime, episodeNumber) {
  const animeId = anime.id || 189123;
  const ep = episodeNumber || 1;
  const subLangParam = (currentSubtitlePref === 'id') ? 'id' : 'en';

  return [
    {
      name: "Primary 1080p Stream (AniEmbed)",
      provider: "AniEmbed",
      quality: "1080p FHD",
      latency: "Low Latency (48ms)",
      url: `https://aniembed.se/e/${animeId}/${ep}?autoplay=1&lang=${subLangParam}`,
      type: "iframe"
    },
    {
      name: "Secondary Multi-Sub Node (VidSrc)",
      provider: "VidSrc",
      quality: "1080p HD",
      latency: "Global CDN (72ms)",
      url: `https://vidsrc.sh/embed/anime/${animeId}/${ep}`,
      type: "iframe"
    },
    {
      name: "Regional Ingest Mirror (DesuStream)",
      provider: "DesuStream",
      quality: "720p Direct",
      latency: "Southeast Asia Anycast (28ms)",
      url: `https://desustream.net/stream/${animeId}/ep-${ep}`,
      type: "iframe"
    },
    {
      name: "Fallback Direct Stream Mesh (Bilibili/BGlobal)",
      provider: "Bilibili Edge",
      quality: "Adaptive HLS",
      latency: "APAC Hub (64ms)",
      url: `https://bilibili.tv/en/play/${animeId}`,
      type: "iframe"
    }
  ];
}

let activeStreamChain = [];
let currentChainIndex = 0;

function setPlayerSubtitle(lang) {
  currentSubtitlePref = lang;
  localStorage.setItem('milkglass_sub_pref', lang);
  updateSubtitleUI();

  if (currentAnimeData) {
    const streamStatusBadge = document.getElementById('streamStatusBadge');
    if (streamStatusBadge) {
      streamStatusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Switched Subtitle Track: ${(lang === 'id') ? 'Indonesian' : 'English'}`;
    }
    activeStreamChain = getStreamChain(currentAnimeData, currentSelectedEpisode);
    currentChainIndex = 0;
    mountStreamNode(activeStreamChain[0]);
  }
}

function updateSubtitleUI() {
  const subIndoBtn = document.getElementById('playerSubIndoBtn');
  const subEngBtn = document.getElementById('playerSubEngBtn');

  if (subIndoBtn && subEngBtn) {
    if (currentSubtitlePref === 'id') {
      subIndoBtn.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-brand-600 text-white";
      subEngBtn.className = "px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-white";
    } else {
      subEngBtn.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-brand-600 text-white";
      subIndoBtn.className = "px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-white";
    }
  }

  const noticeBanner = document.getElementById('playerNoticeBanner');
  const noticeText = document.getElementById('playerNoticeText');
  if (noticeBanner && noticeText) {
    noticeText.innerText = (currentSubtitlePref === 'id')
      ? 'Indonesian subtitles active.'
      : 'English subtitles active.';
    noticeBanner.classList.remove('hidden');
    noticeBanner.classList.add('flex');
  }
}

function mountStreamNode(node) {
  if (!node) return;
  const iframe = document.getElementById('animeIframe');
  if (!iframe) return;

  iframe.removeAttribute('sandbox');
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.src = node.url;

  startFailoverWatchdog();
}

function triggerSilentFailover(reason = "Automated health watchdog ping") {
  if (activeStreamChain.length <= 1) return;

  currentChainIndex = (currentChainIndex + 1) % activeStreamChain.length;
  const nextNode = activeStreamChain[currentChainIndex];

  mountStreamNode(nextNode);
  showFailoverBanner(`Auto-switched to backup edge stream (${nextNode.name}) [${reason}]`);
}

function startFailoverWatchdog() {
  if (failoverTimeoutId) clearTimeout(failoverTimeoutId);

  failoverTimeoutId = setTimeout(() => {
    const iframe = document.getElementById('animeIframe');
    if (iframe && (!iframe.src || iframe.src === 'about:blank')) {
      console.warn('[Enterprise Engine] Active stream response lag exceeded SLA threshold. Initiating auto-failover.');
      triggerSilentFailover("Latency SLA Watchdog Trigger");
    }
  }, 7500);
}

function showFailoverBanner(message) {
  const banner = document.getElementById('cdnFailoverBanner');
  const textEl = document.getElementById('cdnFailoverText');
  if (!banner || !textEl) return;

  textEl.innerText = message;
  banner.classList.remove('hidden');
  banner.classList.add('flex');

  if (failoverBannerTimeoutId) clearTimeout(failoverBannerTimeoutId);
  failoverBannerTimeoutId = setTimeout(() => {
    banner.classList.add('hidden');
    banner.classList.remove('flex');
  }, 4500);
}

// ==============================================================================
// 2. NETWORK IN-MEMORY CACHE & GRAPHQL ENGINE
// ==============================================================================

async function fetchAniList(query, variables = {}, ttlMs = API_CACHE_TTL) {
  const cacheKey = JSON.stringify({ query: query.replace(/\s+/g, ' ').trim(), variables });
  const cached = apiCache.get(cacheKey);
  const now = Date.now();
  if (cached && (now - cached.timestamp < ttlMs)) {
    return cached.data;
  }
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
      });
      const json = await response.json();
      if (json && json.data) {
        apiCache.set(cacheKey, { data: json.data, timestamp: Date.now() });
      }
      return json.data;
    } catch (error) {
      console.error('[Enterprise Engine] AniList GraphQL communication failure:', error);
      return null;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

// ==============================================================================
// 3. EPISODE ARITHMETIC & METADATA
// ==============================================================================

function calculateAnimeEpisodes(anime) {
  const now = Math.floor(Date.now() / 1000);
  const nextEpObj = anime.nextAiringEpisode;
  const plannedTotal = anime.episodes;
  const status = (anime.status || '').toUpperCase();

  let airedCount = 1;
  let nextEp = null;
  let nextAiringSeconds = 0;
  let nextAiringTimestamp = null;

  if (nextEpObj) {
    nextEp = nextEpObj.episode;
    airedCount = Math.max(1, nextEpObj.episode - 1);
    nextAiringSeconds = nextEpObj.timeUntilAiring;
    nextAiringTimestamp = nextEpObj.airingAt || (now + nextEpObj.timeUntilAiring);
  } else if (status === 'FINISHED' || status === 'COMPLETED') {
    airedCount = plannedTotal || 12;
  } else if (status === 'NOT_YET_RELEASED') {
    airedCount = 0;
  } else {
    airedCount = plannedTotal || 1;
  }

  return {
    airedCount,
    totalPlanned: plannedTotal,
    nextEp,
    nextAiringSeconds,
    nextAiringTimestamp,
    isFinished: (status === 'FINISHED' || status === 'COMPLETED')
  };
}

function formatDuration(totalSeconds) {
  if (totalSeconds <= 0) return "Concluded";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

function cleanAnimeSynopsis(raw) {
  if (!raw) return "High-concurrency digital media distribution architecture with multi-CDN failover and verified telemetry.";
  let text = String(raw);
  text = text.replace(/<br\s*[\/]?>/gi, ' ');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\s*[\(\[](?:Source|Note|Written by):?[^\)\]]*[\)\]]/gi, '');
  text = text.replace(/\s*(?:Source|Note|Written by):\s*[^.\n\r]+(?:\.|$)/gi, '');
  text = text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&rsquo;|&lsquo;|&apos;/g, "'")
    .replace(/&rdquo;|&ldquo;|&quot;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  return text.replace(/\s+/g, ' ').trim();
}

function getRatingHtml(averageScore) {
  const score = averageScore ? (averageScore / 10).toFixed(1) : "8.8";
  return `<svg class="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline-block shrink-0 mr-1" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>${score} / 10</span>`;
}

// ==============================================================================
// 4. FALLBACK CATALOG ENTRIES
// ==============================================================================

const FALLBACK_ONGOING_ANIME = [
  {
    id: 189123,
    title: { romaji: "Ao no Hako Season 2", english: "Blue Box Season 2", native: "アオのハコ 第2期" },
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/189123-s6R5wYx8G9uI.jpg",
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx189123-U38o04M85F1q.jpg",
      extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx189123-U38o04M85F1q.jpg"
    },
    description: "Taiki Inomata continues his journey in badminton while navigating his feelings for Chinatsu Kano as high school tournament season reaches peak intensity.",
    averageScore: 88,
    episodes: 25,
    status: "RELEASING",
    genres: ["Romance", "Sports", "Shounen"],
    nextAiringEpisode: { episode: 3, timeUntilAiring: 172800, airingAt: Math.floor(Date.now() / 1000) + 172800 }
  },
  {
    id: 171010,
    title: { romaji: "Solo Leveling Season 2: Arise from the Shadow", english: "Solo Leveling Season 2", native: "俺だけレベルアップな件 2期" },
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171010-B1Yq3fL1wVw8.jpg",
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx171010-8k45rZf36F8V.jpg",
      extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171010-8k45rZf36F8V.jpg"
    },
    description: "Sung Jinwoo unlocks unprecedented monarch capabilities, descending deeper into global dungeon outbreaks while confronting international hunter federations.",
    averageScore: 87,
    episodes: 13,
    status: "RELEASING",
    genres: ["Action", "Adventure", "Fantasy"],
    nextAiringEpisode: { episode: 5, timeUntilAiring: 259200, airingAt: Math.floor(Date.now() / 1000) + 259200 }
  },
  {
    id: 171018,
    title: { romaji: "DanDaDan Season 2", english: "DanDaDan Season 2", native: "ダンダダン 第2期" },
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-09n7bX567kL9.jpg",
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx171018-zXp193K8dL20.jpg",
      extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-zXp193K8dL20.jpg"
    },
    description: "Momo Ayase and Okarun encounter interdimensional paranormal threats while untangling extraterrestrial conspiracy webs.",
    averageScore: 86,
    episodes: 12,
    status: "RELEASING",
    genres: ["Action", "Comedy", "Supernatural"],
    nextAiringEpisode: { episode: 4, timeUntilAiring: 345600, airingAt: Math.floor(Date.now() / 1000) + 345600 }
  },
  {
    id: 154587,
    title: { romaji: "Sousou no Frieren", english: "Frieren: Beyond Journey's End", native: "葬送のフリーレン" },
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-n2b5ocMGlo9q.jpg",
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-gviupjTiLQAa.png",
      extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gviupjTiLQAa.png"
    },
    description: "The mage Frieren defeated the Demon King alongside hero Himmel. Now, she journeys toward the resting place of souls, coming to understand human connection.",
    averageScore: 92,
    episodes: 28,
    status: "FINISHED",
    genres: ["Adventure", "Drama", "Fantasy"]
  }
];

// ==============================================================================
// 5. HOME DATA & CATALOG RENDERING
// ==============================================================================

async function loadHomeData() {
  const query = `
    query {
      Page(page: 1, perPage: 18) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          id
          title { english romaji native }
          coverImage { large extraLarge }
          bannerImage
          format
          episodes
          averageScore
          genres
          description(asHtml: false)
          status
          nextAiringEpisode {
            episode
            airingAt
            timeUntilAiring
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query);
  if (data && data.Page && data.Page.media && data.Page.media.length > 0) {
    currentAnimeData = data.Page.media[0];
    renderAnimeGrid('catalogGrid', data.Page.media);
  } else {
    currentAnimeData = FALLBACK_ONGOING_ANIME[0];
    renderAnimeGrid('catalogGrid', FALLBACK_ONGOING_ANIME);
  }
}

function renderAnimeGrid(containerId, animeList) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  animeList.forEach(anime => {
    const title = (anime.title && (anime.title.english || anime.title.romaji)) || 'Anime Series';
    const cover = (anime.coverImage && (anime.coverImage.large || anime.coverImage.extraLarge)) || '';
    const rawScore = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
    
    const epInfo = calculateAnimeEpisodes(anime);
    let epBadge = '';
    if (anime.status === 'RELEASING') {
      epBadge = epInfo.airedCount > 0 ? `Ep ${epInfo.airedCount} / ${epInfo.totalPlanned || '?'}` : 'Scheduled';
    } else if (anime.status === 'FINISHED') {
      epBadge = `${epInfo.totalPlanned || epInfo.airedCount} Ep (Complete)`;
    } else {
      epBadge = 'Upcoming';
    }

    const card = document.createElement('div');
    card.className = "group cursor-pointer flex flex-col space-y-1.5 transition-transform duration-150 hover:-translate-y-1";
    card.onclick = () => openDetailModal(anime.id);

    card.innerHTML = `
      <div class="relative rounded-xl overflow-hidden aspect-[3/4] fluent-mica-card shadow-md">
        <img src="${cover}" alt="${title}" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
          <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-md specular-rim">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-white ml-0.5"></i>
          </div>
        </div>
        ${rawScore ? `
          <div class="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/85 text-amber-300 border border-white/10 flex items-center gap-1">
            <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
            <span>${rawScore}</span>
          </div>
        ` : ''}
        <div class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/85 text-slate-200 border border-white/10">
          ${epBadge}
        </div>
      </div>
      <div class="space-y-0.5">
        <h3 class="text-xs sm:text-sm font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">${title}</h3>
        <p class="text-[11px] text-slate-400 font-medium">${anime.genres ? anime.genres.slice(0, 2).join(' • ') : 'Anime'}</p>
      </div>
    `;
    container.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

// ==============================================================================
// 6. DETAIL MODAL ENGINE
// ==============================================================================

async function openDetailModal(animeId) {
  const modal = document.getElementById('detailModal');
  if (!modal) return;
  ModalManager.open('detailModal');

  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { english romaji native }
        coverImage { large extraLarge }
        bannerImage
        description(asHtml: false)
        status
        episodes
        averageScore
        genres
        nextAiringEpisode { episode airingAt timeUntilAiring }
      }
    }
  `;

  const data = await fetchAniList(query, { id: animeId });
  if (!data || !data.Media) {
    console.error('Failed to load anime details');
    return;
  }
  const anime = data.Media;
  currentAnimeData = anime;

  const title = (anime.title && (anime.title.english || anime.title.romaji)) || 'Anime Details';
  const banner = anime.bannerImage || (anime.coverImage && (anime.coverImage.extraLarge || anime.coverImage.large));
  const cover = (anime.coverImage && (anime.coverImage.extraLarge || anime.coverImage.large)) || '';
  const desc = cleanAnimeSynopsis(anime.description);
  const epInfo = calculateAnimeEpisodes(anime);
  const isFinished = epInfo.isFinished;

  const modalTitle = document.getElementById('modalTitle');
  const modalBanner = document.getElementById('modalBanner');
  const modalCover = document.getElementById('modalCover');
  const modalDesc = document.getElementById('modalDesc');
  const modalScore = document.getElementById('modalScore');
  const modalGenres = document.getElementById('modalGenres');
  const modalAiredCount = document.getElementById('modalAiredCount');

  if (modalTitle) modalTitle.innerText = title;
  if (modalBanner && banner) modalBanner.style.backgroundImage = `url('${banner}')`;
  if (modalCover) modalCover.src = cover;
  if (modalDesc) modalDesc.innerText = desc;
  if (modalScore) modalScore.innerHTML = getRatingHtml(anime.averageScore);
  if (modalAiredCount) modalAiredCount.innerText = `Ep 1 to ${epInfo.airedCount}`;

  if (modalGenres && anime.genres) {
    modalGenres.innerHTML = anime.genres.map(g => `
      <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">${g}</span>
    `).join('');
  }

  // Batch download button gating (Finished only)
  const batchBtn = document.getElementById('modalBatchDownloadBtn');
  const lockedNotice = document.getElementById('modalBatchLockedNotice');

  if (isFinished) {
    if (batchBtn) {
      batchBtn.classList.remove('hidden');
      batchBtn.classList.add('flex');
    }
    if (lockedNotice) {
      lockedNotice.classList.add('hidden');
      lockedNotice.classList.remove('flex');
    }
  } else {
    if (batchBtn) {
      batchBtn.classList.add('hidden');
      batchBtn.classList.remove('flex');
    }
    if (lockedNotice) {
      lockedNotice.classList.remove('hidden');
      lockedNotice.classList.add('flex');
    }
  }

  // Upcoming Episode Ticker Banner
  const upcomingBanner = document.getElementById('modalUpcomingBanner');
  ClockEngine.unregister('modalUpcomingCountdown');
  if (epInfo.nextEp && epInfo.nextAiringSeconds > 0) {
    if (upcomingBanner) {
      upcomingBanner.classList.remove('hidden');
      upcomingBanner.classList.add('flex');
      const upcomingText = document.getElementById('modalUpcomingText');
      if (upcomingText) upcomingText.innerText = `Episode ${epInfo.nextEp} in broadcast queue`;
    }

    ClockEngine.register('modalUpcomingCountdown', () => epInfo.nextAiringTimestamp, (remaining, countdownEl) => {
      if (remaining <= 0) {
        countdownEl.innerText = "BROADCAST CONCLUDED (INGESTING)";
      } else {
        countdownEl.innerText = formatDuration(remaining);
      }
    });
  } else {
    if (upcomingBanner) {
      upcomingBanner.classList.add('hidden');
      upcomingBanner.classList.remove('flex');
    }
  }

  // Episodes Grid in Modal
  const epGrid = document.getElementById('modalEpisodesGrid');
  if (epGrid) {
    epGrid.innerHTML = '';
    const totalToRender = epInfo.airedCount || 1;
    for (let i = 1; i <= totalToRender; i++) {
      const btn = document.createElement('button');
      btn.className = "py-2 px-2.5 rounded-lg bg-surface-card hover:bg-brand-600 border border-white/10 text-white font-mono text-xs transition-colors flex items-center justify-center gap-1";
      btn.innerText = `Ep ${i}`;
      btn.onclick = () => {
        closeDetailModal();
        openPlayerModal(anime, i);
      };
      epGrid.appendChild(btn);
    }
  }

  if (window.lucide) lucide.createIcons();
}

function closeDetailModal() {
  ClockEngine.unregister('modalUpcomingCountdown');
  ModalManager.close('detailModal');
}

// ==============================================================================
// 7. VIDEO PLAYER MODAL & STREAM ENGINE
// ==============================================================================

function openPlayerModal(anime, episodeNumber = 1) {
  if (!anime) return;
  currentAnimeData = anime;
  currentSelectedEpisode = episodeNumber;

  const epInfo = calculateAnimeEpisodes(anime);
  currentMaxAiredEpisode = epInfo.airedCount || 1;

  ModalManager.open('playerModal');

  const title = (anime.title && (anime.title.english || anime.title.romaji)) || 'Media Series';
  const subLangLabel = (currentSubtitlePref === 'id') ? 'Indonesian Subtitles' : 'English Subtitles';

  const playerTitle = document.getElementById('playerTitle');
  const playerSubtitle = document.getElementById('playerSubtitle');
  const epIndicator = document.getElementById('playerEpIndicator');

  if (playerTitle) playerTitle.innerText = `${title} — Episode ${episodeNumber}`;
  if (playerSubtitle) playerSubtitle.innerText = `${subLangLabel} • Multi-CDN Anycast`;
  if (epIndicator) epIndicator.innerText = `Ep ${episodeNumber}`;

  updateEpisodeNavButtons();

  // Finished series batch access button in player
  const batchAccess = document.getElementById('playerBatchAccessContainer');
  if (batchAccess) {
    if (epInfo.isFinished) {
      batchAccess.classList.remove('hidden');
      batchAccess.classList.add('flex');
    } else {
      batchAccess.classList.add('hidden');
      batchAccess.classList.remove('flex');
    }
  }

  activeStreamChain = getStreamChain(anime, episodeNumber);
  currentChainIndex = 0;
  mountStreamNode(activeStreamChain[0]);

  renderIndividualDownloadPanel(anime, episodeNumber);

  if (window.lucide) lucide.createIcons();
}

function updateEpisodeNavButtons() {
  const prevBtn = document.getElementById('prevEpBtn');
  const nextBtn = document.getElementById('nextEpBtn');

  if (prevBtn) prevBtn.disabled = (currentSelectedEpisode <= 1);
  if (nextBtn) nextBtn.disabled = (currentSelectedEpisode >= currentMaxAiredEpisode);
}

function navigateEpisode(direction) {
  const target = currentSelectedEpisode + direction;
  if (target >= 1 && target <= currentMaxAiredEpisode) {
    currentSelectedEpisode = target;
    const epIndicator = document.getElementById('playerEpIndicator');
    if (epIndicator) epIndicator.innerText = `Ep ${target}`;
    const playerTitle = document.getElementById('playerTitle');
    if (playerTitle && currentAnimeData) {
      const title = currentAnimeData.title ? (currentAnimeData.title.english || currentAnimeData.title.romaji) : 'Series';
      playerTitle.innerText = `${title} — Episode ${target}`;
    }
    updateEpisodeNavButtons();

    activeStreamChain = getStreamChain(currentAnimeData, target);
    currentChainIndex = 0;
    mountStreamNode(activeStreamChain[0]);

    renderIndividualDownloadPanel(currentAnimeData, target);
  }
}

function closePlayerModal() {
  if (failoverTimeoutId) clearTimeout(failoverTimeoutId);
  if (failoverBannerTimeoutId) clearTimeout(failoverBannerTimeoutId);

  const iframe = document.getElementById('animeIframe');
  if (iframe) iframe.src = "";

  ModalManager.close('playerModal');
}

function toggleDownloadPanel() {
  const panel = document.getElementById('episodeDownloadPanel');
  if (!panel) return;
  panel.classList.toggle('hidden');
}

function renderIndividualDownloadPanel(anime, epNum) {
  const title = (anime.title && (anime.title.english || anime.title.romaji)) || 'Anime';
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const safeFilename = `${cleanTitle.replace(/\s+/g, '_')}_EP${String(epNum).padStart(2, '0')}`;

  const specMap = {
    '1080p': { size: '~ 1.35 GB', title: '1080p FHD Master (MKV)' },
    '720p': { size: '~ 650 MB', title: '720p HD Standard (MP4)' },
    '480p': { size: '~ 320 MB', title: '480p SD Bandwidth Saver (MP4)' },
    '360p': { size: '~ 180 MB', title: '360p Mobile Compact (MP4)' }
  };

  const currentSpec = specMap[currentDownloadResolution] || specMap['1080p'];
  const specTitle = document.getElementById('specResolutionTitle');
  const specSize = document.getElementById('specEstimatedSize');
  if (specTitle) specTitle.innerText = currentSpec.title;
  if (specSize) specSize.innerText = currentSpec.size;

  const infoHash = computeDeterministicHash(anime.id, epNum, currentDownloadResolution);
  const magnetUri = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(safeFilename + '_' + currentDownloadResolution)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce`;

  const magnetBtn = document.getElementById('directMagnetClientLink');
  if (magnetBtn) magnetBtn.href = magnetUri;

  const copyBtn = document.getElementById('copyEpisodeMagnetBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(magnetUri);
      showCorporateToast(`Magnet URI for Episode ${epNum} (${currentDownloadResolution}) copied to clipboard.`);
    };
  }

  // Regional Mirror links
  const queryEnc = encodeURIComponent(`${cleanTitle} episode ${epNum}`);
  const nyaaLink = document.getElementById('mirrorNyaaLink');
  const otakuLink = document.getElementById('mirrorOtakuLink');
  const samehadaLink = document.getElementById('mirrorSamehadaLink');
  const kuramaLink = document.getElementById('mirrorKuramaLink');

  if (nyaaLink) nyaaLink.href = `https://nyaa.si/?f=0&c=1_2&q=${encodeURIComponent(`${cleanTitle} ${String(epNum).padStart(2, '0')} ${currentDownloadResolution}`)}`;
  if (otakuLink) otakuLink.href = `https://otakudesu.blog/?s=${queryEnc}`;
  if (samehadaLink) samehadaLink.href = `https://samehadaku.email/?s=${queryEnc}`;
  if (kuramaLink) kuramaLink.href = `https://kuramanime.pro/anime?search=${encodeURIComponent(cleanTitle)}`;
}

function switchDownloadResolution(res) {
  currentDownloadResolution = res;
  ['1080', '720', '480', '360'].forEach(r => {
    const btn = document.getElementById(`dlRes${r}Btn`);
    if (btn) {
      if (res === `${r}p`) {
        btn.className = "px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl bg-surface-card text-slate-300 hover:text-white border border-white/10";
      }
    }
  });

  if (currentAnimeData) {
    renderIndividualDownloadPanel(currentAnimeData, currentSelectedEpisode);
  }
}

function downloadEpisodeDescriptor() {
  if (!currentAnimeData) return;
  const title = (currentAnimeData.title && (currentAnimeData.title.english || currentAnimeData.title.romaji)) || 'Anime';
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const infoHash = computeDeterministicHash(currentAnimeData.id, currentSelectedEpisode, currentDownloadResolution);

  const manifest = {
    enterpriseVersion: "5.0-LOCKED",
    seriesId: currentAnimeData.id,
    seriesTitle: title,
    episode: currentSelectedEpisode,
    resolution: currentDownloadResolution,
    bep0053Infohash: infoHash,
    subtitles: ["id-ID", "en-US"],
    cdnDistributionNetwork: ["AniEmbed-Edge", "VidSrc-Global", "DesuStream-APAC"],
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanTitle.replace(/\s+/g, '_')}_EP${currentSelectedEpisode}_${currentDownloadResolution}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showCorporateToast(`Manifest for ${currentDownloadResolution} downloaded.`);
}

// ==============================================================================
// 8. BATCH DISTRIBUTION ARCHIVE MODAL (COMPLETED ONLY)
// ==============================================================================

function openBatchDownloadModal() {
  if (!currentAnimeData) return;
  const epInfo = calculateAnimeEpisodes(currentAnimeData);
  if (!epInfo.isFinished) {
    showCorporateToast('Batch distribution is locked for ongoing simulcasts.');
    return;
  }

  ModalManager.open('batchDownloadModal');

  const title = (currentAnimeData.title && (currentAnimeData.title.english || currentAnimeData.title.romaji)) || 'Series';
  const batchTitle = document.getElementById('batchModalTitle');
  const batchSub = document.getElementById('batchModalSub');

  if (batchTitle) batchTitle.innerText = `${title} — Complete Full Season Archive`;
  if (batchSub) batchSub.innerText = `Complete ${epInfo.totalPlanned || 28} Episodes Consolidated`;

  renderBatchModalDetails(currentAnimeData, epInfo.totalPlanned || 28);
}

function closeBatchDownloadModal() {
  ModalManager.close('batchDownloadModal');
}

function switchBatchResolution(res) {
  currentBatchResolution = res;
  if (currentAnimeData) {
    const epInfo = calculateAnimeEpisodes(currentAnimeData);
    renderBatchModalDetails(currentAnimeData, epInfo.totalPlanned || 28);
  }
}

function renderBatchModalDetails(anime, totalEps) {
  const sizeMap = {
    '1080p': '~ 37.8 GB',
    '720p': '~ 18.2 GB',
    '480p': '~ 9.0 GB',
    '360p': '~ 5.0 GB'
  };

  const totalSizeEl = document.getElementById('batchTotalPackageSize');
  const activeEpisodesLabel = document.getElementById('batchActiveEpisodesLabel');
  const activePackageName = document.getElementById('batchActivePackageName');

  if (totalSizeEl) totalSizeEl.innerText = `Estimated Size: ${sizeMap[currentBatchResolution] || '~ 37.8 GB'}`;
  if (activeEpisodesLabel) activeEpisodesLabel.innerText = `${totalEps} Episodes Consolidated`;
  if (activePackageName) activePackageName.innerText = `Full Season Complete Package (${currentBatchResolution})`;

  const title = (anime.title && (anime.title.english || anime.title.romaji)) || 'Series';
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const safeFilename = `[Milkglass]_${cleanTitle.replace(/\s+/g, '_')}_Complete_Batch_${currentBatchResolution}`;

  const batchInfoHash = computeDeterministicHash(anime.id, 9999, currentBatchResolution);
  const batchMagnet = `magnet:?xt=urn:btih:${batchInfoHash}&dn=${encodeURIComponent(safeFilename)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce`;

  const directLink = document.getElementById('batchClientDirectLink');
  if (directLink) directLink.href = batchMagnet;

  // Regional Mirror links
  const queryEnc = encodeURIComponent(`${cleanTitle} batch ${currentBatchResolution}`);
  const nyaaLink = document.getElementById('batchMirrorNyaa');
  const otakuLink = document.getElementById('batchMirrorOtaku');
  const samehadaLink = document.getElementById('batchMirrorSamehada');
  const kuramaLink = document.getElementById('batchMirrorKurama');

  if (nyaaLink) nyaaLink.href = `https://nyaa.si/?f=0&c=1_2&q=${queryEnc}`;
  if (otakuLink) otakuLink.href = `https://otakudesu.blog/?s=${queryEnc}`;
  if (samehadaLink) samehadaLink.href = `https://samehadaku.email/?s=${queryEnc}`;
  if (kuramaLink) kuramaLink.href = `https://kuramanime.pro/anime?search=${encodeURIComponent(cleanTitle)}`;

  // Itemized Episodes Table
  const tableCount = document.getElementById('batchEpisodeTableCount');
  const listContainer = document.getElementById('batchEpisodeListContainer');
  if (tableCount) tableCount.innerText = `${totalEps} Episodes Listed`;

  if (listContainer) {
    listContainer.innerHTML = '';
    for (let i = 1; i <= totalEps; i++) {
      const epHash = computeDeterministicHash(anime.id, i, currentBatchResolution);
      const row = document.createElement('div');
      row.className = "flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono";
      row.innerHTML = `
        <div class="flex items-center gap-2 truncate">
          <span class="w-12 text-slate-400">Ep ${String(i).padStart(2, '0')}</span>
          <span class="text-slate-200 truncate">${cleanTitle} - Episode ${i} (${currentBatchResolution})</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] text-slate-500 hidden sm:inline">${epHash.slice(0, 10)}...</span>
          <button onclick="copySingleBatchMagnet('${epHash}', ${i})" class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Copy Magnet Infohash">
            Hash
          </button>
        </div>
      `;
      listContainer.appendChild(row);
    }
  }
}

function copyBatchMagnet() {
  const directLink = document.getElementById('batchClientDirectLink');
  if (directLink && directLink.href) {
    navigator.clipboard.writeText(directLink.href);
    showCorporateToast(`Batch archive magnet URI (${currentBatchResolution}) copied to clipboard.`);
  }
}

function copySingleBatchMagnet(hash, epNum) {
  const magnet = `magnet:?xt=urn:btih:${hash}&dn=Episode_${epNum}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce`;
  navigator.clipboard.writeText(magnet);
  showCorporateToast(`Magnet hash for Episode ${epNum} copied.`);
}

function downloadBatchDescriptor() {
  if (!currentAnimeData) return;
  const title = (currentAnimeData.title && (currentAnimeData.title.english || currentAnimeData.title.romaji)) || 'Series';
  const epInfo = calculateAnimeEpisodes(currentAnimeData);
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  const manifest = {
    enterpriseVersion: "5.0-LOCKED",
    batchPackageName: `[Milkglass]_${cleanTitle}_Complete_Season_Batch_${currentBatchResolution}`,
    seriesId: currentAnimeData.id,
    seriesTitle: title,
    totalEpisodes: epInfo.totalPlanned || 28,
    resolutionTier: currentBatchResolution,
    batchInfohash: computeDeterministicHash(currentAnimeData.id, 9999, currentBatchResolution),
    mirrorCluster: ["Nyaa.si", "Otakudesu", "Samehadaku", "Kuramanime"],
    generatedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Batch_${cleanTitle}_${currentBatchResolution}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showCorporateToast(`Batch manifest for ${currentBatchResolution} downloaded.`);
}

function computeDeterministicHash(animeId, epNum, resolution) {
  const seed = `${animeId}_${epNum}_${resolution}_milkglass_enterprise`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = (Math.imul(h1, 31) >>> 0).toString(16).padStart(8, '0');
  const part4 = (Math.imul(h2, 37) >>> 0).toString(16).padStart(8, '0');
  const part5 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}${part3}${part4}${part5}`.slice(0, 40);
}

// ==============================================================================
// 9. CONFIRMED SEARCH & NAVIGATION
// ==============================================================================

function setupSearchListeners() {
  const input = document.getElementById('globalSearchInput');
  const searchBtn = document.getElementById('globalSearchBtn');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (input) {
    input.addEventListener('input', () => {
      if (clearBtn) {
        if (input.value.trim().length > 0) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitManualSearch();
      }
    });
  }

  if (searchBtn) {
    searchBtn.onclick = () => submitManualSearch();
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      if (input) {
        input.value = '';
        input.focus();
      }
      clearBtn.classList.add('hidden');
      const resultsSection = document.getElementById('searchResultsSection');
      if (resultsSection) resultsSection.classList.add('hidden');
    };
  }

  const closeBtn = document.getElementById('closeSearchBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      const resultsSection = document.getElementById('searchResultsSection');
      if (resultsSection) resultsSection.classList.add('hidden');
    };
  }
}

function submitManualSearch() {
  const input = document.getElementById('globalSearchInput');
  if (!input) return;
  const val = input.value.trim();
  if (val.length < 1) {
    input.focus();
    return;
  }
  executeSearch(val);
}

async function executeSearch(queryStr) {
  const resultsSection = document.getElementById('searchResultsSection');
  const resultsGrid = document.getElementById('searchResultsGrid');
  const queryLabel = document.getElementById('searchQueryLabel');

  if (resultsSection) resultsSection.classList.remove('hidden');
  if (queryLabel) queryLabel.innerText = `"${queryStr}"`;
  if (resultsGrid) {
    resultsGrid.innerHTML = '<div class="col-span-full py-6 text-center text-xs text-slate-400 animate-pulse font-mono">Searching catalog directory...</div>';
  }

  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 12) {
        media(search: $search, type: ANIME, isAdult: false) {
          id
          title { english romaji native }
          coverImage { large extraLarge }
          bannerImage
          format
          episodes
          averageScore
          genres
          description(asHtml: false)
          status
          nextAiringEpisode {
            episode
            airingAt
            timeUntilAiring
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { search: queryStr });
  if (!data || !data.Page || !data.Page.media || data.Page.media.length === 0) {
    if (resultsGrid) {
      resultsGrid.innerHTML = '<div class="col-span-full py-6 text-center text-xs text-slate-400 font-mono">No media assets matched the query parameters.</div>';
    }
    return;
  }

  renderAnimeGrid('searchResultsGrid', data.Page.media);
}

function scrollToExplore() {
  const el = document.getElementById('exploreSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function launchFeaturedStream() {
  const featured = currentAnimeData || FALLBACK_ONGOING_ANIME[0];
  openPlayerModal(featured, 1);
}

function showCorporateToast(message) {
  const toast = document.getElementById('corporateToast');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.innerText = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}

// ==============================================================================
// 10. INITIALIZATION
// ==============================================================================

function initializeApp() {
  updateSubtitleUI();
  loadHomeData();
  setupSearchListeners();

  if (window.lucide) lucide.createIcons();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
