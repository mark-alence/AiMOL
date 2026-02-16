# AiMOL

A browser-based 3D molecular structure viewer with a PyMOL-style command console and AI-powered natural language interface. Load any PDB file and explore it interactively — no install required.

## Try It

**[Launch AiMOL](https://mark-alence.github.io/AiMOL/)** — works on desktop and mobile.

## Features

- **Load structures** — drag-and-drop PDB files, fetch by ID from RCSB, or load multiple structures simultaneously
- **5 representation types** — ball-and-stick, spacefill, sticks, cartoon, and lines
- **PyMOL-style command console** — type commands like `color red, chain A` or `show cartoon` with familiar syntax
- **AI assistant** — describe what you want in plain English ("highlight the active site", "color by secondary structure") and Claude translates it to commands via an agentic tool-use loop that queries the loaded structure
- **Selection algebra** — PyMOL-compatible selections: `chain A`, `resi 1-50`, `resn ALA`, `name CA`, `helix`, `sheet`, boolean operators, and named selections
- **Post-processing** — SSAO and bloom with three quality levels (off / low / high)
- **Interaction detection** — visualize hydrogen bonds, salt bridges, and covalent contacts
- **Structure alignment** — Kabsch superposition for comparing multiple loaded structures
- **Spectrum coloring** — rainbow, blue-white-red, and other palettes across residues, chains, or B-factors
- **Responsive design** — touch-optimized controls on mobile with bottom-sheet console
- **Installable PWA** — add to home screen for app-like experience

## Commands

| Command | Example | Description |
|---|---|---|
| `color` | `color red, chain A` | Color atoms by name, element, or selection |
| `show` / `hide` | `show cartoon, helix` | Toggle representation visibility |
| `select` | `select active, resi 40+57+102` | Create named selections |
| `represent` | `represent sticks, chain B` | Change representation for a selection |
| `spectrum` | `spectrum rainbow` | Color by residue index with a gradient |
| `contacts` | `contacts hbonds` | Show hydrogen bonds, salt bridges, etc. |
| `align` | `align 1CRN, 4HHB` | Superimpose structures via Kabsch alignment |
| `zoom` / `center` | `zoom chain A` | Focus camera on a selection |
| `bg_color` | `bg_color black` | Change background color |
| `fetch` | `fetch 4HHB` | Load a structure from RCSB |
| `remove` | `remove solvent` | Delete atoms from the scene |
| `help` | `help` | List all available commands |

## Controls

### Desktop
| Input | Action |
|---|---|
| Left-drag | Rotate |
| Middle-drag | Pan |
| Scroll wheel | Zoom |
| Backtick (`` ` ``) | Toggle console |

### Mobile
| Input | Action |
|---|---|
| One-finger drag | Rotate |
| Pinch | Zoom |
| Console FAB button | Toggle console |

## Running Locally

No build step. Serve the directory with any static server:

```bash
npx serve .
python3 -m http.server
```

## Tech Stack

- **Three.js 0.162** — WebGL rendering, TrackballControls, CSS2D labels
- **React 18** — UI components via CDN (no JSX, no build)
- **Claude API** — AI mode uses tool-use for structure-aware natural language commands
- **Vanilla ES modules** — no bundler, all dependencies via CDN importmap

## License

MIT
