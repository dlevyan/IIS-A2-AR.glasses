// Physical controls remain visual-only; playback has separate buttons below.
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
// Times are milliseconds. Every turn has at least four seconds of reading time.

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

// Conservative rectangles inside the curved lens edges (SVG units).
const lensBounds = {
  left: { x: 194, y: 210, width: 256, height: 168 },
  right: { x: 552, y: 210, width: 270, height: 168 },
};
const captionStyle = { width: 174, height: 48, padding: 11, lineHeight: 16, tail: 8 };
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
  // No lens is selected while a person passes behind the opaque bridge.
  return Object.values(lensBounds).find(lens => centre >= lens.x && centre <= lens.x + lens.width) ?? null;
}

// Include the pointing tail in lens and face-clearance checks, not just the body.
function bubbleTail(box, face) {
  const { width, height, tail } = captionStyle;
  const anchorX = clamp(face.x + face.width / 2 - box.x, 22, width - 22);
  const anchorY = clamp(face.y + face.height / 2 - box.y, 21, height - 21);
  if (box.position === "below") return { x: box.x + anchorX - 6, y: box.y - tail, width: 12, height: tail, anchor: anchorX };
  if (box.position === "above") return { x: box.x + anchorX - 6, y: box.y + height, width: 12, height: tail, anchor: anchorX };
  if (box.position === "left") return { x: box.x + width, y: box.y + anchorY - 5, width: tail, height: 10, anchor: anchorY };
  return { x: box.x - tail, y: box.y + anchorY - 5, width: tail, height: 10, anchor: anchorY };
}

// Four-direction simulated spatial reasoning, independent of dialogue content.
function calculateCaptionPlacement(speakerId) {
  const speaker = speakers[speakerId];
  const face = currentFace(speaker);
  const lens = speakerLens(speaker);
  if (!lens) return null;
  const { width, height } = captionStyle;
  const faces = Object.values(speakers).map(currentFace);
  const xAligned = clamp(face.x, lens.x, lens.x + lens.width - width);
  const yAligned = clamp(face.y + face.height / 2 - height / 2, lens.y, lens.y + lens.height - height);
  const candidates = [
    { x: face.x + face.width + 12, y: yAligned, position: "right" },
    { x: face.x - width - 12, y: yAligned, position: "left" },
    { x: xAligned, y: Math.min(face.y + face.height + 12, lens.y + lens.height - height), position: "below" },
    { x: xAligned, y: face.y - height - 12, position: "above" },
    // A neighbour's chin can require a slightly lower below-face placement.
    { x: xAligned, y: lens.y + lens.height - height, position: "below" },
  ];
  const contained = box => box.x >= lens.x && box.y >= lens.y
    && box.x + box.width <= lens.x + lens.width && box.y + box.height <= lens.y + lens.height;
  return candidates.map(candidate => ({ ...candidate, width, height })).find(box => {
    const tail = bubbleTail(box, face);
    return contained(box) && contained(tail)
      && faces.every(other => !intersects(box, other) && !intersects(tail, other, 0));
  }) ?? null;
}

// A single curved outline with an integrated tail, not a rectangular text box.
function bubbleOutline(box, face) {
  const { width: w, height: h, tail: t } = captionStyle;
  const a = bubbleTail(box, face).anchor;
  const r = 14;
  const top = box.position === "below" ? `H${a - 6}L${a} ${-t}L${a + 6} 0` : "";
  const right = box.position === "left" ? `V${a - 5}L${w + t} ${a}L${w} ${a + 5}` : "";
  const bottom = box.position === "above" ? `H${a + 6}L${a} ${h + t}L${a - 6} ${h}` : "";
  const left = box.position === "right" ? `V${a + 5}L${-t} ${a}L0 ${a - 5}` : "";
  return `M${r} 0${top}H${w - r}Q${w} 0 ${w} ${r}${right}V${h - r}Q${w} ${h} ${w - r} ${h}${bottom}H${r}Q0 ${h} 0 ${h - r}${left}V${r}Q0 0 ${r} 0Z`;
}

