# Mg-slide-3D
3D HCP Magnesium Slip System Visualizer

## Mg-Slip 3D

A phone-friendly, interactive HCP magnesium crystal explorer built with Three.js.

### Run locally

The app is published on GitHub Pages at `https://xingliang12344-eng.github.io/Mg-slide-3D/`. To run it locally, serve this folder over HTTP (service workers require HTTP or HTTPS), then open the local address in a modern browser. For example, with Python installed:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. Three.js is loaded from jsDelivr, and optional web fonts use Google Fonts.

### Controls

- Enter plane indices as four integers `(h k i l)` and direction indices as `[u v t w]`; the first three indices must sum to zero.
- Drag to rotate, use the wheel or pinch to zoom, and use the view buttons for standard orientations.
- Toggle atoms, cell edges, basal plane, input plane, and input direction independently.
- Choose a preset slip system to populate a common plane and direction.
- The orientation marker reports normalized coordinates in the HCP standard triangle.
- On a supported browser, use the install button or browser menu to add the PWA to the home screen.

The crystallographic model uses the ideal HCP lattice with `a = 3.209 Å`, `c = 5.211 Å`. The IPF triangle marker is a compact visual mapping for exploration, not a calibrated diffraction or EBSD solution.
