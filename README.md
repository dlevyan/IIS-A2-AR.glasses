# Intelligent Interactive Systems A2 — AR Captioning Glasses

A lightweight browser prototype exploring AR captions for Deaf and Hard-of-Hearing users.

## Project status

Stage 2 implements a 55.6-second scripted conversation with 12 turns between Alex, Maya and Sam. Play, Pause/Resume and Replay control one shared timeline. Replay resets character positions and word reveal.

One rounded speech bubble with a pointing tail follows the active speaker. Words appear progressively, with fixed line breaks and bubble size to avoid distracting reflow; the completed sentence remains visible for reading. Rule-based simulated intelligent placement considers left, right, above and below, checks all faces including the tail, and stays inside a lens. Sam's bubble changes from below to the side when Maya's move frees space. Prepared dialogue fits in two lines.

**Simulated:** dialogue, speaker identification and movement are prepared data, not speech recognition or computer-vision tracking. After explaining her move, Maya crosses into the empty chair beside Alex at 30.4–33.2 seconds. Her later bubbles follow her into the left lens. Placement and progressive reveal are implemented JavaScript logic. Physical glasses controls remain visual-only; menus, user-selected positions, customisation, saved preferences and microphone transcription remain unimplemented.

## Technology stack

HTML, CSS, vanilla JavaScript and original inline SVG; no dependencies, external assets or build step.

## Running or inspecting the work

Open [index.html](./index.html) in a modern browser. Click Play, use Pause/Resume to inspect captions, or Replay to restart immediately. Playback pauses when the tab becomes hidden. Reduced-motion preferences replace the animated slide with an immediate position change.

The desktop layout keeps glasses, playback buttons, temple inset and physical controls together. Narrow screens use internal glasses scrolling; short phones may also need vertical scrolling.

### Main files

- [index.html](./index.html): original illustration, reusable caption elements, accessible playback and physical controls.
- [script.js](./script.js): structured turns/movement, speaker geometry, caption measurement/placement, shared playback clock and press feedback.
- [styles.css](./styles.css): existing visual design, compact playback strip and responsive layout.
- [.gitignore](./.gitignore): local tooling, environment and generated-file exclusions.

## Development record

- **10–11 November 2026 — Stage 1:** created the scaffold and visual interface; refined the temples, compact controls and matching outside-right-temple inset.
- **13 November 2026 — Stage 2:** added structured conversation data, a reusable caption renderer and geometry-based placement so captions follow speakers, including a scripted movement. Browser checks with a controlled clock covered all 12 turns, movement samples, text/speaker matching, two-line wrapping, actual lens containment and face clearance. Verified a pause during movement, resume, replay reset, completion, keyboard activation and reduced-motion behaviour. Reviewed a paused rendered screenshot. Layout checks passed without page scrolling at 1366×768, 1280×720, 1440×900 and 1024×600. Editor diagnostics reported no HTML/CSS/JavaScript errors.
- **13 November 2026 — Conversation refinement:** added the destination chair, revised Maya's move, curved speech bubbles and stable word-by-word reveal. Controlled-clock checks at 58 timeline samples passed for revealed text, speaker switching, bubble/tail lens containment and face clearance. Verified destination alignment, visible below-to-left repositioning, paused movement/reveal, resume and replay reset. Inspected before/after screenshots and rechecked desktop fit; small phones still need scrolling.

Timing checks used a controlled browser clock, not a full real-time manual playthrough. Other browsers, physical devices, screen readers and DHH user evaluation have not been tested.

## AI assistance

OpenAI Codex assisted with the original SVG, interface, Stage 2 JavaScript, browser checks and documentation from the author's requirements. Author review and user evaluation remain pending. No Git commits, pushes or deployment were performed.

## Additional files

No accompanying documents or external assets are required.
