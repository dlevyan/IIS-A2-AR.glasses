// Shared press feedback; physical control actions are connected below.
const pressTimers = new WeakMap();

document.querySelectorAll("[data-control]").forEach((button) => {
  button.addEventListener("click", () => {
    // Retain the press briefly so keyboard and touch get visible feedback too.
    window.clearTimeout(pressTimers.get(button));
    button.classList.add("is-pressed");
    pressTimers.set(button, window.setTimeout(() => {
      button.classList.remove("is-pressed");
    }, 180));
  });
});

// Prepared speaker IDs and movement are simulated, not inferred from audio/video.
// Times are milliseconds; dialogue and reading timings are prepared data.

const scriptedConversation = {
  
lines: [
  { start: 0, duration: 3000, speakerId: "alex", text: "Hey everyone! Shall we go over our project?" },
  { start: 3000, duration: 3000, speakerId: "maya", text: "Yes! Have you finished the sketches?" },
  { start: 6000, duration: 3000, speakerId: "sam", text: "Alex made a few designs last night." },
  { start: 9000, duration: 3000, speakerId: "alex", text: "They're on my tablet. Take a look." },
  { start: 12000, duration: 3000, speakerId: "maya", text: "I can't quite see them from here." },
  { start: 15000, duration: 3000, speakerId: "sam", text: "I think the blue design looks best." },
  { start: 18000, duration: 3500, speakerId: "maya", text: "I'll scooch next to Alex for a better look." },

  // Maya moves beside Alex between 21.5 and 24.3 seconds.

  { start: 24500, duration: 3000, speakerId: "alex", text: "Better? Which design do you prefer?" },
  { start: 27500, duration: 3000, speakerId: "sam", text: "I still think the blue one works best." },
  { start: 30500, duration: 3000, speakerId: "maya", text: "I agree! We could improve the layout." },
  { start: 33500, duration: 3000, speakerId: "alex", text: "I'll update it and send it tonight." },
  { start: 36500, duration: 3200, speakerId: "sam", text: "Great. Let's meet here again tomorrow!" },
],

  movements: [
  { speakerId: "maya", start: 21500, duration: 2800, from: { x: 0, y: 0 }, destinationId: "shared-seat" },
],
};
const conversationDuration = Math.max(...scriptedConversation.lines.map(line => line.start + line.duration));

// Positions come from the existing illustration, not individual dialogue lines.
const speakerDefinitions = {
  alex: { name: "Alex", elementId: "person-left" },
  maya: { name: "Maya", elementId: "person-middle" },
  sam: { name: "Sam", elementId: "person-right" },
};
const speakers = Object.fromEntries(Object.entries(speakerDefinitions).map(([id, definition]) => {
  const node = document.getElementById(definition.elementId);
  const face = node.querySelector("[data-face]").getBBox();
  return [id, {
    ...definition, node, offset: { x: 0, y: 0 },
    // Include ears and the hairline in the protected face rectangle.
    face: { x: face.x - 6, y: face.y - 8, width: face.width + 12, height: face.height + 8 },
  }];
}));

