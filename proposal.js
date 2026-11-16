/* ==========================================================================
   THE MUSEUM OF US — Interactive Proposal Experience (proposal.html)
   Handles:
     - Loading room config via /api/museums?pin=<PIN> (+ localStorage fallback)
     - Oval scalloped lace cameo, custom prompt, and partner .nickname-swap reveal
     - Dodging "No" on Tries 1 & 2 (desktop mouse & mobile touch) with growing "Yes"
     - Bittersweet acceptance of rejection on Try 3 + unobtrusive museum fallback link
     - Celebratory crimson & cream floating hearts + redirect to index.html?pin=<PIN>
   ========================================================================== */

(() => {
  "use strict";

  const PUBLIC_ROOMS_STORAGE_KEY = "love_museum_public_rooms_v1";
  const DEFAULT_CAMEO_URL = "images/love1.jpg";
  const DEFAULT_PROPOSAL_PROMPT =
    "Will you accept Our Love Museum and open every memory inside?";

  const DODGE_VARIANTS = [
    {
      noText: "Are you sure? Think again...",
      nudge:
        "Wait\u2014are you sure?! I handpicked our favorite Foyer letters and memories for you inside...",
      yesScale: 1.12,
    },
    {
      noText: "Really? One last chance before heartbreak...",
      nudge:
        "Look closely\u2014even the eternal rose beneath glass is holding its breath for a Yes...",
      yesScale: 1.24,
    },
  ];

  const EDITION_PRESETS = {
    public: {
      partner1: { id: "Him", name: "Him", nickname: "" },
      partner2: { id: "Her", name: "Her", nickname: "" },
    },
  };

  const state = {
    pin: "SAMPLE",
    passcode: "",
    edition: "public",
    room: null,
    rejectAttempts: 0,
    isCompleted: false,
    prevNoPos: null,
    lastDodgeAt: 0,
    lastPointerEnterAt: 0,
    lastTouchAt: 0,
    ignoreNextClickUntil: 0,
  };

  const dom = {
    brandLink: document.getElementById("proposal-brand-link"),
    pinBadge: document.getElementById("proposal-pin-badge"),
    pinCode: document.getElementById("proposal-pin-code"),
    navCta: document.getElementById("proposal-nav-cta"),
    heartsLayer: document.getElementById("proposal-hearts"),

    loadingEl: document.getElementById("proposal-loading"),
    passcodeCard: document.getElementById("proposal-passcode-card"),
    passcodeForm: document.getElementById("proposal-passcode-form"),
    passcodeInput: document.getElementById("proposal-passcode-input"),
    passcodeError: document.getElementById("proposal-passcode-error"),
    notFoundCard: document.getElementById("proposal-notfound-card"),
    experienceEl: document.getElementById("proposal-experience"),

    coupleNames: document.getElementById("proposal-couple-names"),
    cameoImg: document.getElementById("proposal-cameo-img"),
    laceSvg: document.getElementById("proposal-lace-svg"),
    promptEl: document.getElementById("proposal-prompt"),
    nudgeEl: document.getElementById("proposal-nudge"),

    arena: document.getElementById("proposal-arena"),
    actions: document.getElementById("proposal-actions"),
    btnYes: document.getElementById("proposal-btn-yes"),
    btnNo: document.getElementById("proposal-btn-no"),

    bittersweetEl: document.getElementById("proposal-bittersweet"),
    bittersweetMsg: document.getElementById("proposal-bittersweet-msg"),
    openAnywayLink: document.getElementById("proposal-open-anyway"),

    celebrationEl: document.getElementById("proposal-celebration"),
    celebrationMsg: document.getElementById("proposal-celebration-msg"),
    enterNowLink: document.getElementById("proposal-enter-now"),
  };

  let whisperTimerId = null;

  /* ------------------------------------------------------------------------
     HELPERS: PIN, ESCAPING, LOCAL STORAGE & MUSEUM LINK
     ------------------------------------------------------------------------ */
  function normalizePin(raw) {
    return String(raw || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function formatPinDisplay(pin) {
    const clean = normalizePin(pin);
    if (!clean || clean === "SAMPLE") return clean;
    if (clean.length === 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return clean;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function getMuseumUrl() {
    if (!state.pin || state.pin === "SAMPLE") return "index.html";
    return `index.html?pin=${encodeURIComponent(state.pin)}`;
  }

  function readLocalPublicRooms() {
    try {
      const raw = localStorage.getItem(PUBLIC_ROOMS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function updateLocalRoomProposal(accepted, rejectionsCount) {
    try {
      const rooms = readLocalPublicRooms();
      const existing = rooms[state.pin];
      if (!existing || typeof existing !== "object") return;
      existing.proposalAccepted = Boolean(accepted);
      existing.proposalRejections = Number(rejectionsCount || 0);
      rooms[state.pin] = existing;
      localStorage.setItem(PUBLIC_ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch (_) {
      // Ignore storage errors
    }
  }

  function buildLocalFallbackRoom(pin) {
    const norm = normalizePin(pin);
    const rooms = readLocalPublicRooms();
    if (norm && rooms[norm] && typeof rooms[norm] === "object") {
      return rooms[norm];
    }

    if (!norm || norm === "SAMPLE") {
      return {
        pin: "SAMPLE",
        displayPin: "SAMPLE",
        edition: "public",
        isSample: true,
        isHeirloom: false,
        ...EDITION_PRESETS.public,
        heroCameoUrl: DEFAULT_CAMEO_URL,
        proposalPrompt: DEFAULT_PROPOSAL_PROMPT,
      };
    }

    return null;
  }

  /* ------------------------------------------------------------------------
     SCALLOPED OVAL LACE SVG OVERLAY (Matches index.html Cameo)
     ------------------------------------------------------------------------ */
  function populateOvalLaceSvg(svgEl) {
    if (!svgEl) return;
    const maskId = "proposal-oval-lace-mask";
    const cx = 120;
    const cy = 150;
    const petals = 28;
    const rxOuter = 102;
    const ryOuter = 130;
    const rxInner = 93;
    const ryInner = 121;

    let petalCircles = "";
    let outerEyelets = "";
    let innerEyelets = "";

    for (let i = 0; i < petals; i += 1) {
      const theta = (2 * Math.PI * i) / petals;
      const px = (cx + rxOuter * Math.cos(theta)).toFixed(2);
      const py = (cy + ryOuter * Math.sin(theta)).toFixed(2);
      petalCircles += `<circle cx="${px}" cy="${py}" r="13.5" fill="white" />`;
      outerEyelets += `<circle cx="${px}" cy="${py}" r="4.3" fill="black" />`;

      const halfTheta = theta + Math.PI / petals;
      const ix = (cx + rxInner * Math.cos(halfTheta)).toFixed(2);
      const iy = (cy + ryInner * Math.sin(halfTheta)).toFixed(2);
      innerEyelets += `<circle cx="${ix}" cy="${iy}" r="2.2" fill="black" />`;
    }

    svgEl.innerHTML = `
      <defs>
        <mask id="${maskId}">
          <rect width="240" height="300" fill="black" />
          <ellipse cx="${cx}" cy="${cy}" rx="${rxOuter}" ry="${ryOuter}" fill="white" />
          ${petalCircles}
          <ellipse cx="${cx}" cy="${cy}" rx="85.5" ry="113.5" fill="black" />
          ${outerEyelets}
          ${innerEyelets}
        </mask>
      </defs>
      <rect width="240" height="300" fill="#ffffff" mask="url(#${maskId})" />
      <ellipse
        cx="${cx}" cy="${cy}" rx="88" ry="116"
        fill="none" stroke="#f9eede" stroke-width="1.6" stroke-dasharray="3 3"
      />
      <ellipse
        cx="${cx}" cy="${cy}" rx="95" ry="123"
        fill="none" stroke="#920d25" stroke-opacity="0.24" stroke-width="1"
      />
    `;
  }

  /* ------------------------------------------------------------------------
     PARTNER NAMES & SUBTLE NICKNAME REVEAL (.nickname-swap)
     ------------------------------------------------------------------------ */
  function extractPartnerPair(room) {
    const defaults = EDITION_PRESETS.public;

    const p1Name = String(
      room?.partner1?.name || room?.partner1Name || defaults.partner1.name
    ).trim();
    const p1Nick = String(
      room?.partner1?.nickname ?? room?.partner1Nickname ?? defaults.partner1.nickname
    ).trim();

    const p2Name = String(
      room?.partner2?.name || room?.partner2Name || defaults.partner2.name
    ).trim();
    const p2Nick = String(
      room?.partner2?.nickname ?? room?.partner2Nickname ?? defaults.partner2.nickname
    ).trim();

    return {
      partner1: { name: p1Name || defaults.partner1.name, nickname: p1Nick },
      partner2: { name: p2Name || defaults.partner2.name, nickname: p2Nick },
    };
  }

  function renderPartnerHtml(partner) {
    if (partner.nickname) {
      return `
        <span class="nickname-swap" tabindex="0" role="button" aria-label="${escapeAttr(partner.name)} (${escapeAttr(partner.nickname)})">
          <span class="nickname-real">${escapeHtml(partner.name)}</span>
          <span class="nickname-alias">${escapeHtml(partner.nickname)}</span>
        </span>
      `;
    }
    return escapeHtml(partner.name);
  }

  function initNicknameWhisper(hasNicknames) {
    document.addEventListener("click", (e) => {
      const swapEl = e.target.closest(".nickname-swap");
      if (!swapEl) return;
      swapEl.dataset.userPinned = "1";
      swapEl.classList.toggle("is-flipped");
    });

    if (whisperTimerId) clearInterval(whisperTimerId);
    if (!hasNicknames) return;

    whisperTimerId = window.setInterval(() => {
      const isTouchLike =
        window.matchMedia("(hover: none), (pointer: coarse)").matches ||
        window.innerWidth <= 860;
      if (!isTouchLike) return;

      const targets = document.querySelectorAll("#proposal-couple-names .nickname-swap");
      targets.forEach((el) => {
        if (el.dataset.userPinned === "1") return;
        el.classList.add("is-flipped");
        window.setTimeout(() => {
          if (el.dataset.userPinned !== "1") {
            el.classList.remove("is-flipped");
          }
        }, 2100);
      });
    }, 4600);
  }

  /* ------------------------------------------------------------------------
     FLOATING HEARTS ANIMATION (Ambient + Celebration Burst)
     ------------------------------------------------------------------------ */
  function createHeartElement({ leftPct, sizePx, durationSec, delaySec, driftPx, fill, stroke, opacity, ambient }) {
    const el = document.createElement("span");
    el.className = ambient ? "proposal-heart proposal-heart--ambient" : "proposal-heart";
    el.style.left = `${leftPct}%`;
    el.style.width = `${sizePx}px`;
    el.style.height = `${sizePx}px`;
    el.style.setProperty("--heart-dur", `${durationSec}s`);
    el.style.setProperty("--heart-delay", `${delaySec}s`);
    el.style.setProperty("--heart-drift", `${driftPx}px`);
    el.style.setProperty("--heart-opacity", String(opacity));
    el.style.setProperty("--heart-scale", ambient ? "1.05" : (0.95 + Math.random() * 0.45).toFixed(2));
    el.style.setProperty("--heart-rot-start", `${Math.round(-18 + Math.random() * 36)}deg`);
    el.style.setProperty("--heart-rot-end", `${Math.round(-22 + Math.random() * 44)}deg`);

    el.innerHTML = `
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
        <path
          d="M12 21.35 C12 21.35 3 15.2 3 8.9 C3 5.6 5.6 3.2 8.6 3.2 C10.4 3.2 11.6 4.2 12 5.4 C12.4 4.2 13.6 3.2 15.4 3.2 C18.4 3.2 21 5.6 21 8.9 C21 15.2 12 21.35 12 21.35 Z"
          fill="${fill}"
          stroke="${stroke}"
          stroke-width="1.3"
        />
      </svg>
    `;
    return el;
  }

  function seedAmbientHearts() {
    if (!dom.heartsLayer) return;
    dom.heartsLayer.innerHTML = "";
    const palette = [
      { fill: "rgba(249, 238, 222, 0.34)", stroke: "rgba(255, 255, 255, 0.25)" },
      { fill: "rgba(244, 223, 201, 0.3)", stroke: "rgba(249, 238, 222, 0.22)" },
    ];
    for (let i = 0; i < 8; i += 1) {
      const swatch = palette[i % palette.length];
      const heart = createHeartElement({
        leftPct: (8 + i * 12 + Math.random() * 6).toFixed(1),
        sizePx: Math.round(16 + Math.random() * 12),
        durationSec: (7.5 + Math.random() * 4).toFixed(2),
        delaySec: (i * 0.85).toFixed(2),
        driftPx: Math.round(-28 + Math.random() * 56),
        fill: swatch.fill,
        stroke: swatch.stroke,
        opacity: 0.45,
        ambient: true,
      });
      dom.heartsLayer.appendChild(heart);
    }
  }

  function launchCelebrationHearts() {
    if (!dom.heartsLayer) return;
    const palette = [
      { fill: "#920d25", stroke: "#f9eede" },
      { fill: "#f9eede", stroke: "#920d25" },
      { fill: "#f4dfc9", stroke: "#920d25" },
      { fill: "#ffffff", stroke: "#920d25" },
    ];

    for (let i = 0; i < 34; i += 1) {
      const swatch = palette[i % palette.length];
      const heart = createHeartElement({
        leftPct: (4 + Math.random() * 92).toFixed(1),
        sizePx: Math.round(20 + Math.random() * 22),
        durationSec: (2.8 + Math.random() * 2.4).toFixed(2),
        delaySec: (Math.random() * 1.1).toFixed(2),
        driftPx: Math.round(-60 + Math.random() * 120),
        fill: swatch.fill,
        stroke: swatch.stroke,
        opacity: 0.96,
        ambient: false,
      });
      dom.heartsLayer.appendChild(heart);
    }
  }

  /* ------------------------------------------------------------------------
     DODGING "NO" ENGINE (Tries 1 & 2 Dodge, Try 3 Accepts)
     ------------------------------------------------------------------------ */
  function rectsOverlap(a, b) {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  }

  function moveNoButtonToSafeSpot() {
    const arena = dom.arena;
    const yesBtn = dom.btnYes;
    const noBtn = dom.btnNo;
    if (!arena || !yesBtn || !noBtn) return;

    const arenaRect = arena.getBoundingClientRect();

    // Capture current position relative to arena before switching to absolute positioning
    if (!noBtn.classList.contains("is-floating")) {
      const startRect = noBtn.getBoundingClientRect();
      const startX = Math.max(8, startRect.left - arenaRect.left);
      const startY = Math.max(8, startRect.top - arenaRect.top);
      noBtn.style.left = `${startX}px`;
      noBtn.style.top = `${startY}px`;
      noBtn.classList.add("is-floating");
    }

    arena.classList.add("is-dodging");

    // Re-measure after label update and arena height adjustment
    const updatedArenaRect = arena.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const noW = noBtn.offsetWidth;
    const noH = noBtn.offsetHeight;
    const pad = 8;

    // Expand Yes exclusion zone using max target scale (1.28) + generous safety buffer
    const yesRelCenterX = yesRect.left - updatedArenaRect.left + yesRect.width / 2;
    const yesRelCenterY = yesRect.top - updatedArenaRect.top + yesRect.height / 2;
    const yesHalfW = (yesBtn.offsetWidth * 1.28) / 2 + 14;
    const yesHalfH = (yesBtn.offsetHeight * 1.28) / 2 + 14;
    const yesExclusion = {
      left: yesRelCenterX - yesHalfW,
      right: yesRelCenterX + yesHalfW,
      top: yesRelCenterY - yesHalfH,
      bottom: yesRelCenterY + yesHalfH,
    };

    // Ensure arena is tall enough to always provide safe non-overlapping space below Yes
    const minNeededHeight = Math.ceil(yesExclusion.bottom + noH + 24);
    if (arena.clientHeight < minNeededHeight) {
      arena.style.minHeight = `${minNeededHeight}px`;
    }

    const arenaW = arena.clientWidth;
    const arenaH = arena.clientHeight;
    const minX = pad;
    const maxX = Math.max(pad, arenaW - noW - pad);
    const minY = pad;
    const maxY = Math.max(pad, arenaH - noH - pad);

    const candidates = [];
    for (let i = 0; i < 90; i += 1) {
      const cx = minX + Math.random() * (maxX - minX);
      const cy = minY + Math.random() * (maxY - minY);
      candidates.push({ x: cx, y: cy });
    }
    // Deterministic safe corner / lower anchors
    candidates.push(
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
      { x: (minX + maxX) / 2, y: maxY },
      { x: minX, y: Math.min(maxY, yesExclusion.bottom + 8) },
      { x: maxX, y: Math.min(maxY, yesExclusion.bottom + 8) }
    );

    const safeCandidates = candidates.filter((pt) => {
      const box = {
        left: pt.x,
        right: pt.x + noW,
        top: pt.y,
        bottom: pt.y + noH,
      };
      return !rectsOverlap(box, yesExclusion);
    });

    let chosen = null;
    const pool = safeCandidates.length ? safeCandidates : candidates;

    if (state.prevNoPos && pool.length > 1) {
      const farEnough = pool.filter(
        (pt) => Math.hypot(pt.x - state.prevNoPos.x, pt.y - state.prevNoPos.y) >= 48
      );
      const pickFrom = farEnough.length ? farEnough : pool;
      chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    } else {
      chosen = pool[Math.floor(Math.random() * pool.length)];
    }

    // Clamp to arena & viewport safety bounds
    const finalX = Math.round(Math.max(minX, Math.min(maxX, chosen.x)));
    const finalY = Math.round(Math.max(minY, Math.min(maxY, chosen.y)));
    state.prevNoPos = { x: finalX, y: finalY };

    window.requestAnimationFrame(() => {
      noBtn.style.left = `${finalX}px`;
      noBtn.style.top = `${finalY}px`;
    });
  }

  function clampFloatingNoOnResize() {
    if (!dom.arena || !dom.btnNo || !dom.btnNo.classList.contains("is-floating")) return;
    if (state.isCompleted) return;

    const pad = 8;
    const maxX = Math.max(pad, dom.arena.clientWidth - dom.btnNo.offsetWidth - pad);
    const maxY = Math.max(pad, dom.arena.clientHeight - dom.btnNo.offsetHeight - pad);
    const curX = parseFloat(dom.btnNo.style.left) || pad;
    const curY = parseFloat(dom.btnNo.style.top) || pad;

    dom.btnNo.style.left = `${Math.round(Math.max(pad, Math.min(maxX, curX)))}px`;
    dom.btnNo.style.top = `${Math.round(Math.max(pad, Math.min(maxY, curY)))}px`;
  }

  function triggerDodgeAttempt() {
    if (state.isCompleted || state.rejectAttempts >= 2) return;

    const variant = DODGE_VARIANTS[state.rejectAttempts];
    state.rejectAttempts += 1;
    state.lastDodgeAt = performance.now();

    if (dom.btnNo && variant) {
      dom.btnNo.textContent = variant.noText;
      if (state.rejectAttempts >= 2) {
        dom.btnNo.classList.add("is-settled");
      }
    }

    if (dom.nudgeEl && variant) {
      dom.nudgeEl.textContent = variant.nudge;
      dom.nudgeEl.classList.add("is-teasing");
    }

    if (dom.btnYes && variant) {
      dom.btnYes.style.setProperty("--yes-scale", String(variant.yesScale));
    }

    moveNoButtonToSafeSpot();
  }

  async function recordProposalResponse(accepted, rejectionsCount) {
    updateLocalRoomProposal(accepted, rejectionsCount);
    try {
      await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: state.pin,
          accepted: Boolean(accepted),
          rejectionsCount: Number(rejectionsCount || 0),
        }),
      });
    } catch (_) {
      // Non-blocking fallback when offline or static
    }
  }

  async function handleAcceptYes() {
    if (state.isCompleted) return;
    state.isCompleted = true;

    if (dom.btnYes) dom.btnYes.disabled = true;
    if (dom.btnNo) dom.btnNo.disabled = true;

    await recordProposalResponse(true, state.rejectAttempts);

    if (dom.arena) dom.arena.hidden = true;
    if (dom.nudgeEl) dom.nudgeEl.hidden = true;
    if (dom.bittersweetEl) dom.bittersweetEl.hidden = true;
    if (dom.celebrationEl) dom.celebrationEl.hidden = false;

    launchCelebrationHearts();

    const targetUrl = getMuseumUrl();
    if (dom.enterNowLink) dom.enterNowLink.href = targetUrl;

    window.setTimeout(() => {
      window.location.href = targetUrl;
    }, 1850);
  }

  async function handleFinalRejection() {
    if (state.isCompleted) return;
    state.isCompleted = true;
    state.rejectAttempts = 3;

    if (dom.btnYes) dom.btnYes.disabled = true;
    if (dom.btnNo) dom.btnNo.disabled = true;

    await recordProposalResponse(false, 3);

    if (dom.arena) dom.arena.hidden = true;
    if (dom.nudgeEl) dom.nudgeEl.hidden = true;
    if (dom.celebrationEl) dom.celebrationEl.hidden = true;
    if (dom.bittersweetEl) dom.bittersweetEl.hidden = false;

    if (dom.bittersweetMsg) {
      dom.bittersweetMsg.textContent =
        "Even if today's answer is No, this keepsake will stay right here whenever your heart changes.";
    }
    if (dom.openAnywayLink) {
      dom.openAnywayLink.href = getMuseumUrl();
    }
  }

  function bindProposalInteractions() {
    if (dom.btnYes) {
      dom.btnYes.addEventListener("click", handleAcceptYes);
    }

    if (dom.btnNo) {
      // Desktop mouse hover dodge on tries 1 & 2
      dom.btnNo.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;
        state.lastPointerEnterAt = performance.now();
        if (state.rejectAttempts < 2 && state.lastPointerEnterAt - state.lastDodgeAt > 360) {
          triggerDodgeAttempt();
        }
      });

      // Fallback for synthetic MouseEvent('mouseenter') without PointerEvent
      dom.btnNo.addEventListener("mouseenter", () => {
        const now = performance.now();
        if (now - state.lastPointerEnterAt < 80) return;
        if (now - state.lastTouchAt < 700) return;
        if (state.rejectAttempts < 2 && now - state.lastDodgeAt > 360) {
          triggerDodgeAttempt();
        }
      });

      // Mobile touch / pen tap dodge on tries 1 & 2 without waiting for click
      dom.btnNo.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;
        const now = performance.now();
        state.lastTouchAt = now;

        if (state.rejectAttempts < 2) {
          e.preventDefault();
          state.ignoreNextClickUntil = now + 550;
          triggerDodgeAttempt();
        } else {
          // Fresh Try 3 touch tap: allow following click to accept rejection
          state.ignoreNextClickUntil = 0;
        }
      });

      // Unified click handler: keyboard activation, mouse click, or Try 3 confirmation
      dom.btnNo.addEventListener("click", (e) => {
        const now = performance.now();
        if (now < state.ignoreNextClickUntil) {
          e.preventDefault();
          state.ignoreNextClickUntil = 0;
          return;
        }

        if (state.rejectAttempts < 2) {
          e.preventDefault();
          if (now - state.lastDodgeAt > 280) {
            triggerDodgeAttempt();
          }
          return;
        }

        if (now - state.lastDodgeAt < 340) {
          e.preventDefault();
          return;
        }

        handleFinalRejection();
      });
    }

    window.addEventListener("resize", clampFloatingNoOnResize);
  }

  /* ------------------------------------------------------------------------
     ROOM RENDERING & LOADING
     ------------------------------------------------------------------------ */
  function renderRoom(room) {
    state.room = room;
    state.pin = normalizePin(room.pin || state.pin) || "SAMPLE";
    state.edition = "public";

    const museumUrl = getMuseumUrl();
    if (dom.brandLink) dom.brandLink.href = museumUrl;
    if (dom.enterNowLink) dom.enterNowLink.href = museumUrl;
    if (dom.openAnywayLink) dom.openAnywayLink.href = museumUrl;
    if (dom.navCta) {
      dom.navCta.href = museumUrl;
      dom.navCta.textContent = "Open Museum";
    }

    const isCustomPublic = state.pin !== "SAMPLE";
    if (dom.pinBadge && dom.pinCode) {
      dom.pinBadge.hidden = !isCustomPublic;
      dom.pinCode.textContent = formatPinDisplay(state.pin);
    }

    // Cameo portrait
    if (dom.cameoImg) {
      const customCameo = String(room.heroCameoUrl || "").trim();
      dom.cameoImg.src = customCameo || DEFAULT_CAMEO_URL;
      dom.cameoImg.onerror = () => {
        if (!dom.cameoImg.src.endsWith(DEFAULT_CAMEO_URL)) {
          dom.cameoImg.src = DEFAULT_CAMEO_URL;
        }
      };
    }
    populateOvalLaceSvg(dom.laceSvg);

    // Partner names & subtle nickname cross-fade
    const { partner1, partner2 } = extractPartnerPair(room);
    if (dom.coupleNames) {
      dom.coupleNames.innerHTML = `${renderPartnerHtml(partner1)} &amp; ${renderPartnerHtml(partner2)}`;
    }
    initNicknameWhisper(Boolean(partner1.nickname || partner2.nickname));

    document.title = `${partner1.name} & ${partner2.name} \u2014 An Invitation`;

    // Custom proposal prompt
    if (dom.promptEl) {
      dom.promptEl.textContent =
        String(room.proposalPrompt || "").trim() || DEFAULT_PROPOSAL_PROMPT;
    }

    // Reveal proposal view
    if (dom.loadingEl) dom.loadingEl.hidden = true;
    if (dom.passcodeCard) dom.passcodeCard.hidden = true;
    if (dom.notFoundCard) dom.notFoundCard.hidden = true;
    if (dom.experienceEl) dom.experienceEl.hidden = false;
  }

  async function fetchRoomFromServer(pin, passcode) {
    const query = new URLSearchParams({ pin });
    if (passcode) query.set("passcode", passcode);
    const res = await fetch(`/api/museums?${query.toString()}`, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  async function loadProposalRoom(passcodeAttempt = "") {
    if (passcodeAttempt) {
      state.passcode = passcodeAttempt;
    }

    let serverResult = null;
    try {
      serverResult = await fetchRoomFromServer(state.pin, state.passcode);
    } catch (_) {
      serverResult = null;
    }

    if (serverResult && serverResult.ok && serverResult.data) {
      const room = serverResult.data;
      if (room.passcodeRequired) {
        if (dom.loadingEl) dom.loadingEl.hidden = true;
        if (dom.experienceEl) dom.experienceEl.hidden = true;
        if (dom.notFoundCard) dom.notFoundCard.hidden = true;
        if (dom.passcodeCard) dom.passcodeCard.hidden = false;
        if (dom.passcodeError) {
          dom.passcodeError.textContent = passcodeAttempt
            ? "Incorrect passcode. Please try again."
            : "";
        }
        dom.passcodeInput?.focus();
        return;
      }
      renderRoom(room);
      return;
    }

    // Fallback to localStorage / preset room when server is unreachable or room exists only locally
    const localRoom = buildLocalFallbackRoom(state.pin);
    if (localRoom) {
      const localPass = String(localRoom.viewerPasscode || "").trim();
      if (
        localPass &&
        state.pin !== "SAMPLE" &&
        state.passcode !== localPass
      ) {
        if (dom.loadingEl) dom.loadingEl.hidden = true;
        if (dom.experienceEl) dom.experienceEl.hidden = true;
        if (dom.passcodeCard) dom.passcodeCard.hidden = false;
        if (dom.passcodeError) {
          dom.passcodeError.textContent = passcodeAttempt
            ? "Incorrect passcode. Please try again."
            : "";
        }
        return;
      }
      renderRoom(localRoom);
      return;
    }

    if (dom.loadingEl) dom.loadingEl.hidden = true;
    if (dom.passcodeCard) dom.passcodeCard.hidden = true;
    if (dom.experienceEl) dom.experienceEl.hidden = true;
    if (dom.notFoundCard) dom.notFoundCard.hidden = false;
  }

  async function init() {
    seedAmbientHearts();
    bindProposalInteractions();

    const params = new URLSearchParams(window.location.search);
    const queryPin = normalizePin(params.get("pin"));
    const queryPasscode = String(params.get("passcode") || "").trim();

    state.pin = queryPin || "SAMPLE";

    if (queryPasscode) {
      state.passcode = queryPasscode;
    }

    if (dom.passcodeForm) {
      dom.passcodeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = String(dom.passcodeInput?.value || "").trim();
        if (!code) return;
        loadProposalRoom(code);
      });
    }

    await loadProposalRoom();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
