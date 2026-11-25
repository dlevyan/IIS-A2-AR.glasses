// Web Speech is an additional input adapter, not a second caption renderer.
// Speaker assignment is manual. Recognition is browser-generated and fallible.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const live = {
  speakerId: "alex", wanted: false, recognition: null, generation: 0,
  retryTimer: null, emptyEnds: 0, recognising: false, assignment: 0,
  line: null, carry: "", message: "Microphone off",
};
const liveControls = document.getElementById("live-controls");
const scriptedControls = document.querySelector('[aria-label="Scripted conversation playback"]');
const startListeningButton = document.getElementById("listen-start");
const stopListeningButton = document.getElementById("listen-stop");
const liveStatus = document.getElementById("live-status");
const speakerButtons = [...document.querySelectorAll("[data-speaker]")];
const sceneDescription = document.getElementById("glasses-description");
const scriptedDescription = sceneDescription.textContent;
const liveUnavailable = !Recognition
  ? "Speech recognition unavailable. Try a browser supporting Web Speech recognition."
  : !window.isSecureContext
    ? "Microphone requires HTTPS or localhost. Open this project on a secure origin."
    : "";

// Bound in-memory context only. Never put audio or transcripts in localStorage.
function recentTranscript(text) {
  return text.trim().split(/\s+/).slice(-120).join(" ").slice(-6000);
}
function updateLiveControls() {
  startListeningButton.disabled = Boolean(liveUnavailable) || live.wanted;
  stopListeningButton.disabled = !live.wanted;
  document.getElementById("live-clear").disabled = !live.line && !live.wanted;
  const message = liveUnavailable || live.message;
  if (liveStatus.textContent !== message) liveStatus.textContent = message;
  speakerButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.speaker === live.speakerId));
  });
  Object.entries(speakers).forEach(([id, speaker]) => {
    if (inputMode === "microphone") {
      speaker.node.setAttribute("role", "button");
      speaker.node.setAttribute("tabindex", "0");
      speaker.node.setAttribute("aria-label", "Assign live speech to " + speaker.name);
      speaker.node.setAttribute("aria-pressed", String(id === live.speakerId));
    } else {
      ["role", "tabindex", "aria-label", "aria-pressed"].forEach(name => speaker.node.removeAttribute(name));
    }
  });
}
function liveMessage(message) {
  live.message = message;
  updateLiveControls();
}
function renderLive() {
  uncertaintyNode.setAttribute("visibility", "hidden");
  if (live.line?.text) captionDisplay.show(live.line, 0);
  else captionDisplay.clear();
  speakerStatus.textContent = speakers[live.speakerId].name + " · Manually assigned";
  // A steady speaking shape is a visual indication, NOT audio-driven lip-sync.
  // No extra mouth animation clock or rendering loop is necessary for live input.
  updateSpeakingMouths(live.recognising ? [{ speakerId: live.speakerId, start: 0 }] : [], 170);
}