// Lens-safe rectangles, in the original illustration's SVG coordinates.
const lensBounds = {
  left: { x: 194, y: 210, width: 256, height: 168 },
  right: { x: 552, y: 210, width: 270, height: 168 },
};
const captionStyle = { width: 174, height: 48, padding: 11, lineHeight: 16, tail: 8, baseline: 27 };
const sizePresets = {
  small: { fontSize: 13, width: 166, height: 44, lineHeight: 15, baseline: 25, tail: 4 },
  medium: { fontSize: 15, width: 174, height: 48, lineHeight: 16, baseline: 27, tail: 8 },
  large: { fontSize: 17, width: 220, height: 52, lineHeight: 18, baseline: 28, tail: 4 },
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// Simulated speech shapes, not phonemes or speech recognition. Each path stays
// inside its original character group, so Maya's existing translation carries it.
const mouthShapes = {
  alex: { fill: "#874f3c", narrow: "M251 303Q260 305 269 302Q260 309 251 303Z", open: "M253 302Q260 300 267 302Q268 309 260 309Q252 309 253 302Z" },
  maya: { fill: "#875442", narrow: "M582 298Q590 299 597 297Q590 303 582 298Z", open: "M585 297Q590 295 595 297Q596 303 590 303Q584 303 585 297Z" },
  sam: { fill: "#533d32", narrow: "M768 302Q777 304 785 301Q777 308 768 302Z", open: "M771 301Q777 299 783 301Q785 308 777 308Q770 308 771 301Z" },
};
const mouths = Object.entries(speakers).map(([id, speaker]) => {
  const node = speaker.node.querySelector("[data-mouth]");
  return { id, node, closed: node.getAttribute("d"), shape: "closed" };
});
// Uneven, brief speech beats include closed-mouth rests. All timing derives from
// the shared playback clock: no additional animation loops, intervals or timers.
const mouthBeats = [
  { until: 150, shape: "narrow" }, { until: 320, shape: "open" },
  { until: 430, shape: "closed" }, { until: 620, shape: "narrow" },
  { until: 760, shape: "open" }, { until: 900, shape: "closed" },
];
function updateSpeakingMouths(line, elapsed) {
  const beat = line ? (elapsed - line.start) % 900 : 0;

const isSpeaking = line &&
  (elapsed - line.start) < line.duration * 0.40;

const speakingShape = isSpeaking && !reducedMotion.matches
  ? mouthBeats.find(frame => beat < frame.until).shape
  : "closed";
  mouths.forEach(mouth => {
    const shape = mouth.id === line?.speakerId ? speakingShape : "closed";
    if (mouth.shape === shape) return; // Only touch the SVG when a shape changes.
    mouth.node.setAttribute("d", shape === "closed" ? mouth.closed : mouthShapes[mouth.id][shape]);
    mouth.node.setAttribute("fill", shape === "closed" ? "none" : mouthShapes[mouth.id].fill);
    mouth.node.dataset.mouthShape = shape;
    mouth.shape = shape;
  });
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const captionPositionModes = ["automatic", "left", "below", "right"];
const positionLabel = value => value.charAt(0).toUpperCase() + value.slice(1);
const settingsCatalog = [
  { key: "position", label: "Caption Position", options: [["automatic", "Automatic"], ["left", "Left"], ["below", "Below"], ["right", "Right"]] },
  { key: "size", label: "Text Size", options: [["small", "Small"], ["medium", "Medium"], ["large", "Large"]] },
  { key: "colour", label: "Text Colour", options: [["white", "White"], ["yellow", "Yellow"], ["black", "Black"]] },
  { key: "background", label: "Bubble Background", options: [["dark-translucent", "Dark translucent"], ["dark-opaque", "Dark opaque"], ["light-opaque", "Light opaque"]] },
{ key: "captionMode", label: "Caption Mode", options: [["speaker-registered", "Follow Speaker"], ["head-fixed", "Fixed in View"]] },
  { key: "visibility", label: "Captions On/Off", options: [["on", "On"], ["off", "Off"]] },
];
const builtInDefaults = { position: "automatic", size: "medium", colour: "white", background: "dark-translucent", captionMode: "speaker-registered", visibility: "on" };
const STORAGE_KEY = "ar-caption-glasses.preferences.v1";
let storageWarning = "";

// Respect the setting the user just chose, adjusting its contrast partner.
function ensureContrast(values, changedKey) {
  const result = { ...values };
  if (changedKey === "background") {
    if (result.background === "light-opaque") result.colour = "black";
    else if (result.colour === "black") result.colour = "white";
  } else {
    if (result.colour === "black") result.background = "light-opaque";
    else if (result.background === "light-opaque") result.background = "dark-opaque";
  }
  return result;
}

function loadDefaults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...builtInDefaults };
    const record = JSON.parse(raw);
    const values = record && record.version === 1 ? record.values : {};
    const result = { ...builtInDefaults };
    settingsCatalog.forEach(category => {
      if (category.options.some(option => option[0] === values?.[category.key])) result[category.key] = values[category.key];
    });
    return ensureContrast(result, "colour");
  } catch {
    storageWarning = "Saved preferences unavailable; using built-in defaults.";
    return { ...builtInDefaults };
  }
}
let savedDefaults = loadDefaults();
let activeSettings = { ...savedDefaults };
const captionPosition = { defaultMode: savedDefaults.position, mode: activeSettings.position };
const MENU_BOUNDS = { x: 632, y: 210, width: 190, height: 148 };
const menu = { open: false, page: "root", category: 0, index: 0, preview: null, value: null, notice: "", noticeContext: "", noticeTimer: null, returnFocus: null };

function effectiveSettings() {
  return menu.preview
    ? ensureContrast({ ...activeSettings, [menu.preview.key]: menu.preview.value }, menu.preview.key)
    : activeSettings;
}
function previewContrastAdjusted() {
  return menu.preview && ["colour", "background"].some(key =>
    key !== menu.preview.key && effectiveSettings()[key] !== activeSettings[key]);
}
function currentFace(speaker) {
  return { ...speaker.face, x: speaker.face.x + speaker.offset.x, y: speaker.face.y + speaker.offset.y };
}
function intersects(a, b, gap = 3) {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x
    && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}
