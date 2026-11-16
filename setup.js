/* ==========================================================================
   THE MUSEUM OF US — Public Setup, PIN Login & Heirloom Checkout Engine (setup.js)
   Handles:
     - Switching between Create New Museum & Login with Unique PIN
     - Always-visible 4 Foyer Love Letter inputs + "Use Default Foyer Notes" helper
     - Compulsory 3+ Memory Curation Queue with Canvas photo compression
     - POST /api/museums PIN Generation + localStorage backup
     - Heirloom Unlock Modal (Partner Names/Nicknames, Hero "O" Cameo <= 450KB,
       Optional 4-Digit Passcode, Proposal Question & Paystack / Flutterwave / MOR Checkout)
     - Success Screen with Unique PIN, Museum Link & Interactive Proposal Link
   ========================================================================== */

(() => {
  "use strict";

  const PUBLIC_ROOMS_STORAGE_KEY = "love_museum_public_rooms_v1";
  const MIN_REQUIRED_MEMORIES = 3;
  const DEFAULT_FREE_MEMORY_LIMIT = 8;
  const MAX_MEMORY_DATA_URL_LEN = 520000;
  const MAX_CAMEO_DATA_URL_LEN = 450000;
  const DEFAULT_PROPOSAL_PROMPT =
    "Will you accept Our Love Museum and step inside every memory we have kept?";
  const REST_SLANTS = [-3.6, 3.3, -2.8, 4.0, -3.9, 2.9, -3.1, 3.7];

  const DEFAULT_LETTER_FALLBACK =
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23920d25'/%3E%3Crect x='95' y='85' width='410' height='280' rx='16' fill='%23f9eede' stroke='%23ffffff' stroke-width='4'/%3E%3Cpath d='M95 85 L300 245 L505 85' fill='%23f4dfc9' stroke='%23920d25' stroke-opacity='0.22' stroke-width='2'/%3E%3Ccircle cx='300' cy='240' r='34' fill='%23920d25'/%3E%3Cpath d='M290 235 C290 227 300 229 300 237 C300 229 310 227 310 235 C310 246 300 253 300 253 C300 253 290 246 290 235 Z' fill='%23ffffff'/%3E%3C/svg%3E";

  const DEFAULT_FOYER_NOTES = [
    {
      id: "note-1",
      title: "Note I \u2022 Morning Light",
      body: "For every sleepy Sunday morning when you steal the warm side of the blanket and make me laugh before coffee.",
    },
    {
      id: "note-2",
      title: "Note II \u2022 Under Glass",
      body: "Even our quietest ordinary Tuesdays deserve to be framed like rare museum pieces.",
    },
    {
      id: "note-3",
      title: "Note III \u2022 Always Real",
      body: "Love is not perfect, but it is always real\u2014especially in the little artifacts we collect together.",
    },
    {
      id: "note-4",
      title: "Note IV \u2022 Every Chapter",
      body: "Here is to every memory we have already made, and all the ones waiting for us to hang on our thread.",
    },
  ];

  const FOYER_NOTE_PLACEHOLDERS = [
    {
      title: "e.g. Note I \u2022 Morning Light",
      body: "Write a warm opening greeting, favorite morning memory, or why this museum exists for them...",
    },
    {
      title: "e.g. Note II \u2022 Under Glass",
      body: "Share a quiet ordinary moment or inside joke that deserves to be preserved under glass...",
    },
    {
      title: "e.g. Note III \u2022 Always Real",
      body: "Tell your partner what makes your love unmistakably yours, imperfections and all...",
    },
    {
      title: "e.g. Note IV \u2022 Every Chapter",
      body: "Write a promise or toast for every chapter still waiting for the two of you...",
    },
  ];

  const setupState = {
    mode: "create", // "create" | "join"
    customNotes: DEFAULT_FOYER_NOTES.map((n) => ({ id: n.id, title: "", body: "" })),
    memories: [],
    pendingImageDataUrl: "",
    freeMemoryLimit: DEFAULT_FREE_MEMORY_LIMIT,
    paymentConfig: {
      paystackPublicKey: "",
      flutterwavePublicKey: "",
      morCheckoutUrl: "",
      heirloomPriceNgn: 5000,
      heirloomPriceUsd: 7,
    },
    createdRoom: null,
    pendingMorPin: "",
    pendingMorConfig: null,
    heirloomDraft: {
      partner1Name: "",
      partner1Nickname: "",
      partner2Name: "",
      partner2Nickname: "",
      cameoDataUrl: "",
      cameoUrl: "",
      viewerPasscode: "",
      email: "",
      proposalPrompt: DEFAULT_PROPOSAL_PROMPT,
      provider: "paystack",
    },
  };

  const dom = {
    tabCreate: document.getElementById("tab-create"),
    tabJoin: document.getElementById("tab-join"),
    panelCreate: document.getElementById("panel-create"),
    panelJoin: document.getElementById("panel-join"),
    panelSuccess: document.getElementById("panel-success"),

    joinPinForm: document.getElementById("join-pin-form"),
    loginPinInput: document.getElementById("login-pin-input"),
    joinSubmitBtn: document.getElementById("join-submit-btn"),
    joinStatusMsg: document.getElementById("join-status-msg"),

    fillDefaultNotesBtn: document.getElementById("fill-default-notes-btn"),
    customNotesGrid: document.getElementById("custom-notes-grid"),

    progressText: document.getElementById("setup-progress-text"),
    progressFill: document.getElementById("setup-progress-fill"),
    memoryForm: document.getElementById("setup-memory-form"),
    dropzone: document.getElementById("setup-dropzone"),
    imageFileInput: document.getElementById("setup-image-file"),
    dropzonePreview: document.getElementById("setup-dropzone-preview"),
    dropzonePlaceholder: document.getElementById("setup-dropzone-placeholder"),
    previewImg: document.getElementById("setup-preview-img"),
    imageUrlInput: document.getElementById("setup-image-url"),
    titleInput: document.getElementById("setup-mem-title"),
    dateInput: document.getElementById("setup-mem-date"),
    curatorInput: document.getElementById("setup-mem-curator"),
    wingInput: document.getElementById("setup-mem-wing"),
    frameInput: document.getElementById("setup-mem-frame"),
    storyInput: document.getElementById("setup-mem-story"),
    secretInput: document.getElementById("setup-mem-secret"),
    featuredInput: document.getElementById("setup-mem-featured"),
    memStatus: document.getElementById("setup-mem-status"),
    addMemoryBtn: document.getElementById("setup-add-memory-btn"),
    addedHeading: document.getElementById("added-memories-heading"),
    memoryList: document.getElementById("setup-memory-list"),

    heirloomUpgradeCard: document.getElementById("heirloom-upgrade-card"),
    setupUnlockHeirloomBtn: document.getElementById("setup-unlock-heirloom-btn"),
    setupHeirloomBadge: document.getElementById("setup-heirloom-badge"),
    generateStatus: document.getElementById("setup-generate-status"),
    generateBtn: document.getElementById("setup-generate-pin-btn"),

    successHeirloomStatus: document.getElementById("success-heirloom-status"),
    createdPinDisplay: document.getElementById("created-pin-display"),
    copyPinBtn: document.getElementById("copy-created-pin-btn"),
    createdLinkInput: document.getElementById("created-link-input"),
    copyLinkBtn: document.getElementById("copy-created-link-btn"),
    successProposalBox: document.getElementById("success-proposal-box"),
    createdProposalLinkInput: document.getElementById("created-proposal-link-input"),
    copyProposalLinkBtn: document.getElementById("copy-proposal-link-btn"),
    previewProposalBtn: document.getElementById("preview-proposal-btn"),
    successUpgradeBox: document.getElementById("success-upgrade-box"),
    successUnlockHeirloomBtn: document.getElementById("success-unlock-heirloom-btn"),
    enterCreatedBtn: document.getElementById("enter-created-museum-btn"),

    // Heirloom Checkout Modal
    heirloomModal: document.getElementById("heirloom-modal"),
    closeHeirloomModal: document.getElementById("close-heirloom-modal"),
    cancelHeirloomBtn: document.getElementById("cancel-heirloom-btn"),
    heirloomPrereqNote: document.getElementById("heirloom-prereq-note"),
    heirloomForm: document.getElementById("heirloom-form"),
    heirloomP1Name: document.getElementById("heirloom-p1-name"),
    heirloomP1Nick: document.getElementById("heirloom-p1-nick"),
    heirloomP2Name: document.getElementById("heirloom-p2-name"),
    heirloomP2Nick: document.getElementById("heirloom-p2-nick"),
    heirloomCameoDropzone: document.getElementById("heirloom-cameo-dropzone"),
    heirloomCameoFile: document.getElementById("heirloom-cameo-file"),
    heirloomCameoPreviewImg: document.getElementById("heirloom-cameo-preview-img"),
    heirloomCameoPlaceholder: document.getElementById("heirloom-cameo-placeholder"),
    heirloomCameoUrl: document.getElementById("heirloom-cameo-url"),
    heirloomCameoClearBtn: document.getElementById("heirloom-cameo-clear-btn"),
    heirloomCameoStatus: document.getElementById("heirloom-cameo-status"),
    heirloomPasscode: document.getElementById("heirloom-passcode"),
    heirloomEmail: document.getElementById("heirloom-email"),
    heirloomProposalPrompt: document.getElementById("heirloom-proposal-prompt"),
    paymentRailGrid: document.getElementById("payment-rail-grid"),
    heirloomModeNote: document.getElementById("heirloom-mode-note"),
    morConfirmWrap: document.getElementById("mor-confirm-wrap"),
    morRefInput: document.getElementById("mor-ref-input"),
    morConfirmBtn: document.getElementById("mor-confirm-btn"),
    heirloomStatusMsg: document.getElementById("heirloom-status-msg"),
    heirloomCheckoutBtn: document.getElementById("heirloom-checkout-btn"),
  };

  function normalizePin(raw) {
    return String(raw || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function formatPinDisplay(pin) {
    const clean = normalizePin(pin);
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

  function buildShareUrl(pageName, pin) {
    const targetUrl = new URL(pageName, window.location.href);
    targetUrl.search = `?pin=${encodeURIComponent(normalizePin(pin))}`;
    targetUrl.hash = "";
    return targetUrl.href;
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

  function saveLocalPublicRoom(room) {
    if (!room || !room.pin) return;
    try {
      const rooms = readLocalPublicRooms();
      rooms[normalizePin(room.pin)] = room;
      localStorage.setItem(PUBLIC_ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch (_) {
      // Ignore quota exceeded
    }
  }

  function switchTab(mode) {
    setupState.mode = mode;
    const isJoin = mode === "join";

    dom.tabCreate?.classList.toggle("is-active", !isJoin);
    dom.tabJoin?.classList.toggle("is-active", isJoin);
    dom.tabCreate?.setAttribute("aria-selected", String(!isJoin));
    dom.tabJoin?.setAttribute("aria-selected", String(isJoin));

    if (dom.panelCreate) dom.panelCreate.hidden = isJoin;
    if (dom.panelJoin) dom.panelJoin.hidden = !isJoin;
    if (dom.panelSuccess) dom.panelSuccess.hidden = true;
  }

  async function fetchServerConfig() {
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      if (!res.ok) return null;
      const cfg = await res.json();
      if (typeof cfg?.freeMemoryLimit === "number" && cfg.freeMemoryLimit > 0) {
        setupState.freeMemoryLimit = cfg.freeMemoryLimit;
      }
      const p = cfg?.payments || cfg || {};
      setupState.paymentConfig = {
        paystackPublicKey: String(p.paystackPublicKey || "").trim(),
        flutterwavePublicKey: String(p.flutterwavePublicKey || "").trim(),
        morCheckoutUrl: String(p.morCheckoutUrl || "").trim(),
        heirloomPriceNgn: Number(p.heirloomPriceNgn || 5000),
        heirloomPriceUsd: Number(p.heirloomPriceUsd || 7),
      };
      return cfg;
    } catch (_) {
      return null;
    }
  }

  /* ------------------------------------------------------------------------
     STEP 1: ALWAYS-VISIBLE CUSTOM FOYER NOTES (4 ENVELOPES)
     ------------------------------------------------------------------------ */
  function renderFoyerNoteInputs() {
    if (!dom.customNotesGrid) return;
    dom.customNotesGrid.hidden = false;
    dom.customNotesGrid.innerHTML = setupState.customNotes
      .map((note, idx) => {
        const ph = FOYER_NOTE_PLACEHOLDERS[idx] || FOYER_NOTE_PLACEHOLDERS[0];
        return `
          <div class="custom-note-card">
            <span class="custom-note-card-label">Floating Envelope ${idx + 1}</span>
            <label class="field-label">
              <span>Envelope Title</span>
              <input
                type="text"
                class="field-input"
                id="foyer-note-title-${idx + 1}"
                data-note-idx="${idx}"
                data-note-field="title"
                maxlength="80"
                placeholder="${escapeHtml(ph.title)}"
                value="${escapeHtml(note.title)}"
              />
            </label>
            <label class="field-label">
              <span>Love Letter Message</span>
              <textarea
                class="field-input field-textarea"
                id="foyer-note-body-${idx + 1}"
                rows="2"
                data-note-idx="${idx}"
                data-note-field="body"
                maxlength="280"
                placeholder="${escapeHtml(ph.body)}"
              >${escapeHtml(note.body)}</textarea>
            </label>
          </div>
        `;
      })
      .join("");
  }

  function fillDefaultFoyerNotes() {
    setupState.customNotes = structuredClone(DEFAULT_FOYER_NOTES);
    renderFoyerNoteInputs();
  }

  function getResolvedFoyerNotes() {
    return DEFAULT_FOYER_NOTES.map((def, idx) => {
      const custom = setupState.customNotes[idx] || {};
      return {
        id: def.id,
        title: String(custom.title || "").trim() || def.title,
        body: String(custom.body || "").trim() || def.body,
      };
    });
  }

  /* ------------------------------------------------------------------------
     SHARED CANVAS IMAGE COMPRESSION HELPER
     ------------------------------------------------------------------------ */
  function compressImageFile(file, initialMaxDim, maxDataUrlLen, onStatus, onSuccess) {
    if (!file || !file.type.startsWith("image/")) {
      onStatus?.("Please choose an image file (JPG, PNG, WebP).");
      return;
    }
    onStatus?.("Framing photograph...");

    const reader = new FileReader();
    reader.onerror = () => onStatus?.("Could not read that image file.");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => onStatus?.("Could not decode that image file.");
      img.onload = () => {
        let maxDim = initialMaxDim;
        const qualities = [0.82, 0.72, 0.62, 0.5, 0.38];
        let compressed = "";

        for (let pass = 0; pass < 4; pass += 1) {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);

          for (const q of qualities) {
            const candidate = canvas.toDataURL("image/jpeg", q);
            compressed = candidate;
            if (candidate.length <= maxDataUrlLen) {
              onSuccess(candidate);
              return;
            }
          }
          maxDim = Math.round(maxDim * 0.72);
        }

        if (compressed && compressed.length <= maxDataUrlLen) {
          onSuccess(compressed);
        } else {
          onStatus?.("Image is still too large after compression. Try a smaller photo or URL.");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ------------------------------------------------------------------------
     STEP 2: COMPULSORY 3+ MEMORIES QUEUE
     ------------------------------------------------------------------------ */
  function setUploadPreview(src) {
    if (!dom.dropzonePreview || !dom.dropzonePlaceholder || !dom.previewImg) return;
    if (src) {
      dom.previewImg.src = src;
      dom.dropzonePreview.hidden = false;
      dom.dropzonePlaceholder.hidden = true;
    } else {
      dom.previewImg.src = "";
      dom.dropzonePreview.hidden = true;
      dom.dropzonePlaceholder.hidden = false;
    }
  }

  function processUploadedFile(file) {
    compressImageFile(
      file,
      900,
      MAX_MEMORY_DATA_URL_LEN,
      (msg) => {
        if (dom.memStatus) dom.memStatus.textContent = msg;
      },
      (compressed) => {
        setupState.pendingImageDataUrl = compressed;
        if (dom.imageUrlInput) dom.imageUrlInput.value = "";
        setUploadPreview(compressed);
        if (dom.memStatus) dom.memStatus.textContent = "Photo ready to add.";
      }
    );
  }

  function renderMemoryQueue() {
    const count = setupState.memories.length;
    const pct = Math.min(100, Math.round((count / MIN_REQUIRED_MEMORIES) * 100));
    const ready = count >= MIN_REQUIRED_MEMORIES;
    const freeLimit = setupState.freeMemoryLimit;
    const overFreeLimit = count > freeLimit && !setupState.createdRoom?.isHeirloom;

    if (dom.progressText) {
      dom.progressText.innerHTML = ready
        ? `<strong>${count} Memories Added</strong> &bull; Ready to generate your PIN`
        : `<strong>${count} / ${MIN_REQUIRED_MEMORIES}</strong> Compulsory Memories Added`;
    }
    if (dom.progressFill) {
      dom.progressFill.style.width = `${pct}%`;
    }
    if (dom.addedHeading) {
      dom.addedHeading.textContent = `Curated Memories Queue (${count})`;
    }
    if (dom.generateBtn) {
      dom.generateBtn.disabled = !ready;
    }
    if (dom.generateStatus) {
      const remaining = Math.max(0, MIN_REQUIRED_MEMORIES - count);
      if (!ready) {
        dom.generateStatus.textContent = `Add ${remaining} more ${
          remaining === 1 ? "memory" : "memories"
        } above to unlock PIN generation.`;
      } else if (overFreeLimit) {
        dom.generateStatus.textContent = `You queued ${count} memories (Free tier holds up to ${freeLimit}). Click Unlock Heirloom Edition above to keep all ${count}, or remove ${
          count - freeLimit
        } for a Free PIN.`;
      } else {
        dom.generateStatus.textContent =
          "Everything is ready. Unlock Heirloom Edition above or generate your Free Museum PIN!";
      }
    }

    if (!dom.memoryList) return;
    if (count === 0) {
      dom.memoryList.innerHTML = `<p style="margin:0;color:var(--text-on-warm-muted);font-size:0.9rem;">No memories queued yet. Add your first moment above.</p>`;
      return;
    }

    dom.memoryList.innerHTML = setupState.memories
      .map(
        (mem, idx) => `
          <div class="added-memory-mini">
            <img src="${escapeHtml(mem.imageUrl || DEFAULT_LETTER_FALLBACK)}" alt="${escapeHtml(mem.title)}" />
            <h4>${escapeHtml(mem.title)}</h4>
            <p>${escapeHtml(mem.date)} &middot; ${escapeHtml(mem.curator)}</p>
            <button type="button" class="card-btn card-btn--danger" data-remove-idx="${idx}">
              Remove
            </button>
          </div>
        `
      )
      .join("");
  }

  function handleAddMemory(event) {
    event.preventDefault();
    const title = dom.titleInput?.value.trim() || "";
    const date = dom.dateInput?.value.trim() || "";
    const story = dom.storyInput?.value.trim() || "";
    const imageUrl =
      dom.imageUrlInput?.value.trim() || setupState.pendingImageDataUrl || DEFAULT_LETTER_FALLBACK;

    if (!title || !date || !story) {
      if (dom.memStatus) dom.memStatus.textContent = "Please fill in Title, Date, and Story.";
      return;
    }

    const idx = setupState.memories.length;
    setupState.memories.push({
      id: `art-${Date.now()}-${idx + 1}`,
      catalogNumber: `ARTIFACT #${String(idx + 1).padStart(2, "0")}`,
      title,
      date,
      curator: dom.curatorInput?.value || "Both of Us",
      wing: dom.wingInput?.value || "First Chapters & Sparks",
      frameStyle: dom.frameInput?.value || "Rectangular Lace Frame",
      featured: Boolean(dom.featuredInput?.checked),
      slant: REST_SLANTS[idx % REST_SLANTS.length],
      story,
      secretNote: dom.secretInput?.value.trim() || "",
      tags: [],
      imageUrl,
    });

    setupState.pendingImageDataUrl = "";
    dom.memoryForm?.reset();
    if (dom.dateInput) {
      dom.dateInput.value = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (dom.featuredInput) dom.featuredInput.checked = true;
    setUploadPreview("");

    const count = setupState.memories.length;
    if (dom.memStatus) {
      if (count < MIN_REQUIRED_MEMORIES) {
        dom.memStatus.textContent = `Added "${title}" (${count}/${MIN_REQUIRED_MEMORIES}). Add ${
          MIN_REQUIRED_MEMORIES - count
        } more!`;
      } else if (count > setupState.freeMemoryLimit) {
        dom.memStatus.textContent = `Added "${title}" (${count} queued). Unlock Heirloom below for unlimited memories!`;
      } else {
        dom.memStatus.textContent = `Added "${title}". Ready to generate your PIN or unlock Heirloom below!`;
      }
    }
    renderMemoryQueue();
  }

  /* ------------------------------------------------------------------------
     CREATE MUSEUM & GENERATE UNIQUE PIN (Server + Offline Fallback)
     ------------------------------------------------------------------------ */
  function generateLocalFallbackPin() {
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  }

  async function createMuseumRoom(artifactsSlice) {
    const foyerNotes = getResolvedFoyerNotes();
    let createdRoom = null;

    try {
      const res = await fetch("/api/museums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foyerNotes,
          artifacts: artifactsSlice,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("OFFLINE_STATIC");
      }
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(json?.error || "Could not create museum");
        err.isApiError = true;
        throw err;
      }
      createdRoom = json.museum || {
        pin: json.pin,
        displayPin: json.displayPin || formatPinDisplay(json.pin),
        edition: "public",
        isSample: false,
        isHeirloom: false,
        partner1: { id: "Him", name: "Him", nickname: "" },
        partner2: { id: "Her", name: "Her", nickname: "" },
        heroCameoUrl: "",
        hasPasscode: false,
        proposalPrompt: DEFAULT_PROPOSAL_PROMPT,
        foyerNotes,
        artifacts: artifactsSlice,
      };
    } catch (err) {
      if (err?.isApiError) {
        throw err;
      }
      const pin = generateLocalFallbackPin();
      createdRoom = {
        pin,
        displayPin: formatPinDisplay(pin),
        edition: "public",
        isSample: false,
        isHeirloom: false,
        partner1: { id: "Him", name: "Him", nickname: "" },
        partner2: { id: "Her", name: "Her", nickname: "" },
        heroCameoUrl: "",
        hasPasscode: false,
        proposalPrompt: DEFAULT_PROPOSAL_PROMPT,
        foyerNotes,
        artifacts: artifactsSlice,
      };
    }

    setupState.createdRoom = createdRoom;
    saveLocalPublicRoom(createdRoom);
    return createdRoom;
  }

  async function handleGenerateMuseum() {
    if (setupState.memories.length < MIN_REQUIRED_MEMORIES) {
      if (dom.generateStatus) {
        dom.generateStatus.textContent =
          "At least 3 memories are compulsory before generating your PIN.";
      }
      return;
    }

    if (setupState.memories.length > setupState.freeMemoryLimit) {
      if (dom.generateStatus) {
        dom.generateStatus.textContent = `Free museums hold up to ${setupState.freeMemoryLimit} memories (you queued ${setupState.memories.length}). Unlock Heirloom Edition above for unlimited memories, or trim to ${setupState.freeMemoryLimit}.`;
      }
      dom.heirloomUpgradeCard?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (dom.generateBtn) dom.generateBtn.disabled = true;
    if (dom.generateStatus) dom.generateStatus.textContent = "Generating your private museum...";

    try {
      const createdRoom = await createMuseumRoom(setupState.memories);
      showSuccessScreen(createdRoom);
    } catch (err) {
      if (dom.generateStatus) dom.generateStatus.textContent = err.message;
      if (dom.generateBtn) dom.generateBtn.disabled = false;
    }
  }

  /* ------------------------------------------------------------------------
     SUCCESS SCREEN RENDERING (Free vs Heirloom Unlocked)
     ------------------------------------------------------------------------ */
  function showSuccessScreen(room) {
    const cleanPin = normalizePin(room.pin);
    const displayPin = formatPinDisplay(cleanPin);
    const museumLink = buildShareUrl("index.html", cleanPin);
    const proposalLink = buildShareUrl("proposal.html", cleanPin);
    const isHeirloom = Boolean(room.isHeirloom);

    setupState.createdRoom = room;

    if (dom.panelCreate) dom.panelCreate.hidden = true;
    if (dom.panelJoin) dom.panelJoin.hidden = true;
    if (dom.panelSuccess) dom.panelSuccess.hidden = false;

    if (dom.createdPinDisplay) dom.createdPinDisplay.textContent = displayPin;
    if (dom.createdLinkInput) dom.createdLinkInput.value = museumLink;
    if (dom.enterCreatedBtn) {
      dom.enterCreatedBtn.href = `index.html?pin=${encodeURIComponent(cleanPin)}`;
    }

    if (dom.successHeirloomStatus) {
      dom.successHeirloomStatus.classList.toggle("is-heirloom", isHeirloom);
      if (isHeirloom) {
        const p1 = room.partner1?.name || "Partner 1";
        const p2 = room.partner2?.name || "Partner 2";
        const lockText = room.hasPasscode ? " \u2022 Passcode Locked" : "";
        dom.successHeirloomStatus.textContent = `Heirloom Unlocked \u2022 ${p1} & ${p2}${lockText}`;
      } else {
        dom.successHeirloomStatus.textContent = "Free Museum Edition";
      }
    }

    if (dom.successProposalBox) dom.successProposalBox.hidden = !isHeirloom;
    if (dom.successUpgradeBox) dom.successUpgradeBox.hidden = isHeirloom;

    if (isHeirloom) {
      if (dom.createdProposalLinkInput) dom.createdProposalLinkInput.value = proposalLink;
      if (dom.previewProposalBtn) {
        dom.previewProposalBtn.href = `proposal.html?pin=${encodeURIComponent(cleanPin)}`;
      }
    }

    dom.panelSuccess?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ------------------------------------------------------------------------
     HEIRLOOM UNLOCK MODAL & MULTI-RAIL CHECKOUT
     ------------------------------------------------------------------------ */
  function setCameoPreview(src) {
    if (!dom.heirloomCameoPreviewImg || !dom.heirloomCameoPlaceholder) return;
    if (src) {
      dom.heirloomCameoPreviewImg.src = src;
      dom.heirloomCameoPreviewImg.hidden = false;
      dom.heirloomCameoPlaceholder.hidden = true;
      if (dom.heirloomCameoClearBtn) dom.heirloomCameoClearBtn.hidden = false;
    } else {
      dom.heirloomCameoPreviewImg.src = "";
      dom.heirloomCameoPreviewImg.hidden = true;
      dom.heirloomCameoPlaceholder.hidden = false;
      if (dom.heirloomCameoClearBtn) dom.heirloomCameoClearBtn.hidden = true;
    }
  }

  function syncDraftFromModalInputs() {
    const selectedRail =
      dom.heirloomForm?.querySelector('input[name="heirloom-rail"]:checked')?.value || "paystack";
    setupState.heirloomDraft = {
      partner1Name: dom.heirloomP1Name?.value.trim() || "",
      partner1Nickname: dom.heirloomP1Nick?.value.trim() || "",
      partner2Name: dom.heirloomP2Name?.value.trim() || "",
      partner2Nickname: dom.heirloomP2Nick?.value.trim() || "",
      cameoDataUrl: setupState.heirloomDraft.cameoDataUrl || "",
      cameoUrl: dom.heirloomCameoUrl?.value.trim() || "",
      viewerPasscode: dom.heirloomPasscode?.value.trim() || "",
      email: dom.heirloomEmail?.value.trim() || "",
      proposalPrompt: dom.heirloomProposalPrompt?.value.trim() || "",
      provider: selectedRail,
    };

    dom.paymentRailGrid?.querySelectorAll(".payment-rail-card").forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      card.classList.toggle("is-selected", Boolean(radio?.checked));
    });
    updateCheckoutModeNote(selectedRail);
  }

  function updateCheckoutModeNote(provider) {
    if (!dom.heirloomModeNote) return;
    const cfg = setupState.paymentConfig;
    const isLive =
      (provider === "paystack" && Boolean(cfg.paystackPublicKey)) ||
      (provider === "flutterwave" && Boolean(cfg.flutterwavePublicKey)) ||
      (provider === "mor" && Boolean(cfg.morCheckoutUrl));

    dom.heirloomModeNote.textContent = isLive
      ? "Live checkout gateway active for this provider."
      : "Sandbox Demo Checkout mode active \u2014 instant test unlock with no live card charge.";
  }

  function updateHeirloomPrereqUI() {
    const needsMemories =
      !setupState.createdRoom && setupState.memories.length < MIN_REQUIRED_MEMORIES;
    if (dom.heirloomPrereqNote) {
      dom.heirloomPrereqNote.hidden = !needsMemories;
      if (needsMemories) {
        const remaining = MIN_REQUIRED_MEMORIES - setupState.memories.length;
        dom.heirloomPrereqNote.textContent = `You currently have ${setupState.memories.length}/${MIN_REQUIRED_MEMORIES} compulsory memories in Step 2. Fill in your Heirloom preferences now (saved as a draft) and add ${remaining} more ${
          remaining === 1 ? "memory" : "memories"
        } before completing checkout.`;
      }
    }

    if (dom.setupHeirloomBadge) {
      const hasDraft = Boolean(
        setupState.heirloomDraft.partner1Name ||
          setupState.heirloomDraft.partner2Name ||
          setupState.heirloomDraft.cameoDataUrl ||
          setupState.heirloomDraft.cameoUrl ||
          setupState.heirloomDraft.viewerPasscode
      );
      dom.setupHeirloomBadge.hidden = !hasDraft;
      if (hasDraft) {
        dom.setupHeirloomBadge.textContent =
          "Heirloom details drafted \u2014 click above to complete checkout.";
      }
    }
  }

  async function openHeirloomModal() {
    if (!dom.heirloomModal) return;
    if (dom.heirloomStatusMsg) dom.heirloomStatusMsg.textContent = "";
    if (dom.morConfirmWrap) dom.morConfirmWrap.hidden = true;
    if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = false;

    const d = setupState.heirloomDraft;
    if (dom.heirloomP1Name) dom.heirloomP1Name.value = d.partner1Name;
    if (dom.heirloomP1Nick) dom.heirloomP1Nick.value = d.partner1Nickname;
    if (dom.heirloomP2Name) dom.heirloomP2Name.value = d.partner2Name;
    if (dom.heirloomP2Nick) dom.heirloomP2Nick.value = d.partner2Nickname;
    if (dom.heirloomCameoUrl) dom.heirloomCameoUrl.value = d.cameoUrl;
    if (dom.heirloomPasscode) dom.heirloomPasscode.value = d.viewerPasscode;
    if (dom.heirloomEmail) dom.heirloomEmail.value = d.email;
    if (dom.heirloomProposalPrompt) {
      dom.heirloomProposalPrompt.value = d.proposalPrompt || DEFAULT_PROPOSAL_PROMPT;
    }

    setCameoPreview(d.cameoUrl || d.cameoDataUrl || "");

    const activeRadio = dom.heirloomForm?.querySelector(
      `input[name="heirloom-rail"][value="${d.provider || "paystack"}"]`
    );
    if (activeRadio) activeRadio.checked = true;

    updateHeirloomPrereqUI();
    syncDraftFromModalInputs();

    dom.heirloomModal.hidden = false;
    document.body.style.overflow = "hidden";

    await fetchServerConfig();
    updateCheckoutModeNote(setupState.heirloomDraft.provider);
  }

  function closeHeirloomModal() {
    if (!dom.heirloomModal) return;
    syncDraftFromModalInputs();
    updateHeirloomPrereqUI();
    dom.heirloomModal.hidden = true;
    document.body.style.overflow = "";
  }

  function processCameoUpload(file) {
    compressImageFile(
      file,
      720,
      MAX_CAMEO_DATA_URL_LEN,
      (msg) => {
        if (dom.heirloomCameoStatus) dom.heirloomCameoStatus.textContent = msg;
      },
      (compressed) => {
        const kb = Math.round(compressed.length / 1024);
        setupState.heirloomDraft.cameoDataUrl = compressed;
        if (dom.heirloomCameoUrl) dom.heirloomCameoUrl.value = "";
        setCameoPreview(compressed);
        if (dom.heirloomCameoStatus) {
          dom.heirloomCameoStatus.textContent = `Portrait framed & compressed (${kb}KB \u2264 450KB).`;
        }
      }
    );
  }

  function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "1") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.addEventListener("load", () => {
        script.dataset.loaded = "1";
        resolve();
      });
      script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      document.head.appendChild(script);
    });
  }

  async function finalizeHeirloomPayment(pin, provider, reference, heirloomConfig) {
    if (dom.heirloomStatusMsg) {
      dom.heirloomStatusMsg.textContent = "Unlocking Heirloom features for your museum...";
    }

    let unlockedRoom = null;

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          provider,
          reference,
          heirloomConfig,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("OFFLINE_STATIC");
      }
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(json?.error || "Payment verification failed.");
        err.isApiError = true;
        throw err;
      }
      unlockedRoom = json.museum || null;

      // If the user queued > FREE_MEMORY_LIMIT memories before checkout, push the full queue now that Heirloom is active
      if (
        unlockedRoom &&
        setupState.memories.length > setupState.freeMemoryLimit &&
        (!Array.isArray(unlockedRoom.artifacts) ||
          unlockedRoom.artifacts.length < setupState.memories.length)
      ) {
        const artRes = await fetch(`/api/artifacts?pin=${encodeURIComponent(pin)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setupState.memories),
        });
        if (artRes.ok) {
          const artJson = await artRes.json();
          if (Array.isArray(artJson?.artifacts)) {
            unlockedRoom.artifacts = artJson.artifacts;
          }
        }
      }
    } catch (err) {
      if (err?.isApiError) {
        throw err;
      }
      // Static / offline fallback
      const baseRoom = setupState.createdRoom || {
        pin,
        displayPin: formatPinDisplay(pin),
        edition: "public",
        isSample: false,
        foyerNotes: getResolvedFoyerNotes(),
        artifacts: setupState.memories,
      };
      unlockedRoom = {
        ...baseRoom,
        isHeirloom: true,
        paymentProvider: provider,
        paymentRef: reference,
        partner1: {
          id: heirloomConfig.partner1Name || "Him",
          name: heirloomConfig.partner1Name || "Him",
          nickname: heirloomConfig.partner1Nickname || "",
        },
        partner2: {
          id: heirloomConfig.partner2Name || "Her",
          name: heirloomConfig.partner2Name || "Her",
          nickname: heirloomConfig.partner2Nickname || "",
        },
        heroCameoUrl: heirloomConfig.heroCameoUrl || "",
        hasPasscode: Boolean(heirloomConfig.viewerPasscode),
        proposalPrompt: heirloomConfig.proposalPrompt || DEFAULT_PROPOSAL_PROMPT,
        artifacts:
          setupState.memories.length > 0 ? setupState.memories : baseRoom.artifacts || [],
      };
    }

    if (!unlockedRoom) {
      throw new Error("Could not finalize Heirloom room.");
    }

    saveLocalPublicRoom(unlockedRoom);
    setupState.createdRoom = unlockedRoom;
    setupState.pendingMorPin = "";
    setupState.pendingMorConfig = null;
    closeHeirloomModal();
    showSuccessScreen(unlockedRoom);
  }

  async function handleHeirloomCheckoutSubmit(event) {
    event.preventDefault();
    syncDraftFromModalInputs();
    const d = setupState.heirloomDraft;

    if (d.viewerPasscode && !/^\d{4}$/.test(d.viewerPasscode)) {
      if (dom.heirloomStatusMsg) {
        dom.heirloomStatusMsg.textContent =
          "Viewer passcode must be exactly 4 digits (e.g. 1402), or leave blank for none.";
      }
      dom.heirloomPasscode?.focus();
      return;
    }

    if (!setupState.createdRoom && setupState.memories.length < MIN_REQUIRED_MEMORIES) {
      if (dom.heirloomStatusMsg) {
        dom.heirloomStatusMsg.textContent = `Draft saved! Please add at least ${MIN_REQUIRED_MEMORIES} memories in Step 2 first so your Museum PIN can be generated.`;
      }
      return;
    }

    const heirloomConfig = {
      partner1Name: d.partner1Name || "Him",
      partner1Nickname: d.partner1Nickname,
      partner2Name: d.partner2Name || "Her",
      partner2Nickname: d.partner2Nickname,
      heroCameoUrl: d.cameoUrl || d.cameoDataUrl || "",
      viewerPasscode: d.viewerPasscode,
      proposalPrompt: d.proposalPrompt || DEFAULT_PROPOSAL_PROMPT,
    };

    if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = true;
    if (dom.heirloomStatusMsg) dom.heirloomStatusMsg.textContent = "Checking payment gateway...";

    try {
      await fetchServerConfig();
      const payments = setupState.paymentConfig;
      updateCheckoutModeNote(d.provider);

      // Ensure a room & PIN exist first
      let targetRoom = setupState.createdRoom;
      if (!targetRoom) {
        const initialSlice = setupState.memories.slice(0, setupState.freeMemoryLimit);
        targetRoom = await createMuseumRoom(initialSlice);
      }
      const targetPin = normalizePin(targetRoom.pin);
      const email = d.email || "couple@museumofus.love";
      const randSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();

      if (d.provider === "paystack" && payments.paystackPublicKey) {
        await loadExternalScript("https://js.paystack.co/v1/inline.js");
        if (!window.PaystackPop) {
          throw new Error("Paystack checkout could not initialize.");
        }
        const ref = `PSK-${targetPin}-${Date.now()}`;
        const handler = window.PaystackPop.setup({
          key: payments.paystackPublicKey,
          email,
          amount: Math.round((payments.heirloomPriceNgn || 5000) * 100),
          currency: "NGN",
          ref,
          metadata: { pin: targetPin },
          callback: (resp) => {
            finalizeHeirloomPayment(targetPin, "paystack", resp?.reference || ref, heirloomConfig).catch(
              (err) => {
                if (dom.heirloomStatusMsg) dom.heirloomStatusMsg.textContent = err.message;
                if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = false;
              }
            );
          },
          onClose: () => {
            if (dom.heirloomStatusMsg) dom.heirloomStatusMsg.textContent = "Checkout window closed.";
            if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = false;
          },
        });
        handler.openIframe();
        return;
      }

      if (d.provider === "flutterwave" && payments.flutterwavePublicKey) {
        await loadExternalScript("https://checkout.flutterwave.com/v3.js");
        if (typeof window.FlutterwaveCheckout !== "function") {
          throw new Error("Flutterwave checkout could not initialize.");
        }
        const txRef = `FLW-${targetPin}-${Date.now()}`;
        window.FlutterwaveCheckout({
          public_key: payments.flutterwavePublicKey,
          tx_ref: txRef,
          amount: payments.heirloomPriceNgn || 5000,
          currency: "NGN",
          customer: {
            email,
            name: `${heirloomConfig.partner1Name} & ${heirloomConfig.partner2Name}`,
          },
          customizations: {
            title: "The Museum of Us",
            description: `Heirloom Unlock for PIN ${formatPinDisplay(targetPin)}`,
          },
          callback: (data) => {
            finalizeHeirloomPayment(
              targetPin,
              "flutterwave",
              data?.tx_ref || txRef,
              heirloomConfig
            ).catch((err) => {
              if (dom.heirloomStatusMsg) dom.heirloomStatusMsg.textContent = err.message;
              if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = false;
            });
          },
          onclose: () => {
            if (dom.heirloomStatusMsg) dom.heirloomStatusMsg.textContent = "Checkout window closed.";
            if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = false;
          },
        });
        return;
      }

      if (d.provider === "mor" && payments.morCheckoutUrl) {
        const checkoutUrl = new URL(payments.morCheckoutUrl, window.location.href);
        checkoutUrl.searchParams.set("checkout[custom][pin]", targetPin);
        window.open(checkoutUrl.toString(), "_blank", "noopener");
        setupState.pendingMorPin = targetPin;
        setupState.pendingMorConfig = heirloomConfig;
        if (dom.morConfirmWrap) dom.morConfirmWrap.hidden = false;
        if (dom.morRefInput && !dom.morRefInput.value) {
          dom.morRefInput.value = `MOR-${targetPin}-${randSuffix}`;
        }
        if (dom.heirloomStatusMsg) {
          dom.heirloomStatusMsg.textContent =
            "Complete checkout in the opened global window, then confirm your reference below.";
        }
        if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = false;
        return;
      }

      // Sandbox Demo Checkout mode (no live keys configured)
      const demoRef = `DEMO-${d.provider.toUpperCase()}-${Date.now()}-${randSuffix}`;
      await finalizeHeirloomPayment(targetPin, d.provider, demoRef, heirloomConfig);
    } catch (err) {
      if (dom.heirloomStatusMsg) {
        dom.heirloomStatusMsg.textContent = err?.message || "Could not complete checkout.";
      }
      if (dom.heirloomCheckoutBtn) dom.heirloomCheckoutBtn.disabled = false;
    }
  }

  /* ------------------------------------------------------------------------
     JOIN / LOGIN WITH EXISTING MUSEUM PIN
     ------------------------------------------------------------------------ */
  async function handleJoinPin(event) {
    event.preventDefault();
    const cleanPin = normalizePin(dom.loginPinInput?.value);
    if (!cleanPin) {
      if (dom.joinStatusMsg) dom.joinStatusMsg.textContent = "Please enter your Museum PIN.";
      return;
    }

    if (dom.joinStatusMsg) dom.joinStatusMsg.textContent = "Looking up your museum...";

    try {
      const res = await fetch(`/api/museums?pin=${encodeURIComponent(cleanPin)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        window.location.href = `index.html?pin=${encodeURIComponent(cleanPin)}`;
        return;
      }
    } catch (_) {
      // Check local storage fallback
    }

    const localRoom = readLocalPublicRooms()[cleanPin];
    if (localRoom) {
      window.location.href = `index.html?pin=${encodeURIComponent(cleanPin)}`;
      return;
    }

    if (dom.joinStatusMsg) {
      dom.joinStatusMsg.textContent = `No museum found for PIN "${formatPinDisplay(
        cleanPin
      )}". Please double-check the PIN or create a new museum.`;
    }
  }

  async function copyTextWithFeedback(text, btn, defaultLabel, promptLabel) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        btn.textContent = "Copied!";
        window.setTimeout(() => {
          btn.textContent = defaultLabel;
        }, 1600);
      }
    } catch (_) {
      window.prompt(promptLabel, text);
    }
  }

  /* ------------------------------------------------------------------------
     INIT & EVENT WIRING
     ------------------------------------------------------------------------ */
  function wireListeners() {
    dom.tabCreate?.addEventListener("click", () => switchTab("create"));
    dom.tabJoin?.addEventListener("click", () => switchTab("join"));
    dom.joinPinForm?.addEventListener("submit", handleJoinPin);

    // Step 1: Always-visible Foyer Notes & Fill Defaults
    dom.fillDefaultNotesBtn?.addEventListener("click", fillDefaultFoyerNotes);
    dom.customNotesGrid?.addEventListener("input", (e) => {
      const idx = Number(e.target?.dataset?.noteIdx);
      const field = e.target?.dataset?.noteField;
      if (Number.isInteger(idx) && (field === "title" || field === "body")) {
        setupState.customNotes[idx][field] = e.target.value;
      }
    });

    // Step 2: Memory Upload & Form
    dom.imageFileInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) processUploadedFile(file);
    });

    dom.dropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      dom.dropzone.classList.add("is-dragover");
    });

    dom.dropzone?.addEventListener("dragleave", () => {
      dom.dropzone.classList.remove("is-dragover");
    });

    dom.dropzone?.addEventListener("drop", (e) => {
      e.preventDefault();
      dom.dropzone.classList.remove("is-dragover");
      const file = e.dataTransfer?.files?.[0];
      if (file) processUploadedFile(file);
    });

    dom.imageUrlInput?.addEventListener("input", () => {
      const val = dom.imageUrlInput.value.trim();
      setUploadPreview(val || setupState.pendingImageDataUrl || "");
    });

    dom.memoryForm?.addEventListener("submit", handleAddMemory);

    dom.memoryList?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-idx]");
      if (!btn) return;
      const idx = Number(btn.dataset.removeIdx);
      if (Number.isInteger(idx)) {
        setupState.memories.splice(idx, 1);
        renderMemoryQueue();
      }
    });

    dom.generateBtn?.addEventListener("click", handleGenerateMuseum);

    // Step 3 & Success Screen Heirloom Triggers
    dom.setupUnlockHeirloomBtn?.addEventListener("click", openHeirloomModal);
    dom.successUnlockHeirloomBtn?.addEventListener("click", openHeirloomModal);

    // Success Screen Copy Buttons
    dom.copyPinBtn?.addEventListener("click", () => {
      copyTextWithFeedback(
        dom.createdPinDisplay?.textContent || "",
        dom.copyPinBtn,
        "Copy PIN",
        "Copy your Museum PIN:"
      );
    });

    dom.copyLinkBtn?.addEventListener("click", () => {
      copyTextWithFeedback(
        dom.createdLinkInput?.value || "",
        dom.copyLinkBtn,
        "Copy Link",
        "Copy this shareable partner link:"
      );
    });

    dom.copyProposalLinkBtn?.addEventListener("click", () => {
      copyTextWithFeedback(
        dom.createdProposalLinkInput?.value || "",
        dom.copyProposalLinkBtn,
        "Copy Proposal Link",
        "Copy this Interactive Proposal Link:"
      );
    });

    // Heirloom Modal Controls
    dom.closeHeirloomModal?.addEventListener("click", closeHeirloomModal);
    dom.cancelHeirloomBtn?.addEventListener("click", closeHeirloomModal);
    dom.heirloomModal?.addEventListener("click", (e) => {
      if (e.target === dom.heirloomModal) closeHeirloomModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dom.heirloomModal && !dom.heirloomModal.hidden) {
        closeHeirloomModal();
      }
    });

    dom.heirloomCameoFile?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) processCameoUpload(file);
    });

    dom.heirloomCameoDropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    dom.heirloomCameoDropzone?.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) processCameoUpload(file);
    });

    dom.heirloomCameoUrl?.addEventListener("input", () => {
      const val = dom.heirloomCameoUrl.value.trim();
      setCameoPreview(val || setupState.heirloomDraft.cameoDataUrl || "");
      syncDraftFromModalInputs();
    });

    dom.heirloomCameoClearBtn?.addEventListener("click", () => {
      setupState.heirloomDraft.cameoDataUrl = "";
      if (dom.heirloomCameoUrl) dom.heirloomCameoUrl.value = "";
      if (dom.heirloomCameoFile) dom.heirloomCameoFile.value = "";
      setCameoPreview("");
      if (dom.heirloomCameoStatus) {
        dom.heirloomCameoStatus.textContent =
          'Auto-compressed to \u2264 450KB to frame inside the "L O V E" oval window.';
      }
      syncDraftFromModalInputs();
    });

    dom.heirloomForm?.addEventListener("input", syncDraftFromModalInputs);
    dom.heirloomForm?.addEventListener("change", syncDraftFromModalInputs);
    dom.heirloomForm?.addEventListener("submit", handleHeirloomCheckoutSubmit);

    dom.morConfirmBtn?.addEventListener("click", async () => {
      if (!setupState.pendingMorPin || !setupState.pendingMorConfig) return;
      const ref = dom.morRefInput?.value.trim() || `MOR-${setupState.pendingMorPin}-${Date.now()}`;
      dom.morConfirmBtn.disabled = true;
      try {
        await finalizeHeirloomPayment(
          setupState.pendingMorPin,
          "mor",
          ref,
          setupState.pendingMorConfig
        );
      } catch (err) {
        if (dom.heirloomStatusMsg) dom.heirloomStatusMsg.textContent = err.message;
        dom.morConfirmBtn.disabled = false;
      }
    });
  }

  function init() {
    if (dom.dateInput) {
      dom.dateInput.value = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    wireListeners();
    renderFoyerNoteInputs();
    renderMemoryQueue();
    fetchServerConfig();

    const params = new URLSearchParams(window.location.search);
    const shouldJoin =
      window.location.hash.toLowerCase() === "#join" ||
      window.location.pathname.toLowerCase().includes("/login") ||
      params.get("mode") === "join" ||
      params.get("notfound") === "1";

    switchTab(shouldJoin ? "join" : "create");

    if (params.get("notfound") === "1" && params.get("pin") && dom.loginPinInput && dom.joinStatusMsg) {
      const badPin = formatPinDisplay(params.get("pin"));
      dom.loginPinInput.value = badPin;
      dom.joinStatusMsg.textContent = `No museum found for PIN "${badPin}". Check your code or create a new museum.`;
    }
  }

  init();
})();
