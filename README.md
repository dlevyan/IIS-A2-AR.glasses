# Intelligent Interactive Systems A2 — AR Captioning Glasses

**README prose word count:** 445

## Overview and project status

A browser-based prototype exploring how Deaf and hard-of-hearing (DHH) users could follow group conversations through AR captions. Both modes use the same illustrated glasses, caption positioning and controls.

- **Implemented:** Scripted playback; live microphone transcription with manual Alex/Maya/Sam selection; two-line speaker-associated or fixed captions; position, size, colour, background and on/off settings; safe-placement feedback and saved preferences.
- **Simulated:** Scripted dialogue, speaker movement and overlapping-speech uncertainty; physical glasses buttons.
- **Not implemented:** Physical glasses, camera tracking, automatic speaker diarisation, live overlap detection and preference learning.

## Technology

HTML, CSS, vanilla JavaScript and SVG; `localStorage` saves caption preferences. Live transcription uses the browser's Web Speech API (`SpeechRecognition`, `en-GB`). No separate model, backend, API key or build dependencies are required. Recognition depends on browser support and may use an external speech service. Audio and transcripts are not stored by this application.

## Run and inspect

From the repository folder, start a local server:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in Chrome.

- **Scripted Conversation:** Press Play; observe speaker changes, Maya moving and the overlap notice. Try Pause, Replay and Reset.
- **Live Microphone:** Select Alex, Maya or Sam, press **Start Listening**, grant microphone permission and speak. Switch speakers between phrases; press **Stop Listening** when finished.
- **Settings:** Round button opens the menu; +/− navigates and centre selects. Try caption placement, appearance, Fixed in View and saving defaults. The quick-position button changes placement without opening Settings.

The scripted mode needs no microphone. Live mode requires browser support, permission and localhost or HTTPS; recognition errors and inaccurate transcripts are possible.

## Development record

- **10/11/12/13 Nov 2026 — Initial prototype:** Built the glasses illustration, physical-style controls and scripted conversation to demonstrate speaker changes and movement.
- **14–15 Nov — Caption interaction:** Added placement fallbacks, settings previews, saved defaults, mouth animation and scripted overlap uncertainty. Codex reported checks of caption placement, playback, keyboard navigation and settings persistence.
- **25 Nov — Live input:** Added Web Speech recognition and manual speaker selection while retaining the scripted mode. Codex reported simulated-recognition and regression checks.
- **25 Nov — Correction:** My Chrome testing revealed repeated permission prompts when changing speakers. Codex revised the recognition lifecycle; I retested live captions and speaker switching in Chrome.

See the repository commit history for development evidence. Real-world DHH usability, other browsers and physical glasses have not been evaluated.

## AI assistance

I used **OpenAI Codex** to help build, test and debug the prototype. I used **ChatGPT** to refine report wording and help structure the architecture diagram; I checked the descriptions against the prototype. I created the storyboards from prototype screenshots and arranged them in Canva myself.

## Supporting material

The A2 report contains the architecture diagram, storyboards, rationale and references.
