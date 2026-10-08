# Prasi's Toybox

A fun personal website: a growing collection of little games and toys with a bold
geometric / tessellation look. Built with **React + Vite**, deployed free on
**GitHub Pages**.

Currently inside the box:

| Toy | Status |
| --- | --- |
| Tic-Tac-Toe (2-player local) | ✅ Playable |
| 5 reserved slots | 🚧 Coming soon |

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
  App.tsx                     # page shell, hero, toy grid, modal wiring
  index.css                   # all styling + design tokens (the palette lives here)
  components/
    Tessellation.tsx          # the isometric-cube pattern (signature visual)
    ToyCard.tsx               # a single card in the toybox
    ToyStage.tsx              # the full-screen focus view that hosts a toy
  games/
    TicTacToe.tsx             # the first game
public/
  favicon.svg
.github/workflows/deploy.yml  # auto-deploys to GitHub Pages on every push
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

1. Create `src/games/MyGame.tsx` and export a component.
2. Add an entry to the `TOYS` array in `src/App.tsx`:

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

3. Render it in the focus view near the bottom of `src/App.tsx`:

   ```tsx
   {active.id === 'tic-tac-toe' && <TicTacToe />}
   {active.id === 'my-game' && <MyGame />}
   ```

To *un-reserve* a "Coming Soon" slot, just swap its object for a real, playable
toy and give it a matching `variant`.

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