function speakerLens(speaker) {
  const face = currentFace(speaker);
  const centre = face.x + face.width / 2;
  return Object.values(lensBounds).find(lens => centre >= lens.x && centre <= lens.x + lens.width) ?? null;
}
function bubbleFace(box, speakerId) {
  // A fixed tail points to a stable HUD anchor, not to the changing speaker.
  return box.headFixed
    ? { x: box.x + box.width / 2 - 1, y: box.y - captionStyle.tail - 1, width: 2, height: 1 }
    : currentFace(speakers[speakerId]);
}
function bubbleTail(box, face) {
  const { width, height, tail } = captionStyle;
  const anchorX = clamp(face.x + face.width / 2 - box.x, 22, width - 22);
  const anchorY = clamp(face.y + face.height / 2 - box.y, 21, height - 21);
  if (box.position === "below") return { x: box.x + anchorX - 6, y: box.y - tail, width: 12, height: tail, anchor: anchorX };
  if (box.position === "above") return { x: box.x + anchorX - 6, y: box.y + height, width: 12, height: tail, anchor: anchorX };
  if (box.position === "left") return { x: box.x + width, y: box.y + anchorY - 5, width: tail, height: 10, anchor: anchorY };
  return { x: box.x - tail, y: box.y + anchorY - 5, width: tail, height: 10, anchor: anchorY };
}
function safeCaptionBox(box, face, lens) {
  const contained = rect => rect.x >= lens.x && rect.y >= lens.y
    && rect.x + rect.width <= lens.x + lens.width && rect.y + rect.height <= lens.y + lens.height;
  const tail = bubbleTail(box, face);
  return contained(box) && contained(tail)
    && Object.values(speakers).every(s => !intersects(box, currentFace(s)) && !intersects(tail, currentFace(s), 0));
}

// Same renderer and four-direction safety rules serve menu choices and quick mode.
function calculateCaptionPlacement(speakerId) {
  const { width, height } = captionStyle;
  if (effectiveSettings().captionMode === "head-fixed") {
    const lens = lensBounds.left;
    const fixed = { x: lens.x + (lens.width - width) / 2, y: lens.y + lens.height - height, width, height, position: "below", headFixed: true };
    return safeCaptionBox(fixed, bubbleFace(fixed, speakerId), lens) ? fixed : null;
  }
  const face = currentFace(speakers[speakerId]);
  const lens = speakerLens(speakers[speakerId]);
  if (!lens) return null;
  const xAligned = clamp(face.x, lens.x, lens.x + lens.width - width);
  const yAligned = clamp(face.y + face.height / 2 - height / 2, lens.y, lens.y + lens.height - height);
  const candidates = [
    { x: face.x + face.width + 12, y: yAligned, position: "right" },
    { x: face.x - width - 12, y: yAligned, position: "left" },
    { x: xAligned, y: Math.min(face.y + face.height + 12, lens.y + lens.height - height), position: "below" },
    { x: xAligned, y: face.y - height - 12, position: "above" },
    { x: xAligned, y: lens.y + lens.height - height, position: "below" },
  ].map(box => ({ ...box, width, height }));
  const safe = candidates.filter(box => safeCaptionBox(box, face, lens));
  if (captionPosition.mode === "automatic") return safe[0] ?? null;
  const preferred = safe.find(box => box.position === captionPosition.mode);
  if (preferred) return preferred;
  const target = candidates.find(box => box.position === captionPosition.mode);
  const distance = box => (box.x - target.x) ** 2 + (box.y - target.y) ** 2;
  return safe.sort((a, b) => distance(a) - distance(b))[0] ?? null;
}
function bubbleOutline(box, face) {
  const { width: w, height: h, tail: t } = captionStyle;
  const a = bubbleTail(box, face).anchor;
  const r = 14;
  const top = box.position === "below" ? "H" + (a - 6) + "L" + a + " " + -t + "L" + (a + 6) + " 0" : "";
  const right = box.position === "left" ? "V" + (a - 5) + "L" + (w + t) + " " + a + "L" + w + " " + (a + 5) : "";
  const bottom = box.position === "above" ? "H" + (a + 6) + "L" + a + " " + (h + t) + "L" + (a - 6) + " " + h : "";
  const left = box.position === "right" ? "V" + (a + 5) + "L" + -t + " " + a + "L0 " + (a - 5) : "";
  return "M" + r + " 0" + top + "H" + (w-r) + "Q" + w + " 0 " + w + " " + r + right + "V" + (h-r) + "Q" + w + " " + h + " " + (w-r) + " " + h + bottom + "H" + r + "Q0 " + h + " 0 " + (h-r) + left + "V" + r + "Q0 0 " + r + " 0Z";
}

const captionNode = document.getElementById("dynamic-caption");
const captionText = document.getElementById("caption-text");
const captionSpeaker = document.getElementById("caption-speaker");
const captionBackground = document.getElementById("caption-background");
const announcement = document.getElementById("caption-announcement");
const measureContext = document.createElement("canvas").getContext("2d");
const positionButton = document.querySelector('[data-control="position"]');
const positionDescription = document.getElementById("position-description");
const positionStatus = document.getElementById("position-status");
const positionToast = document.getElementById("position-toast");
const positionToastTitle = document.getElementById("position-toast-title");
const positionToastDetail = document.getElementById("position-toast-detail");
const positionFeedback = { timer: null, lastFallbackKey: null };
const menuNode = document.getElementById("settings-menu");
const menuButton = document.querySelector('[data-control="menu"]');
let appearanceSignature = "";

