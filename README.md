# Intelligent Interactive Systems A2 — AR Captioning Glasses

A lightweight prototype exploring AR captions for Deaf and Hard-of-Hearing users.

## Project status

Scripted Conversation and Live Microphone share the same glasses, SVG captions and physical settings controls. The compact settings overlay remains inside the **right lens only**, with paging, selection highlighting and Back. The original shared bench, 39.7-second scripted conversation, moving speakers and playback controls are retained.

Available customisation:

- Caption Position: Automatic, Left, Below, Right.
- Text Size: Small, Medium (default), Large.
- Text Colour: White, Yellow, Black.
- Bubble Background: Dark translucent, Dark opaque, Light opaque.
- Caption Mode: Speaker-registered or Head-fixed.
- Captions On/Off.

Speech bubbles still reveal words progressively and roll the latest two lines. Changing size recomputes wrapping and bubble dimensions. Incompatible colours/backgrounds are adjusted with feedback.

Subtle three-shape mouth movements identify the speaking character using the same prepared dialogue clock. Pause freezes the current shape; silent gaps, completion and Reset to Original close all mouths. Reduced-motion preferences disable continuous mouth animation. This is timing-based visual simulation, not audio-driven lip synchronisation.

A prepared interruption overlaps Alex and Sam at **26.2–27.5 seconds**. Both mouths animate, but a neutral amber **Overlapping speech · Speaker uncertain** indicator replaces dialogue captions. It explicitly reports that words are not displayed; omitted speech is not attributed or replayed. Sam continues at 27.5 seconds with “Green has more room for sketches.” Normal captions and their reading hold then resume. Captions Off also hides the in-lens uncertainty indicator; the playback status still communicates uncertainty. This is scripted uncertainty, not recognition or confidence estimation.

**Simulated:** scripted dialogue, speaker identity, movement and uncertainty are prepared data, not audio/video detection. **Implemented:** shared caption presentation, face/lens safety, progressive scripted reveal, customisation, playback, browser preference storage and browser speech recognition. Live speaker assignment is manual, not diarisation; its steady mouth shape is an indication, not lip-sync.

Live Microphone uses `SpeechRecognition` / `webkitSpeechRecognition` with `en-GB` and interim results. Select a character or Alex/Maya/Sam button, then explicitly press **Start Listening**. Corrected interim results replace earlier guesses; final results are not appended twice. Latest text rolls through two lines. Stop retains the last caption; Clear, changing speaker or switching modes clears it. **Speaker selection and Clear keep the same recognition object/session active**: neither starts, stops nor aborts the microphone. Each recognition result retains its original assignment through interim corrections and finalisation, so old words cannot move to a new speaker. Switch at phrase boundaries: an in-progress old phrase is omitted after switching, and fresh results belong to the new selection. Speech-start ownership also protects a delayed first result. This is conservative manual assignment, not word-level diarisation.

Recognition reconnects only after the engine itself ends while listening is still requested, and stops after three consecutive empty sessions or a fatal error. A legitimate restart can still require browser permission; the application cannot override Chrome's permission/security policies. Stop, Reset, leaving the mode, hiding or leaving the page cancels listening and pending retries.

