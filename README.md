# Into the lighthouse — Immersive Film Built with Blender & Three.js

A personal exploration of how to translate emotional storytelling and hand-crafted visual art into a browser-native experience, merging Blender’s artistic freedom with Three.js real-time interactivity.

Inspired by projects like [**Quill.art**](https://quill.art/) — the VR painting and animation tool — and [**Theater Elsewhere**](https://www.meta.com/en-gb/experiences/theater-elsewhere/2515021945210953/), which showcase immersive, hand-painted worlds, as well as the landscapes of [**Land's End**](https://www.landsendgame.com/) VR game and even older web experiments merging music and visuals like [Rome](https://rome.mrdoob.com/).

## Case Study

A detailed case study is available at [unboring.net/cases/into-the-lighthouse](https://unboring.net/cases/into-the-lighthouse), where you can dive deeper into the narrative, technical workflow, and creative decisions behind the project.

## Tech Stack

- **Blender** — 3D modeling, animation & camera design (EEVEE preview).
  The `.blend` file is included in `/sources` to export `scene.glb` used in Three.js.
- **Three.js** — Real-time 3D rendering on the web.
- **Ableton Live** — Soundtrack and ambient sound design.
  The `.als` project is included in `/sources` to export `ambient.mp3`.
  Part of the ambient track was generated using [ableton-mcp](https://github.com/ahujasid/ableton-mcp).
- **React** — UI and app structure.
- **GSAP** — Animations for 2D / DOM elements.
- **TailwindCSS** — Minimal UI styling.
- **Zustand** — Lightweight state management for communication between React and Three.js (and vice versa).
- **Vite** — Fast modern build setup.

### Requirements

This project uses local HTTPS with custom certificates for development.

If you don't have the required certificate files, you can generate them automatically:

```sh
npm run generate-cert
```

This will create two files in the project root:

- `certificate.pem`: Your SSL certificate
- `key.pem`: Your private key

> ⚠️ **Important**: These files are **not included** in the repository and should **never** be committed. Make sure to add them to `.gitignore`.

## Getting Started

```sh
npm install
npm run generate-cert
npm run dev
```

Then open https://localhost:8080 to

## License

MIT — Feel free to remix, adapt, and share, just credit the original.
