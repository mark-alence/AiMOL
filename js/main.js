// ============================================================
// main.js — PDB Viewer entry point
// ============================================================

import { ViewerEvents } from './events.js';
import { ViewerApp } from './ui.js';
import { scene, camera, renderer, cssRenderer, controls, updateControls, resize } from './renderer.js';
import { PDBViewer } from './pdb/viewer.js';
import { createCommandInterpreter, setRepChangedCallback } from './pdb/commands.js';
import { createLegendOverlay } from './pdb/legendOverlay.js';

let pdbViewer = null;
let cmdInterpreter = null;
let legendOverlay = null;
let animFrameId = null;

// --- React mount ---
const uiRoot = document.getElementById('ui-root');
ReactDOM.createRoot(uiRoot).render(React.createElement(ViewerApp));

// --- Render loop ---
function loop() {
  animFrameId = requestAnimationFrame(loop);
  updateControls();
  if (pdbViewer) {
    pdbViewer.render();
  }
  cssRenderer.render(scene, camera);
}

// --- Enter viewer mode ---
ViewerEvents.on('enterViewerMode', (data) => {
  pdbViewer = new PDBViewer(scene, camera, controls, renderer);
  pdbViewer.setQuality(data.quality || 'low');

  // Start render loop
  if (animFrameId == null) {
    loop();
  }

  // Load PDB data
  const result = pdbViewer.loadFromText(data.pdbText, data.name);
  if (result) {
    const info = pdbViewer.getInfo();
    ViewerEvents.emit('viewerLoaded', info);

    // Create legend overlay
    legendOverlay = createLegendOverlay(renderer.domElement.parentElement);

    // Create command interpreter and notify UI
    cmdInterpreter = createCommandInterpreter(pdbViewer);
    setRepChangedCallback((repType) => {
      ViewerEvents.emit('viewerRepChanged', { rep: repType });
    });
    ViewerEvents.emit('viewerReady', {
      interpreter: cmdInterpreter,
      onLegendUpdate: (data) => legendOverlay.update(data),
    });
  } else {
    ViewerEvents.emit('viewerError', { message: 'Failed to parse PDB file' });
  }
});

// --- Load additional structure ---
ViewerEvents.on('loadAdditionalStructure', (data) => {
  if (!pdbViewer) return;
  const actualName = pdbViewer.addStructure(data.pdbText, data.name);
  if (actualName) {
    const info = pdbViewer.getInfo();
    ViewerEvents.emit('viewerLoaded', info);
  } else {
    ViewerEvents.emit('viewerError', { message: 'Failed to parse additional PDB file' });
  }
});

// --- Quality change ---
ViewerEvents.on('viewerQuality', (data) => {
  if (pdbViewer) {
    pdbViewer.setQuality(data.quality);
  }
});

// --- Representation change ---
ViewerEvents.on('viewerRepChange', (data) => {
  if (pdbViewer) {
    if (pdbViewer.atomVisible && pdbViewer.model) {
      let hasHidden = false;
      for (let i = 0; i < pdbViewer.model.atomCount; i++) {
        if (!pdbViewer.atomVisible[i]) { hasHidden = true; break; }
      }
      if (hasHidden) {
        const visible = new Set();
        for (let i = 0; i < pdbViewer.model.atomCount; i++) {
          if (pdbViewer.atomVisible[i]) visible.add(i);
        }
        pdbViewer.setRepresentationForAtoms(data.rep, visible);
        return;
      }
    }
    pdbViewer.setRepresentation(data.rep);
  }
});

// --- Orient camera ---
ViewerEvents.on('viewerOrient', () => {
  if (pdbViewer) pdbViewer.orient();
});

// --- Exit viewer mode ---
ViewerEvents.on('exitViewerMode', () => {
  if (legendOverlay) {
    legendOverlay.dispose();
    legendOverlay = null;
  }
  if (pdbViewer) {
    pdbViewer.dispose();
    pdbViewer = null;
  }
  cmdInterpreter = null;
  setRepChangedCallback(null);

  if (animFrameId != null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
});

// --- Expose command interpreter for automation (Playwright demo) ---
ViewerEvents.on('viewerReady', (data) => {
  window.__aimolExec = (cmd) => data.interpreter.execute(cmd);
  window.__aimolReady = true;
});
ViewerEvents.on('exitViewerMode', () => {
  window.__aimolExec = null;
  window.__aimolReady = false;
});

// --- Resize ---
resize();
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
} else {
  window.addEventListener('resize', resize);
}