function updatePositionButton() {
  const index = captionPositionModes.indexOf(captionPosition.mode);
  const next = captionPositionModes[(index + 1) % captionPositionModes.length];
  positionButton.setAttribute("aria-label", "Caption position: " + positionLabel(captionPosition.mode) + ". Activate to select " + positionLabel(next) + ".");
  positionDescription.textContent = "Current: " + positionLabel(captionPosition.mode);
}
function notify(message, shortMessage = message, context = "") {
  positionStatus.textContent = message;
  if (menu.open) {
    positionToast.setAttribute("visibility", "hidden");
    menu.notice = shortMessage;
    menu.noticeContext = context;
    window.clearTimeout(menu.noticeTimer);
    menu.noticeTimer = window.setTimeout(() => { menu.notice = ""; menu.noticeContext = ""; renderMenu(); }, 2600);
    renderMenu();
  } else {
    positionToastTitle.textContent = shortMessage;
    positionToastTitle.setAttribute("y", 223);
    positionToastDetail.textContent = "";
    positionToast.setAttribute("visibility", "visible");
    window.clearTimeout(positionFeedback.timer);
    positionFeedback.timer = window.setTimeout(() => positionToast.setAttribute("visibility", "hidden"), 2600);
  }
}
function showPositionFeedback(detail = "") {
  const message = "Caption position: " + positionLabel(captionPosition.mode);
  if (menu.open) {
    notify(message + (detail ? ". " + detail : ""), detail || message);
    return;
  }
  positionToastTitle.textContent = message;
  positionToastDetail.textContent = detail;
  positionToastTitle.setAttribute("y", detail ? 218 : 223);
  positionStatus.textContent = message + (detail ? ". " + detail : "");
  positionToast.setAttribute("visibility", "visible");
  window.clearTimeout(positionFeedback.timer);
  positionFeedback.timer = window.setTimeout(() => positionToast.setAttribute("visibility", "hidden"), 2200);
}
function reportPositionFallback(speakerId, box) {
  const mode = effectiveSettings().captionMode;
  const fallback = !box || (mode === "speaker-registered" && captionPosition.mode !== "automatic" && box.position !== captionPosition.mode);
  if (!fallback) { positionFeedback.lastFallbackKey = null; return; }
  const key = captionPosition.mode + ":" + speakerId + ":" + (box?.position ?? "hidden") + ":" + menu.open;
  if (key === positionFeedback.lastFallbackKey) return;
  positionFeedback.lastFallbackKey = key;
  showPositionFeedback(box ? "Repositioned " + box.position + " for visibility" : menu.open ? "Paused: close Settings to read" : "Paused: no safe caption space");
}
function configureCaptionAppearance() {
  const settings = effectiveSettings();
  captionPosition.mode = settings.position;
  captionPosition.defaultMode = savedDefaults.position;
  const signature = JSON.stringify(settings);
  if (signature === appearanceSignature) return;
  appearanceSignature = signature;
  Object.assign(captionStyle, sizePresets[settings.size]);
  captionText.setAttribute("font-size", captionStyle.fontSize);
  const light = settings.background === "light-opaque";
  captionText.setAttribute("fill", { white: "#ffffff", yellow: "#ffeb63", black: "#101b17" }[settings.colour]);
  captionSpeaker.setAttribute("fill", light ? "#234333" : "#d4e6d9");
  captionBackground.setAttribute("fill", light ? "#f5f5e9" : "#142a27");
  captionBackground.setAttribute("fill-opacity", settings.background === "dark-translucent" ? ".88" : "1");
  captionBackground.setAttribute("stroke", light ? "#43604f" : "#d9ede1");
  updatePositionButton();
}
function resetConversationSettings() {
  activeSettings = { ...savedDefaults };
  menu.preview = null;
  menu.page = "root";
  menu.index = 0;
  menu.notice = "";
  window.clearTimeout(menu.noticeTimer);
  window.clearTimeout(positionFeedback.timer);
  positionFeedback.lastFallbackKey = null;
  positionToast.setAttribute("visibility", "hidden");
  configureCaptionAppearance();
  positionStatus.textContent = "Conversation settings reset to saved defaults";
  renderMenu();
}
function wrapCaption(text) {
  const font = getComputedStyle(captionText);
  measureContext.font = font.fontWeight + " " + font.fontSize + " " + font.fontFamily;
  const maxWidth = captionStyle.width - captionStyle.padding * 2;
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? line + " " + word : word;
    if (line && measureContext.measureText(next).width > maxWidth) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const captionDisplay = {
  currentLine: null, wordCount: 0, rows: [], layoutKey: "", lastBox: null,
  show(line, elapsed) {
    if (effectiveSettings().visibility === "off") { this.clear(); return; }
    const layoutKey = captionStyle.fontSize + ":" + captionStyle.width;
    if (this.currentLine !== line || this.layoutKey !== layoutKey) {
      captionText.replaceChildren();
      this.rows = wrapCaption(line.text).map(text => {
        const span = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        span.setAttribute("x", captionStyle.padding);
        captionText.append(span);
        return { span, words: text.split(/\s+/) };
      });
      captionSpeaker.textContent = speakers[line.speakerId].name.toUpperCase() + " · SIMULATED";
      this.currentLine = line;
      this.layoutKey = layoutKey;
      this.wordCount = 0;
    }
    const words = line.text.split(/\s+/);
    const progress = clamp((elapsed - line.start) / (line.duration * .40), 0, 1);
    const count = Math.min(words.length, 1 + Math.floor(progress * (words.length - 1)));
    if (count !== this.wordCount) {
      let remaining = count;
      const visibleLines = [];
      this.rows.forEach(row => {
        const text = row.words.slice(0, Math.max(0, remaining)).join(" ");
        if (text) visibleLines.push(text);
        remaining -= row.words.length;
      });
      const latest = visibleLines.slice(-2);
      this.rows.forEach((row, index) => {
        row.span.textContent = latest[index] || "";
        row.span.setAttribute("y", captionStyle.baseline + index * captionStyle.lineHeight);
      });
      announcement.textContent = speakers[line.speakerId].name + ", simulated speaker: " + words.slice(0, count).join(" ");
      this.wordCount = count;
    }
    const box = calculateCaptionPlacement(line.speakerId);
    this.lastBox = box;
    reportPositionFallback(line.speakerId, box);
    if (!box) {
  captionNode.setAttribute("visibility", "hidden");
  return;
}
    captionNode.dataset.revealedWords = count;
    captionNode.dataset.speaker = line.speakerId;
    captionNode.dataset.placement = box.headFixed ? "head-fixed" : box.position;
    captionNode.setAttribute("transform", "translate(" + box.x + " " + box.y + ")");
captionBackground.setAttribute(
  "d",
  box.headFixed
    ? `M14 0 H${box.width - 14} Q${box.width} 0 ${box.width} 14
       V${box.height - 14} Q${box.width} ${box.height} ${box.width - 14} ${box.height}
       H14 Q0 ${box.height} 0 ${box.height - 14}
       V14 Q0 0 14 0 Z`
    : bubbleOutline(box, bubbleFace(box, line.speakerId))
);
    captionNode.setAttribute("visibility", "visible");
  },
  clear() {
    this.currentLine = null; this.wordCount = 0; this.rows = []; this.lastBox = null;
    captionText.replaceChildren(); captionSpeaker.textContent = ""; announcement.textContent = "";
    ["speaker", "revealedWords", "placement"].forEach(key => delete captionNode.dataset[key]);
    captionNode.setAttribute("visibility", "hidden");
  },
};

// Settings UI: three root rows; two choices plus a permanently visible Back row.
function svgNode(tag, attributes = {}, text = "") {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}
function menuEntries() {
  if (menu.page === "root") return settingsCatalog.map(category => ({ label: category.label }));
  if (menu.page === "actions") return [{ label: "Use for this conversation" }, { label: "Save as default" }, { label: "Back", back: true }];
  return [...settingsCatalog[menu.category].options.map(([value, label]) => ({ value, label })), { label: "Back", back: true }];
}
function renderMenu() {
  menuNode.setAttribute("visibility", menu.open ? "visible" : "hidden");
  menuNode.setAttribute("aria-hidden", String(!menu.open));
  menuButton.setAttribute("aria-expanded", String(menu.open));
  menuButton.setAttribute("aria-label", menu.open ? "Close settings menu" : "Open settings menu");
  if (!menu.open) return;
  const entries = menuEntries();
  const root = menu.page === "root";
  const selectedBack = entries[menu.index]?.back;
  const perPage = root ? 4 : 3;
  const lastOption = entries.length - (root ? 1 : 2);
const start = Math.floor(
  Math.min(Math.max(menu.index, 0), lastOption) / perPage
) * perPage;
  const shown = entries.slice(start, Math.min(start + perPage, root ? entries.length : entries.length - 1)).map((entry, offset) => ({ entry, index: start + offset }));
  if (!root) shown.push({ entry: entries.at(-1), index: entries.length - 1 });
  menuNode.replaceChildren();
  menuNode.append(svgNode("rect", { x: MENU_BOUNDS.x, y: MENU_BOUNDS.y, width: MENU_BOUNDS.width, height: MENU_BOUNDS.height, rx: 8, fill: "#142a27", "fill-opacity": ".8", stroke: "#c4ddcf", "stroke-opacity": ".6" }));
  menuNode.append(svgNode("text", { x: 644, y: 225, fill: "#fff", "font-size": 12, "font-weight": 650 }, "Settings"));
  // OFF option: always visible at the top-right of Settings.
// Controlled only by the physical navigation and confirm buttons.
const offSelected = menu.index === -1;

const offButton = svgNode("g", {
  id: "settings-off",
  role: "menuitem",
  "aria-label": "Close settings menu",
  "pointer-events": "none"
});

offButton.append(
  svgNode("rect", {
    x: 774,
    y: 211,
    width: 40,
    height: 23,
    rx: 5,
    fill: offSelected ? "#b7d5bf" : "#294d41",
    stroke: offSelected ? "#ffffff" : "#d4e6d9",
    "stroke-width": offSelected ? 1.5 : 1
  }),

  svgNode("text", {
    x: 794,
    y: 226,
    "text-anchor": "middle",
    fill: offSelected ? "#142a27" : "#ffffff",
    "font-size": 10,
    "font-weight": 650
  }, "OFF")
);

menuNode.append(offButton);
  const context = menu.notice && menu.noticeContext ? menu.noticeContext : previewContrastAdjusted() ? "Preview · Contrast adjusted" : root ? "Physical controls / arrow keys" : settingsCatalog[menu.category].label + (menu.page === "actions" ? " · Apply" : " · Preview");
  menuNode.append(svgNode("text", { x: 644, y: 237, fill: "#d4e6d9", "font-size": 8.5 }, context));
  shown.forEach(({ entry, index }, slot) => {
    const y = root ? 250 + slot * 22 : entry.back ? 324 : 252 + slot * 24;  
    const selected = index === menu.index;
    const row = svgNode("g", { id: "settings-row-" + index, role: "menuitem", "aria-label": entry.label + (selected ? ", selected" : "") });
    if (selected) row.append(svgNode("rect", { x: 641, y: y - 11, width: 172, height: 20, rx: 4, fill: "#b7d5bf", "fill-opacity": ".19", stroke: "#e1f1e7", "stroke-width": 1 }));
    const active = menu.page === "options" && entry.value === activeSettings[settingsCatalog[menu.category].key];
    row.append(svgNode("text", { x: 647, y: y + 3, fill: "#fff", "font-size": menu.page === "actions" ? 10 : 11 }, (entry.back ? "‹ " : active ? "• " : "") + entry.label));
    menuNode.append(row);
  });
menuNode.setAttribute(
  "aria-activedescendant",
  menu.index === -1 ? "settings-off" : "settings-row-" + menu.index
);
  const pager = (start > 0 ? "↑ " : "") + (start + 1) + "–" + Math.min(start + perPage, root ? entries.length : entries.length - 1) + " / " + (root ? entries.length : entries.length - 1) + (start + perPage < (root ? entries.length : entries.length - 1) ? " ↓" : "") + (selectedBack ? " · Back" : "");
const footer = svgNode("text", { x: 644, y: 346, fill: "#d4e6d9", "font-size": 8.2 }, menu.notice || pager);
  // Fit confirmation feedback without truncating its accessible full message.
  menuNode.append(footer);
  if (footer.getComputedTextLength() > 166) { footer.setAttribute("textLength", 166); footer.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
}
function refreshSettingsView() {
  configureCaptionAppearance();
  renderConversation(playback.elapsed);
  renderMenu();
}
function previewHighlighted() {
  const entry = menu.index >= 0
    ? menuEntries()[menu.index]
    : null;

  menu.preview =
    menu.page === "options" && entry && !entry.back
      ? {
          key: settingsCatalog[menu.category].key,
          value: entry.value
        }
      : null;

  positionFeedback.lastFallbackKey = null;

  refreshSettingsView();
}
function navigateMenu(direction) {
  if (!menu.open) {
    notify(
      "Open Settings with the round menu button",
      "Open Settings first"
    );
    return;
  }

  const count = menuEntries().length;

  if (direction < 0) {
    // PLUS moves upwards through menu options.
    // From the first option, PLUS highlights OFF.
    menu.index = Math.max(-1, menu.index - 1);

  } else {
    // MINUS moves downwards.
    // From OFF, MINUS returns to the first option.
    if (menu.index === -1) {
      menu.index = 0;
    } else {
      menu.index = (menu.index + 1) % count;
    }
  }

  menu.notice = "";

  if (menu.page === "options") {
    previewHighlighted();
  } else {
    renderMenu();
  }

  const label = menu.index === -1
    ? "OFF — press confirm to close settings"
    : menuEntries()[menu.index].label;

  positionStatus.textContent = "Settings: " + label;
}
function openMenu() {
  menu.returnFocus = document.activeElement;
  menu.open = true; menu.page = "root"; menu.index = 0; menu.preview = null; menu.notice = "";
  positionToast.setAttribute("visibility", "hidden");
  refreshSettingsView();
  menuNode.focus({ preventScroll: true });
  positionStatus.textContent = "Settings opened. Use plus/minus or arrow keys; confirm or Enter to select.";
  if (storageWarning) notify(storageWarning, "Saving unavailable in this browser");
}
function closeMenu() {
  menu.open = false; menu.preview = null; menu.notice = "";
  refreshSettingsView();
  (menu.returnFocus?.focus ? menu.returnFocus : menuButton).focus({ preventScroll: true });
  positionStatus.textContent = "Settings closed. Unconfirmed preview cancelled.";
}
function backMenu() {
  if (menu.page === "root") { closeMenu(); return; }
  if (menu.page === "actions") {
    menu.page = "options";
    menu.index = settingsCatalog[menu.category].options.findIndex(option => option[0] === menu.value);
    previewHighlighted();
  } else {
    menu.preview = null; menu.page = "root"; menu.index = menu.category;
    refreshSettingsView();
  }
}
function commitSetting(save) {
  const category = settingsCatalog[menu.category];
  const before = { ...activeSettings };
  activeSettings = ensureContrast({ ...activeSettings, [category.key]: menu.value }, category.key);
  let saved = false;
  if (save) {
    const defaults = ensureContrast({ ...savedDefaults, [category.key]: menu.value }, category.key);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, values: defaults }));
      savedDefaults = defaults;
      storageWarning = "";
      saved = true;
    } catch { storageWarning = "Storage unavailable. Setting applied only to this conversation."; }
  }
  const adjusted = ["colour", "background"].some(key => key !== category.key && before[key] !== activeSettings[key]);
  const valueLabel = category.options.find(option => option[0] === menu.value)[1];
  const scope = saved ? "Saved as default" : save ? "This conversation; saving unavailable" : "This conversation";
  menu.preview = null; menu.page = "root"; menu.index = menu.category;
  positionFeedback.lastFallbackKey = null;
  refreshSettingsView();
  const box = captionDisplay.lastBox;
  const repositioned = box && activeSettings.captionMode === "speaker-registered" && activeSettings.position !== "automatic" && box.position !== activeSettings.position;
  const context = save && !saved ? "Saving unavailable; not saved" : repositioned ? "Repositioned " + box.position + " for visibility" : adjusted ? "Contrast adjusted automatically" : "";
  const message = category.label + ": " + valueLabel + " — " + scope + (adjusted ? ". Contrast adjusted automatically." : "") + (repositioned ? ". Repositioned " + box.position + " for visibility." : "");
  notify(message, valueLabel + " · " + (saved ? "Saved default" : "This conversation"), context);
}
function confirmMenu() {
  if (!menu.open) {
    notify(
      "Open Settings with the round menu button",
      "Open Settings first"
    );
    return;
  }

  // OFF selected: close the Settings overlay.
  if (menu.index === -1) {
    closeMenu();
    return;
  }

  const entry = menuEntries()[menu.index];

  if (entry.back) {
    backMenu();
    return;
  }

  if (menu.page === "root") {
    menu.category = menu.index;
    menu.page = "options";

    menu.index = settingsCatalog[menu.category].options.findIndex(
      option =>
        option[0] === activeSettings[settingsCatalog[menu.category].key]
    );

    previewHighlighted();

  } else if (menu.page === "options") {
    menu.value = entry.value;
    menu.page = "actions";
    menu.index = 0;

    renderMenu();

  } else {
    commitSetting(menu.index === 1);
  }
}
menuButton.addEventListener("click", () => { if (menu.open) closeMenu(); else openMenu(); });
document.querySelector('[data-control="up"]').addEventListener("click", () => navigateMenu(-1));
document.querySelector('[data-control="down"]').addEventListener("click", () => navigateMenu(1));
document.querySelector('[data-control="confirm"]').addEventListener("click", confirmMenu);
document.addEventListener("keydown", event => {
  if (!menu.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault(); navigateMenu(event.key === "ArrowUp" ? -1 : 1);
  } else if (event.key === "Escape") {
    event.preventDefault(); backMenu();
  } else if (event.key === "Enter" && !event.target.closest("[data-control], .playback-strip")) {
    event.preventDefault(); confirmMenu();
  }
});

