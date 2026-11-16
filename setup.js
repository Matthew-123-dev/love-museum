/* ==========================================================================
   THE MUSEUM OF US — Public Setup & PIN Login Engine (setup.js)
   Handles:
     - Switching between Create New Museum & Login with Unique PIN
     - Always-visible 4 Foyer Love Letter inputs + "Use Default Foyer Notes" button
     - Compulsory 3+ Memory Curation Queue (up to 8 on initial setup)
     - POST /api/museums PIN Generation + localStorage backup
     - Success Screen with Unique PIN & Shareable Partner Link
   ========================================================================== */

(() => {
  "use strict";

  const PUBLIC_ROOMS_STORAGE_KEY = "love_museum_public_rooms_v1";
  const MIN_REQUIRED_MEMORIES = 3;
  const FREE_SETUP_MEMORY_LIMIT = 8;
  const MAX_MEMORY_DATA_URL_LEN = 520000;
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
  };

  const dom = {
    tabCreate: document.getElementById("tab-create"),
    tabJoin: document.getElementById("tab-join"),
    panelCreate: document.getElementById("panel-create"),
    panelJoin: document.getElementById("panel-join"),
    panelSuccess: document.getElementById("panel-success"),

    joinPinForm: document.getElementById("join-pin-form"),
    loginPinInput: document.getElementById("login-pin-input"),
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
    addedHeading: document.getElementById("added-memories-heading"),
    memoryList: document.getElementById("setup-memory-list"),
    generateStatus: document.getElementById("setup-generate-status"),
    generateBtn: document.getElementById("setup-generate-pin-btn"),

    createdPinDisplay: document.getElementById("created-pin-display"),
    copyPinBtn: document.getElementById("copy-created-pin-btn"),
    createdLinkInput: document.getElementById("created-link-input"),
    copyLinkBtn: document.getElementById("copy-created-link-btn"),
    enterCreatedBtn: document.getElementById("enter-created-museum-btn"),
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

  /* ------------------------------------------------------------------------
     STEP 1: ALWAYS-VISIBLE FOYER NOTES & DEFAULT FILL
     ------------------------------------------------------------------------ */
  function renderFoyerNoteInputs() {
    if (!dom.customNotesGrid) return;
    dom.customNotesGrid.hidden = false;
    dom.customNotesGrid.innerHTML = setupState.customNotes
      .map((note, idx) => {
        const ph = FOYER_NOTE_PLACEHOLDERS[idx];
        return `
          <div class="custom-note-card">
            <span class="custom-note-card-label">Floating Envelope ${idx + 1}</span>
            <label class="field-label">
              <span>Envelope Title</span>
              <input
                type="text"
                class="field-input"
                data-note-idx="${idx}"
                data-note-field="title"
                maxlength="80"
                placeholder="${escapeHtml(ph.title)}"
                value="${escapeHtml(note.title)}"
              />
            </label>
            <label class="field-label">
              <span>Love Note Inside</span>
              <textarea
                class="field-input field-textarea"
                rows="3"
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
    setupState.customNotes = DEFAULT_FOYER_NOTES.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
    }));
    renderFoyerNoteInputs();
  }

  function getResolvedFoyerNotes() {
    return setupState.customNotes.map((n, idx) => ({
      id: DEFAULT_FOYER_NOTES[idx].id,
      title: (n.title || "").trim() || DEFAULT_FOYER_NOTES[idx].title,
      body: (n.body || "").trim() || DEFAULT_FOYER_NOTES[idx].body,
    }));
  }

  /* ------------------------------------------------------------------------
     SHARED IMAGE COMPRESSION
     ------------------------------------------------------------------------ */
  function compressImageFile(file, maxDim, maxBytesLen, onStatus, onDone) {
    if (!file || !file.type.startsWith("image/")) {
      onStatus?.("Please choose an image file (JPG, PNG, WebP).");
      return;
    }
    onStatus?.("Framing photograph...");

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL("image/jpeg", 0.78);
        if (compressed.length > maxBytesLen) {
          compressed = canvas.toDataURL("image/jpeg", 0.6);
        }
        onDone(compressed);
      };
      img.onerror = () => onStatus?.("Could not decode that image file.");
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
      dom.generateStatus.textContent = ready
        ? "Everything is ready. Click to generate your private Museum PIN and share link!"
        : `Add ${remaining} more ${
            remaining === 1 ? "memory" : "memories"
          } above to unlock PIN generation.`;
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
    if (setupState.memories.length >= FREE_SETUP_MEMORY_LIMIT) {
      if (dom.memStatus) {
        dom.memStatus.textContent = `You can queue up to ${FREE_SETUP_MEMORY_LIMIT} memories during setup. Generate your PIN now, then manage or upgrade inside your museum.`;
      }
      return;
    }

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
      } else {
        dom.memStatus.textContent = `Added "${title}". Ready to generate your PIN below!`;
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

  async function handleGenerateMuseum() {
    if (setupState.memories.length < MIN_REQUIRED_MEMORIES) {
      if (dom.generateStatus) {
        dom.generateStatus.textContent =
          "At least 3 memories are compulsory before generating your PIN.";
      }
      return;
    }

    if (dom.generateBtn) dom.generateBtn.disabled = true;
    if (dom.generateStatus) dom.generateStatus.textContent = "Generating your private museum...";

    const foyerNotes = getResolvedFoyerNotes();
    let createdRoom = null;

    try {
      const res = await fetch("/api/museums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foyerNotes,
          artifacts: setupState.memories,
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
        artifacts: setupState.memories,
      };
    } catch (err) {
      if (err?.isApiError) {
        if (dom.generateStatus) dom.generateStatus.textContent = err.message;
        if (dom.generateBtn) dom.generateBtn.disabled = false;
        return;
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
        artifacts: setupState.memories,
      };
    }

    saveLocalPublicRoom(createdRoom);
    showSuccessScreen(createdRoom);
  }

  function showSuccessScreen(room) {
    const cleanPin = normalizePin(room.pin);
    const displayPin = formatPinDisplay(cleanPin);
    const museumLink = buildShareUrl("index.html", cleanPin);

    if (dom.panelCreate) dom.panelCreate.hidden = true;
    if (dom.panelJoin) dom.panelJoin.hidden = true;
    if (dom.panelSuccess) dom.panelSuccess.hidden = false;

    if (dom.createdPinDisplay) dom.createdPinDisplay.textContent = displayPin;
    if (dom.createdLinkInput) dom.createdLinkInput.value = museumLink;
    if (dom.enterCreatedBtn) {
      dom.enterCreatedBtn.href = `index.html?pin=${encodeURIComponent(cleanPin)}`;
    }

    dom.panelSuccess?.scrollIntoView({ behavior: "smooth", block: "start" });
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
