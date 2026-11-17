# Intelligent Interactive Systems A2 — AR Captioning Glasses

A lightweight prototype exploring AR captions for Deaf and Hard-of-Hearing users.

## Project status

Stage 3B adds a working settings overlay inside the **right lens only**. It shows up to three rows, with paging, selection highlighting and Back. The 80%-opaque green-grey panel keeps the scene faintly visible. The original glasses, shared bench, 39.7-second scripted conversation, moving speakers and playback controls are retained.

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

**Simulated:** dialogue, speaker identity and Maya's movement are prepared data, not audio/video detection. **Implemented:** face/lens/menu-aware placement, progressive reveal, customisation, playback and browser preference storage. Microphone transcription remains unavailable.

## Technology stack

HTML, CSS, vanilla JavaScript and original inline SVG. No frameworks, dependencies, external assets or build step.

## Running or inspecting the work

Open [index.html](./index.html). Use Play, Pause/Resume and Replay as before.

- Round menu button: open/close Settings.
- Plus/minus: move up/down. Centre button: select.
- Keyboard: Up/Down arrows, Enter to select, Escape to go back/close.
- Quick-position button: cycle Automatic → Left → Below → Right; always temporary.

Browsing options previews changes without saving. Back/close cancels an unconfirmed preview. Confirm a value, then choose **Use for this conversation** or **Save as default**. Temporary choices reset to saved defaults on Replay/new conversation. Defaults persist in localStorage for this browser/origin; blocked storage leaves the change temporary and reports the failure.

Speaker-registered bubbles follow people and prefer the requested side when safe. Head-fixed bubbles stay at the bottom of the left lens, with a speaker label. Position preferences are retained for speaker-registered mode; they do not move the head-fixed overlay.

The right-lens menu occupies space, so automatic placement may move a bubble below it. Unsafe side choices use an announced safe alternative. If no safe space exists, playback pauses and asks the user to close Settings, retaining the caption text. Captions Off hides bubbles without stopping dialogue or movement.

### Main files

[index.html](./index.html) contains the illustrations and lens overlays; [script.js](./script.js) handles settings, storage, menu navigation, geometry, reveal and playback; [styles.css](./styles.css) preserves the responsive interface. [.gitignore](./.gitignore) excludes local/generated files.

## Development record

- **10–11 November 2026 — Stage 1:** scaffold, original glasses/scene and compact physical controls with matching temple inset.
- **13 November 2026 — Stage 2:** scripted conversation, speaker movement, speech bubbles and progressive rolling text.
- **14 November 2026 — Stage 3A:** temporary quick-position preferences, safe fallback and accessible feedback.
- **14 November 2026 — Stage 3B:** added the clipped menu, live previews, separate temporary/saved preferences, contrast adjustment, size-aware wrapping and head-fixed mode. Browser checks covered all categories through physical controls, keyboard navigation, preview cancellation, Replay, reload persistence, captions-off movement and storage failure/invalid-data handling. A geometry/text audit passed 576 caption combinations and 47 menu screens. Reviewed a rendered screenshot and checked desktop viewport fit. Test-created saved preferences were cleared afterward.
- **14 November 2026 — Mouth animation:** isolated the existing SVG mouths and added clock-driven speech shapes without changing character movement or caption logic. Controlled-clock browser checks covered all speakers, silent movement, pause/resume, Replay, Reset, reduced-motion playback, settings and reload persistence. A 52-sample timeline audit found no inactive-speaker animation or mouth/caption geometry failures; reviewed rendered faces before and after Maya moved. Desktop layout fit at 1262 × 710. Test preferences were removed afterward.
- **15 November 2026 — Overlapping speech:** added explicit speaking durations alongside caption hold durations and an array of simultaneously speaking turns, all using the existing clock. Added one 1.3-second interruption and an unattributed, lens-clipped uncertainty indicator. Controlled-clock browser checks passed for overlap boundaries, two moving mouths, caption holds/recovery, pause/resume, Replay, Reset, Maya's movement, reduced motion, both display modes, physical/keyboard settings during playback, previews, visibility and saved-default reload. A 576-case placement/text audit passed across modes, sizes, positions, menu states and timeline samples. Reviewed the overlap screenshot and desktop viewport fit; test-created defaults were removed.

Timing checks used a controlled browser clock rather than a complete real-time manual playthrough. Other browsers, physical devices, screen readers and DHH user evaluation remain untested. Short/narrow screens may need scrolling; localStorage availability can differ between browsers, particularly for local files.

## AI assistance

OpenAI Codex assisted with implementation, original SVG, browser checks and documentation from the author's requirements. Author review remains pending. No commits, pushes or deployment were performed.

## Additional files

No accompanying documents or external assets are required.