const playback = { status: "idle", elapsed: 0, anchorElapsed: 0, startedAt: 0, frameId: null };
const playButton = document.getElementById("play-button");
const pauseButton = document.getElementById("pause-button");
const replayButton = document.getElementById("replay-button");
const resetButton = document.getElementById("reset-button");
const playbackState = document.getElementById("playback-state");
const playbackTime = document.getElementById("playback-time");
const speakerStatus = document.getElementById("speaker-status");

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function updatePlaybackControls() {
  playButton.disabled = playback.status === "playing" || playback.status === "paused";
  pauseButton.disabled = playback.status === "idle" || playback.status === "ended";
  pauseButton.textContent = playback.status === "paused" ? "Resume" : "Pause";
  replayButton.disabled = playback.status === "idle";
  playbackState.textContent = { idle: "Ready", playing: "Playing", paused: "Paused", ended: "Finished" }[playback.status];
}

function updateSpeakerPositions(elapsed) {
  Object.values(speakers).forEach(speaker => { speaker.offset = { x: 0, y: 0 }; });
  scriptedConversation.movements.forEach(movement => {
    if (elapsed < movement.start) return;
    const fraction = reducedMotion.matches ? 1 : clamp((elapsed - movement.start) / movement.duration, 0, 1);
    const eased = fraction * fraction * (3 - 2 * fraction);
    const speaker = speakers[movement.speakerId];
    const seat = document.getElementById(movement.destinationId);
    const target = {
      x: Number(seat.dataset.seatX) - (speaker.face.x + speaker.face.width / 2),
      y: Number(seat.dataset.seatY) - (speaker.face.y + 8 + (speaker.face.height - 8) / 2),
    };
    speaker.offset = {
      x: movement.from.x + (target.x - movement.from.x) * eased,
      y: movement.from.y + (target.y - movement.from.y) * eased,
    };
  });
  Object.values(speakers).forEach(speaker => {
    speaker.node.setAttribute("transform", `translate(${speaker.offset.x} ${speaker.offset.y})`);
  });
}

