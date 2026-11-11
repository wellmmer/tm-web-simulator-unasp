# Computable: design, with release 1 in full

Date: 2026-11-11. Status: draft for Wellmmer's review. Open to other ideas.

This spec turns the 2016 capstone project "Simulador de Máquina de Turing" (UNASP, Computer
Science) into **Computable**: a modern web app that teaches the Turing machine, Turing's 1936
paper, Enigma and the Bombe. It covers the whole plan briefly and release 1 (R1) in detail.
Releases 2 to 5 each get their own spec later.

## 1. Who it is for and what it does

- **Audience:** Computer Science students, professors, and anyone curious about the Turing
  machine, the paper "On Computable Numbers, with an Application to the Entscheidungsproblem"
  (1936), Enigma and the Bombe.
- **Languages:** English by default. Also Brazilian Portuguese, Spanish, French and German.
- **The story the app tells:** a visitor encrypts a message on a working Enigma (1940), breaks it
  with the Bombe, then learns why a Turing machine (1936) could do the same work.
- **A history fact the app must get right** (from my own knowledge; standard history): Turing did
  not break Enigma with a Turing machine. The Turing machine is a mathematical model from 1936 and
  was never built. Enigma was broken with the Bombe (1940), designed by Turing and Gordon
  Welchman, based on the Polish bomba (Rejewski, 1938). Colossus (1944) broke the Lorenz cipher,
  not Enigma. Every page keeps these apart.

## 2. Releases

Each release has its own spec, plan and build, and goes live on its own.

| Release | Content |
| --- | --- |
| **R1** | Repo reset, the new app, the simulator, About, Support the dev, languages, dark mode, the tour. This spec. |
| R2 | Lessons: intuition, the formal 7-tuple, Entscheidungsproblem, halting problem, Church–Turing, the universal machine, "Read Turing's 1936 paper" with a scroll-driven tape. Quizzes. Lesson translations. |
| R3 | Enigma lab (Enigma I, plugboard, settings, real and practice messages). The lampboard becomes the Home page. A one-rotor cipher machine that runs in the simulator. |
| R4 | Bombe lab: crib, menu, drum wall, search in a background thread, history lesson. Breaks the visitor's own message from Home. |
| R5 | Enigma M4 (naval), then optional accounts with Supabase on the free tier. |

## 3. Decisions already made