// Invalidating a session before aborting it rejects already-queued callbacks.
// Only stopping/leaving input retires the engine, never selecting a character.
function retireRecognition() {
  window.clearTimeout(live.retryTimer);
  live.retryTimer = null;
  ++live.generation;
  const recognition = live.recognition;
  live.recognition = null;
  live.recognising = false;
  if (!recognition) return;
  ["onstart", "onresult", "onerror", "onend", "onspeechstart", "onspeechend", "onnomatch"].forEach(name => { recognition[name] = null; });
  try { recognition.abort(); }
  catch { /* The engine may already have ended. */ }
}
function stopListening(clear = false) {
  live.wanted = false;
  retireRecognition();
  live.carry = "";
  if (clear) { live.line = null; captionDisplay.clear(); }
  liveMessage("Microphone off · Recognition stopped");
  if (inputMode === "microphone") renderConversation(playback.elapsed);
}
function recognitionFailure(code) {
  const messages = {
    "not-allowed": "Microphone permission denied. Allow microphone access in browser settings, then press Start Listening.",
    "service-not-allowed": "Speech recognition service unavailable or blocked by your browser.",
    "audio-capture": "Microphone unavailable. Check the device and browser microphone access.",
    "network": "Recognition failed: network or speech service unavailable. Press Start Listening to retry.",
    "language-not-supported": "British English recognition is unavailable in this browser.",
    "aborted": "Recognition stopped. Press Start Listening to retry.",
  };
  stopListening();
  liveMessage(messages[code] || "Speech recognition failed. Press Start Listening to retry.");
}
function beginRecognition() {
  if (!live.wanted || inputMode !== "microphone" || liveUnavailable) return;
  const ticket = live.generation;
  let recognition;
  try { recognition = new Recognition(); }
  catch { recognitionFailure("service-not-allowed"); return; }
  live.recognition = recognition;
  recognition.lang = "en-GB";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  const carry = live.carry;
  const carryAssignment = live.assignment;
  // Result indices survive interim corrections/finalisation within a session.
  // Ownership never changes when a character is selected, even if selected again.
  const resultAssignments = [];
  let utteranceAssignment = null;
  let finalText = carry;
  let finalAssignment = live.assignment;
  let hadResults = false;
  const current = () => live.wanted && inputMode === "microphone"
    && live.generation === ticket && live.recognition === recognition;
  recognition.onstart = () => { if (current()) liveMessage("Listening"); };
  recognition.onspeechstart = () => {
    if (!current()) return;
    utteranceAssignment = live.assignment;
    live.recognising = true;
    liveMessage("Recognising speech");
    renderConversation(playback.elapsed);
  };
  recognition.onspeechend = () => {
    if (!current()) return;
    live.recognising = false;
    liveMessage("Listening");
    renderConversation(playback.elapsed);
  };
  recognition.onresult = event => {
    if (!current()) return;
    // Each event is a replacement snapshot for this engine session. Rebuild it
    // rather than appending interim corrections or counting final words twice.
    const snapshot = Array.from(event.results);
    snapshot.forEach((result, index) => {
      if (resultAssignments[index] === undefined) {
        resultAssignments[index] = utteranceAssignment ?? live.assignment;
      }
    });
    // Browsers may remove trailing interim results and later reuse those indices.
    resultAssignments.length = snapshot.length;
    const results = snapshot.filter((result, index) => resultAssignments[index] === live.assignment);
    const textOf = result => result[0]?.transcript || "";
    const assignedCarry = carryAssignment === live.assignment ? carry : "";
    finalText = recentTranscript([assignedCarry, ...results.filter(result => result.isFinal).map(textOf)].join(" "));
    finalAssignment = live.assignment;
    const text = recentTranscript([assignedCarry, ...results.map(textOf)].join(" "));
    hadResults ||= snapshot.some(result => textOf(result).trim());
    live.recognising = results.some(result => !result.isFinal && textOf(result).trim());
    live.line = text ? { source: "microphone", speakerId: live.speakerId, text } : null;
    // Preserve ownership until a delayed final arrives after speechend.
    if (snapshot.every(result => result.isFinal)) utteranceAssignment = null;
    liveMessage(live.recognising ? "Recognising speech" : "Listening");
    renderConversation(playback.elapsed);
  };
  recognition.onnomatch = () => {
    if (!current()) return;
    live.recognising = false;
    liveMessage("Speech not recognised clearly. Please try again.");
    renderConversation(playback.elapsed);
  };
  recognition.onerror = event => {
    if (!current()) return;
    if (event.error === "no-speech") {
      live.recognising = false;
      liveMessage("No speech heard · Waiting to reconnect");
      renderConversation(playback.elapsed);
    } else recognitionFailure(event.error);
  };
  recognition.onend = () => {
    if (!current()) return;
    live.recognition = null;
    live.recognising = false;
    live.carry = finalAssignment === live.assignment ? finalText : "";
    live.emptyEnds = hadResults ? 0 : live.emptyEnds + 1;
    if (live.emptyEnds >= 3) {
      live.wanted = false;
      liveMessage("Recognition stopped after repeated silence. Press Start Listening to retry.");
    } else {
      liveMessage("Recognition ended · Reconnecting");
      live.retryTimer = window.setTimeout(() => {
        live.retryTimer = null;
        if (ticket === live.generation && live.wanted && inputMode === "microphone") beginRecognition();
      }, 400);
    }
    renderConversation(playback.elapsed);
  };
  liveMessage("Requesting microphone permission / connecting…");
  try { recognition.start(); }
  catch (error) { recognitionFailure(error.name === "NotAllowedError" ? "not-allowed" : "service-not-allowed"); }
}
function startListening() {
  if (inputMode !== "microphone" || live.wanted || liveUnavailable) return;
  live.line = null; live.carry = ""; live.emptyEnds = 0;
  ++live.assignment;
  live.wanted = true;
  ++live.generation;
  beginRecognition();
  renderConversation(playback.elapsed);
}
function clearLiveCaptions() {
  live.line = null; live.carry = ""; live.emptyEnds = 0;
  ++live.assignment;
  live.recognising = false;
  captionDisplay.clear();
  // Clear the presentation/assignment boundary, not the microphone session.
  if (live.wanted) liveMessage("Listening · New phrases assigned to " + speakers[live.speakerId].name);
  updateLiveControls();
  renderConversation(playback.elapsed);
}
function selectLiveSpeaker(id) {
  if (inputMode !== "microphone" || !speakers[id] || id === live.speakerId) return;
  live.speakerId = id;
  clearLiveCaptions(); // Existing/interim results keep their previous ownership.
}
function resetLive() {
  stopListening(true);
  live.speakerId = "alex";
  updateLiveControls();
}
function changeInputMode(mode) {
  if (mode === inputMode) return;
  if (inputMode === "scripted") pausePlayback();
  stopListening(true);
  cancelAnimationFrame(playback.frameId);
  Object.assign(playback, { status: "idle", elapsed: 0, anchorElapsed: 0, startedAt: 0, frameId: null });
  inputMode = mode;
  document.body.dataset.mode = mode;
  menu.open = false;
  resetConversationSettings();
  updateSpeakerPositions(0);
  updateSpeakingMouths([], 0);
  uncertaintyNode.setAttribute("visibility", "hidden");
  scriptedControls.hidden = mode === "microphone";
  liveControls.hidden = mode !== "microphone";
  document.getElementById("scene-mode-description").textContent = mode === "microphone"
    ? "Live microphone · Manually assigned speaker · Illustrated scene"
    : "Simulated conversation · Scripted speakers & movement";
  document.getElementById("mode-privacy").textContent = mode === "microphone"
    ? "Browser speech recognition · Manual speaker assignment" : "Original illustration · No microphone access";
  document.title = "AR Captioning Glasses · " + (mode === "microphone" ? "Live Microphone" : "Scripted Conversation");
  sceneDescription.textContent = mode === "microphone"
    ? "Three illustrated people: Alex on the left, Maya in the middle and Sam on the right. Select a character or their named button to manually assign browser-generated captions. This is not automatic speaker identification or accurate lip synchronisation."
    : scriptedDescription;
  liveMessage("Microphone off");
  updatePlaybackControls();
  renderConversation(0);
}