function renderConversation(elapsed) {
  configureCaptionAppearance();
  playback.elapsed = clamp(elapsed, 0, conversationDuration);
  updateSpeakerPositions(playback.elapsed);
  const line = playback.status === "idle" ? null : scriptedConversation.lines.find(turn =>
    playback.elapsed >= turn.start && playback.elapsed < turn.start + turn.duration);
  updateSpeakingMouths(line, playback.elapsed);
  if (line) {
    captionDisplay.show(line, playback.elapsed);
    const label = `${speakers[line.speakerId].name} · Simulated speaker`;
    if (speakerStatus.textContent !== label) speakerStatus.textContent = label;
  } else {
    captionDisplay.clear();
    speakerStatus.textContent = "No active speaker";
  }
  const time = `${formatTime(playback.elapsed)} / ${formatTime(conversationDuration)}`;
  if (playbackTime.textContent !== time) playbackTime.textContent = time;
}

// A single elapsed-time clock drives captions, movement and mouths; pause freezes all.
function tick(now) {
  if (playback.status !== "playing") return;
  renderConversation(playback.anchorElapsed + now - playback.startedAt);
  if (playback.elapsed >= conversationDuration) {
    playback.status = "ended";
    playback.frameId = null;
    updatePlaybackControls();
    return;
  }
  playback.frameId = requestAnimationFrame(tick);
}

