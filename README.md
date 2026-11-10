# Intelligent Interactive Systems A2 — AR Captioning Glasses

## Project status

Stage 1: visual interface prototype for AR captioning glasses for Deaf and Hard-of-Hearing (DHH) users.

- Original inline SVG glasses with black rectangular frames, outward temples, and three distinct controls on the visible right temple.
- One continuous illustrated scene of three people seated around a table, visible through both lenses. A static bubble beside a speaker reads “Hello everyone, how are you?”
- Enlarged caption-position, hourglass navigation (+ / confirm / −), and circular menu controls. Buttons provide hover, keyboard focus and temporary press feedback only.
- Scripted Conversation appears selected; Live Microphone is disabled and marked “Coming soon”. Neither mode runs a conversation.
- Compact simulation workspace with a small mode selector and a card-free control strip. Both lenses dominate the view; short, gently angled temples carry subtle button markings. On narrow screens, the glasses view scrolls horizontally to preserve detail.

Everything inside the lenses is illustrated and simulated. Speech recognition, timed playback, intelligent caption positioning, functional menus and saved preferences are **not implemented**.

## Technology stack

- HTML for semantic structure, labelled native controls, and the original SVG illustration.
- CSS for the layout, frame materials, control styling, responsive behaviour, focus states and reduced-motion support.
- Vanilla JavaScript for brief press feedback only.
- OpenAI Codex for AI-assisted implementation and documentation.

No frameworks, dependencies, build step, external fonts, product photographs or remote assets are used.

## Running or inspecting the work

Open [index.html](./index.html) in a modern browser. No installation or server is required for this stage. A local static server can also be used, but was not needed for the checks below.

Use Tab to focus the controls and Enter or Space to press them. On smaller screens, swipe/scroll inside the glasses view, or focus it and use horizontal arrow keys. Pressing controls does not change captions or open menus.

### Main files

- [index.html](./index.html): page content, modes, SVG glasses and shared scene, static caption and accessible enlarged controls. Named SVG groups and `data-control` attributes provide future integration points.
- [styles.css](./styles.css): page layout, visual materials, responsive breakpoints and interaction feedback.
- [script.js](./script.js): temporary pressed-state styling, without simulation logic.
- [.gitignore](./.gitignore): excludes local editor files, generated output, dependencies, logs and environment files.

## Development record

| Date | Stage | Changes and checks |
| --- | --- | --- |
| 10 November 2026 | Initial scaffold | Created the HTML, CSS and JavaScript entry points, README and Git ignore rules. No simulator functionality or browser testing at this step. |
| 10 November 2026 | Stage 1 — visual interface | Replaced the placeholder with original SVG glasses, a coherent illustrated scene, static caption, mode selector and enlarged physical controls. Inspected browser rendering and screenshots. Checked layout at 320, 390, 768, 1024 and 1440 CSS-pixel widths: no page-level horizontal overflow; internal glasses scrolling and card breakpoints behaved as intended. Verified Enter activation and focus visibility on all five button actions, Space activation on caption position, and mouse press/release feedback. Scripted mode remained selected and microphone mode disabled. No JavaScript errors were observed during the checked interactions; the editor reported no HTML/CSS/JavaScript diagnostics. |

Also checked mouse hover styling, horizontal arrow-key scrolling within the glasses view, and disabled transitions under the browser's reduced-motion setting.

Stage 1 refinement (10 November 2026): removed the marketing hero, tightened the SVG crop, shortened the temples and replaced large control cards with a compact strip. Browser layout checks confirmed no vertical or horizontal page overflow at 1366×768, 1280×720, 1440×900 and 1024×600, with glasses and controls visible together. Also checked 390×844 (fits vertically, glasses scroll internally) and 320×568 (vertical scrolling needed). All five button actions retained Enter activation and visible focus; the default/disabled mode states remained correct. No simulation functionality was added.

These are development checks in the available integrated browser, not a full accessibility audit or cross-browser certification. Physical mobile devices, screen readers and evaluation with DHH users have not been tested. No Git commits, pushes or deployment were performed by the AI assistant.

## AI assistance

OpenAI Codex helped create the initial scaffold and implement Stage 1 from the author's requirements: original SVG glasses and people, CSS styling, accessible HTML controls and minimal JavaScript press feedback. It also updated this README and used browser inspection, viewport checks and keyboard/mouse checks to review the result. Website workflow guidance was used for local-only development; nothing was published.

The interface is ready for the author's review and refinement before Stage 2. The AI-generated code and illustration have not yet been independently evaluated by the author or representative users.

## Additional files

No accompanying documents, external image assets or ZIP files are required. The original artwork is embedded in [index.html](./index.html).