const captionNode = document.getElementById("dynamic-caption");
const captionText = document.getElementById("caption-text");
const captionSpeaker = document.getElementById("caption-speaker");
const captionBackground = document.getElementById("caption-background");
const announcement = document.getElementById("caption-announcement");
const measureContext = document.createElement("canvas").getContext("2d");

function wrapCaption(text) {
  const font = getComputedStyle(captionText);
  measureContext.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
  const maxWidth = captionStyle.width - captionStyle.padding * 2;
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measureContext.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// One caption display can later accept live transcription without changing SVGs.
const captionDisplay = {
  currentLine: null,
  wordCount: 0,
  rows: [],
  show(line, elapsed) {
    const box = calculateCaptionPlacement(line.speakerId);
    if (!box) {
      captionNode.setAttribute("visibility", "hidden");
      return;
    }
    if (this.currentLine !== line) {
      captionText.replaceChildren();
      this.rows = wrapCaption(line.text).map((text, index) => {
        const span = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        span.setAttribute("x", captionStyle.padding);
        span.setAttribute("y", 27 + index * captionStyle.lineHeight);
        captionText.append(span);
        return { span, words: text.split(/\s+/) };
      });
      captionSpeaker.textContent = `${speakers[line.speakerId].name.toUpperCase()} · SIMULATED`;
      this.currentLine = line;
      this.wordCount = 0;
    }
    // Reserve the full sentence's line breaks and bubble size before revealing.
    // Finish at 72% of the turn, leaving the remainder for reading the full line.
    const words = line.text.split(/\s+/);
    const progress = clamp((elapsed - line.start) / (line.duration * .40), 0, 1);
    const count = Math.min(words.length, 1 + Math.floor(progress * (words.length - 1)));
    
if (count !== this.wordCount) {
  let remaining = count;
  const visibleLines = [];

  // Work out which words have appeared so far.
  this.rows.forEach(row => {
    const visibleText = row.words
      .slice(0, Math.max(0, remaining))
      .join(" ");

    if (visibleText) {
      visibleLines.push(visibleText);
    }

    remaining -= row.words.length;
  });

  // Only show the two most recent lines.
  const latestTwoLines = visibleLines.slice(-2);

  this.rows.forEach((row, index) => {
    row.span.textContent = latestTwoLines[index] || "";
    row.span.setAttribute(
      "y",
      27 + index * captionStyle.lineHeight
    );
  });

  announcement.textContent =
    `${speakers[line.speakerId].name}, simulated speaker: ${words.slice(0, count).join(" ")}`;

  this.wordCount = count;
}
    captionNode.dataset.revealedWords = count;
    captionNode.dataset.speaker = line.speakerId;
    captionNode.dataset.placement = box.position;
    captionNode.setAttribute("transform", `translate(${box.x} ${box.y})`);
    captionBackground.setAttribute("d", bubbleOutline(box, currentFace(speakers[line.speakerId])));
    captionNode.setAttribute("visibility", "visible");
  },
  clear() {
    this.currentLine = null;
    this.wordCount = 0;
    this.rows = [];
    captionText.replaceChildren();
    captionSpeaker.textContent = "";
    announcement.textContent = "";
    delete captionNode.dataset.speaker;
    delete captionNode.dataset.revealedWords;
    delete captionNode.dataset.placement;
    captionNode.setAttribute("visibility", "hidden");
  },
};

const playback = { status: "idle", elapsed: 0, anchorElapsed: 0, startedAt: 0, frameId: null };
const playButton = document.getElementById("play-button");
const pauseButton = document.getElementById("pause-button");
const replayButton = document.getElementById("replay-button");
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
  playback.elapsed = clamp(elapsed, 0, conversationDuration);
  updateSpeakerPositions(playback.elapsed);
  const line = playback.status === "idle" ? null : scriptedConversation.lines.find(turn =>
    playback.elapsed >= turn.start && playback.elapsed < turn.start + turn.duration);
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

// A single elapsed-time clock drives captions AND movement, so pause freezes both.
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

// Do not silently skip readable turns while the visitor is in another tab.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pausePlayback();
});
renderConversation(0);
updatePlaybackControls();
