/*
  app.js — Monthly Receipt

  Reads QUESTIONS / MAXLEN from questions.js and STICKERS from stickers.js
  (loaded before this file — see index.html). Everything else lives here:

    1. Storage        — load/save one month's answers + sticker layout
    2. Elements        — cached DOM refs
    3. Month picker    — every month that's ever been saved, plus today's
    4. Form            — renders the question cards, tracks progress
    5. Receipt model   — turns answers into printable line items
    6. Receipt render  — builds the receipt DOM from that model
    7. Stickers        — drag / resize+rotate / delete, and the tray
    8. PNG export       — repaints the same content onto a canvas to save
    9. Theme            — light/dark toggle, remembered per device
   10. Views + wiring   — home / form / receipt screens
*/
(function () {
  "use strict";

  /* =========================================================================
     1. STORAGE — one localStorage entry per calendar month
     ========================================================================= */
  const storageKey = (month) => "monthly-receipt:" + month;

  const monthKey = (date) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

  const MONTH_NAMES = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  function blankMonth() {
    return { answers: {}, total: "", stickers: [], seq: 0 };
  }

  function loadMonth(month) {
    try {
      const raw = localStorage.getItem(storageKey(month));
      return raw ? Object.assign(blankMonth(), JSON.parse(raw)) : blankMonth();
    } catch (e) {
      return blankMonth();
    }
  }

  // The month a receipt is for is decided once, when it's created, and is
  // literally its storage key — so it can't drift if someone starts on the
  // 31st and finishes on the 1st. Defaults to the real current month; the
  // home screen lets you point at an earlier one instead.
  let currentMonth = monthKey(new Date());
  let state = loadMonth(currentMonth);

  function saveMonth() {
    try {
      localStorage.setItem(storageKey(currentMonth), JSON.stringify(state));
    } catch (e) {
      showToast("Couldn't save — storage full");
    }
  }

  // Your name and handle aren't facts about a particular month, so they're
  // stored once for the device rather than per-receipt — type them the
  // first time, and every later month is already filled in.
  const IDENTITY_KEY = "monthly-receipt:identity";

  function loadIdentity() {
    try {
      return Object.assign({ name: "", handle: "" },
                           JSON.parse(localStorage.getItem(IDENTITY_KEY)) || {});
    } catch (e) {
      return { name: "", handle: "" };
    }
  }

  let identity = loadIdentity();

  function saveIdentity() {
    try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity)); } catch (e) { /* ignore */ }
  }

  /* =========================================================================
     2. ELEMENTS
     ========================================================================= */
  const $ = (id) => document.getElementById(id);

  const qlist = $("qlist");
  const meter = $("meter");
  const meterLabel = $("meterLabel");
  const stage = $("stage");
  const receiptEl = $("receipt");
  const viewHome = $("viewHome");
  const viewForm = $("viewForm");
  const viewLoading = $("viewLoading");
  const viewReceipt = $("viewReceipt");
  const dockForm = $("dockForm");
  const dockReceipt = $("dockReceipt");
  const tray = $("tray");
  const headerBack = $("btnHeaderBack");

  /* =========================================================================
     3. MONTH PICKER — Jan–Dec of the current year, in the header
     ========================================================================= */
  // Just the 12 calendar months of this year, Jan through Dec — plain month
  // names, no year suffix needed since there's only ever one year on offer.
  function savedMonths() {
    const year = new Date().getFullYear();
    const months = [];
    for (let mo = 1; mo <= 12; mo++) {
      months.push(year + "-" + String(mo).padStart(2, "0"));
    }
    return months;
  }

  const monthSelect = $("monthPick");

  function refreshMonthPicker() {
    monthSelect.innerHTML = "";
    savedMonths().forEach((key) => {
      const [, mo] = key.split("-").map(Number);
      const option = document.createElement("option");
      option.value = key;
      option.textContent = MONTH_NAMES[mo - 1];
      monthSelect.appendChild(option);
    });
    monthSelect.value = currentMonth;
  }

  refreshMonthPicker();
  monthSelect.addEventListener("change", () => {
    currentMonth = monthSelect.value;
    state = loadMonth(currentMonth);
    renderForm();
    showForm();
  });

  /* =========================================================================
     4. FORM
     ========================================================================= */
  $("maxlenNote").textContent = "(" + MAXLEN + " characters each)";

  function renderForm() {
    qlist.innerHTML = "";
    QUESTIONS.forEach((q) => qlist.append(renderQuestionCard(q)));
    updateProgress();
  }

  // One compact row per question: the receipt label on the left, the input
  // on the right. The longer `prompt` wording isn't shown as its own line
  // (that doubled every row's height and pushed the form off-screen) — it
  // lives on as the field's accessible name and its tooltip instead.
  function renderQuestionCard(q) {
    const card = document.createElement("div");
    card.className = "q";
    card.title = q.prompt;

    const tag = document.createElement("span");
    tag.className = "q-tag";
    tag.textContent = q.label;
    card.append(tag);

    card.append(q.type === "pick" ? renderPickField(q, card) : renderTextField(q, card));

    card.classList.toggle("filled", !!String(state.answers[q.key] || "").trim());
    return card;
  }

  function renderPickField(q, card) {
    const chips = document.createElement("div");
    chips.className = "chips";
    q.options.forEach((option) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = option;
      chip.setAttribute("aria-pressed", String(state.answers[q.key] === option));
      chip.addEventListener("click", () => {
        state.answers[q.key] = state.answers[q.key] === option ? "" : option;
        saveMonth();
        renderForm();
      });
      chips.append(chip);
    });
    return chips;
  }

  function renderTextField(q, card) {
    const input = document.createElement("input");
    input.type = q.type === "num" ? "number" : "text";
    if (q.type === "num") {
      input.inputMode = "numeric";
      input.min = "0";
      input.max = "999";
    } else {
      input.maxLength = MAXLEN;
    }
    input.placeholder = q.ph || "";
    input.value = state.answers[q.key] || "";
    input.setAttribute("aria-label", q.prompt);

    input.addEventListener("input", () => {
      state.answers[q.key] = input.value;
      card.classList.toggle("filled", !!input.value.trim());
      updateProgress();
      saveMonth();
    });

    return input;
  }


  function answeredCount() {
    return QUESTIONS.filter((q) => String(state.answers[q.key] || "").trim()).length;
  }

  function updateProgress() {
    const n = answeredCount();
    meter.innerHTML = "";
    for (let i = 0; i < QUESTIONS.length; i++) {
      const bar = document.createElement("i");
      if (i < n) bar.className = "on";
      meter.append(bar);
    }
    meterLabel.textContent = n + " of " + QUESTIONS.length + " lines";
  }

  /* ---- identity: name + handle, shared across every month ---- */
  const idName = $("idName");
  const idHandle = $("idHandle");
  const formMonth = $("formMonth");

  function monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    return "MONTH OF " + MONTH_NAMES[m - 1] + ", " + y;
  }

  function syncIdentityFields() {
    idName.value = identity.name;
    idHandle.value = identity.handle;
    idName.classList.toggle("filled", !!identity.name.trim());
    idHandle.classList.toggle("filled", !!identity.handle.trim());
    formMonth.textContent = monthLabel(currentMonth);
  }

  idName.addEventListener("input", () => {
    identity.name = idName.value;
    idName.classList.toggle("filled", !!idName.value.trim());
    saveIdentity();
  });
  idHandle.addEventListener("input", () => {
    identity.handle = idHandle.value;
    idHandle.classList.toggle("filled", !!idHandle.value.trim());
    saveIdentity();
  });

  /* =========================================================================
     5. RECEIPT MODEL — answers → the exact blocks on the reference receipt
     ========================================================================= */
  function receiptModel() {
    // every question prints a line, answered or not — a blank one just
    // shows "LABEL:" with nothing after it (matches the reference exactly).
    // The bottom-pinned question gets pulled out to its own spot instead
    // of a normal inline row.
    const rows = QUESTIONS
      .filter((q) => q.display !== "bottom")
      .map((q) => {
        const raw = String(state.answers[q.key] || "").trim();
        return { label: q.label, value: raw ? (raw + (q.suffix || "")).toUpperCase() : "" };
      });

    // one question can opt into being the very last line instead of an
    // inline row wherever it falls in the list — see questions.js. Falls
    // back to the cardholder's name if nothing's flagged.
    const bottomQ = QUESTIONS.find((q) => q.display === "bottom");
    let bottomRow;
    if (bottomQ) {
      const raw = String(state.answers[bottomQ.key] || "").trim();
      bottomRow = { label: bottomQ.label, value: raw ? (raw + (bottomQ.suffix || "")).toUpperCase() : "" };
    } else {
      bottomRow = { label: "CARDHOLDER", value: (identity.name || NAME || "YOUR NAME").toUpperCase() };
    }

    // signed by whoever filled it in — from the fields on the form, not
    // from a per-month question (see IDENTITY_KEY above)
    const theirName = (identity.name || NAME || "YOUR NAME").toUpperCase();
    const rawHandle = identity.handle.trim();
    const theirHandle = rawHandle ? ("@" + rawHandle.replace(/^@/, "").toUpperCase()) : "";

    return {
      monthLine: monthLabel(currentMonth),
      identity: theirHandle ? theirName + "  " + theirHandle : theirName,
      rows: rows,
      bottomRow: bottomRow,
      handle: HANDLE // fixed studio handle under the barcode — see questions.js
    };
  }

  /* =========================================================================
     6. RECEIPT RENDER
     The heading, "SEE YOU NEXT MONTH", and the barcode are baked into
     assets/paper.png itself (your actual Canva design) — not drawn by us.
     This only renders the parts that change: the month/name line, the
     answers, and the handle (painted over where the original art had it,
     so it stays editable instead of being someone else's baked-in text).
     ========================================================================= */
  function makeLine(className, text, align) {
    const el = document.createElement("div");
    el.className = className;
    if (text != null) el.textContent = text;
    if (align) el.dataset.px = align; // read by the PNG exporter, see section 8
    return el;
  }

  function renderReceipt() {
    const m = receiptModel();
    receiptEl.innerHTML = "";

    const content = makeLine("r-content");
    const meta = makeLine("r-meta-block");
    meta.append(makeLine("r-line", m.monthLine, "left"), makeLine("r-line", m.identity, "left"));
    // doubled here as well as at the close, so the header block is bracketed
    // by the same treatment that ends the itemised section
    content.append(meta, dashedRule(), dashedRule());

    m.rows.forEach((row) => content.append(itemRow(row)));
    // closing break is doubled — a single rule opens the itemised section,
    // two close it, the way a real receipt weights its last line heavier
    content.append(dashedRule(), dashedRule());
    content.append(itemRow(m.bottomRow));
    receiptEl.append(content);

    // sits over the patched-out area of the original art — see assets/README
    receiptEl.append(makeLine("r-handle", m.handle, "center"));

    fitReceiptContent(content);
    renderStickers();
  }

  // How much the answers wrap depends entirely on what someone typed, so a
  // fixed font-size can't promise everything stays above the baked-in
  // footer — this shrinks .r-content's font-size (see style.css, it's set
  // in em specifically so this scales every line together) until the
  // content's actual height fits in the space available for it.
  function fitReceiptContent(content) {
    // Where the answers should stop, as a fraction of the paper's height —
    // just above the baked-in "SEE YOU NEXT MONTH". Measured off
    // assets/paper.png; see assets/README.
    const CONTENT_ENDS_AT = 0.70;

    const receiptH = receiptEl.getBoundingClientRect().height;
    if (!receiptH) return;
    const topFrac = parseFloat(getComputedStyle(content).top) / receiptH; // px → fraction
    const available = receiptH * (CONTENT_ENDS_AT - topFrac);

    // Bounds as a fraction of the paper, not fixed px, so the type keeps the
    // same proportions whatever size the receipt renders at (phone, desktop,
    // 1080px export).
    let lo = receiptH * 0.010;  // floor: still legible if someone writes essays
    let hi = receiptH * 0.030;  // ceiling: big enough that even one-word
                                // answers reach CONTENT_ENDS_AT rather than
                                // stranding a gap above the footer

    // Largest size that still fits — grows short answers to fill the paper
    // instead of leaving a big empty gap above the footer, and shrinks long
    // ones so they never collide with it.
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      content.style.fontSize = mid + "px";
      if (content.scrollHeight <= available) lo = mid;
      else hi = mid;
    }
    content.style.fontSize = lo + "px";
  }

  function itemRow(row) {
    const el = makeLine("r-row", row.label + ": " + row.value, "left");
    return el;
  }

  function dashedRule() {
    const rule = makeLine("rule");
    rule.dataset.rule = "1"; // read by the PNG exporter
    return rule;
  }

  /* =========================================================================
     7. STICKERS — tray, drag/resize/rotate, delete
     ========================================================================= */
  const STICKER_BASE_PX = 82; // rendered width at scale 1

  function stickerSrc(id) {
    const entry = STICKERS.find((s) => s.id === id) || STICKERS[0];
    return entry ? entry.src : "";
  }

  // if the real PNG 404s, fall back to a placeholder tile instead of a
  // broken-image icon — see stickers.js
  function withPlaceholderFallback(img, id) {
    img.addEventListener("error", () => { img.src = placeholderSticker(id); }, { once: true });
  }

  // Most stickers aren't square. Their on-screen height only becomes known
  // once the image actually loads, so this caches naturalHeight/naturalWidth
  // per sticker id the first time we see it, and repositions any copies
  // already on the canvas — otherwise positionSticker has to *guess* the
  // height (assuming square) while the PNG export always centers on the
  // real one, and the two visibly disagree the moment a sticker isn't square.
  const stickerAspect = {};
  function noteStickerAspect(id, img) {
    if (!img.naturalWidth) return;
    const ratio = img.naturalHeight / img.naturalWidth;
    if (stickerAspect[id] === ratio) return;
    stickerAspect[id] = ratio;
    stage.querySelectorAll(".sticker").forEach((btn) => {
      const s = state.stickers.find((x) => x.uid === btn.dataset.uid);
      if (s && s.id === id) positionSticker(btn, s);
    });
  }

  let selectedSticker = null;

  function renderStickers() {
    stage.querySelectorAll(".sticker").forEach((n) => n.remove());
    state.stickers.forEach((s) => stage.append(buildStickerEl(s)));
  }

  function buildStickerEl(s) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sticker";
    btn.dataset.uid = s.uid;
    btn.style.zIndex = 5 + s.z;
    btn.setAttribute("aria-label", "Sticker " + s.id);

    const img = document.createElement("img");
    img.alt = "";
    withPlaceholderFallback(img, s.id);
    img.addEventListener("load", () => noteStickerAspect(s.id, img));
    img.src = stickerSrc(s.id);
    btn.append(img);

    const del = document.createElement("span");
    del.className = "handle h-del";
    del.textContent = "×";
    del.dataset.role = "del";
    const resize = document.createElement("span");
    resize.className = "handle h-tr";
    resize.textContent = "⤢";
    resize.dataset.role = "tr";
    btn.append(del, resize);

    positionSticker(btn, s);
    wireStickerGestures(btn, s);
    return btn;
  }

  function positionSticker(btn, s) {
    const w = stage.clientWidth, h = stage.clientHeight;
    const size = STICKER_BASE_PX * s.scale;
    // height defaults to square until the image loads and we learn its
    // real aspect ratio (see noteStickerAspect) — matches how the PNG
    // export centers it, so the two never disagree
    const height = size * (stickerAspect[s.id] || 1);
    btn.style.width = size + "px";
    btn.style.height = height + "px";
    btn.style.left = (s.x * w - size / 2) + "px";
    btn.style.top = (s.y * h - height / 2) + "px";
    btn.style.transform = "rotate(" + s.rot + "deg)";
  }

  function selectSticker(btn) {
    stage.querySelectorAll(".sticker.sel").forEach((n) => n.classList.remove("sel"));
    if (btn) btn.classList.add("sel");
    selectedSticker = btn || null;
  }

  function wireStickerGestures(btn, s) {
    let mode = null;
    let startX = 0, startY = 0, startSX = 0, startSY = 0;
    let baseDist = 0, baseAngle = 0, baseScale = 1, baseRot = 0;

    btn.addEventListener("pointerdown", (e) => {
      const role = e.target.dataset && e.target.dataset.role;

      if (role === "del") {
        e.stopPropagation();
        e.preventDefault();
        state.stickers = state.stickers.filter((x) => x.uid !== s.uid);
        btn.remove();
        selectedSticker = null;
        saveMonth();
        return;
      }

      selectSticker(btn);
      s.z = ++state.seq; // bring to front
      btn.style.zIndex = 5 + s.z;

      const stageRect = stage.getBoundingClientRect();
      const cx = stageRect.left + s.x * stageRect.width;
      const cy = stageRect.top + s.y * stageRect.height;

      if (role === "tr") {
        mode = "resize";
        baseDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
        baseAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        baseScale = s.scale;
        baseRot = s.rot;
      } else {
        mode = "move";
        startX = e.clientX; startY = e.clientY;
        startSX = s.x; startSY = s.y;
        btn.classList.add("dragging");
      }
      btn.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    btn.addEventListener("pointermove", (e) => {
      if (!mode) return;
      const stageRect = stage.getBoundingClientRect();

      if (mode === "move") {
        // stickers may sit well outside the paper — the export crops to
        // whatever they actually occupy, so overhang is a feature here
        s.x = clamp(startSX + (e.clientX - startX) / stageRect.width, -0.2, 1.2);
        s.y = clamp(startSY + (e.clientY - startY) / stageRect.height, -0.2, 1.2);
      } else {
        const cx = stageRect.left + s.x * stageRect.width;
        const cy = stageRect.top + s.y * stageRect.height;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
        s.scale = clamp(baseScale * (dist / baseDist), 0.35, 3.4);
        s.rot = baseRot + (angle - baseAngle) * 180 / Math.PI;
      }
      positionSticker(btn, s);
    });

    const endGesture = () => {
      if (!mode) return;
      mode = null;
      btn.classList.remove("dragging");
      saveMonth();
    };
    btn.addEventListener("pointerup", endGesture);
    btn.addEventListener("pointercancel", endGesture);
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  // New stickers spawn peeking over one of the receipt's edges or corners —
  // like tape or a charm hung on top of the paper, not sitting neatly inside
  // it. Reads the receipt's actual on-screen edges rather than assuming a
  // fixed height, since the receipt grows or shrinks with how many
  // questions are answered.
  function randomEdgeSpot() {
    const stageRect = stage.getBoundingClientRect();
    const r = receiptEl.getBoundingClientRect();
    const edge = {
      xMin: (r.left - stageRect.left) / stageRect.width,
      xMax: (r.right - stageRect.left) / stageRect.width,
      yMin: (r.top - stageRect.top) / stageRect.height,
      yMax: (r.bottom - stageRect.top) / stageRect.height
    };
    const jitterAlong = () => Math.random() * 0.5 + 0.25; // stay off the corners a bit
    const spots = [
      { x: edge.xMin + (edge.xMax - edge.xMin) * jitterAlong(), y: edge.yMin },              // top edge
      { x: edge.xMin + (edge.xMax - edge.xMin) * jitterAlong(), y: edge.yMax },              // bottom edge
      { x: edge.xMin, y: edge.yMin + (edge.yMax - edge.yMin) * jitterAlong() },              // left edge
      { x: edge.xMax, y: edge.yMin + (edge.yMax - edge.yMin) * jitterAlong() },              // right edge
      { x: edge.xMin, y: edge.yMin }, { x: edge.xMax, y: edge.yMin },                        // top corners
      { x: edge.xMin, y: edge.yMax }, { x: edge.xMax, y: edge.yMax }                         // bottom corners
    ];
    const spot = spots[Math.floor(Math.random() * spots.length)];
    return {
      x: clamp(spot.x + (Math.random() * 0.06 - 0.03), -0.06, 1.06),
      y: clamp(spot.y + (Math.random() * 0.04 - 0.02), -0.06, 1.06)
    };
  }

  function addSticker(id) {
    const spot = randomEdgeSpot();
    const s = {
      uid: "s" + Date.now() + Math.random().toString(36).slice(2, 6),
      id: id,
      x: spot.x,
      y: spot.y,
      scale: 1,
      rot: Math.random() * 26 - 13,
      z: ++state.seq
    };
    state.stickers.push(s);
    const btn = buildStickerEl(s);
    stage.append(btn);
    selectSticker(btn);
    saveMonth();
  }

  stage.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".sticker")) selectSticker(null);
  });

  (function buildTray() {
    const scroll = $("trayScroll");
    STICKERS.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Add " + s.id + " sticker");
      const img = document.createElement("img");
      img.alt = "";
      withPlaceholderFallback(img, s.id);
      img.addEventListener("load", () => noteStickerAspect(s.id, img));
      img.src = s.src;
      btn.append(img);
      btn.addEventListener("click", () => addSticker(s.id));
      scroll.append(btn);
    });

    $("trayGrip").addEventListener("click", () => {
      const open = tray.classList.toggle("open");
      $("trayGrip").setAttribute("aria-expanded", String(open));
    });
  })();

  /* =========================================================================
     8. PNG EXPORT
     Repaints the receipt onto a canvas by measuring the live DOM, so the
     exported image always matches what's on screen — no separate rendering
     path to keep in sync.
     ========================================================================= */
  // cached so repeat exports (and the resize handler) don't refetch it
  let paperImagePromise = null;
  function loadPaperArt() {
    if (!paperImagePromise) {
      paperImagePromise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // export still works, just flat-colour paper
        img.src = "assets/paper.png";
      });
    }
    return paperImagePromise;
  }

  // Receipt + stickers only, no surrounding grid — the export crops to
  // whatever the paper and its stickers actually occupy, not the whole
  // stage, so the background pattern never ends up in the saved image.
  // Stickers can hang off any edge, so this has to look at their actual
  // positions rather than assuming the receipt's own box is enough.
  function computeExportBounds() {
    const r = receiptEl.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    let minX = r.left, minY = r.top, maxX = r.right, maxY = r.bottom;

    state.stickers.forEach((s) => {
      const cx = stageRect.left + s.x * stageRect.width;
      const cy = stageRect.top + s.y * stageRect.height;
      // half the sticker's diagonal — a safe radius regardless of rotation
      const radius = (STICKER_BASE_PX * s.scale) / 2 * Math.SQRT2 * 1.15;
      minX = Math.min(minX, cx - radius);
      maxX = Math.max(maxX, cx + radius);
      minY = Math.min(minY, cy - radius);
      maxY = Math.max(maxY, cy + radius);
    });

    const pad = 16; // room for the stickers' drop-shadow blur
    return {
      left: minX - pad, top: minY - pad,
      width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2
    };
  }

  async function exportReceiptPNG() {
    selectSticker(null);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const bounds = computeExportBounds();
    const OUTPUT_WIDTH = 1080;
    const k = OUTPUT_WIDTH / bounds.width; // scale factor: screen px → export px

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bounds.width * k);
    canvas.height = Math.round(bounds.height * k);
    const ctx = canvas.getContext("2d"); // left transparent outside the paper

    const paperImg = await loadPaperArt();

    paintReceiptPaper(ctx, bounds, k, paperImg);
    paintReceiptText(ctx, bounds, k);
    paintDashedRules(ctx, bounds, k);
    await paintStickers(ctx, bounds, k);

    return canvas;
  }

  // the receipt's CSS aspect-ratio is locked to the art's own (see style.css),
  // so this is a direct fit — no "cover" cropping/zoom logic needed
  function paintReceiptPaper(ctx, bounds, k, paperImg) {
    const r = receiptEl.getBoundingClientRect();
    const box = {
      x: (r.left - bounds.left) * k,
      y: (r.top - bounds.top) * k,
      w: r.width * k,
      h: r.height * k
    };
    ctx.save();
    ctx.shadowColor = "rgba(29,47,92,.22)";
    ctx.shadowBlur = 24 * k;
    ctx.shadowOffsetY = 8 * k;
    ctx.fillStyle = "#fcfcfa"; // shows through if the art failed to load
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();

    if (paperImg) ctx.drawImage(paperImg, box.x, box.y, box.w, box.h);
    return box;
  }

  // Ask the browser where it actually put each line, rather than re-wrapping
  // the text ourselves. Canvas text metrics don't match the DOM's exactly, so
  // our own wrapping would break a line a word early or late — and any row
  // that gained a line then overflowed its box and collided with the next
  // one in the export. Ranges over the text node give the real line boxes.
  function domLineBoxes(el) {
    const node = el.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return null;

    const text = node.nodeValue;
    const range = document.createRange();
    const lines = [];
    let line = null;

    for (let i = 0; i < text.length; i++) {
      const isSpace = /\s/.test(text[i]);
      if (isSpace && !line) continue; // don't let a wrapped line start on a space

      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (!r.width && !r.height) continue; // collapsed whitespace

      const row = Math.round(r.top);
      if (!line || line.row !== row) {
        if (isSpace) continue;
        line = { row: row, text: "", left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        lines.push(line);
      }
      line.text += text[i];
      line.left = Math.min(line.left, r.left);
      line.right = Math.max(line.right, r.right);
      line.top = Math.min(line.top, r.top);
      line.bottom = Math.max(line.bottom, r.bottom);
    }

    lines.forEach((l) => { l.text = l.text.replace(/\s+$/, ""); });
    return lines.length ? lines : null;
  }

  function paintReceiptText(ctx, bounds, k) {
    ctx.textBaseline = "middle";
    receiptEl.querySelectorAll("[data-px]").forEach((node) => {
      const box = node.getBoundingClientRect();
      if (!box.width) return;

      const style = getComputedStyle(node);
      const fontSize = parseFloat(style.fontSize) * k;
      // use the node's *actual* font (mono body vs. the cursive heading),
      // not a hardcoded stack — otherwise measurements/rendering here
      // don't match the DOM, which is exactly what caused the heading to
      // wrap wrong and print in the wrong face
      ctx.font = style.fontWeight + " " + fontSize + "px " + style.fontFamily;
      ctx.fillStyle = style.color;
      if ("letterSpacing" in ctx) {
        const ls = parseFloat(style.letterSpacing);
        ctx.letterSpacing = (isNaN(ls) ? 0 : ls * k) + "px";
      }

      const align = node.dataset.px;
      ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";

      const lines = domLineBoxes(node);
      if (lines) {
        lines.forEach((line) => {
          const y = ((line.top + line.bottom) / 2 - bounds.top) * k;
          const x = align === "center" ? ((line.left + line.right) / 2 - bounds.left) * k
                  : align === "right"  ? (line.right - bounds.left) * k
                  : (line.left - bounds.left) * k;
          ctx.fillText(line.text, x, y);
        });
      } else {
        // no text node (shouldn't happen) — fall back to the element's box
        const y = (box.top - bounds.top + box.height / 2) * k;
        const x = align === "center" ? (box.left - bounds.left + box.width / 2) * k
                : align === "right"  ? (box.right - bounds.left) * k
                : (box.left - bounds.left) * k;
        ctx.fillText(node.textContent, x, y);
      }
    });
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }

  function paintDashedRules(ctx, bounds, k) {
    receiptEl.querySelectorAll("[data-rule]").forEach((node) => {
      const box = node.getBoundingClientRect();
      const y = (box.top - bounds.top + box.height / 2) * k;
      ctx.save();
      ctx.strokeStyle = "#9fb0d4";
      ctx.lineWidth = 1.4 * k;
      ctx.setLineDash([5 * k, 5 * k]);
      ctx.beginPath();
      ctx.moveTo((box.left - bounds.left) * k, y);
      ctx.lineTo((box.right - bounds.left) * k, y);
      ctx.stroke();
      ctx.restore();
    });
  }

  function paintStickers(ctx, bounds, k) {
    const stageRect = stage.getBoundingClientRect();
    const ordered = state.stickers.slice().sort((a, b) => a.z - b.z);
    return Promise.all(ordered.map((s) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = STICKER_BASE_PX * s.scale * k;
        const h = size * (img.naturalHeight / img.naturalWidth || 1);
        const cx = (stageRect.left + s.x * stageRect.width - bounds.left) * k;
        const cy = (stageRect.top + s.y * stageRect.height - bounds.top) * k;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(s.rot * Math.PI / 180);
        ctx.shadowColor = "rgba(29,47,92,.25)";
        ctx.shadowBlur = 8 * k;
        ctx.shadowOffsetY = 3 * k;
        ctx.drawImage(img, -size / 2, -h / 2, size, h);
        ctx.restore();
        resolve();
      };
      img.onerror = () => {
        img.onerror = null;
        img.src = placeholderSticker(s.id);
      };
      img.src = stickerSrc(s.id);
    })));
  }

  async function saveReceiptImage() {
    showToast("Printing…");
    try {
      const canvas = await exportReceiptPNG();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("canvas.toBlob returned null");

      const filename = "monthly-receipt-" + currentMonth + ".png";
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Monthly Receipt" });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("Saved to your downloads");
    } catch (err) {
      if (err && err.name === "AbortError") return; // user cancelled the share sheet
      showToast("Couldn't save the image");
    }
  }

  /* =========================================================================
     9. VIEWS + WIRING
     ========================================================================= */
  function showHome() {
    refreshMonthPicker(); // picks up a brand-new current month automatically
    headerBack.classList.add("hidden"); // home is the root — nowhere to go back to
    viewHome.classList.remove("hidden");
    viewForm.classList.add("hidden");
    viewLoading.classList.add("hidden");
    viewReceipt.classList.add("hidden");
    dockForm.classList.add("hidden");
    dockReceipt.classList.add("hidden");
    tray.classList.add("hidden");
    tray.classList.remove("open");

    const n = answeredCount();
    $("btnStart").textContent = n ? "Pick up where you left off" : "Let's go";
    window.scrollTo(0, 0);
  }

  function showForm() {
    syncIdentityFields(); // month label + remembered name/handle
    headerBack.classList.remove("hidden");
    viewHome.classList.add("hidden");
    viewForm.classList.remove("hidden");
    viewLoading.classList.add("hidden");
    viewReceipt.classList.add("hidden");
    dockForm.classList.remove("hidden");
    dockReceipt.classList.add("hidden");
    tray.classList.add("hidden");
    tray.classList.remove("open");
    window.scrollTo(0, 0);
  }

  const LOADING_MS = 1000;

  // brief pause between "Print receipt" and actually seeing it — mostly an
  // excuse for a bit of delight (drop a gif/image in assets/loading.gif),
  // but also gives the receipt a moment to lay out before it's revealed
  // The loading screen reuses the home screen's little printing receipt.
  // Its animations are gated behind `.printing` (see style.css) so they can
  // be replayed on demand — CSS animations only run once per element
  // otherwise, and this element is never re-created.
  const loadingReceipt = $("loadingReceipt");
  const loadingPhoto = $("loadingPhoto");
  const loadingPhotos = (typeof LOADING_PHOTOS !== "undefined" && Array.isArray(LOADING_PHOTOS))
    ? LOADING_PHOTOS.filter(Boolean)
    : [];
  let loadingPhotoIndex = 0;

  function playLoadingAnimation() {
    if (loadingPhotos.length) {
      // cycle, so it isn't the same shot every single time
      loadingPhoto.style.backgroundImage =
        'url("' + loadingPhotos[loadingPhotoIndex % loadingPhotos.length] + '")';
      loadingPhoto.hidden = false;
      loadingPhotoIndex++;
    } else {
      loadingPhoto.hidden = true; // no photos configured — receipt still prints
    }

    loadingReceipt.classList.remove("printing");
    void loadingReceipt.offsetWidth; // reflow, so the animations restart
    loadingReceipt.classList.add("printing");
  }

  function showLoading() {
    headerBack.classList.add("hidden"); // nothing to interrupt mid-print
    viewHome.classList.add("hidden");
    viewForm.classList.add("hidden");
    viewLoading.classList.remove("hidden");
    viewReceipt.classList.add("hidden");
    dockForm.classList.add("hidden");
    dockReceipt.classList.add("hidden");
    tray.classList.add("hidden");
    window.scrollTo(0, 0);
    playLoadingAnimation();
    setTimeout(showReceipt, LOADING_MS);
  }

  function showReceipt() {
    // the dock already offers "Edit answers", so the header arrow would be
    // a second route to the same place — keep it hidden here
    headerBack.classList.add("hidden");
    // unhide first — the stage must be laid out before stickers are placed,
    // otherwise stage.clientWidth is 0 and everything lands in the corner
    viewHome.classList.add("hidden");
    viewForm.classList.add("hidden");
    viewLoading.classList.add("hidden");
    viewReceipt.classList.remove("hidden");
    renderReceipt();
    dockForm.classList.add("hidden");
    dockReceipt.classList.remove("hidden");
    tray.classList.remove("hidden");
    // the sticker list keeps its scroll offset while hidden, which on the
    // desktop rail meant opening part-way down the set — always start at
    // the first sticker
    $("trayScroll").scrollTop = 0;
    window.scrollTo(0, 0);
  }

  $("btnStart").addEventListener("click", showForm);
  $("btnGenerate").addEventListener("click", showLoading);
  $("btnBack").addEventListener("click", showForm);
  $("btnSave").addEventListener("click", saveReceiptImage);
  $("home").addEventListener("click", showHome);
  headerBack.addEventListener("click", showHome);

  $("btnResetStickers").addEventListener("click", () => {
    if (!state.stickers.length) return;
    state.stickers = [];
    stage.querySelectorAll(".sticker").forEach((n) => n.remove());
    selectedSticker = null;
    saveMonth();
    showToast("Stickers cleared");
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (viewReceipt.classList.contains("hidden")) return;
      // the paper's size changes with the viewport, so the text has to be
      // re-fitted to it — otherwise a rotate or window resize leaves the
      // answers sized for the old width and overflowing the footer
      const content = receiptEl.querySelector(".r-content");
      if (content) fitReceiptContent(content);
      stage.querySelectorAll(".sticker").forEach((btn) => {
        const s = state.stickers.find((x) => x.uid === btn.dataset.uid);
        if (s) positionSticker(btn, s);
      });
    }, 120);
  });

  let toastTimer;
  function showToast(message) {
    const t = $("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  renderForm();
  showHome();
})();