Only caption preferences are saved. Transcripts stay in bounded memory; this website does not record audio. The browser may send audio to its speech service, so network access and provider privacy policies can apply. Recognition support is limited and accuracy is not guaranteed; see [MDN's SpeechRecognition documentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Technology stack

HTML, CSS, vanilla JavaScript and original inline SVG. No frameworks, dependencies, external assets or build step.

## Running or inspecting the work

Open [index.html](./index.html). Use Play, Pause/Resume and Replay as before.

For microphone use, serve this folder at **localhost or HTTPS** in a browser supporting Web Speech recognition. For example, if Python 3 is already installed, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`. No build step is needed. Direct `file:` access, embedded previews and browser/platform policies can prevent recognition even when the API exists. Unsupported or insecure environments show an explanation and disable Start Listening, without affecting scripted playback. Allow microphone access when prompted; denied permission may need changing in the browser's site settings. Preferences belong to the current browser/origin, so file and localhost preferences may differ.

- Round menu button: open/close Settings.
- Plus/minus: move up/down. Centre button: select.
- Keyboard: Up/Down arrows, Enter to select, Escape to go back/close.
- Quick-position button: cycle Automatic → Left → Below → Right; always temporary.

Browsing options previews changes without saving. Back/close cancels an unconfirmed preview. Confirm a value, then choose **Use for this conversation** or **Save as default**. Temporary choices do not overwrite saved defaults; switching input modes starts fresh from saved defaults. The existing scripted Replay retains current conversation settings. Defaults persist in localStorage for this browser/origin; blocked storage leaves the change temporary and reports the failure. Reset to Original stops input, clears captions and saved preferences, and restores built-in defaults.

Speaker-registered bubbles follow people and prefer the requested side when safe. Head-fixed bubbles stay at the bottom of the left lens, with a speaker label. Position preferences are retained for speaker-registered mode; they do not move the head-fixed overlay.

Unsafe side choices use an announced safe alternative. Live captions temporarily use a safe left-lens position if Settings occupies their usual lens, returning on close. If no safe space exists, captions are hidden with feedback rather than drawn over faces or outside a lens; input is not automatically paused. Captions Off hides bubbles without stopping dialogue, movement or recognition.

### Main files

[index.html](./index.html) contains the illustrations and mode controls; [script.js](./script.js) handles shared captions, settings, storage, geometry and scripted playback; [live.js](./live.js) adds recognition lifecycle, manual speaker selection and mode cleanup; [styles.css](./styles.css) styles the responsive interface. [.gitignore](./.gitignore) excludes local/generated files.

## Development record

- **10–11 November 2026 — Stage 1:** scaffold, original glasses/scene and compact physical controls with matching temple inset.
- **13 November 2026 — Stage 2:** scripted conversation, speaker movement, speech bubbles and progressive rolling text.
- **14 November 2026 — Stage 3A:** temporary quick-position preferences, safe fallback and accessible feedback.
- **14 November 2026 — Stage 3B:** added the clipped menu, live previews, separate temporary/saved preferences, contrast adjustment, size-aware wrapping and head-fixed mode. Browser checks covered all categories through physical controls, keyboard navigation, preview cancellation, Replay, reload persistence, captions-off movement and storage failure/invalid-data handling. A geometry/text audit passed 576 caption combinations and 47 menu screens. Reviewed a rendered screenshot and checked desktop viewport fit. Test-created saved preferences were cleared afterward.
- **14 November 2026 — Mouth animation:** isolated the existing SVG mouths and added clock-driven speech shapes without changing character movement or caption logic. Controlled-clock browser checks covered all speakers, silent movement, pause/resume, Replay, Reset, reduced-motion playback, settings and reload persistence. A 52-sample timeline audit found no inactive-speaker animation or mouth/caption geometry failures; reviewed rendered faces before and after Maya moved. Desktop layout fit at 1262 × 710. Test preferences were removed afterward.
- **15 November 2026 — Overlapping speech:** added explicit speaking durations alongside caption hold durations and an array of simultaneously speaking turns, all using the existing clock. Added one 1.3-second interruption and an unattributed, lens-clipped uncertainty indicator. Controlled-clock browser checks passed for overlap boundaries, two moving mouths, caption holds/recovery, pause/resume, Replay, Reset, Maya's movement, reduced motion, both display modes, physical/keyboard settings during playback, previews, visibility and saved-default reload. A 576-case placement/text audit passed across modes, sizes, positions, menu states and timeline samples. Reviewed the overlap screenshot and desktop viewport fit; test-created defaults were removed.
- **25 November 2026 — Live Microphone:** added a separate input adapter reusing the caption renderer, with manual assignment, interim corrections, bounded two-line text, session invalidation, explicit listening controls, retry/error handling and privacy feedback. Created `feature/live-microphone` before edits and preserved the existing uncommitted caption-label change. Browser tests used a mock recognition engine: corrections/finals, all speakers, delayed results, clear/stop, silence/reconnect, denied permission/network errors, unsupported/insecure environments, settings/previews, preference reload/reset and repeated mode changes passed. A 960-case comparison against the pre-edit scripted code matched; a 432-case live geometry/text audit passed. Controlled-clock scripted playback completed, paused/resumed, replayed and reset correctly. Reviewed the live screenshot and desktop viewport fit. Test preferences were restored.
- **25 November 2026 — Speaker-switch permission fix:** traced character selection through Clear to abort/new recognition/start, which unnecessarily re-entered Chrome's microphone-access flow. Replaced those restarts with per-result assignment boundaries, preserving old interim/final ownership and excluding old-speaker carry on genuine reconnects. Browser instrumentation with simulated recognition passed 30 repeated selections using exactly one object and one start, with zero stops/aborts before explicit Stop. Checked SVG/keyboard selection, corrections, delayed finals/first results, Clear, legitimate end/reconnect, pending-retry cancellation, live settings and complete scripted playback/pause/resume/overlap/replay. Actual Chrome microphone prompts still require manual verification.

**Still requires manual verification:** actual microphone permission prompts, spoken en-GB transcription, real-engine silence/restart behaviour and provider/network availability. Select each speaker, speak a sentence, check interim corrections and final text, change Settings while listening, then stop and switch modes. Mock tests verify application handling, not real recognition accuracy or hardware access.

Timing checks used a controlled browser clock rather than a complete real-time manual playthrough. Other browsers, physical devices, screen readers and DHH user evaluation remain untested. Short/narrow screens may need scrolling; localStorage availability can differ between browsers, particularly for local files.

## AI assistance

OpenAI Codex assisted with implementation, original SVG, browser checks and documentation from the author's requirements. Author review remains pending. No commits, pushes or deployment were performed.

## Additional files

No accompanying documents or external assets are required.