liveInput = { render: renderLive, stop: stopListening, reset: resetLive };
startListeningButton.addEventListener("click", startListening);
stopListeningButton.addEventListener("click", () => stopListening());
document.getElementById("live-clear").addEventListener("click", clearLiveCaptions);
document.getElementById("live-reset").addEventListener("click", resetToOriginal);
speakerButtons.forEach(button => button.addEventListener("click", () => selectLiveSpeaker(button.dataset.speaker)));
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener("change", () => { if (radio.checked) changeInputMode(radio.value); });
});
Object.entries(speakers).forEach(([id, speaker]) => {
  speaker.node.dataset.liveSpeaker = id;
  const face = speaker.face;
  speaker.node.prepend(svgNode("rect", {
    class: "speaker-selection", x: face.x - 3, y: face.y - 3,
    width: face.width + 6, height: face.height + 6, rx: 18,
    fill: "none", stroke: "#285b45", "stroke-width": 1.5, "stroke-dasharray": "4 3",
  }));
  speaker.node.addEventListener("click", () => selectLiveSpeaker(id));
  speaker.node.addEventListener("keydown", event => {
    if (inputMode === "microphone" && !menu.open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault(); selectLiveSpeaker(id);
    }
  });
});
window.addEventListener("pagehide", () => stopListening(true));
updateLiveControls();