| Topic | Decision |
| --- | --- |
| Name | Computable (from the paper's title). The repo keeps its name. |
| Repo | Same repo, `wellmmer/tm-web-simulator-unasp`. Tag the 2016 version `v1.0-tcc-2016`, then build at the root. |
| Textbook PDFs | Remove the Hopcroft and Sipser PDFs from all of git history (`git filter-repo`), with a backup bundle first. Your TCC paper stays. |
| Stack | One Next.js app with TypeScript, Tailwind, next-intl, MDX, React Flow, Motion and Zustand. |
| Engines | Turing machine, Enigma and Bombe logic live in `src/engines/` as plain TypeScript with no React. |
| Hosting | Vercel, team `chimpcode`. No cost allowed. |
| Saving | Browser storage, JSON file, and share link. Accounts come in R5 behind the same storage interface. |
| Language on first visit | Detect the browser language. Switch to it at once and show a bar: "Showing in Português. Switch to English?" Remember the choice. |
| Translations | English is the source. Wellmmer checks PT-BR. ES, FR and DE are AI-translated and show a "machine-translated, help improve it" note with a link to open a PR. |
| Lesson texts | Claude drafts them from the TCC and cited sources. Wellmmer reviews before anything ships. |
| Learning measure | Quizzes saved in the browser, plus cookieless free analytics. |
| Visual direction | Each lab in its own material: theory on squared paper, war machines on a bakelite panel. |
| Dark mode | Night paper from R1. |
| Tape | A setting per machine. New machines start one-sided. |
| Left edge of a one-sided tape | Sipser's rule: the head stays on cell 0. Machines imported from 2016 keep the old rule (reject). |
| Donations | One page plus a link in the menu and footer. Amount from $1, $5 preselected. PayPal, PIX, Revolut, Wise, Ko-fi, GitHub Sponsors. Links only: no payment data passes through the app. |
| License | MIT for the code (file `LICENSE`). CC BY 4.0 for lesson texts and other written content, stated in the README and in the lesson folder. |
| Payment handles | All handles live in one file, `src/config/support.ts`. The Support page hides any provider whose handle is empty, so the page can ship before every handle is known. |
| Design skills | `impeccable` is installed for this repo only (local scope). The taste-skill inspector and `/impeccable audit` run before launch. |

## 4. R1 scope

### 4.1 Repo reset

1. Make a backup bundle of the full repo.
2. Tag the current `master` as `v1.0-tcc-2016` and push the tag.
3. Remove `documentation/tcc/imports/articles/` from all history with `git filter-repo`.
   This rewrites every commit ID and needs a force-push. Wellmmer confirms right before the push.
4. Move the TCC paper and presentation to `docs/tcc/`. Delete the 2016 site files from `master`
   (they stay in the tag).
5. Rename `tms/exemplo.txt` to `examples/example.txt`.
6. Add `.superpowers/` to `.gitignore`.

### 4.2 Pages

| Page | Content |
| --- | --- |
| Home (temporary until R3) | Title, one sentence on what Computable is, and Turing's 1936 first machine running live on the tape. One button: "Open the simulator". |
| Simulator | Section 5. |
| About | The 2016 capstone project, UNASP, advisor Prof. Laercio Martins Carpes, author Wellmmer Lucas de Oliveira Pinto, a link to the TCC paper, and a link to the `v1.0-tcc-2016` tag. |
| Support the dev | Section 7. |
| Privacy | What the cookieless analytics counts. No personal data is stored. |

The menu holds the wordmark, Learn (shows "coming soon" until R2), Simulator, Enigma and Bombe
(both "coming soon" until R3 and R4), Support the dev, the language switcher, the theme switch,
and "? Tour".

## 5. The simulator

### 5.1 Layout (approved mockup `simulator-v4.html`)

- **Top:** the page title (the machine's name), the example picker and the input field.
- **The stage:** the tape across the full width on squared paper. The head is a red pencil circle
  with the current state in a tag above it. Cell numbers sit under the cells.
- **The step sentence** under the tape explains every step in words:
  "In q1 reading 1: write 0, move left, go to q1."
- **Controls:** Reset, Step back, Run/Pause, Step, and a speed control. Each button has an icon,
  a text label and its keyboard key.
- **The result line:** "Accepted after 9 steps. The tape now reads 1100."
- **Below, side by side:** the rule table (left) and the state diagram (right). On phones they
  stack. The current rule lights up red in the table row, the diagram arrow and the head at the
  same time.
- **Rule table headers:** "If in state", "and reading", "write", "move", "then go to".
- A third view, "Machine file", shows the JSON and allows import, export and share.

### 5.2 Engine (`src/engines/turing/`)

Plain TypeScript, no UI code.

**Machine file format** (also used in share links):

```json
{
  "format": "computable/machine@1",
  "name": "Binary +1",
  "tape": "one-sided",
  "blank": "_",
  "start": "q0",
  "accept": ["qA"],
  "reject": ["qR"],
  "input": "1011",
  "rules": [
    { "state": "q0", "read": "1", "write": "1", "move": "R", "next": "q0" }
  ]
}
```

- A symbol is exactly one Unicode character. Any character is allowed, including `,`.
- `move` is `L`, `R` or `S`.
- `tape` is `one-sided` or `two-way`.
- A rule holds a list of operations inside the engine. A modern rule is "print, then move". A
  Turing 1936 rule may be longer (for example `P0, R, R`) and may match "any symbol" or "blank".
  One engine runs both notations. The 1936 notation shows Turing's own state letters (𝔟, 𝔠, 𝔢, 𝔨)
  in a Fraktur face.

**Rules while running:**

- No rule for the current state and symbol: the machine halts and rejects. The screen says why:
  "Rejected: no rule for q3 reading 1".
- Reaching an accept state: accept. Reaching a reject state: reject.
- One-sided tape, head moves left from cell 0: the head stays on cell 0 (Sipser). The first time
  this happens, a note explains it. A 2016 import uses the old rule (reject).
- Step limit: 10,000 by default, adjustable. On reaching it: "Paused after 10,000 steps. This
  machine may never halt. Continue?"
- Step back: each step stores only the changed cell, the old state and the old head position.
- The tape stores only written cells.

**Import of 2016 `.txt` files:** line 1 is the start state, line 2 is the input, then rows of
`state,read,write,next,dir,`. `A` and `R` in the `next` column become accept and reject. A space
as the read symbol becomes the blank.

### 5.3 Examples shipped in R1

- Binary +1
- Palindrome checker
- Your 2016 machine (`examples/example.txt`)
- Turing's 1936 first machine (prints `0 1 0 1…`), in his notation

### 5.4 Keyboard

| Key | Action |
| --- | --- |
| `Space` | Run or pause |
| `→` | Step |
| `←` | Step back |
| `R` | Reset |
| `+` / `-` | Faster / slower |
| `E` or click a cell | Edit the tape: arrows move the cursor, type to write, `Backspace` writes the blank, `Esc` ends editing |
| `?` | Show all shortcuts |

Shortcuts are off while focus is in a text field. Screen readers hear each step in a live region,
spaced out while the machine runs.

### 5.5 The tour

- A "? Tour" button in the menu, and a one-time prompt on the first visit: "New here? Take the
  1-minute tour". The prompt can be dismissed for good.
- 7 steps, each with a spotlight on one part: the tape, the head and its state, the step
  sentence, the controls, the rule table, the state diagram, the keyboard and examples.
- The visitor acts during the tour (for example "Press Step and watch which row lights up").
- "Skip tour" is visible on every step.

### 5.6 Saving and sharing

- The current machine saves in browser storage after each change.
- "Download" and "Open file" use the JSON format above. "Open file" also takes 2016 `.txt` files.
- "Copy share link" puts the machine in the URL, compressed. If the link is still longer than
  about 8,000 characters, the app offers the file download instead.
- All storage calls go through one storage interface, so R5 can add accounts without changing the
  simulator.

## 6. Look and feel

**Two materials.**

| Material | Used on | Colors |
| --- | --- | --- |
| Squared paper | Home (until R3), Learn, Simulator, About, Support, Privacy | paper `#F4F7FB` with an 18px grid, ink `#1C2B4A`, pencil red `#B3261E`, cells `#FFFFFF`, soft `#E6EBF3`, muted text `#4A5570` |
| Night paper (dark mode) | Same pages | paper `#121A2C`, grid `rgba(140,170,230,.10)`, ink `#E3E9F5`, pencil red `#F2685C`, cells `#1B2640`, muted text `#9AA6BF` |
| Machine panel (R3, R4) | Enigma, Bombe, Home from R3 | bakelite `#23201C`, brass `#D4B67E`, lit lamp `#FFC857`, ivory `#ECE4D4`, drum red `#B23A2E`, yellow `#C9A227`, green `#3E7D4F` |

Night paper follows the system setting. A switch in the menu overrides it, and the app remembers
the choice.

**Type.** Spectral for headings and the step sentence. IBM Plex Sans for buttons, menus and body
text. JetBrains Mono only for tape symbols, rules and cipher text. Barlow Condensed only for the
brass plates on the machine panels. A Fraktur face only for Turing's state letters in 1936 mode.

**Icons.** Drawn for this app with a 1.8px line: book (Learn), tape with head pointer
(Simulator), rotor (Enigma), cabinet with two rows of drums (Bombe), cup with steam (Support the
dev). The current page's icon is pencil red. Plain UI icons (play, step, reset) come from Lucide.

**Motion.** One main moving element per page. Fast feedback on buttons. With "reduce motion" on,
nothing travels; the content stays.

**Accessibility.** WCAG AA contrast in both themes, a visible pencil-red focus outline, every
control works from the keyboard, and every control has an accessible name.

## 7. Support the dev

- Title: "Buy the dev a coffee".
- Amount buttons: $1, $3, $5 (preselected), $10, and "Other" (minimum $1).
- Payment options, all links:
  - PT-BR visitors see PIX first (QR code plus the copy-paste key).
  - Others see PayPal and Ko-fi first. Revolut and Wise sit under "More ways to pay".
  - GitHub Sponsors appears as a link here and as the repo's Sponsor button.
- Where a provider supports it, the link carries the chosen amount. Otherwise the donor types it.
- A thank-you line. No payment data passes through the app.

## 8. Errors and empty states

| Situation | What the app shows |
| --- | --- |
| Two rules for the same state and symbol | The row turns red: "Two rules for q1 reading 1. A Turing machine needs exactly one." Run stays disabled until fixed. |
| Empty field, or a symbol longer than one character | The field is marked, with a short hint next to it. |
| A next state with no rules | "q5 has no rules yet. The machine will stop there and reject." |
| A bad import file | "This file is not a Computable machine (line 3: missing `rules`)". 2016 files get the row number. |
| Share link too long | "This machine is too big for a link. Download it as a file instead." |
| Browser blocks storage | "This browser won't keep your machine after you close it." The app keeps working. |
| Step limit reached | The pause message from 5.2. |
| New machine with no rules | "Your machine has no rules yet. Add the first rule, or start from an example." with both buttons. |

## 9. Testing

- **Engine (Vitest):** every rule type, the left edge, `S` moves, the step limit, reject on a
  missing rule, the 2016 import of `example.txt`, and the 1936 machine printing `0 1 0 1`.
  Property tests (fast-check) on random machines: N steps then N step-backs gives back the exact
  start; save then load gives back the same machine.
- **Screens (Testing Library):** table errors, shortcuts switched off in text fields, the
  language bar, the theme switch.
- **End to end (Playwright):** each example reaches the right result, a share link opens the same
  machine, the tour finishes, and an axe accessibility check runs on every page in both themes.
  Screenshots at 390, 768 and 1440 pixels wide.
- **Design checks before launch:** the taste-skill inspector, `/impeccable audit` and
  `/impeccable critique`.
- **CI:** GitHub Actions runs typecheck, lint and all tests on every PR. Vercel builds a preview
  link for every PR.

## 10. R1 is done when

- Lighthouse scores performance at 90 or more and accessibility at 100.
- Every UI string exists in all 5 languages. A missing string fails the build.
- The privacy note is live.
- Wellmmer has confirmed every payment handle on the Support page.
- The history rewrite is done, with the backup bundle kept, and the tag `v1.0-tcc-2016` exists.
- The `chimpcode` Vercel plan is confirmed to add no cost.
- The README matches what is live.

## 11. Open checks (each must be checked before it is relied on)

| Claim | Source |
| --- | --- |
| Free Supabase projects pause after about 7 days without activity. | From my own knowledge. Matters only in R5. |
| A Vercel team usually needs the paid Pro plan; Hobby is for personal accounts. | From my own knowledge. Wellmmer checks the `chimpcode` plan. |
| Turing's 1936 paper is public domain in the UK since 2025 (Turing died in 1954). | From my own knowledge. Check before quoting the paper's text at length. |
| PayPal.me links can carry an amount; Revolut and Wise links may not. | From my own knowledge. Check each provider. |
| Ko-fi takes no platform fee on one-off donations. | From my own knowledge. Check before launch. |
| A short crib like a name gives the Bombe too many false stops. | From my own knowledge. Matters in R4. |
| Enigma I simulation is correct. | Checked: a test implementation encrypts `AAAAA` to `BDZGO` with rotors I-II-III, reflector B, rings and start `AAA`. |

## 12. Questions still open

- Wellmmer gives the real payment handles (PayPal, PIX key, Revolut, Wise, Ko-fi, GitHub Sponsors) before the Support page goes live. Until then, the page shows only the providers that have a handle.