function startPlayback(restart = false) {
  cancelAnimationFrame(playback.frameId);
  if (restart || playback.status === "ended") {
  playback.elapsed = 0;
  captionDisplay.clear();
}
  playback.anchorElapsed = playback.elapsed;
  playback.startedAt = performance.now();
  playback.status = "playing";
  renderConversation(playback.elapsed);
  updatePlaybackControls();
  playback.frameId = requestAnimationFrame(tick);
}
function resetToOriginal() {
  // Stop playback.
  cancelAnimationFrame(playback.frameId);
  playback.frameId = null;

  // Remove any previously saved preferences.
  try {
    localStorage.removeItem(STORAGE_KEY);
    storageWarning = "";
  } catch {
    storageWarning = "Could not clear stored preferences.";
  }

  // Restore the original built-in settings.
  savedDefaults = { ...builtInDefaults };
  menu.open = false;
  menu.preview = null;
  menu.noticeContext = "";

  resetConversationSettings();

  // Return the conversation to the beginning.
  playback.status = "idle";
  playback.elapsed = 0;
  playback.anchorElapsed = 0;
  playback.startedAt = 0;

  captionDisplay.clear();

  // Update the interface.
  renderConversation(0);
  renderMenu();
  updatePlaybackControls();

  positionStatus.textContent =
    "Original settings restored. Press Play to begin.";
}

