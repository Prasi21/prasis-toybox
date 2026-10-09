# Prasi's Toybox

A fun personal website: a growing collection of little games and toys with a bold
geometric / tessellation look. Built with **React + Vite**, deployed free on
**GitHub Pages**.

Currently inside the box:

| Toy | Status |
| --- | --- |
| Tic-Tac-Toe (2-player local) | ✅ Playable |
| Jeopardy (board library + play + final round) | ✅ Playable |
| 4 reserved slots | 🚧 Coming soon |

---

## Run it locally

```bash
npm install      # once
npm run dev      # start the dev server, open the printed URL
```

Other useful scripts:

```bash
npm run build    # type-check + build into dist/
npm run preview  # serve the production build locally
```

---

## Project structure

```
src/
  App.tsx                      # hash router + route table
  main.tsx                     # React entry
  pages/
    ToyboxHome.tsx             # homepage: hero + toy grid
  components/
    Tessellation.tsx           # the isometric-cube pattern (signature visual)
    ToyCard.tsx                # a single card in the toybox
    ToyStage.tsx               # full-screen focus view for simple toys
  games/
    TicTacToe.tsx              # first game
  jeopardy/
    types.ts                   # board data model
    loader.ts                  # fetches boards from public/boards/
    jeopardy.css               # jeopardy styling
    components/                # JBoard, JScoreboard, JClueOverlay, JFinal, JShell
    pages/                     # JeopardyLibrary, JeopardyPlay
public/
  boards/
    index.json                 # manifest: which boards exist
    *.json                     # one file per board
  favicon.svg
.github/workflows/deploy.yml   # auto-deploys to GitHub Pages on every push
```

### Design tokens

The palette (from a bold isometric-cube reference) is defined at the top of
`src/index.css` as CSS variables — change them there to re-skin the whole site:

```
--orange-500: #e8782e   (accent / "live" toys)
--indigo-600: #4a44a5   (secondary)
--navy-800:   #1b2541   (background)
--cream-100:  #f6f2e9   (cards / text)
```

---

## Adding a new toy

1. Simple toys live in `src/games/`. Create `src/games/MyGame.tsx` and export a component.
2. Add an entry to the `TOYS` array in `src/pages/ToyboxHome.tsx`:

   ```tsx
   {
     id: 'my-game',
     title: 'My Game',
     tagline: 'One line about it.',
     badge: 'Play',
     variant: 'indigo', // orange | indigo | navy | cream | mixed
     playable: true,
   }
   ```

3. Render it in the focus view near the bottom of `src/pages/ToyboxHome.tsx`:

   ```tsx
   {active.id === 'tic-tac-toe' && <TicTacToe />}
   {active.id === 'my-game' && <MyGame />}
   ```

   For a toy with its own pages (like Jeopardy), give the entry a `to: '/my-game'`
   instead and add a `<Route>` in `src/App.tsx`.

To *un-reserve* a "Coming Soon" slot, just swap its object for a real, playable
toy and give it a matching `variant`.

---

## Jeopardy

Jeopardy is its own section: a **board library** (`/#/jeopardy`) → **play**
(`/#/jeopardy/<board-id>`). Boards are plain JSON files in `public/boards/`,
fetched at runtime, so the site stays fully static — anyone can play, no accounts.

### Adding a board (by hand)

1. Create `public/boards/my-board.json`:

   ```json
   {
     "id": "my-board",
     "title": "My Board",
     "description": "One line about it.",
     "values": [200, 400, 600, 800, 1000],
     "categories": [
       {
         "id": "cat-1",
         "title": "Category One",
         "clues": [
           { "id": "c1-200", "value": 200, "prompt": "The clue text.", "answer": "The response." },
           { "id": "c1-400", "value": 400, "prompt": "...", "answer": "..." },
           { "id": "c1-600", "value": 600, "prompt": "...", "answer": "..." },
           { "id": "c1-800", "value": 800, "prompt": "...", "answer": "..." },
           { "id": "c1-1000", "value": 1000, "prompt": "...", "answer": "..." }
         ]
       }
     ],
     "final": {
       "category": "Final Jeopardy",
       "rules": ["Optional rules shown first"],
       "pages": [
         { "prompt": "Question one.", "answer": "Answer one." },
         { "prompt": "Question two.", "answer": "Answer two." }
       ]
     }
   }
   ```

2. Add it to `public/boards/index.json`:

   ```json
   { "boards": [{ "id": "my-board", "file": "my-board.json", "title": "My Board" }] }
   ```

A clue may also include:

- `"rules": ["...", "..."]` — extra rules/instructions shown with the clue (for
  mini-game tiles). Informational only; any scoring happens off-screen.
- `"image": "images/foo.webp"` — a path relative to `public/boards/`, or an absolute URL.
- `"answerImage": "images/foo-answer.webp"` — an optional image shown with the answer.
  Keep images optimised (WebP, ~1200px wide, under ~150 KB); the clue images live in
  `public/boards/images/`.
- `"revealSteps": ["Ready..", "Another hint"]` — staged reveals shown one at a time
  before the answer.

The answer is always hidden until the host clicks **Reveal answer**. Clues with an
empty `answer` skip straight to the scoring buttons. **Continue** / **Reveal answer**
always come with a **Back** button, and **Exit card** returns an accidentally opened
tile to the board unused.

> A built-in **browser editor** — a protected `/#/jeopardy/admin` page that commits
> boards back to the repo via the GitHub API — is planned but not built yet.

---

## Deploy to GitHub Pages (free)

### 0. One-time: put it on GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Prasi's Toybox"
git branch -M main
# create an empty repo named "prasis-toybox" on github.com, then:
git remote add origin https://github.com/<your-username>/prasis-toybox.git
git push -u origin main
```

### 1. Turn on Pages

On GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

The included workflow (`.github/workflows/deploy.yml`) will build the site and
publish it automatically on every push to `main`.

### 2. Visit your site

After the first run finishes (watch the **Actions** tab), your site is live at:

```
https://<your-username>.github.io/prasis-toybox/
```

> Because the build uses relative asset paths (`base: './'`), this works no matter
> what you name the repo — no config changes required.

### Optional: custom domain

Buy a domain (e.g. `prasistoybox.com`), then in **Settings → Pages → Custom
domain** enter it and follow GitHub's DNS instructions. Add a `public/CNAME`
file containing your domain so it isn't reset on each deploy.

---

## Other free hosts

The build output in `dist/` is plain static files, so it also drops straight onto
**Netlify**, **Cloudflare Pages**, or **Vercel** — point them at the repo, set the
build command to `npm run build` and the publish directory to `dist`.
