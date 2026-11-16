/* ==========================================================================
   THE MUSEUM OF US — Interactive Engine
   Handles:
     - Sample Exhibition ("Him & Her") + PIN-scoped Cloud Couple Rooms
     - Heirloom Unlock Tier (Custom Names, Subtle Nicknames, Cameo, Passcode, Payment)
     - Architecture B Cloud Sync (/api/config, /api/museums, /api/artifacts + local fallback)
     - Canva Scalloped Oval Eyelet Lace SVG generation
     - Dynamic Wavy String Geometry through Slanted Card Top Holes
     - Scroll-velocity pendulum sway & IntersectionObserver .is-onscreen reveals
     - Floating love letters, Lace Lightbox, Add/Edit/Delete & Archive Export/Import
   ========================================================================== */

(() => {
  "use strict";

  const PUBLIC_ROOMS_STORAGE_KEY = "love_museum_public_rooms_v1";

  const DEFAULT_LETTER_FALLBACK =
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23920d25'/%3E%3Crect x='95' y='85' width='410' height='280' rx='16' fill='%23f9eede' stroke='%23ffffff' stroke-width='4'/%3E%3Cpath d='M95 85 L300 245 L505 85' fill='%23f4dfc9' stroke='%23920d25' stroke-opacity='0.22' stroke-width='2'/%3E%3Ccircle cx='300' cy='240' r='34' fill='%23920d25'/%3E%3Cpath d='M290 235 C290 227 300 229 300 237 C300 229 310 227 310 235 C310 246 300 253 300 253 C300 253 290 246 290 235 Z' fill='%23ffffff'/%3E%3C/svg%3E";

  const REST_SLANTS = [-3.6, 3.3, -2.8, 4.0, -3.9, 2.9, -3.1, 3.7];

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

  const DEFAULT_WINGS = [
    "First Chapters & Sparks",
    "Soft Days & Inside Jokes",
    "Letters, Vows & Forever",
  ];

  const EDITION_PRESETS = {
    public: {
      partner1: { id: "Him", name: "Him", nickname: "" },
      partner2: { id: "Her", name: "Her", nickname: "" },
      shared: "Both of Us",
    },
  };

  const FALLBACK_SEED_ARTIFACTS = [
    {
      id: "art-01",
      title: "Golden Hour by the Tide",
      date: "June 14, 2024",
      curator: "Him",
      wing: "First Chapters & Sparks",
      frameStyle: "Rectangular Lace Frame",
      featured: true,
      slant: -3.6,
      story:
        "The evening we forgot what time it was because the waves kept erasing our footprints and you laughed every time the cold water caught your dress.",
      secretNote:
        "I knew right there on the wet sand that I wanted a thousand more summers beside you.",
      tags: ["First Trip", "Ocean Air", "Golden Hour"],
      imageUrl:
        "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f4dfc9'/%3E%3Cstop offset='55%25' stop-color='%23e8bfa0'/%3E%3Cstop offset='100%25' stop-color='%23920d25'/%3E%3C/linearGradient%3E%3CradialGradient id='sun' cx='50%25' cy='46%25' r='35%25'%3E%3Cstop offset='0%25' stop-color='%23ffffff' stop-opacity='0.95'/%3E%3Cstop offset='40%25' stop-color='%23f9eede' stop-opacity='0.7'/%3E%3Cstop offset='100%25' stop-color='%23920d25' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='600' height='450' fill='url(%23sky)'/%3E%3Ccircle cx='300' cy='210' r='160' fill='url(%23sun)'/%3E%3Ccircle cx='300' cy='205' r='54' fill='%23ffffff' opacity='0.88'/%3E%3Cpath d='M0 265 Q150 250 300 266 T600 260 L600 450 L0 450 Z' fill='%23780b1f' opacity='0.85'/%3E%3Cpath d='M0 305 Q120 292 260 310 T600 300 L600 450 L0 450 Z' fill='%23590716'/%3E%3Cellipse cx='300' cy='312' rx='95' ry='10' fill='%23f9eede' opacity='0.45'/%3E%3Cellipse cx='300' cy='335' rx='65' ry='7' fill='%23f9eede' opacity='0.3'/%3E%3Cpath d='M275 300 C272 250 282 220 293 216 C302 214 308 232 305 256 L309 300 Z' fill='%233b040e'/%3E%3Cpath d='M322 300 C325 254 316 226 306 223 C297 221 294 240 298 262 L292 300 Z' fill='%234a0512'/%3E%3Ccircle cx='292' cy='202' r='13' fill='%233b040e'/%3E%3Ccircle cx='311' cy='208' r='12' fill='%234a0512'/%3E%3C/svg%3E",
    },
    {
      id: "art-02",
      title: "Two Coffees & The Rainy Window",
      date: "October 03, 2024",
      curator: "Her",
      wing: "Soft Days & Inside Jokes",
      frameStyle: "Oval Lace Cameo",
      featured: true,
      slant: 3.4,
      story:
        "That Saturday storm trapped us at the corner booth for four hours. We drew constellations on napkins and ranked every terrible rom-com we ever watched.",
      secretNote:
        "I kept the napkin with your handwriting in the back of my wallet until it tore at the folds.",
      tags: ["Rainy Café", "Napkin Notes", "Inside Jokes"],
      imageUrl:
        "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Cdefs%3E%3ClinearGradient id='bg2' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%234a0512'/%3E%3Cstop offset='60%25' stop-color='%23920d25'/%3E%3Cstop offset='100%25' stop-color='%23630819'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='450' fill='url(%23bg2)'/%3E%3Crect x='50' y='35' width='500' height='260' rx='18' fill='%23f4dfc9' opacity='0.14' stroke='%23f9eede' stroke-opacity='0.35' stroke-width='2'/%3E%3Cline x1='300' y1='35' x2='300' y2='295' stroke='%23f9eede' stroke-opacity='0.3' stroke-width='2'/%3E%3Crect x='0' y='310' width='600' height='140' fill='%23f4dfc9'/%3E%3Cellipse cx='215' cy='355' rx='62' ry='16' fill='%23ffffff'/%3E%3Cpath d='M172 315 h86 v26 a43 22 0 0 1 -86 0 z' fill='%23f9eede' stroke='%23920d25' stroke-width='2'/%3E%3Cellipse cx='385' cy='362' rx='62' ry='16' fill='%23ffffff'/%3E%3Cpath d='M342 322 h86 v26 a43 22 0 0 1 -86 0 z' fill='%23f9eede' stroke='%23920d25' stroke-width='2'/%3E%3Ccircle cx='300' cy='382' r='34' fill='%23ffffff' stroke='%23920d25' stroke-opacity='0.25' stroke-width='1.5'/%3E%3Cpath d='M292 380 C292 373 300 374 300 381 C300 374 308 373 308 380 C308 389 300 394 300 394 C300 394 292 389 292 380 Z' fill='%23920d25'/%3E%3C/svg%3E",
    },
    {
      id: "art-03",
      title: "The First Wax-Sealed Letter",
      date: "December 21, 2024",
      curator: "Both of Us",
      wing: "Letters, Vows & Forever",
      frameStyle: "Rectangular Lace Frame",
      featured: true,
      slant: -2.8,
      story:
        "Written by candlelight before we even exchanged gifts. Folded in heavy cream stationery, sealed in deep burgundy wax, and kept under lock until midnight.",
      secretNote: "Read paragraph three whenever you miss me\u2014every word still holds true.",
      tags: ["Handwritten", "Wax Seal", "Winter Solstice"],
      imageUrl:
        "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23590716'/%3E%3Ccircle cx='300' cy='225' r='220' fill='%23920d25' opacity='0.65'/%3E%3Cg transform='translate(115 95) rotate(-3 185 130)'%3E%3Crect width='370' height='250' rx='10' fill='%23f9eede' stroke='%23f4dfc9' stroke-width='3'/%3E%3Cpath d='M0 0 L185 140 L370 0' fill='%23f4dfc9' stroke='%23920d25' stroke-opacity='0.2' stroke-width='2'/%3E%3Ccircle cx='185' cy='140' r='32' fill='%23920d25'/%3E%3Cpath d='M177 136 C177 130 185 131 185 137 C185 131 193 130 193 136 C193 144 185 149 185 149 C185 149 177 144 177 136 Z' fill='%23f9eede'/%3E%3C/g%3E%3C/svg%3E",
    },
    {
      id: "art-04",
      title: "Midnight Kitchen Slow Dance",
      date: "February 14, 2025",
      curator: "Him",
      wing: "Soft Days & Inside Jokes",
      frameStyle: "Oval Lace Cameo",
      featured: true,
      slant: 4.1,
      story:
        "No fancy reservation, just one warm lamp over the stove, pasta simmering, and our favorite vinyl spinning softly while we danced in socks on the kitchen tile.",
      secretNote: "The kitchen floor is still my favorite ballroom on earth.",
      tags: ["Vinyl Night", "Warm Lamp", "Slow Dance"],
      imageUrl:
        "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Cdefs%3E%3CradialGradient id='lamp' cx='50%25' cy='25%25' r='60%25'%3E%3Cstop offset='0%25' stop-color='%23ffffff' stop-opacity='0.95'/%3E%3Cstop offset='35%25' stop-color='%23f4dfc9' stop-opacity='0.65'/%3E%3Cstop offset='100%25' stop-color='%23630819' stop-opacity='1'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='600' height='450' fill='url(%23lamp)'/%3E%3Ccircle cx='300' cy='85' r='22' fill='%23ffffff'/%3E%3Crect x='0' y='355' width='600' height='95' fill='%234a0512' opacity='0.85'/%3E%3Ccircle cx='286' cy='182' r='16' fill='%23f9eede'/%3E%3Ccircle cx='316' cy='188' r='15' fill='%23f4dfc9'/%3E%3Ccircle cx='120' cy='160' r='36' fill='%233b040e' stroke='%23f9eede' stroke-width='2'/%3E%3C/svg%3E",
    },
    {
      id: "art-05",
      title: "Pressed Crimson Rose No. 1",
      date: "May 19, 2025",
      curator: "Her",
      wing: "Letters, Vows & Forever",
      frameStyle: "Slanted String Card",
      featured: false,
      slant: -4.2,
      story:
        "The first flower you tucked inside my hardcover book so it wouldn't wilt on the train home. Months later, its petals still hold the exact shade of your lipstick.",
      secretNote: "Open page 114 whenever you want to find its twin petal.",
      tags: ["Pressed Flower", "Bookstore", "Keepsake"],
      imageUrl:
        "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23f4dfc9'/%3E%3Crect x='40' y='35' width='520' height='380' rx='14' fill='%23f9eede' stroke='%23920d25' stroke-opacity='0.22' stroke-width='2'/%3E%3Cpath d='M300 220 Q296 300 315 365' stroke='%2368081a' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='300' cy='185' r='54' fill='%23920d25'/%3E%3C/svg%3E",
    },
    {
      id: "art-06",
      title: "Rooftop Starlight & Polaroids",
      date: "August 28, 2025",
      curator: "Both of Us",
      wing: "First Chapters & Sparks",
      frameStyle: "Slanted String Card",
      featured: false,
      slant: 2.9,
      story:
        "Wrapped in one oversized cream blanket on the roof, counting satellites until 2 AM and taking blurry flash selfies we refused to delete.",
      secretNote:
        "This is the night we promised to build our own little museum someday\u2014and here it is.",
      tags: ["Stargazing", "Rooftop", "Anniversary Eve"],
      imageUrl:
        "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%234a0512'/%3E%3Ccircle cx='120' cy='80' r='2.5' fill='%23ffffff'/%3E%3Ccircle cx='350' cy='70' r='2.5' fill='%23ffffff'/%3E%3Cpath d='M465 55 A36 36 0 1 0 505 110 A28 28 0 1 1 465 55 Z' fill='%23f9eede'/%3E%3Cpath d='M0 320 L600 340 L600 450 L0 450 Z' fill='%23920d25'/%3E%3C/svg%3E",
    },
  ];

  const state = {
    edition: "public", // "private" | "public"
    pin: "SAMPLE",
    freeMemoryLimit: 8,
    paymentsConfig: {
      paystackPublicKey: "",
      flutterwavePublicKey: "",
      morCheckoutUrl: "",
      heirloomPriceNgn: 5000,
      heirloomPriceUsd: 7,
    },
    passcode: "",
    passcodeLocked: false,
    room: {
      pin: "SAMPLE",
      displayPin: "SAMPLE",
      isSample: true,
      isHeirloom: false,
      edition: "public",
      heroCameoUrl: "",
      hasPasscode: false,
      passcodeRequired: false,
      proposalPrompt: "Will you accept Our Love Museum and step inside every memory we have kept?",
      proposalAccepted: false,
      ...EDITION_PRESETS.public,
      wings: structuredClone(DEFAULT_WINGS),
      foyerNotes: structuredClone(DEFAULT_FOYER_NOTES),
    },
    artifacts: [],
    defaults: [],
    wingFilter: "All",
    curatorFilter: "All",
    activeLightboxId: null,
    pendingImageDataUrl: "",
    pendingCameoDataUrl: "",
    pendingMemoryAfterUnlock: null,
    openSecretIds: new Set(),
    swayAngle: 0,
    lastScrollY: window.scrollY || 0,
    isRafRunning: false,
  };

  // DOM References
  const dom = {
    topNav: document.getElementById("top-nav"),
    activePinBadge: document.getElementById("active-pin-badge"),
    navPinCode: document.getElementById("nav-pin-code"),
    openHeirloomBtn: document.getElementById("open-heirloom-btn"),
    copyProposalLinkBtn: document.getElementById("copy-proposal-link-btn"),
    publicNavActions: document.getElementById("public-nav-actions"),
    openCurateNav: document.getElementById("open-curate-nav"),
    foyerCoupleSignature: document.getElementById("foyer-couple-signature"),
    heroOSlot: document.getElementById("hero-o-slot"),
    foyerDescription: document.getElementById("foyer-description"),
    foyerCreateBtn: document.getElementById("foyer-create-btn"),
    foyerJoinBtn: document.getElementById("foyer-join-btn"),
    foyerExploreBtn: document.getElementById("foyer-explore-btn"),
    openCurateHero: document.getElementById("open-curate-hero"),
    vaultCreateBtn: document.getElementById("vault-create-btn"),
    vaultHeirloomBanner: document.getElementById("vault-heirloom-banner"),
    vaultHeirloomTitle: document.getElementById("vault-heirloom-title"),
    vaultHeirloomDesc: document.getElementById("vault-heirloom-desc"),
    vaultUnlockHeirloomBtn: document.getElementById("vault-unlock-heirloom-btn"),
    vaultPreviewProposalLink: document.getElementById("vault-preview-proposal-link"),
    vaultEditHeirloomBtn: document.getElementById("vault-edit-heirloom-btn"),
    footerBrandMeta: document.getElementById("footer-brand-meta"),
    wingFilterGroup: document.getElementById("wing-filter-group"),
    openWingsModalBtn: document.getElementById("open-wings-modal-btn"),
    filterCurator1: document.getElementById("filter-curator-1"),
    filterCurator2: document.getElementById("filter-curator-2"),

    // Gallery Wings Editor Modal
    wingsModal: document.getElementById("wings-modal"),
    closeWingsModal: document.getElementById("close-wings-modal"),
    cancelWingsBtn: document.getElementById("cancel-wings-btn"),
    wingsForm: document.getElementById("wings-form"),
    wingsEditorList: document.getElementById("wings-editor-list"),
    addWingRowBtn: document.getElementById("add-wing-row-btn"),
    wingsCountHint: document.getElementById("wings-count-hint"),
    wingsStatusMsg: document.getElementById("wings-status-msg"),

    laceShowcaseGrid: document.getElementById("lace-showcase-grid"),
    slantedCardsGrid: document.getElementById("slanted-cards-grid"),
    stringGalleryStage: document.getElementById("string-gallery-stage"),
    stringAnchor: document.getElementById("string-anchor"),
    wavyStringSvg: document.getElementById("wavy-string-svg"),
    wavyStringShadow: document.getElementById("wavy-string-shadow"),
    wavyStringMain: document.getElementById("wavy-string-main"),
    wavyStringOverSvg: document.getElementById("wavy-string-over-svg"),
    terminalAddTag: document.getElementById("terminal-add-tag"),
    galleryEmptyState: document.getElementById("gallery-empty-state"),
    resetFiltersBtn: document.getElementById("reset-filters-btn"),

    // Floating Note Popover
    notePopover: document.getElementById("unsealed-note-popover"),
    popoverKicker: document.getElementById("popover-kicker"),
    popoverText: document.getElementById("popover-text"),
    closeNotePopover: document.getElementById("close-note-popover"),

    // Curate Modal
    curateModal: document.getElementById("curate-modal"),
    curateModalTitle: document.getElementById("curate-modal-title"),
    artifactForm: document.getElementById("artifact-form"),
    artifactIdInput: document.getElementById("artifact-id-input"),
    imageDropzone: document.getElementById("image-dropzone"),
    imageFileInput: document.getElementById("image-file-input"),
    dropzonePreview: document.getElementById("dropzone-preview"),
    dropzonePlaceholder: document.getElementById("dropzone-placeholder"),
    previewImgEl: document.getElementById("preview-img-el"),
    imageUrlInput: document.getElementById("image-url-input"),
    titleInput: document.getElementById("title-input"),
    dateInput: document.getElementById("date-input"),
    curatorInput: document.getElementById("curator-input"),
    wingInput: document.getElementById("wing-input"),
    frameStyleInput: document.getElementById("frame-style-input"),
    storyInput: document.getElementById("story-input"),
    secretNoteInput: document.getElementById("secret-note-input"),
    featuredInput: document.getElementById("featured-input"),
    formStatusMsg: document.getElementById("form-status-msg"),
    closeCurateModal: document.getElementById("close-curate-modal"),
    cancelCurateBtn: document.getElementById("cancel-curate-btn"),

    // Lightbox Modal
    lightboxModal: document.getElementById("lightbox-modal"),
    closeLightboxModal: document.getElementById("close-lightbox-modal"),
    lightboxLaceMount: document.getElementById("lightbox-lace-mount"),
    lightboxCurator: document.getElementById("lightbox-curator"),
    lightboxTitle: document.getElementById("lightbox-title"),
    lightboxDate: document.getElementById("lightbox-date"),
    lightboxWing: document.getElementById("lightbox-wing"),
    lightboxStory: document.getElementById("lightbox-story"),
    lightboxSecretBox: document.getElementById("lightbox-secret-box"),
    lightboxSecretToggle: document.getElementById("lightbox-secret-toggle"),
    lightboxSecretText: document.getElementById("lightbox-secret-text"),
    lightboxEditBtn: document.getElementById("lightbox-edit-btn"),
    lightboxFeatureBtn: document.getElementById("lightbox-feature-btn"),
    lightboxDeleteBtn: document.getElementById("lightbox-delete-btn"),

    // Archive Actions
    exportArchiveBtn: document.getElementById("export-archive-btn"),
    importArchiveInput: document.getElementById("import-archive-input"),

    // Passcode Lock Modal
    passcodeModal: document.getElementById("passcode-modal"),
    passcodeModalSubtitle: document.getElementById("passcode-modal-subtitle"),
    passcodeForm: document.getElementById("passcode-form"),
    passcodeModalInput: document.getElementById("passcode-modal-input"),
    passcodeModalStatus: document.getElementById("passcode-modal-status"),

    // In-Museum Heirloom Upgrade & Checkout Modal
    museumHeirloomModal: document.getElementById("museum-heirloom-modal"),
    closeHeirloomModal: document.getElementById("close-heirloom-modal"),
    cancelHeirloomBtn: document.getElementById("cancel-heirloom-btn"),
    mhModalTitle: document.getElementById("mh-modal-title"),
    mhModalSubtitle: document.getElementById("mh-modal-subtitle"),
    mhLimitNotice: document.getElementById("mh-limit-notice"),
    mhLimitNoticeText: document.getElementById("mh-limit-notice-text"),
    museumHeirloomForm: document.getElementById("museum-heirloom-form"),
    mhCameoDropzone: document.getElementById("mh-cameo-dropzone"),
    mhCameoFile: document.getElementById("mh-cameo-file"),
    mhCameoPreview: document.getElementById("mh-cameo-preview"),
    mhCameoPreviewImg: document.getElementById("mh-cameo-preview-img"),
    mhCameoPlaceholder: document.getElementById("mh-cameo-placeholder"),
    mhCameoUrl: document.getElementById("mh-cameo-url"),
    mhPasscode: document.getElementById("mh-passcode"),
    mhClearPasscodeWrap: document.getElementById("mh-clear-passcode-wrap"),
    mhClearPasscode: document.getElementById("mh-clear-passcode"),
    mhPartner1Name: document.getElementById("mh-partner1-name"),
    mhPartner1Nickname: document.getElementById("mh-partner1-nickname"),
    mhPartner2Name: document.getElementById("mh-partner2-name"),
    mhPartner2Nickname: document.getElementById("mh-partner2-nickname"),
    mhProposalPrompt: document.getElementById("mh-proposal-prompt"),
    mhPaymentSection: document.getElementById("mh-payment-section"),
    mhPriceSummary: document.getElementById("mh-price-summary"),
    mhPaymentRails: document.getElementById("mh-payment-rails"),
    mhPaystackPrice: document.getElementById("mh-paystack-price"),
    mhFlutterwavePrice: document.getElementById("mh-flutterwave-price"),
    mhMorPrice: document.getElementById("mh-mor-price"),
    mhStatusMsg: document.getElementById("mh-status-msg"),
    mhSandboxBtn: document.getElementById("mh-sandbox-btn"),
    mhCompletePaymentBtn: document.getElementById("mh-complete-payment-btn"),
    mhUnlockedPanel: document.getElementById("mh-unlocked-panel"),
    mhProposalLinkInput: document.getElementById("mh-proposal-link-input"),
    mhCopyProposalBtn: document.getElementById("mh-copy-proposal-btn"),
    mhOpenProposalLink: document.getElementById("mh-open-proposal-link"),
    mhDoneBtn: document.getElementById("mh-done-btn"),
  };

  let laceMaskCounter = 0;

  /* ------------------------------------------------------------------------
     EDITION, IDENTITY & SUBTLE NICKNAME HELPERS
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

  function hasCustomHeirloomIdentity() {
    return Boolean(state.room?.isHeirloom);
  }

  function getActivePartners() {
    const fallback = EDITION_PRESETS.public;
    const rawP1 = state.room?.partner1 || {};
    const rawP2 = state.room?.partner2 || {};
    const p1Name = String(rawP1.name || fallback.partner1.name || "Him").trim();
    const p2Name = String(rawP2.name || fallback.partner2.name || "Her").trim();
    const p1Id = String(rawP1.id || p1Name || "Him").trim();
    const p2Id = String(rawP2.id || p2Name || "Her").trim();
    return {
      partner1: {
        id: p1Id,
        name: p1Name,
        nickname: String(rawP1.nickname || "").trim(),
      },
      partner2: {
        id: p2Id,
        name: p2Name,
        nickname: String(rawP2.nickname || "").trim(),
      },
    };
  }

  function getProposalUrl(pin = state.pin) {
    return new URL(`proposal.html?pin=${encodeURIComponent(normalizePin(pin) || "SAMPLE")}`, window.location.href).href;
  }

  function mapCuratorForActiveEdition(curator) {
    const raw = String(curator || "").trim();
    const { partner1: p1, partner2: p2 } = getActivePartners();

    if (state.room?.isHeirloom) {
      if (raw === p1.id || raw === p1.name) return p1.id;
      if (raw === p2.id || raw === p2.name) return p2.id;
      if (raw === "Both of Us" || !raw) return "Both of Us";
      if (raw === "Me" || raw === "Him") return p1.id;
      if (raw === "My Girlfriend" || raw === "Her") return p2.id;
      return raw;
    }

    if (raw === "Me" || raw === "Him") return "Him";
    if (raw === "My Girlfriend" || raw === "Her") return "Her";
    return raw || "Both of Us";
  }

  function normalizeArtifactsForEdition(list) {
    return (list || []).map((item) => ({
      ...item,
      curator: mapCuratorForActiveEdition(item.curator),
    }));
  }

  function renderCuratorNameHtml(curatorValue) {
    const mapped = mapCuratorForActiveEdition(curatorValue);
    if (!hasCustomHeirloomIdentity()) {
      return escapeHtml(mapped);
    }

    const { partner1: p1, partner2: p2 } = getActivePartners();

    if (mapped === p1.id) {
      if (p1.nickname) {
        return `
          <span class="nickname-swap" data-partner="${escapeAttr(p1.id)}" tabindex="0" role="button" aria-label="${escapeAttr(p1.name)} (${escapeAttr(p1.nickname)})">
            <span class="nickname-real">${escapeHtml(p1.name)}</span>
            <span class="nickname-alias">${escapeHtml(p1.nickname)}</span>
          </span>
        `;
      }
      return escapeHtml(p1.name);
    }

    if (mapped === p2.id) {
      if (p2.nickname) {
        return `
          <span class="nickname-swap" data-partner="${escapeAttr(p2.id)}" tabindex="0" role="button" aria-label="${escapeAttr(p2.name)} (${escapeAttr(p2.nickname)})">
            <span class="nickname-real">${escapeHtml(p2.name)}</span>
            <span class="nickname-alias">${escapeHtml(p2.nickname)}</span>
          </span>
        `;
      }
      return escapeHtml(p2.name);
    }

    return escapeHtml(mapped);
  }

  function applyFoyerNotes() {
    const notes =
      Array.isArray(state.room.foyerNotes) && state.room.foyerNotes.length === 4
        ? state.room.foyerNotes
        : DEFAULT_FOYER_NOTES;

    notes.forEach((note, index) => {
      const btn = document.querySelector(`.floating-letter--${index + 1}`);
      if (!btn) return;
      btn.dataset.noteTitle = note.title || DEFAULT_FOYER_NOTES[index].title;
      btn.dataset.noteBody = note.body || DEFAULT_FOYER_NOTES[index].body;
    });
  }

  function applyEditionUI() {
    const isPrivate = state.edition === "private";
    const isPublicSample = !isPrivate && state.room.isSample;
    const isPublicCustom = !isPrivate && !state.room.isSample;
    const isHeirloom = hasCustomHeirloomIdentity();
    const { partner1: p1, partner2: p2 } = getActivePartners();

    // Document title
    if (isPrivate) {
      document.title = `${p1.name} & ${p2.name} \u2014 The Museum of Us`;
    } else if (isPublicCustom && state.room.isHeirloom) {
      document.title = `${p1.name} & ${p2.name} \u2014 Museum ${state.room.displayPin}`;
    } else if (isPublicCustom) {
      document.title = `Museum ${state.room.displayPin} \u2014 The Museum of Us`;
    } else {
      document.title = "The Museum of Us \u2014 Sample Exhibition";
    }

    // Hero "O" Cameo Portrait
    const heroImg = dom.heroOSlot?.querySelector("img");
    if (heroImg) {
      const customCameo = isHeirloom && Boolean(state.room.heroCameoUrl);
      heroImg.src = customCameo ? state.room.heroCameoUrl : "images/love1.jpg";
      heroImg.alt = customCameo ? `${p1.name} and ${p2.name}` : "Our Love";
    }

    // Top Navigation Controls
    if (dom.publicNavActions) dom.publicNavActions.hidden = !isPublicSample;
    if (dom.openCurateNav) dom.openCurateNav.hidden = isPublicSample;
    if (dom.activePinBadge) {
      dom.activePinBadge.hidden = !isPublicCustom;
      if (isPublicCustom && dom.navPinCode) {
        dom.navPinCode.textContent = state.room.displayPin || state.pin;
      }
    }
    if (dom.openHeirloomBtn) {
      dom.openHeirloomBtn.hidden = !(isPublicCustom && !state.room.isHeirloom);
    }
    if (dom.copyProposalLinkBtn) {
      dom.copyProposalLinkBtn.hidden = !(isPublicCustom && state.room.isHeirloom);
    }

    // Foyer Hero Signature & Actions
    if (dom.foyerCoupleSignature) {
      if (isPrivate) {
        dom.foyerCoupleSignature.innerHTML = `Private Museum &bull; ${renderCuratorNameHtml(p1.id)} &amp; ${renderCuratorNameHtml(p2.id)}`;
      } else if (isPublicCustom && state.room.isHeirloom) {
        dom.foyerCoupleSignature.innerHTML = `Heirloom Museum ${escapeHtml(state.room.displayPin)} &bull; ${renderCuratorNameHtml(p1.id)} &amp; ${renderCuratorNameHtml(p2.id)}`;
      } else if (isPublicCustom) {
        dom.foyerCoupleSignature.textContent = `Private Room ${state.room.displayPin} \u2022 Him & Her`;
      } else {
        dom.foyerCoupleSignature.textContent = "Public Sample Exhibition \u2022 Him & Her";
      }
    }

    if (dom.foyerDescription) {
      dom.foyerDescription.textContent = isPublicSample
        ? "Explore this live sample gallery crafted for Him & Her, or set up your own private museum with custom Foyer letters and your first three memories."
        : "Every place we have been, every letter we have kept, and the quiet moments only the two of us know.";
    }

    if (dom.foyerCreateBtn) dom.foyerCreateBtn.hidden = !isPublicSample;
    if (dom.foyerJoinBtn) dom.foyerJoinBtn.hidden = !isPublicSample;
    if (dom.foyerExploreBtn) {
      dom.foyerExploreBtn.classList.toggle("pill-cta--primary", !isPublicSample);
      dom.foyerExploreBtn.classList.toggle("pill-cta--ghost", isPublicSample);
      dom.foyerExploreBtn.textContent = isPublicSample ? "View Sample Gallery" : "Explore the Gallery";
    }
    if (dom.openCurateHero) dom.openCurateHero.hidden = isPublicSample;
    if (dom.vaultCreateBtn) dom.vaultCreateBtn.hidden = !isPublicSample;

    // Vault Heirloom Banner
    if (dom.vaultHeirloomBanner) {
      dom.vaultHeirloomBanner.hidden = !isPublicCustom;
      if (isPublicCustom) {
        const ngn = Number(state.paymentsConfig.heirloomPriceNgn || 5000).toLocaleString("en-NG");
        const usd = Number(state.paymentsConfig.heirloomPriceUsd || 7);
        if (state.room.isHeirloom) {
          if (dom.vaultHeirloomTitle) {
            dom.vaultHeirloomTitle.textContent = state.room.proposalAccepted
              ? "Heirloom Edition Unlocked \u2022 Proposal Accepted"
              : "Heirloom Edition Unlocked";
          }
          if (dom.vaultHeirloomDesc) {
            dom.vaultHeirloomDesc.textContent =
              "Custom partner names & nicknames, Hero cameo portrait, unlimited memories, and your interactive Proposal Link are active.";
          }
          if (dom.vaultUnlockHeirloomBtn) dom.vaultUnlockHeirloomBtn.hidden = true;
          if (dom.vaultPreviewProposalLink) {
            dom.vaultPreviewProposalLink.hidden = false;
            dom.vaultPreviewProposalLink.href = getProposalUrl();
          }
          if (dom.vaultEditHeirloomBtn) dom.vaultEditHeirloomBtn.hidden = false;
        } else {
          if (dom.vaultHeirloomTitle) {
            dom.vaultHeirloomTitle.textContent = `Free Museum Tier (Up to ${state.freeMemoryLimit} Memories)`;
          }
          if (dom.vaultHeirloomDesc) {
            dom.vaultHeirloomDesc.textContent =
              `Unlock Heirloom once (\u20a6${ngn} / $${usd}) for custom names & nicknames, Hero "O" portrait, unlimited memories, optional passcode lock, and your dodging-No Proposal Link.`;
          }
          if (dom.vaultUnlockHeirloomBtn) dom.vaultUnlockHeirloomBtn.hidden = false;
          if (dom.vaultPreviewProposalLink) dom.vaultPreviewProposalLink.hidden = true;
          if (dom.vaultEditHeirloomBtn) dom.vaultEditHeirloomBtn.hidden = true;
        }
      }
    }

    // Gallery Curator Filter Chips
    if (dom.filterCurator1) {
      dom.filterCurator1.dataset.curator = p1.id;
      dom.filterCurator1.innerHTML = isHeirloom
        ? `Added by ${renderCuratorNameHtml(p1.id)}`
        : "Added by Him";
    }
    if (dom.filterCurator2) {
      dom.filterCurator2.dataset.curator = p2.id;
      dom.filterCurator2.innerHTML = isHeirloom
        ? `Added by ${renderCuratorNameHtml(p2.id)}`
        : "Added by Her";
    }
    document.querySelectorAll("#curator-filter-group .filter-chip").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.curator === state.curatorFilter);
    });

    // Curate Modal Select Options
    if (dom.curatorInput) {
      if (isHeirloom) {
        const p1Label = p1.nickname ? `${p1.name} (${p1.nickname})` : p1.name;
        const p2Label = p2.nickname ? `${p2.name} (${p2.nickname})` : p2.name;
        dom.curatorInput.innerHTML = `
          <option value="${escapeAttr(p1.id)}">${escapeHtml(p1Label)}</option>
          <option value="${escapeAttr(p2.id)}">${escapeHtml(p2Label)}</option>
          <option value="Both of Us">Both of Us</option>
        `;
      } else {
        dom.curatorInput.innerHTML = `
          <option value="Him">Him</option>
          <option value="Her">Her</option>
          <option value="Both of Us">Both of Us</option>
        `;
      }
    }

    // Footer Brand Line
    if (dom.footerBrandMeta) {
      if (isPrivate) {
        dom.footerBrandMeta.innerHTML = `<strong>THE MUSEUM OF US</strong><span>&bull; Curated for ${renderCuratorNameHtml(p1.id)} &amp; ${renderCuratorNameHtml(p2.id)}</span>`;
      } else if (isPublicCustom && state.room.isHeirloom) {
        dom.footerBrandMeta.innerHTML = `<strong>THE MUSEUM OF US</strong><span>&bull; Heirloom Room ${escapeHtml(state.room.displayPin)} &bull; ${renderCuratorNameHtml(p1.id)} &amp; ${renderCuratorNameHtml(p2.id)}</span>`;
      } else if (isPublicCustom) {
        dom.footerBrandMeta.innerHTML = `<strong>THE MUSEUM OF US</strong><span>&bull; Couple Room ${escapeHtml(state.room.displayPin)}</span>`;
      } else {
        dom.footerBrandMeta.innerHTML = `<strong>THE MUSEUM OF US</strong><span>&bull; Sample Exhibition (Him &amp; Her)</span>`;
      }
    }

    applyFoyerNotes();
    renderWingControls();
  }

  /* ------------------------------------------------------------------------
     MOBILE & DESKTOP SUBTLE NICKNAME WHISPER ENGINE
     ------------------------------------------------------------------------ */
  let whisperIntervalId = null;
  let nicknameClickBound = false;

  function startNicknameWhisperTimer() {
    if (whisperIntervalId) {
      clearInterval(whisperIntervalId);
      whisperIntervalId = null;
    }
    if (!hasCustomHeirloomIdentity()) return;

    // On mobile/touch screens (no cursor hover), gently cross-fade signature & filter names periodically
    whisperIntervalId = window.setInterval(() => {
      const isTouchLike =
        window.matchMedia("(hover: none), (pointer: coarse)").matches ||
        window.innerWidth <= 860;
      if (!isTouchLike) return;

      const targets = document.querySelectorAll(
        "#foyer-couple-signature .nickname-swap, #curator-filter-group .nickname-swap"
      );
      targets.forEach((el) => {
        if (el.dataset.userPinned === "1") return;
        el.classList.add("is-flipped");
        window.setTimeout(() => {
          if (el.dataset.userPinned !== "1") {
            el.classList.remove("is-flipped");
          }
        }, 2100);
      });
    }, 4800);
  }

  function initNicknameInteractions() {
    if (!nicknameClickBound) {
      nicknameClickBound = true;
      document.addEventListener("click", (e) => {
        const swapEl = e.target.closest(".nickname-swap");
        if (!swapEl) return;
        swapEl.dataset.userPinned = "1";
        swapEl.classList.toggle("is-flipped");
      });
    }
    startNicknameWhisperTimer();
  }

  /* ------------------------------------------------------------------------
     CANVA SCALLOPED EYELET LACE SVG BUILDER (Oval Cameo)
     ------------------------------------------------------------------------ */
  function populateOvalLaceSvg(svgEl) {
    if (!svgEl) return;
    laceMaskCounter += 1;
    const maskId = `oval-lace-mask-${laceMaskCounter}`;
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

  function createLaceDisplayElement(artifact, forceStyle) {
    const style = forceStyle || artifact.frameStyle || "Rectangular Lace Frame";
    const wrapper = document.createElement("div");

    if (style === "Oval Lace Cameo") {
      wrapper.className = "lace-oval-case";
      wrapper.innerHTML = `
        <div class="lace-oval-viewport">
          <img src="${escapeAttr(artifact.imageUrl || DEFAULT_LETTER_FALLBACK)}" alt="${escapeAttr(artifact.title)}" />
        </div>
        <svg class="lace-oval-overlay" viewBox="0 0 240 300" aria-hidden="true"></svg>
      `;
      populateOvalLaceSvg(wrapper.querySelector(".lace-oval-overlay"));
      return wrapper;
    }

    wrapper.className = "lace-rect-case";
    wrapper.innerHTML = `
      <div class="lace-rect-viewport">
        <img src="${escapeAttr(artifact.imageUrl || DEFAULT_LETTER_FALLBACK)}" alt="${escapeAttr(artifact.title)}" />
      </div>
    `;
    return wrapper;
  }

  function sanitizeWings(rawWings) {
    if (!Array.isArray(rawWings)) {
      return structuredClone(DEFAULT_WINGS);
    }
    const cleaned = [];
    const seen = new Set();
    for (const entry of rawWings) {
      const label = String(entry || "").trim().slice(0, 48);
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push(label);
      if (cleaned.length >= 8) break;
    }
    return cleaned.length ? cleaned : structuredClone(DEFAULT_WINGS);
  }

  function populateWingSelectOptions(selectedWing = "") {
    if (!dom.wingInput) return;
    const wings = sanitizeWings(state.room.wings);
    const options = [...wings];
    const desired = String(selectedWing || "").trim();
    if (desired && !options.includes(desired)) {
      options.push(desired);
    }

    dom.wingInput.innerHTML = options
      .map((wing) => `<option value="${escapeAttr(wing)}">${escapeHtml(wing)}</option>`)
      .join("");
    dom.wingInput.value = desired && options.includes(desired) ? desired : options[0];
  }

  function renderWingControls() {
    const wings = sanitizeWings(state.room.wings);
    state.room.wings = wings;
    if (state.wingFilter !== "All" && !wings.includes(state.wingFilter)) {
      state.wingFilter = "All";
    }

    if (dom.wingFilterGroup) {
      const canEditWings = !state.room.isSample;
      const wingButtonsHtml = wings
        .map(
          (wing) => `
            <button
              type="button"
              class="filter-chip${state.wingFilter === wing ? " is-active" : ""}"
              data-wing="${escapeAttr(wing)}"
            >${escapeHtml(wing)}</button>`
        )
        .join("");

      const editBtnHtml = canEditWings
        ? `<button type="button" class="filter-chip filter-chip--edit" id="open-wings-modal-btn" title="Edit gallery wings" aria-label="Edit gallery wings">&#9998; Edit Wings</button>`
        : "";

      dom.wingFilterGroup.innerHTML = `
        <button type="button" class="filter-chip${state.wingFilter === "All" ? " is-active" : ""}" data-wing="All">All Wings</button>
        ${wingButtonsHtml}
        ${editBtnHtml}
      `;
      dom.openWingsModalBtn = document.getElementById("open-wings-modal-btn");
    }

    populateWingSelectOptions(dom.wingInput?.value || "");
  }

  /* ------------------------------------------------------------------------
     CLOUD + LOCAL ROOM PERSISTENCE
     ------------------------------------------------------------------------ */
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
    try {
      const rooms = readLocalPublicRooms();
      rooms[normalizePin(room.pin)] = room;
      localStorage.setItem(PUBLIC_ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch (_) {
      // Ignore quota exceeded
    }
  }

  function applyRoomPayload(loadedRoom) {
    const preset = EDITION_PRESETS[state.edition] || EDITION_PRESETS.public;
    state.room = {
      pin: normalizePin(loadedRoom.pin || state.pin),
      displayPin: formatPinDisplay(loadedRoom.pin || state.pin),
      edition: state.edition,
      isSample: Boolean(loadedRoom.isSample),
      isHeirloom: state.edition === "private" ? true : Boolean(loadedRoom.isHeirloom),
      partner1: loadedRoom.partner1 || structuredClone(preset.partner1),
      partner2: loadedRoom.partner2 || structuredClone(preset.partner2),
      shared: loadedRoom.shared || "Both of Us",
      heroCameoUrl: String(loadedRoom.heroCameoUrl || "").trim(),
      hasPasscode: Boolean(loadedRoom.hasPasscode || loadedRoom.viewerPasscode),
      passcodeRequired: Boolean(loadedRoom.passcodeRequired),
      proposalPrompt: String(
        loadedRoom.proposalPrompt ||
          "Will you accept Our Love Museum and step inside every memory we have kept?"
      ).trim(),
      proposalAccepted: Boolean(loadedRoom.proposalAccepted),
      paymentProvider: String(loadedRoom.paymentProvider || ""),
      paymentRef: String(loadedRoom.paymentRef || ""),
      wings: sanitizeWings(loadedRoom.wings),
      foyerNotes:
        Array.isArray(loadedRoom.foyerNotes) && loadedRoom.foyerNotes.length === 4
          ? loadedRoom.foyerNotes
          : structuredClone(DEFAULT_FOYER_NOTES),
    };

    state.passcodeLocked = Boolean(loadedRoom.passcodeRequired);
    if (state.passcodeLocked) {
      state.artifacts = [];
    } else {
      const rawArtifacts =
        Array.isArray(loadedRoom.artifacts) && loadedRoom.artifacts.length > 0
          ? loadedRoom.artifacts
          : state.defaults;
      state.artifacts = normalizeArtifactsForEdition(rawArtifacts);
    }

    if (state.curatorFilter && state.curatorFilter !== "All") {
      state.curatorFilter = mapCuratorForActiveEdition(state.curatorFilter);
    }

    if (!state.passcodeLocked) {
      syncLocalStorage();
    }
  }

  async function refreshServerConfig() {
    let serverEdition = "public";
    try {
      const cfgRes = await fetch("/api/config", { cache: "no-store" });
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        if (cfg?.edition === "private" || cfg?.edition === "public") {
          serverEdition = cfg.edition;
        }
        if (Number(cfg?.freeMemoryLimit) > 0) {
          state.freeMemoryLimit = Number(cfg.freeMemoryLimit);
        }
        if (cfg?.payments && typeof cfg.payments === "object") {
          state.paymentsConfig = {
            ...state.paymentsConfig,
            ...cfg.payments,
          };
        }
      }
    } catch (_) {
      // Static / file:// fallback
    }
    return serverEdition;
  }

  async function fetchMuseumRoom(pin, passcode = "") {
    const query = passcode
      ? `/api/museums?pin=${encodeURIComponent(pin)}&passcode=${encodeURIComponent(passcode)}`
      : `/api/museums?pin=${encodeURIComponent(pin)}`;
    return fetch(query, { cache: "no-store" });
  }

  function sanitizeLocalOfflineRoom(localRoom, passcode = "") {
    if (!localRoom || typeof localRoom !== "object") return null;
    const storedCode = String(localRoom.viewerPasscode || "").trim();
    if (storedCode && storedCode !== passcode) {
      return {
        ...localRoom,
        hasPasscode: true,
        passcodeRequired: true,
        artifacts: [],
        foyerNotes: [],
        heroCameoUrl: "",
      };
    }
    return {
      ...localRoom,
      hasPasscode: Boolean(storedCode || localRoom.hasPasscode),
      passcodeRequired: false,
    };
  }

  async function resolveEditionAndLoadRoom() {
    const params = new URLSearchParams(window.location.search);
    const queryPin = normalizePin(params.get("pin"));

    await refreshServerConfig();
    state.edition = "public";
    state.pin = queryPin || "SAMPLE";

    // Load seed defaults for sample exhibition
    try {
      const seedRes = await fetch("data/artifacts.json", { cache: "no-store" });
      if (seedRes.ok) {
        const seedJson = await seedRes.json();
        if (Array.isArray(seedJson) && seedJson.length > 0) {
          state.defaults = normalizeArtifactsForEdition(seedJson);
        }
      }
    } catch (_) {
      // Embedded fallback below
    }
    if (state.defaults.length === 0) {
      state.defaults = normalizeArtifactsForEdition(structuredClone(FALLBACK_SEED_ARTIFACTS));
    }

    // Try loading active room from Cloud / API
    let loadedRoom = null;
    try {
      const roomRes = await fetchMuseumRoom(state.pin, state.passcode);
      if (roomRes.ok) {
        loadedRoom = await roomRes.json();
      } else if (roomRes.status === 404 && queryPin) {
        // Check local browser fallback first before reporting not found
        const localRoom = sanitizeLocalOfflineRoom(readLocalPublicRooms()[queryPin], state.passcode);
        if (localRoom) {
          loadedRoom = localRoom;
        } else {
          window.location.replace(`setup.html?notfound=1&pin=${encodeURIComponent(queryPin)}#join`);
          return false;
        }
      }
    } catch (_) {
      // Static/offline fallback below
    }

    if (!loadedRoom && state.pin !== "SAMPLE") {
      const localRoom = sanitizeLocalOfflineRoom(readLocalPublicRooms()[state.pin], state.passcode);
      if (localRoom) {
        loadedRoom = localRoom;
      } else {
        window.location.replace(`setup.html?notfound=1&pin=${encodeURIComponent(state.pin)}#join`);
        return false;
      }
    }

    if (loadedRoom && typeof loadedRoom === "object") {
      applyRoomPayload(loadedRoom);
    } else {
      state.room = {
        pin: state.pin,
        displayPin: formatPinDisplay(state.pin),
        edition: "public",
        isSample: true,
        isHeirloom: false,
        heroCameoUrl: "",
        hasPasscode: false,
        passcodeRequired: false,
        proposalPrompt:
          "Will you accept Our Love Museum and step inside every memory we have kept?",
        proposalAccepted: false,
        ...structuredClone(EDITION_PRESETS.public),
        wings: structuredClone(DEFAULT_WINGS),
        foyerNotes: structuredClone(DEFAULT_FOYER_NOTES),
      };
      state.artifacts = normalizeArtifactsForEdition(structuredClone(state.defaults));
      syncLocalStorage();
    }

    return true;
  }

  function syncLocalStorage() {
    if (state.passcodeLocked) return;
    try {
      if (!state.room.isSample && state.pin !== "SAMPLE") {
        const existing = readLocalPublicRooms()[normalizePin(state.pin)] || {};
        saveLocalPublicRoom({
          ...existing,
          ...state.room,
          artifacts: state.artifacts,
        });
      }
    } catch (_) {
      // Ignore storage quota issues
    }
  }

  async function persistArtifacts(nextArtifacts = state.artifacts) {
    if (state.edition === "public" && state.room.isSample) {
      state.artifacts = nextArtifacts;
      return { ok: true }; // Sample exhibition stays read-only on shared server
    }
    try {
      const res = await fetch(`/api/artifacts?pin=${encodeURIComponent(state.pin)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextArtifacts),
      });
      if (res.status === 402) {
        const errJson = await res.json().catch(() => ({}));
        return {
          ok: false,
          heirloomRequired: errJson?.code === "HEIRLOOM_REQUIRED" || res.status === 402,
          message:
            errJson?.error ||
            `Free museums hold up to ${state.freeMemoryLimit} memories. Unlock Heirloom to hang unlimited memories.`,
        };
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { ok: false, message: errJson?.error || "Could not save memories." };
      }
      state.artifacts = nextArtifacts;
      syncLocalStorage();
      return { ok: true };
    } catch (_) {
      // Offline / static host fallback
      if (
        state.edition === "public" &&
        !state.room.isSample &&
        !state.room.isHeirloom &&
        nextArtifacts.length > state.freeMemoryLimit
      ) {
        return {
          ok: false,
          heirloomRequired: true,
          message: `Free museums hold up to ${state.freeMemoryLimit} memories. Unlock Heirloom to hang unlimited memories.`,
        };
      }
      state.artifacts = nextArtifacts;
      syncLocalStorage();
      return { ok: true };
    }
  }

  /* ------------------------------------------------------------------------
     RENDERERS
     ------------------------------------------------------------------------ */
  function getFilteredArtifacts() {
    return state.artifacts.filter((item) => {
      const wingOk = state.wingFilter === "All" || item.wing === state.wingFilter;
      const curatorOk = state.curatorFilter === "All" || item.curator === state.curatorFilter;
      return wingOk && curatorOk;
    });
  }

  function renderLaceShowcase() {
    if (!dom.laceShowcaseGrid) return;
    dom.laceShowcaseGrid.innerHTML = "";

    const featured = state.artifacts.filter((a) => a.featured);
    const displayList = (featured.length ? featured : state.artifacts).slice(0, 4);

    displayList.forEach((artifact, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "showcase-item";
      btn.setAttribute("aria-label", `Inspect ${artifact.title} in lace display case`);

      const preferredStyle =
        artifact.frameStyle === "Oval Lace Cameo" || artifact.frameStyle === "Rectangular Lace Frame"
          ? artifact.frameStyle
          : idx % 2 === 1
            ? "Oval Lace Cameo"
            : "Rectangular Lace Frame";

      const caseEl = createLaceDisplayElement(artifact, preferredStyle);
      const caption = document.createElement("div");
      caption.className = "showcase-caption";
      caption.innerHTML = `
        <strong>${escapeHtml(artifact.title)}</strong>
        <span>${escapeHtml(artifact.date)} &middot; ${renderCuratorNameHtml(artifact.curator)}</span>
      `;

      btn.appendChild(caseEl);
      btn.appendChild(caption);
      btn.addEventListener("click", (e) => {
        if (e.target.closest(".nickname-swap")) return;
        openLightbox(artifact.id);
      });
      dom.laceShowcaseGrid.appendChild(btn);
    });
  }

  function renderSlantedGallery() {
    if (!dom.slantedCardsGrid) return;
    dom.slantedCardsGrid.innerHTML = "";

    const filtered = getFilteredArtifacts();
    if (dom.galleryEmptyState) {
      dom.galleryEmptyState.hidden = filtered.length > 0;
    }

    filtered.forEach((artifact, idx) => {
      const slant =
        typeof artifact.slant === "number"
          ? artifact.slant
          : REST_SLANTS[idx % REST_SLANTS.length];
      const isSecretOpen = state.openSecretIds.has(artifact.id);

      const card = document.createElement("article");
      card.className = "slanted-artifact-card is-revealable";
      card.style.setProperty("--rest-angle", `${slant}deg`);
      card.dataset.artifactId = artifact.id;
      card.dataset.index = String(idx);

      card.innerHTML = `
        <span class="card-eyelet" aria-hidden="true">
          <span class="eyelet-hole"></span>
        </span>

        <div class="card-photo-frame" data-action="inspect" title="Open inside Lace Display Case">
          <img src="${escapeAttr(artifact.imageUrl || DEFAULT_LETTER_FALLBACK)}" alt="${escapeAttr(artifact.title)}" />
        </div>

        <h3 class="card-title">${escapeHtml(artifact.title)}</h3>
        <p class="card-byline">${escapeHtml(artifact.date)} &middot; ${renderCuratorNameHtml(artifact.curator)}</p>
        <p class="card-story">${escapeHtml(artifact.story)}</p>

        ${
          artifact.secretNote
            ? `<div class="card-secret-drawer" ${isSecretOpen ? "" : "hidden"}>
                 &ldquo;${escapeHtml(artifact.secretNote)}&rdquo;
               </div>`
            : ""
        }

        <div class="card-actions">
          <button type="button" class="card-btn" data-action="inspect">View in Lace Case</button>
          ${
            artifact.secretNote
              ? `<button type="button" class="card-btn" data-action="secret">${
                  isSecretOpen ? "Hide Note" : "Secret Note"
                }</button>`
              : ""
          }
          <button type="button" class="card-btn" data-action="edit">Edit</button>
          <button type="button" class="card-btn card-btn--danger" data-action="delete">Delete</button>
        </div>
      `;

      const imgEl = card.querySelector("img");
      if (imgEl) {
        imgEl.addEventListener("load", () => scheduleStringRedraw(), { once: true });
      }

      card.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-action]");
        if (!trigger) return;
        const action = trigger.dataset.action;

        if (action === "inspect") {
          openLightbox(artifact.id);
        } else if (action === "secret") {
          if (state.openSecretIds.has(artifact.id)) {
            state.openSecretIds.delete(artifact.id);
          } else {
            state.openSecretIds.add(artifact.id);
          }
          renderSlantedGallery();
        } else if (action === "edit") {
          openCurateModal(artifact.id);
        } else if (action === "delete") {
          deleteArtifact(artifact.id);
        }
      });

      dom.slantedCardsGrid.appendChild(card);
    });

    observeReveals();
    scheduleStringRedraw();
  }

  function renderAll() {
    applyEditionUI();
    renderLaceShowcase();
    renderSlantedGallery();
  }

  /* ------------------------------------------------------------------------
     DYNAMIC WAVY STRING THROUGH TOP PUNCHED HOLES
     ------------------------------------------------------------------------ */
  let stringRafId = 0;

  function scheduleStringRedraw() {
    if (stringRafId) cancelAnimationFrame(stringRafId);
    stringRafId = requestAnimationFrame(() => {
      stringRafId = 0;
      updateWavyStringPath();
    });
  }

  function updateWavyStringPath() {
    if (!dom.stringGalleryStage || !dom.wavyStringMain || !dom.wavyStringOverSvg) return;

    const stageRect = dom.stringGalleryStage.getBoundingClientRect();
    if (stageRect.width === 0 || stageRect.height === 0) return;

    const waypoints = [];

    const anchorRing = dom.stringAnchor?.querySelector(".anchor-ring");
    if (anchorRing) {
      const r = anchorRing.getBoundingClientRect();
      waypoints.push({
        x: r.left + r.width / 2 - stageRect.left,
        y: r.top + r.height / 2 - stageRect.top,
        isHole: false,
      });
    }

    const eyelets =
      dom.slantedCardsGrid?.querySelectorAll(".slanted-artifact-card .card-eyelet") || [];
    eyelets.forEach((eyelet) => {
      const r = eyelet.getBoundingClientRect();
      waypoints.push({
        x: r.left + r.width / 2 - stageRect.left,
        y: r.top + r.height / 2 - stageRect.top,
        isHole: true,
      });
    });

    const tagEyelet = dom.terminalAddTag?.querySelector(".card-eyelet");
    if (tagEyelet) {
      const r = tagEyelet.getBoundingClientRect();
      waypoints.push({
        x: r.left + r.width / 2 - stageRect.left,
        y: r.top + r.height / 2 - stageRect.top,
        isHole: true,
      });
    }

    if (waypoints.length < 2) {
      dom.wavyStringMain.setAttribute("d", "");
      dom.wavyStringShadow?.setAttribute("d", "");
      dom.wavyStringOverSvg.innerHTML = "";
      return;
    }

    dom.wavyStringSvg?.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);
    dom.wavyStringOverSvg.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);

    let fullPath = `M ${waypoints[0].x.toFixed(1)},${waypoints[0].y.toFixed(1)}`;
    let overMarkup = "";

    for (let i = 0; i < waypoints.length - 1; i += 1) {
      const p0 = waypoints[i];
      const p3 = waypoints[i + 1];
      const dx = p3.x - p0.x;
      const dy = p3.y - p0.y;
      const waveBias = Math.abs(dx) < 60 ? (i % 2 === 0 ? -64 : 64) : 0;

      const p1 = {
        x: p0.x + dx * 0.14 + waveBias,
        y: p0.y + Math.max(54, Math.abs(dy) * 0.48),
      };
      const p2 = {
        x: p3.x - dx * 0.16 - waveBias * 0.5,
        y: p3.y - Math.max(54, Math.abs(dy) * 0.48),
      };

      fullPath += ` C ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`;

      if (p3.isHole) {
        const sub = splitCubicBezierTail(p0, p1, p2, p3, 0.84);
        overMarkup += `
          <path
            class="wavy-string-thread-over"
            d="M ${sub.q0.x.toFixed(1)},${sub.q0.y.toFixed(1)} C ${sub.q1.x.toFixed(1)},${sub.q1.y.toFixed(1)} ${sub.q2.x.toFixed(1)},${sub.q2.y.toFixed(1)} ${sub.q3.x.toFixed(1)},${sub.q3.y.toFixed(1)}"
          />
          <circle cx="${p3.x.toFixed(1)}" cy="${(p3.y - 1).toFixed(1)}" r="3.4" fill="#ffffff" />
        `;
      }
    }

    dom.wavyStringMain.setAttribute("d", fullPath);
    dom.wavyStringShadow?.setAttribute("d", fullPath);
    dom.wavyStringOverSvg.innerHTML = overMarkup;
  }

  function lerpPoint(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  function splitCubicBezierTail(p0, p1, p2, p3, t) {
    const a = lerpPoint(p0, p1, t);
    const b = lerpPoint(p1, p2, t);
    const c = lerpPoint(p2, p3, t);
    const d = lerpPoint(a, b, t);
    const e = lerpPoint(b, c, t);
    const f = lerpPoint(d, e, t);
    return { q0: f, q1: e, q2: c, q3: p3 };
  }

  /* ------------------------------------------------------------------------
     SCROLL VELOCITY PENDULUM SWAY & .is-onscreen REVEALS
     ------------------------------------------------------------------------ */
  let revealObserver = null;

  function observeReveals() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".is-revealable").forEach((el) => {
        el.classList.add("is-onscreen");
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-onscreen");
            }
          });
        },
        { threshold: 0.16 }
      );
    }

    document.querySelectorAll(".is-revealable").forEach((el) => {
      revealObserver.observe(el);
    });
  }

  function handleScrollEffects() {
    const currentY = window.scrollY || 0;
    const delta = currentY - state.lastScrollY;
    state.lastScrollY = currentY;

    if (dom.topNav) {
      dom.topNav.classList.toggle("is-scrolled", currentY > 24);
    }

    const targetVelocity = Math.max(-3.6, Math.min(3.6, delta * 0.14));
    if (Math.abs(targetVelocity) > Math.abs(state.swayAngle)) {
      state.swayAngle = targetVelocity;
    }

    if (!state.isRafRunning) {
      state.isRafRunning = true;
      requestAnimationFrame(stepPendulumPhysics);
    }
  }

  function stepPendulumPhysics() {
    state.swayAngle *= 0.88;
    const cards = dom.slantedCardsGrid?.querySelectorAll(".slanted-artifact-card") || [];
    cards.forEach((card, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      card.style.setProperty("--sway-angle", `${(state.swayAngle * dir).toFixed(3)}deg`);
    });

    if (Math.abs(state.swayAngle) > 0.03) {
      requestAnimationFrame(stepPendulumPhysics);
    } else {
      state.swayAngle = 0;
      cards.forEach((card) => card.style.setProperty("--sway-angle", "0deg"));
      state.isRafRunning = false;
    }
  }

  /* ------------------------------------------------------------------------
     CURATE (ADD / EDIT / DELETE) & IMAGE PROCESSOR
     ------------------------------------------------------------------------ */
  function setFormStatus(message) {
    if (dom.formStatusMsg) {
      dom.formStatusMsg.textContent = message;
    }
  }

  function openCurateModal(artifactId = null) {
    if (
      !artifactId &&
      state.edition === "public" &&
      !state.room.isSample &&
      !state.room.isHeirloom &&
      state.artifacts.length >= state.freeMemoryLimit
    ) {
      openHeirloomModal({
        limitNotice: `You have reached the ${state.freeMemoryLimit}-memory limit on your free museum archive. Unlock Heirloom Edition once to hang unlimited memories, customize your names & nicknames, upload a Hero portrait, lock with a passcode, and unlock your interactive Proposal Link.`,
      });
      return;
    }
    if (!dom.curateModal || !dom.artifactForm) return;
    setFormStatus("");
    dom.artifactForm.reset();
    state.pendingImageDataUrl = "";
    setModalPreview("");

    if (artifactId) {
      const item = state.artifacts.find((a) => a.id === artifactId);
      if (item) {
        if (dom.curateModalTitle) dom.curateModalTitle.textContent = "Edit This Memory";
        if (dom.artifactIdInput) dom.artifactIdInput.value = item.id;
        if (dom.titleInput) dom.titleInput.value = item.title;
        if (dom.dateInput) dom.dateInput.value = item.date;
        if (dom.curatorInput) {
          dom.curatorInput.value = mapCuratorForActiveEdition(item.curator);
        }
        populateWingSelectOptions(item.wing);
        if (dom.frameStyleInput) {
          dom.frameStyleInput.value = item.frameStyle || "Rectangular Lace Frame";
        }
        if (dom.storyInput) dom.storyInput.value = item.story;
        if (dom.secretNoteInput) dom.secretNoteInput.value = item.secretNote || "";
        if (dom.featuredInput) dom.featuredInput.checked = Boolean(item.featured);
        state.pendingImageDataUrl = item.imageUrl;
        if (dom.imageUrlInput && item.imageUrl && !item.imageUrl.startsWith("data:")) {
          dom.imageUrlInput.value = item.imageUrl;
        }
        setModalPreview(item.imageUrl);
      }
    } else {
      if (dom.curateModalTitle) dom.curateModalTitle.textContent = "Hang a New Memory";
      if (dom.artifactIdInput) dom.artifactIdInput.value = "";
      if (dom.dateInput) {
        dom.dateInput.value = new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
      if (dom.featuredInput) dom.featuredInput.checked = true;
      populateWingSelectOptions(state.wingFilter !== "All" ? state.wingFilter : "");
    }

    dom.curateModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCurateModal() {
    if (!dom.curateModal) return;
    dom.curateModal.hidden = true;
    document.body.style.overflow = "";
  }

  function setModalPreview(src) {
    if (!dom.dropzonePreview || !dom.dropzonePlaceholder || !dom.previewImgEl) return;
    if (src) {
      dom.previewImgEl.src = src;
      dom.dropzonePreview.hidden = false;
      dom.dropzonePlaceholder.hidden = true;
    } else {
      dom.previewImgEl.src = "";
      dom.dropzonePreview.hidden = true;
      dom.dropzonePlaceholder.hidden = false;
    }
  }

  function processUploadedFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setFormStatus("Please choose an image file (JPG, PNG, WebP).");
      return;
    }
    setFormStatus("Framing photograph...");

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 920;
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
        if (!ctx) {
          setFormStatus("Could not initialize image canvas.");
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL("image/jpeg", 0.8);
        if (compressed.length > 650000) {
          compressed = canvas.toDataURL("image/jpeg", 0.66);
        }
        state.pendingImageDataUrl = compressed;
        if (dom.imageUrlInput) dom.imageUrlInput.value = "";
        setModalPreview(compressed);
        setFormStatus("Photo ready to hang.");
      };
      img.onerror = () => {
        setFormStatus("Could not decode this image file.");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const editingId = dom.artifactIdInput?.value.trim() || "";
    const urlInput = dom.imageUrlInput?.value.trim() || "";
    const chosenImage = urlInput || state.pendingImageDataUrl || DEFAULT_LETTER_FALLBACK;

    const title = dom.titleInput?.value.trim() || "";
    const date = dom.dateInput?.value.trim() || "";
    const story = dom.storyInput?.value.trim() || "";
    const curator = mapCuratorForActiveEdition(dom.curatorInput?.value || "Both of Us");
    const wing = dom.wingInput?.value || sanitizeWings(state.room.wings)[0] || DEFAULT_WINGS[0];
    const frameStyle = dom.frameStyleInput?.value || "Rectangular Lace Frame";
    const secretNote = dom.secretNoteInput?.value.trim() || "";
    const featured = Boolean(dom.featuredInput?.checked);

    if (!title || !date || !story) {
      setFormStatus("Please fill in the title, date, and memory story.");
      return;
    }

    const nextArtifacts = structuredClone(state.artifacts);
    let newArtifact = null;

    if (editingId) {
      const idx = nextArtifacts.findIndex((a) => a.id === editingId);
      if (idx !== -1) {
        nextArtifacts[idx] = {
          ...nextArtifacts[idx],
          title,
          date,
          curator,
          wing,
          frameStyle,
          story,
          secretNote,
          featured,
          imageUrl: chosenImage,
        };
      }
    } else {
      const nextNum = nextArtifacts.length + 1;
      newArtifact = {
        id: `art-${Date.now()}`,
        catalogNumber: `ARTIFACT #${String(nextNum).padStart(2, "0")}`,
        title,
        date,
        curator,
        wing,
        frameStyle,
        featured,
        slant: REST_SLANTS[(nextNum - 1) % REST_SLANTS.length],
        story,
        secretNote,
        tags: [],
        imageUrl: chosenImage,
      };
      nextArtifacts.push(newArtifact);
    }

    setFormStatus("Saving memory...");
    const result = await persistArtifacts(nextArtifacts);
    if (result.heirloomRequired) {
      if (newArtifact) {
        state.pendingMemoryAfterUnlock = newArtifact;
      }
      closeCurateModal();
      openHeirloomModal({ limitNotice: result.message });
      return;
    }
    if (!result.ok) {
      setFormStatus(result.message || "Could not save memory.");
      return;
    }

    renderAll();
    closeCurateModal();

    if (!editingId) {
      const target = document.getElementById("gallery");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function deleteArtifact(artifactId) {
    const item = state.artifacts.find((a) => a.id === artifactId);
    if (!item) return;
    if (!window.confirm(`Remove "${item.title}" from the museum?`)) return;

    const nextArtifacts = state.artifacts.filter((a) => a.id !== artifactId);
    const result = await persistArtifacts(nextArtifacts);
    if (!result.ok) {
      window.alert(result.message || "Could not remove memory.");
      return;
    }

    state.openSecretIds.delete(artifactId);
    if (state.activeLightboxId === artifactId) {
      closeLightbox();
    }
    renderAll();
  }

  /* ------------------------------------------------------------------------
     4-DIGIT VIEWER PASSCODE LOCK MODAL
     ------------------------------------------------------------------------ */
  function openPasscodeModal() {
    if (!dom.passcodeModal) return;
    if (dom.passcodeModalSubtitle) {
      dom.passcodeModalSubtitle.textContent = `Enter the 4-digit passcode shared with you to unlock Museum ${state.room.displayPin || state.pin}.`;
    }
    if (dom.passcodeModalStatus) dom.passcodeModalStatus.textContent = "";
    if (dom.passcodeModalInput) dom.passcodeModalInput.value = "";
    dom.passcodeModal.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => dom.passcodeModalInput?.focus(), 60);
  }

  function closePasscodeModal() {
    if (!dom.passcodeModal) return;
    dom.passcodeModal.hidden = true;
    document.body.style.overflow = "";
  }

  async function handlePasscodeSubmit(event) {
    event.preventDefault();
    const code = String(dom.passcodeModalInput?.value || "").trim();
    if (!/^\d{4}$/.test(code)) {
      if (dom.passcodeModalStatus) {
        dom.passcodeModalStatus.textContent = "Please enter a 4-digit passcode.";
      }
      dom.passcodeModalInput?.focus();
      return;
    }

    if (dom.passcodeModalStatus) dom.passcodeModalStatus.textContent = "Unsealing museum...";

    let unlockedRoom = null;
    try {
      const res = await fetchMuseumRoom(state.pin, code);
      if (res.ok) {
        const data = await res.json();
        if (!data.passcodeRequired) {
          unlockedRoom = data;
        }
      }
    } catch (_) {
      const localRoom = sanitizeLocalOfflineRoom(readLocalPublicRooms()[state.pin], code);
      if (localRoom && !localRoom.passcodeRequired) {
        unlockedRoom = localRoom;
      }
    }

    if (!unlockedRoom) {
      if (dom.passcodeModalStatus) {
        dom.passcodeModalStatus.textContent = "That passcode didn't match. Please try again.";
      }
      dom.passcodeModalInput?.select();
      return;
    }

    state.passcode = code;
    state.passcodeLocked = false;
    applyRoomPayload(unlockedRoom);
    closePasscodeModal();
    applyEditionUI();
    startNicknameWhisperTimer();
    renderAll();
    observeReveals();
    scheduleStringRedraw();
  }

  /* ------------------------------------------------------------------------
     IN-MUSEUM HEIRLOOM UPGRADE & PAYMENT CHECKOUT
     ------------------------------------------------------------------------ */
  function setCameoPreview(src) {
    if (!dom.mhCameoPreview || !dom.mhCameoPlaceholder || !dom.mhCameoPreviewImg) return;
    if (src) {
      dom.mhCameoPreviewImg.src = src;
      dom.mhCameoPreview.hidden = false;
      dom.mhCameoPlaceholder.hidden = true;
    } else {
      dom.mhCameoPreviewImg.src = "";
      dom.mhCameoPreview.hidden = true;
      dom.mhCameoPlaceholder.hidden = false;
    }
  }

  function setHeirloomStatus(message) {
    if (dom.mhStatusMsg) dom.mhStatusMsg.textContent = message;
  }

  function processCameoFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setHeirloomStatus("Please choose an image file (JPG, PNG, WebP).");
      return;
    }
    setHeirloomStatus("Framing cameo portrait...");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 640;
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
        if (compressed.length > 420000) {
          compressed = canvas.toDataURL("image/jpeg", 0.6);
        }
        state.pendingCameoDataUrl = compressed;
        if (dom.mhCameoUrl) dom.mhCameoUrl.value = "";
        setCameoPreview(compressed);
        setHeirloomStatus("Hero cameo portrait ready.");
      };
      img.onerror = () => setHeirloomStatus("Could not decode that image.");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function updateSelectedPaymentRailUI() {
    if (!dom.mhPaymentRails) return;
    const checked = dom.mhPaymentRails.querySelector('input[name="mh-payment-rail"]:checked');
    const selectedVal = checked ? checked.value : "paystack";
    dom.mhPaymentRails.querySelectorAll(".payment-rail-card").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.rail === selectedVal);
    });
  }

  function openHeirloomModal({ limitNotice = "" } = {}) {
    if (!dom.museumHeirloomModal || !dom.museumHeirloomForm) return;
    const isEditMode = Boolean(state.room.isHeirloom);
    const { partner1: p1, partner2: p2 } = getActivePartners();

    setHeirloomStatus("");
    state.pendingCameoDataUrl = state.room.heroCameoUrl || "";
    setCameoPreview(state.room.heroCameoUrl || "");

    if (dom.mhCameoUrl) {
      dom.mhCameoUrl.value =
        state.room.heroCameoUrl && !state.room.heroCameoUrl.startsWith("data:")
          ? state.room.heroCameoUrl
          : "";
    }
    if (dom.mhCameoFile) dom.mhCameoFile.value = "";

    if (dom.mhPartner1Name) {
      dom.mhPartner1Name.value = isEditMode || p1.name !== "Him" ? p1.name : "";
    }
    if (dom.mhPartner1Nickname) dom.mhPartner1Nickname.value = p1.nickname || "";
    if (dom.mhPartner2Name) {
      dom.mhPartner2Name.value = isEditMode || p2.name !== "Her" ? p2.name : "";
    }
    if (dom.mhPartner2Nickname) dom.mhPartner2Nickname.value = p2.nickname || "";
    if (dom.mhProposalPrompt) {
      dom.mhProposalPrompt.value =
        state.room.proposalPrompt ||
        "Will you accept Our Love Museum and step inside every memory we have kept?";
    }
    if (dom.mhPasscode) {
      dom.mhPasscode.value = "";
      dom.mhPasscode.placeholder = state.room.hasPasscode
        ? "Leave blank to keep current passcode"
        : "e.g. 1402 (leave blank for open PIN)";
    }
    if (dom.mhClearPasscodeWrap) {
      dom.mhClearPasscodeWrap.hidden = !(isEditMode && state.room.hasPasscode);
    }
    if (dom.mhClearPasscode) dom.mhClearPasscode.checked = false;

    if (dom.mhLimitNotice) {
      dom.mhLimitNotice.hidden = !limitNotice;
      if (limitNotice && dom.mhLimitNoticeText) {
        dom.mhLimitNoticeText.textContent = limitNotice;
      }
    }

    const ngn = Number(state.paymentsConfig.heirloomPriceNgn || 5000).toLocaleString("en-NG");
    const usd = Number(state.paymentsConfig.heirloomPriceUsd || 7);
    if (dom.mhPriceSummary) dom.mhPriceSummary.textContent = `\u20a6${ngn} / $${usd} one-time`;
    if (dom.mhPaystackPrice) dom.mhPaystackPrice.textContent = `\u20a6${ngn}`;
    if (dom.mhFlutterwavePrice) dom.mhFlutterwavePrice.textContent = `\u20a6${ngn}`;
    if (dom.mhMorPrice) dom.mhMorPrice.textContent = `$${usd} USD`;

    if (dom.mhModalTitle) {
      dom.mhModalTitle.textContent = isEditMode
        ? "Edit Heirloom Details"
        : "Unlock Heirloom Edition";
    }
    if (dom.mhModalSubtitle) {
      dom.mhModalSubtitle.textContent = isEditMode
        ? "Update your custom partner names, whispered nicknames, Hero portrait, 4-digit passcode, or Proposal Question."
        : 'Personalize your museum with your real names, whispered nicknames, custom Hero "O" portrait, unlimited memories, optional passcode lock, and an interactive Proposal Link.';
    }
    if (dom.mhPaymentSection) dom.mhPaymentSection.hidden = isEditMode;
    if (dom.mhSandboxBtn) dom.mhSandboxBtn.hidden = isEditMode;
    if (dom.mhCompletePaymentBtn) {
      dom.mhCompletePaymentBtn.textContent = isEditMode
        ? "Save Heirloom Settings"
        : "Complete Payment & Unlock Heirloom";
    }

    dom.museumHeirloomForm.hidden = false;
    if (dom.mhUnlockedPanel) dom.mhUnlockedPanel.hidden = true;
    updateSelectedPaymentRailUI();

    dom.museumHeirloomModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeHeirloomModal() {
    if (!dom.museumHeirloomModal) return;
    dom.museumHeirloomModal.hidden = true;
    state.pendingMemoryAfterUnlock = null;
    document.body.style.overflow = "";
  }

  function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function collectHeirloomFormConfig() {
    const partner1Name = dom.mhPartner1Name?.value.trim() || "";
    const partner1Nickname = dom.mhPartner1Nickname?.value.trim() || "";
    const partner2Name = dom.mhPartner2Name?.value.trim() || "";
    const partner2Nickname = dom.mhPartner2Nickname?.value.trim() || "";
    const proposalPrompt =
      dom.mhProposalPrompt?.value.trim() ||
      "Will you accept Our Love Museum and step inside every memory we have kept?";
    const heroCameoUrl =
      dom.mhCameoUrl?.value.trim() || state.pendingCameoDataUrl || "";
    const rawPasscode = dom.mhPasscode?.value.trim() || "";
    const clearPasscode = Boolean(dom.mhClearPasscode?.checked);

    if (!partner1Name || !partner2Name) {
      return { error: "Please enter both Partner 1 and Partner 2 names." };
    }
    if (rawPasscode && !/^\d{4}$/.test(rawPasscode)) {
      return { error: "Passcode must be exactly 4 digits (or leave blank)." };
    }

    const config = {
      partner1Name,
      partner1Nickname,
      partner2Name,
      partner2Nickname,
      heroCameoUrl,
      proposalPrompt,
    };

    if (clearPasscode) {
      config.viewerPasscode = "";
    } else if (rawPasscode) {
      config.viewerPasscode = rawPasscode;
    }

    return { config };
  }

  async function finalizePayment(provider, reference, heirloomConfig) {
    setHeirloomStatus("Activating Heirloom Edition...");
    let updatedRoom = null;

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: state.pin,
          provider,
          reference,
          heirloomConfig,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Payment activation failed.");
      }
      updatedRoom = json.museum || null;
    } catch (err) {
      if (String(err.message || "").includes("Payment activation failed")) {
        setHeirloomStatus(err.message);
        return;
      }
      // Static / offline fallback
      updatedRoom = {
        ...state.room,
        isHeirloom: true,
        paymentProvider: provider,
        paymentRef: reference,
        partner1: {
          id: state.room.partner1?.id || "Him",
          name: heirloomConfig.partner1Name,
          nickname: heirloomConfig.partner1Nickname,
        },
        partner2: {
          id: state.room.partner2?.id || "Her",
          name: heirloomConfig.partner2Name,
          nickname: heirloomConfig.partner2Nickname,
        },
        heroCameoUrl: heirloomConfig.heroCameoUrl || "",
        proposalPrompt: heirloomConfig.proposalPrompt,
        viewerPasscode:
          heirloomConfig.viewerPasscode !== undefined
            ? heirloomConfig.viewerPasscode
            : state.room.viewerPasscode,
        hasPasscode: Boolean(
          heirloomConfig.viewerPasscode !== undefined
            ? heirloomConfig.viewerPasscode
            : state.room.hasPasscode
        ),
        artifacts: state.artifacts,
      };
    }

    if (heirloomConfig.viewerPasscode) {
      state.passcode = heirloomConfig.viewerPasscode;
    } else if (heirloomConfig.viewerPasscode === "") {
      state.passcode = "";
    }

    if (updatedRoom) {
      applyRoomPayload(updatedRoom);
    } else {
      state.room.isHeirloom = true;
    }

    if (state.pendingMemoryAfterUnlock) {
      const queued = {
        ...state.pendingMemoryAfterUnlock,
        curator: mapCuratorForActiveEdition(state.pendingMemoryAfterUnlock.curator),
      };
      state.pendingMemoryAfterUnlock = null;
      await persistArtifacts([...state.artifacts, queued]);
    }

    applyEditionUI();
    startNicknameWhisperTimer();
    renderAll();
    observeReveals();
    scheduleStringRedraw();

    const proposalUrl = getProposalUrl();
    if (dom.museumHeirloomForm) dom.museumHeirloomForm.hidden = true;
    if (dom.mhLimitNotice) dom.mhLimitNotice.hidden = true;
    if (dom.mhUnlockedPanel) dom.mhUnlockedPanel.hidden = false;
    if (dom.mhProposalLinkInput) dom.mhProposalLinkInput.value = proposalUrl;
    if (dom.mhOpenProposalLink) dom.mhOpenProposalLink.href = proposalUrl;
    setHeirloomStatus("");
  }

  async function saveHeirloomEdits(heirloomConfig) {
    setHeirloomStatus("Saving Heirloom details...");
    try {
      const res = await fetch(`/api/museums?pin=${encodeURIComponent(state.pin)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heirloomConfig),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Could not update Heirloom details.");
      }
      if (json.museum) {
        applyRoomPayload(json.museum);
      }
    } catch (_) {
      const existing = readLocalPublicRooms()[state.pin] || {};
      const updatedOffline = {
        ...existing,
        ...state.room,
        partner1: {
          id: state.room.partner1?.id || "Him",
          name: heirloomConfig.partner1Name,
          nickname: heirloomConfig.partner1Nickname,
        },
        partner2: {
          id: state.room.partner2?.id || "Her",
          name: heirloomConfig.partner2Name,
          nickname: heirloomConfig.partner2Nickname,
        },
        heroCameoUrl: heirloomConfig.heroCameoUrl || "",
        proposalPrompt: heirloomConfig.proposalPrompt,
        hasPasscode:
          heirloomConfig.viewerPasscode !== undefined
            ? Boolean(heirloomConfig.viewerPasscode)
            : state.room.hasPasscode,
        artifacts: state.artifacts,
      };
      applyRoomPayload(updatedOffline);
    }

    if (heirloomConfig.viewerPasscode) {
      state.passcode = heirloomConfig.viewerPasscode;
    } else if (heirloomConfig.viewerPasscode === "") {
      state.passcode = "";
    }

    applyEditionUI();
    startNicknameWhisperTimer();
    renderAll();
    observeReveals();
    scheduleStringRedraw();
    closeHeirloomModal();
  }

  async function triggerHeirloomCheckout({ forceSandbox = false } = {}) {
    if (!dom.museumHeirloomForm?.reportValidity()) return;
    const { config, error } = collectHeirloomFormConfig();
    if (error) {
      setHeirloomStatus(error);
      return;
    }

    if (state.room.isHeirloom) {
      await saveHeirloomEdits(config);
      return;
    }

    const selectedRadio = dom.mhPaymentRails?.querySelector('input[name="mh-payment-rail"]:checked');
    const provider = forceSandbox ? "sandbox" : selectedRadio?.value || "paystack";

    await refreshServerConfig();
    const payments = state.paymentsConfig || {};

    if (forceSandbox) {
      const ref = `DEMO-SANDBOX-${Date.now()}`;
      await finalizePayment("sandbox", ref, config);
      return;
    }

    if (provider === "paystack" && payments.paystackPublicKey) {
      try {
        setHeirloomStatus("Opening Paystack checkout...");
        await loadExternalScript("https://js.paystack.co/v1/inline.js");
        if (window.PaystackPop) {
          const ref = `LOVE-${state.pin}-${Date.now()}`;
          const handler = window.PaystackPop.setup({
            key: payments.paystackPublicKey,
            email: "couples@museumofus.app",
            amount: Number(payments.heirloomPriceNgn || 5000) * 100,
            currency: "NGN",
            ref,
            callback: (response) => {
              finalizePayment("paystack", response?.reference || ref, config);
            },
            onClose: () => {
              setHeirloomStatus("Checkout closed. Complete payment or use Sandbox Test Unlock.");
            },
          });
          handler.openIframe();
          return;
        }
      } catch (_) {
        // Fall through to sandbox fallback if Paystack script is blocked
      }
    }

    if (provider === "flutterwave" && payments.flutterwavePublicKey) {
      try {
        setHeirloomStatus("Opening Flutterwave checkout...");
        await loadExternalScript("https://checkout.flutterwave.com/v3.js");
        if (typeof window.FlutterwaveCheckout === "function") {
          const txRef = `FLW-${state.pin}-${Date.now()}`;
          window.FlutterwaveCheckout({
            public_key: payments.flutterwavePublicKey,
            tx_ref: txRef,
            amount: Number(payments.heirloomPriceNgn || 5000),
            currency: "NGN",
            customer: {
              email: "couples@museumofus.app",
              name: `${config.partner1Name} & ${config.partner2Name}`,
            },
            callback: (resp) => {
              finalizePayment("flutterwave", resp?.tx_ref || txRef, config);
            },
            onclose: () => {
              setHeirloomStatus("Checkout closed. Complete payment or use Sandbox Test Unlock.");
            },
          });
          return;
        }
      } catch (_) {
        // Fall through to sandbox fallback
      }
    }

    if (provider === "mor" && payments.morCheckoutUrl) {
      const sep = payments.morCheckoutUrl.includes("?") ? "&" : "?";
      const morUrl = `${payments.morCheckoutUrl}${sep}checkout[custom][pin]=${encodeURIComponent(state.pin)}`;
      window.open(morUrl, "_blank", "noopener");
      setHeirloomStatus(
        "International checkout opened in a new tab. For local preview, click Sandbox Test Unlock."
      );
      return;
    }

    // Sandbox / Demo mode (default when no live public keys are configured)
    const demoRef = `DEMO-${provider.toUpperCase()}-${Date.now()}`;
    await finalizePayment(provider, demoRef, config);
  }

  /* ------------------------------------------------------------------------
     LACE DISPLAY CASE LIGHTBOX
     ------------------------------------------------------------------------ */
  function openLightbox(artifactId) {
    const item = state.artifacts.find((a) => a.id === artifactId);
    if (!item || !dom.lightboxModal) return;

    state.activeLightboxId = item.id;
    if (dom.lightboxLaceMount) {
      dom.lightboxLaceMount.innerHTML = "";
      const style =
        item.frameStyle === "Oval Lace Cameo" ? "Oval Lace Cameo" : "Rectangular Lace Frame";
      dom.lightboxLaceMount.appendChild(createLaceDisplayElement(item, style));
    }

    if (dom.lightboxCurator) {
      dom.lightboxCurator.innerHTML = `Curated by ${renderCuratorNameHtml(item.curator)}`;
    }
    if (dom.lightboxTitle) dom.lightboxTitle.textContent = item.title;
    if (dom.lightboxDate) dom.lightboxDate.textContent = item.date;
    if (dom.lightboxWing) dom.lightboxWing.textContent = item.wing;
    if (dom.lightboxStory) dom.lightboxStory.textContent = item.story;

    if (dom.lightboxSecretBox) {
      if (item.secretNote) {
        dom.lightboxSecretBox.hidden = false;
        if (dom.lightboxSecretText) {
          dom.lightboxSecretText.hidden = true;
          dom.lightboxSecretText.textContent = `"${item.secretNote}"`;
        }
        if (dom.lightboxSecretToggle) {
          dom.lightboxSecretToggle.textContent = "\u273f Unseal Secret Note on Back";
        }
      } else {
        dom.lightboxSecretBox.hidden = true;
      }
    }

    if (dom.lightboxFeatureBtn) {
      dom.lightboxFeatureBtn.textContent = item.featured
        ? "Unpin from Lace Showcase"
        : "Feature in Lace Showcase";
    }

    dom.lightboxModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!dom.lightboxModal) return;
    dom.lightboxModal.hidden = true;
    state.activeLightboxId = null;
    document.body.style.overflow = "";
  }

  /* ------------------------------------------------------------------------
     GALLERY WINGS / CATEGORIES EDITOR MODAL
     ------------------------------------------------------------------------ */
  let draftWingsState = [];

  function setWingsStatus(message) {
    if (dom.wingsStatusMsg) dom.wingsStatusMsg.textContent = message || "";
  }

  function syncDraftWingsFromDom() {
    if (!dom.wingsEditorList) return;
    const rows = Array.from(dom.wingsEditorList.querySelectorAll(".wing-editor-row"));
    draftWingsState = rows.map((row) => ({
      original: row.dataset.originalWing || "",
      label: row.querySelector(".wing-editor-input")?.value ?? "",
    }));
  }

  function renderWingsEditorRows() {
    if (!dom.wingsEditorList) return;
    const canRemove = draftWingsState.length > 1;
    dom.wingsEditorList.innerHTML = draftWingsState
      .map(
        (entry, idx) => `
          <div class="wing-editor-row" data-original-wing="${escapeAttr(entry.original)}">
            <span class="wing-editor-badge" aria-hidden="true">${idx + 1}</span>
            <input
              type="text"
              class="field-input wing-editor-input"
              maxlength="48"
              value="${escapeAttr(entry.label)}"
              placeholder="e.g. Travel & Spontaneous Dates"
              aria-label="Wing category ${idx + 1}"
              required
            />
            <button
              type="button"
              class="wing-remove-btn"
              data-remove-wing="${idx}"
              aria-label="Remove wing ${idx + 1}"
              title="Remove category"
              ${canRemove ? "" : "disabled"}
            >&times;</button>
          </div>`
      )
      .join("");

    if (dom.addWingRowBtn) {
      dom.addWingRowBtn.disabled = draftWingsState.length >= 8;
    }
    if (dom.wingsCountHint) {
      dom.wingsCountHint.textContent = `${draftWingsState.length} of 8 categories`;
    }
  }

  function openWingsModal() {
    if (!dom.wingsModal) return;
    setWingsStatus("");
    const currentWings = sanitizeWings(state.room.wings);
    draftWingsState = currentWings.map((label) => ({
      original: label,
      label,
    }));
    renderWingsEditorRows();
    dom.wingsModal.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      dom.wingsEditorList?.querySelector(".wing-editor-input")?.focus();
    }, 60);
  }

  function closeWingsModal() {
    if (!dom.wingsModal) return;
    dom.wingsModal.hidden = true;
    document.body.style.overflow = "";
  }

  async function handleWingsSubmit(event) {
    event.preventDefault();
    syncDraftWingsFromDom();

    const nextWings = [];
    const seen = new Set();
    const wingRenames = {};

    for (const entry of draftWingsState) {
      const cleaned = String(entry.label || "").trim().slice(0, 48);
      if (!cleaned) continue;
      const lower = cleaned.toLowerCase();
      if (seen.has(lower)) {
        setWingsStatus(`Duplicate wing "${cleaned}". Keep each category unique.`);
        return;
      }
      seen.add(lower);
      nextWings.push(cleaned);
      if (entry.original && entry.original !== cleaned) {
        wingRenames[entry.original] = cleaned;
      }
    }

    if (nextWings.length === 0) {
      setWingsStatus("Keep at least 1 wing category.");
      return;
    }

    setWingsStatus("Saving categories...");
    let savedRoom = null;

    try {
      const res = await fetch(`/api/museums?pin=${encodeURIComponent(state.pin)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wings: nextWings,
          wingRenames,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        savedRoom = data?.museum || null;
      } else {
        const err = await res.json().catch(() => ({}));
        setWingsStatus(err?.error || "Could not save gallery wings.");
        return;
      }
    } catch (_) {
      // Offline / static fallback
    }

    if (state.wingFilter !== "All") {
      if (wingRenames[state.wingFilter]) {
        state.wingFilter = wingRenames[state.wingFilter];
      } else if (!nextWings.includes(state.wingFilter)) {
        state.wingFilter = "All";
      }
    }

    if (savedRoom) {
      applyRoomPayload(savedRoom);
    } else {
      state.room.wings = nextWings;
      if (Object.keys(wingRenames).length > 0) {
        state.artifacts = state.artifacts.map((art) => ({
          ...art,
          wing: wingRenames[art.wing] || art.wing,
        }));
      }
      syncLocalStorage();
    }

    renderWingControls();
    renderAll();
    closeWingsModal();
  }

  /* ------------------------------------------------------------------------
     FILTERING & NAVIGATION WIRING
     ------------------------------------------------------------------------ */
  function setWingFilter(wing) {
    state.wingFilter = wing;
    document.querySelectorAll("#wing-filter-group .filter-chip").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.wing === wing);
    });
    renderSlantedGallery();
  }

  function setCuratorFilter(curator) {
    state.curatorFilter = curator;
    document.querySelectorAll("#curator-filter-group .filter-chip").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.curator === curator);
    });
    renderSlantedGallery();
  }

  function wireEventListeners() {
    // Active PIN Share Badge Copy Link
    dom.activePinBadge?.addEventListener("click", async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?pin=${encodeURIComponent(state.pin)}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (dom.navPinCode) {
          const orig = dom.navPinCode.textContent;
          dom.navPinCode.textContent = "Copied Link!";
          window.setTimeout(() => {
            if (dom.navPinCode) dom.navPinCode.textContent = orig;
          }, 1800);
        }
      } catch (_) {
        window.prompt("Share this private link with your partner:", shareUrl);
      }
    });

    // Floating Love Letters Popover
    document.querySelectorAll(".floating-letter").forEach((letterBtn) => {
      letterBtn.addEventListener("click", () => {
        if (!dom.notePopover) return;
        if (dom.popoverKicker) {
          dom.popoverKicker.textContent = letterBtn.dataset.noteTitle || "UNSEALED LETTER";
        }
        if (dom.popoverText) {
          dom.popoverText.textContent = letterBtn.dataset.noteBody || "";
        }
        dom.notePopover.hidden = false;
      });
    });

    dom.closeNotePopover?.addEventListener("click", () => {
      if (dom.notePopover) dom.notePopover.hidden = true;
    });

    // Gallery Filter Chips (delegated so dynamically edited wings work immediately)
    dom.wingFilterGroup?.addEventListener("click", (e) => {
      const editBtn = e.target.closest("#open-wings-modal-btn");
      if (editBtn) {
        openWingsModal();
        return;
      }
      const chip = e.target.closest(".filter-chip[data-wing]");
      if (chip) {
        setWingFilter(chip.dataset.wing || "All");
      }
    });

    // Wings Category Editor Modal
    dom.closeWingsModal?.addEventListener("click", closeWingsModal);
    dom.cancelWingsBtn?.addEventListener("click", closeWingsModal);
    dom.wingsModal?.addEventListener("click", (e) => {
      if (e.target === dom.wingsModal) closeWingsModal();
    });
    dom.addWingRowBtn?.addEventListener("click", () => {
      syncDraftWingsFromDom();
      if (draftWingsState.length >= 8) return;
      draftWingsState.push({ original: "", label: "" });
      renderWingsEditorRows();
      const inputs = dom.wingsEditorList?.querySelectorAll(".wing-editor-input");
      inputs?.[inputs.length - 1]?.focus();
    });
    dom.wingsEditorList?.addEventListener("click", (e) => {
      const removeBtn = e.target.closest("[data-remove-wing]");
      if (!removeBtn) return;
      syncDraftWingsFromDom();
      if (draftWingsState.length <= 1) return;
      const idx = Number(removeBtn.dataset.removeWing);
      if (Number.isInteger(idx) && idx >= 0 && idx < draftWingsState.length) {
        draftWingsState.splice(idx, 1);
        renderWingsEditorRows();
      }
    });
    dom.wingsForm?.addEventListener("submit", handleWingsSubmit);

    document.querySelectorAll("#curator-filter-group .filter-chip").forEach((btn) => {
      btn.addEventListener("click", () => setCuratorFilter(btn.dataset.curator || "All"));
    });

    dom.resetFiltersBtn?.addEventListener("click", () => {
      setWingFilter("All");
      setCuratorFilter("All");
    });

    // Open Curate Modal Triggers
    [
      "open-curate-nav",
      "open-curate-hero",
      "open-curate-gallery",
      "terminal-add-tag",
      "open-curate-footer",
    ].forEach((id) => {
      document.getElementById(id)?.addEventListener("click", () => openCurateModal());
    });

    // Curate Modal Close & Form
    dom.closeCurateModal?.addEventListener("click", closeCurateModal);
    dom.cancelCurateBtn?.addEventListener("click", closeCurateModal);
    dom.curateModal?.addEventListener("click", (e) => {
      if (e.target === dom.curateModal) closeCurateModal();
    });

    dom.imageFileInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) processUploadedFile(file);
    });

    dom.imageDropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      dom.imageDropzone.classList.add("is-dragover");
    });

    dom.imageDropzone?.addEventListener("dragleave", () => {
      dom.imageDropzone.classList.remove("is-dragover");
    });

    dom.imageDropzone?.addEventListener("drop", (e) => {
      e.preventDefault();
      dom.imageDropzone.classList.remove("is-dragover");
      const file = e.dataTransfer?.files?.[0];
      if (file) processUploadedFile(file);
    });

    dom.imageUrlInput?.addEventListener("input", () => {
      const val = dom.imageUrlInput.value.trim();
      if (val) {
        setModalPreview(val);
      } else if (!state.pendingImageDataUrl) {
        setModalPreview("");
      }
    });

    dom.artifactForm?.addEventListener("submit", handleFormSubmit);

    // Lightbox Controls
    dom.closeLightboxModal?.addEventListener("click", closeLightbox);
    dom.lightboxModal?.addEventListener("click", (e) => {
      if (e.target === dom.lightboxModal) closeLightbox();
    });

    dom.lightboxSecretToggle?.addEventListener("click", () => {
      if (!dom.lightboxSecretText || !dom.lightboxSecretToggle) return;
      const willShow = dom.lightboxSecretText.hidden;
      dom.lightboxSecretText.hidden = !willShow;
      dom.lightboxSecretToggle.textContent = willShow
        ? "\u273f Fold Secret Note"
        : "\u273f Unseal Secret Note on Back";
    });

    dom.lightboxEditBtn?.addEventListener("click", () => {
      const id = state.activeLightboxId;
      closeLightbox();
      if (id) openCurateModal(id);
    });

    dom.lightboxFeatureBtn?.addEventListener("click", async () => {
      const idx = state.artifacts.findIndex((a) => a.id === state.activeLightboxId);
      if (idx === -1) return;
      const nextArtifacts = structuredClone(state.artifacts);
      nextArtifacts[idx].featured = !nextArtifacts[idx].featured;
      const res = await persistArtifacts(nextArtifacts);
      if (!res.ok) {
        window.alert(res.message || "Could not update showcase state.");
        return;
      }
      renderAll();
      dom.lightboxFeatureBtn.textContent = nextArtifacts[idx].featured
        ? "Unpin from Lace Showcase"
        : "Feature in Lace Showcase";
    });

    dom.lightboxDeleteBtn?.addEventListener("click", () => {
      if (state.activeLightboxId) {
        deleteArtifact(state.activeLightboxId);
      }
    });

    // Passcode Modal Submission
    dom.passcodeForm?.addEventListener("submit", handlePasscodeSubmit);

    // Heirloom Upgrade, Edit & Proposal Link Controls
    dom.openHeirloomBtn?.addEventListener("click", () => openHeirloomModal());
    dom.vaultUnlockHeirloomBtn?.addEventListener("click", () => openHeirloomModal());
    dom.vaultEditHeirloomBtn?.addEventListener("click", () => openHeirloomModal());

    dom.copyProposalLinkBtn?.addEventListener("click", async () => {
      const proposalUrl = getProposalUrl();
      try {
        await navigator.clipboard.writeText(proposalUrl);
        const orig = dom.copyProposalLinkBtn.textContent;
        dom.copyProposalLinkBtn.textContent = "Copied Proposal Link!";
        window.setTimeout(() => {
          if (dom.copyProposalLinkBtn) dom.copyProposalLinkBtn.textContent = orig;
        }, 1800);
      } catch (_) {
        window.prompt("Share this interactive Proposal Link:", proposalUrl);
      }
    });

    dom.closeHeirloomModal?.addEventListener("click", closeHeirloomModal);
    dom.cancelHeirloomBtn?.addEventListener("click", closeHeirloomModal);
    dom.mhDoneBtn?.addEventListener("click", closeHeirloomModal);
    dom.museumHeirloomModal?.addEventListener("click", (e) => {
      if (e.target === dom.museumHeirloomModal) closeHeirloomModal();
    });

    dom.mhCameoFile?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) processCameoFile(file);
    });

    dom.mhCameoDropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      dom.mhCameoDropzone.classList.add("is-dragover");
    });

    dom.mhCameoDropzone?.addEventListener("dragleave", () => {
      dom.mhCameoDropzone.classList.remove("is-dragover");
    });

    dom.mhCameoDropzone?.addEventListener("drop", (e) => {
      e.preventDefault();
      dom.mhCameoDropzone.classList.remove("is-dragover");
      const file = e.dataTransfer?.files?.[0];
      if (file) processCameoFile(file);
    });

    dom.mhCameoUrl?.addEventListener("input", () => {
      const val = dom.mhCameoUrl.value.trim();
      if (val) {
        setCameoPreview(val);
      } else if (!state.pendingCameoDataUrl) {
        setCameoPreview("");
      } else {
        setCameoPreview(state.pendingCameoDataUrl);
      }
    });

    dom.mhPaymentRails?.addEventListener("change", updateSelectedPaymentRailUI);

    dom.museumHeirloomForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      triggerHeirloomCheckout({ forceSandbox: false });
    });

    dom.mhSandboxBtn?.addEventListener("click", () => {
      triggerHeirloomCheckout({ forceSandbox: true });
    });

    dom.mhCopyProposalBtn?.addEventListener("click", async () => {
      const text = dom.mhProposalLinkInput?.value || getProposalUrl();
      try {
        await navigator.clipboard.writeText(text);
        const orig = dom.mhCopyProposalBtn.textContent;
        dom.mhCopyProposalBtn.textContent = "Copied!";
        window.setTimeout(() => {
          if (dom.mhCopyProposalBtn) dom.mhCopyProposalBtn.textContent = orig;
        }, 1600);
      } catch (_) {
        window.prompt("Copy this interactive Proposal Link:", text);
      }
    });

    // Archive Export / Import / Reset
    dom.exportArchiveBtn?.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.artifacts, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `museum-of-us-${state.pin.toLowerCase()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });

    dom.importArchiveInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) throw new Error("Invalid archive format");
        const nextArtifacts = normalizeArtifactsForEdition(imported);
        const res = await persistArtifacts(nextArtifacts);
        if (res.heirloomRequired) {
          openHeirloomModal({ limitNotice: res.message });
          return;
        }
        if (!res.ok) {
          throw new Error(res.message || "Could not import archive.");
        }
        renderAll();
      } catch (err) {
        window.alert(`Could not import archive: ${err.message}`);
      } finally {
        e.target.value = "";
      }
    });

    // Escape closes active modals (never bypass locked passcode overlay)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (dom.curateModal && !dom.curateModal.hidden) closeCurateModal();
        if (dom.wingsModal && !dom.wingsModal.hidden) closeWingsModal();
        if (dom.lightboxModal && !dom.lightboxModal.hidden) closeLightbox();
        if (dom.museumHeirloomModal && !dom.museumHeirloomModal.hidden) closeHeirloomModal();
        if (dom.notePopover && !dom.notePopover.hidden) dom.notePopover.hidden = true;
      }
    });

    // Scroll, Resize & Mobile Orientation Change
    window.addEventListener("scroll", handleScrollEffects, { passive: true });
    window.addEventListener("resize", scheduleStringRedraw);
    window.addEventListener("orientationchange", () => {
      window.setTimeout(scheduleStringRedraw, 140);
    });
    if ("ResizeObserver" in window && dom.stringGalleryStage) {
      const stageObserver = new ResizeObserver(scheduleStringRedraw);
      stageObserver.observe(dom.stringGalleryStage);
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleStringRedraw);
    }
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

  async function init() {
    wireEventListeners();
    const ok = await resolveEditionAndLoadRoom();
    if (ok === false) return;
    applyEditionUI();
    initNicknameInteractions();
    if (state.passcodeLocked) {
      openPasscodeModal();
      return;
    }
    renderAll();
    observeReveals();
    scheduleStringRedraw();
  }

  init();
})();