function pausePlayback() {
  if (playback.status !== "playing") return;
  cancelAnimationFrame(playback.frameId);
  renderConversation(playback.anchorElapsed + performance.now() - playback.startedAt);
  playback.status = playback.elapsed >= conversationDuration ? "ended" : "paused";
  updatePlaybackControls();
}

playButton.addEventListener("click", () => startPlayback());
pauseButton.addEventListener("click", () => {
  if (playback.status === "paused") startPlayback();
  else pausePlayback();
});
replayButton.addEventListener("click", () => startPlayback(true));
resetButton.addEventListener("click", resetToOriginal);
positionButton.addEventListener("click", () => {
  menu.preview = null;
  if (menu.open) { menu.page = "root"; menu.index = 0; }
  const index = captionPositionModes.indexOf(activeSettings.position);
  activeSettings.position = captionPositionModes[(index + 1) % captionPositionModes.length];
  positionFeedback.lastFallbackKey = null;
  configureCaptionAppearance();
showPositionFeedback(effectiveSettings().captionMode === "head-fixed" ? "Position controls only apply in Follow Speaker mode" : "");
  renderConversation(playback.elapsed);
  renderMenu();
});

// Do not silently skip readable turns while the visitor is in another tab.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pausePlayback();
});
// Apply an accessibility preference change even while playback is paused.
reducedMotion.addEventListener("change", () => {
  const line = playback.status === "idle" ? null : scriptedConversation.lines.find(turn =>
    playback.elapsed >= turn.start && playback.elapsed < turn.start + turn.duration);
  updateSpeakingMouths(line, playback.elapsed);
});
resetConversationSettings();
renderConversation(0);
updatePlaybackControls();
