# Findings

- 2026-07-07 14:55: The presentation is a static HTML/CSS deck. Each page duplicates `resizeSlides()` and currently uses a `1920x1080` design canvas, which makes 12-16px text render around half-size in normal windowed mode.
- 2026-07-07 14:58: A 1080px-wide design baseline matches `.slide-container { width: min(100%, 1080px); aspect-ratio: 16 / 9; }`, so scaling should use `1080x607.5` instead of enlarging all slide CSS rules individually.
- 2026-07-07 15:03: Native browser fullscreen usually exits on HTML page navigation, so cross-module continuity needs a persisted `fullscreen-active` presentation layout state.
- 2026-07-07 15:12: Module copy source files are markdown extraction tables; HTML should keep existing layout/image placeholders while replacing visible text to match those tables.
- 2026-07-07 15:34: `module3.html` and `module4.html` already contain complete slide copy and speaker-note copy, so the new extraction files can be generated directly from the current HTML without changing the HTML pages.
- 2026-07-07 15:55: Meeting-minutes gaps were concentrated in module 4 meeting statistics/roles/reminders, module 3 annual repair count, and module 1 paper consumption; these can be patched without touching layout structure.
- 2026-07-07 16:05: During native fullscreen page navigation, the browser fires an exit event before the next HTML loads; preserving the presentation fullscreen state requires ignoring that exit while navigation is already in progress.
- 2026-07-07 16:12: Static HTML pages cannot reliably fetch local markdown directly under `file://`; using markdown as the source and a generated browser JS data file keeps one editable copy while preserving offline opening.
