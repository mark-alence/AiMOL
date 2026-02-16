// ============================================================
// ui.js — Viewer-only React UI
// ============================================================

import { ViewerEvents } from './events.js';
import { PDBConsole } from './pdb/console.js';

const { useState, useEffect, useCallback, useRef } = React;

const isMobile = window.matchMedia('(max-width: 768px)').matches;

// --- Title Screen (PDB open only) ---
function TitleScreen({ onOpenViewer }) {
  const [fade, setFade] = useState(false);
  const [pdbId, setPdbId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadPDB = (pdbText, name) => {
    setFade(true);
    setTimeout(() => onOpenViewer(pdbText, name), 600);
  };

  const handleFetchPDB = async () => {
    const id = pdbId.trim().toUpperCase();
    if (!id || id.length !== 4) {
      setError('Enter a 4-character PDB ID (e.g. 1CRN)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = `https://files.rcsb.org/download/${id}.pdb`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`PDB ID "${id}" not found`);
      const text = await resp.text();
      loadPDB(text, id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleFetchPDB();
  };

  const handleExample = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('https://files.rcsb.org/download/1CRN.pdb');
      if (!resp.ok) throw new Error('Failed to fetch example');
      const text = await resp.text();
      loadPDB(text, '1CRN');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadPDB(reader.result, file.name.replace(/\.(pdb|ent|pdb1)$/i, ''));
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileInput = (e) => {
    handleFile(e.target.files[0]);
  };

  const hints = isMobile
    ? 'One-finger drag to orbit  |  Pinch to zoom'
    : 'Left-drag to orbit  |  Middle-drag to pan  |  Scroll to zoom';

  return React.createElement('div', {
    className: 'title-screen' + (fade ? ' fade-out' : ''),
  },
    React.createElement('h1', null, 'AiMOL'),
    React.createElement('p', { className: 'subtitle' }, 'Interactive 3D molecular structure viewer'),

    React.createElement('div', { className: 'pdb-open-section' },
      // Drop zone
      React.createElement('div', {
        className: 'pdb-drop-zone' + (dragOver ? ' drag-over' : ''),
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onClick: () => fileInputRef.current?.click(),
      },
        React.createElement('span', { className: 'pdb-drop-icon' }, '\u{1F4C2}'),
        React.createElement('span', { className: 'pdb-drop-text' },
          dragOver ? 'Drop PDB file here' : 'Open PDB File'
        ),
        React.createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: '.pdb,.ent,.pdb1',
          style: { display: 'none' },
          onChange: handleFileInput,
        }),
      ),

      // PDB ID input
      React.createElement('div', { className: 'pdb-fetch-row' },
        React.createElement('input', {
          type: 'text',
          className: 'pdb-id-input',
          placeholder: 'PDB ID (e.g. 1CRN)',
          value: pdbId,
          maxLength: 4,
          onChange: (e) => setPdbId(e.target.value.toUpperCase()),
          onKeyDown: handleKeyDown,
          disabled: loading,
        }),
        React.createElement('button', {
          className: 'pdb-fetch-btn',
          onClick: handleFetchPDB,
          disabled: loading,
        }, loading ? 'Loading...' : 'Fetch'),
      ),

      // Example button
      React.createElement('button', {
        className: 'pdb-example-btn',
        onClick: handleExample,
        disabled: loading,
      }, 'Load Example (Crambin)'),

      // Error display
      error && React.createElement('p', { className: 'pdb-error' }, error),
    ),

    React.createElement('p', { className: 'controls-hint' }, hints),
  );
}

// --- Viewer Info Bar ---
function ViewerInfoBar({ info, name, onBack, quality, onQualityChange }) {
  if (!info) return null;
  const qualityLevels = ['off', 'low', 'high'];
  return React.createElement('div', { className: 'viewer-info-bar' },
    React.createElement('button', {
      className: 'viewer-back-btn',
      onClick: onBack,
      title: 'Back to title',
    }, '\u2190'),
    React.createElement('span', { className: 'viewer-name' }, name || 'AiMOL'),
    React.createElement('span', { className: 'viewer-stats' },
      `${info.atomCount.toLocaleString()} atoms \u00B7 ${info.residueCount} residues \u00B7 ${info.chainCount} chain${info.chainCount !== 1 ? 's' : ''}`
    ),
    React.createElement('div', { className: 'viewer-quality-toggle' },
      React.createElement('span', { className: 'viewer-quality-label' }, 'FX'),
      ...qualityLevels.map(q =>
        React.createElement('button', {
          key: q,
          className: 'viewer-quality-btn' + (quality === q ? ' active' : ''),
          onClick: () => onQualityChange(q),
          title: q === 'off' ? 'No post-processing' : q === 'low' ? 'SSAO + Bloom (balanced)' : 'SSAO + Bloom (full quality)',
        }, q.charAt(0).toUpperCase() + q.slice(1))
      ),
    ),
  );
}

// --- Viewer Error Toast ---
function ViewerError({ message }) {
  if (!message) return null;
  return React.createElement('div', { className: 'viewer-error-toast' }, message);
}

// --- Representation Toolbar ---
const REP_BUTTONS = [
  { key: 'cartoon',        label: 'Cartoon' },
  { key: 'ball_and_stick', label: 'Ball&Stick' },
  { key: 'spacefill',      label: 'Spacefill' },
  { key: 'sticks',         label: 'Sticks' },
  { key: 'lines',          label: 'Lines' },
];

function RepToolbar({ currentRep, onRepChange }) {
  return React.createElement('div', {
    className: 'rep-toolbar',
  },
    ...REP_BUTTONS.map(btn =>
      React.createElement('button', {
        key: btn.key,
        className: 'rep-btn' + (currentRep === btn.key ? ' active' : ''),
        onClick: () => onRepChange(btn.key),
      }, btn.label)
    ),
  );
}

// --- Load Structure Button ---
function LoadStructureButton() {
  const [open, setOpen] = useState(false);
  const [pdbId, setPdbId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const popoverRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onClick);
    return () => document.removeEventListener('pointerdown', onClick);
  }, [open]);

  const handleFetch = async () => {
    const id = pdbId.trim().toUpperCase();
    if (!id || id.length !== 4) {
      setError('Enter a 4-character PDB ID');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = `https://files.rcsb.org/download/${id}.pdb`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`PDB ID "${id}" not found`);
      const text = await resp.text();
      ViewerEvents.emit('loadAdditionalStructure', { pdbText: text, name: id });
      setPdbId('');
      setOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      ViewerEvents.emit('loadAdditionalStructure', { pdbText: reader.result, name: file.name.replace(/\.(pdb|ent|pdb1)$/i, '') });
      setOpen(false);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleFetch();
    if (e.key === 'Escape') setOpen(false);
  };

  return React.createElement('div', { className: 'load-structure-wrap', ref: popoverRef },
    React.createElement('button', {
      className: 'load-structure-btn',
      onClick: () => setOpen(o => !o),
      title: 'Load additional structure',
    }, '+ Structure'),
    open && React.createElement('div', { className: 'load-structure-popover' },
      React.createElement('div', { className: 'load-structure-title' }, 'Load Structure'),
      React.createElement('div', { className: 'load-structure-row' },
        React.createElement('input', {
          type: 'text',
          className: 'load-structure-input',
          placeholder: 'PDB ID (e.g. 4HHB)',
          value: pdbId,
          maxLength: 4,
          onChange: (e) => setPdbId(e.target.value.toUpperCase()),
          onKeyDown: handleKeyDown,
          disabled: loading,
          autoFocus: true,
        }),
        React.createElement('button', {
          className: 'load-structure-fetch-btn',
          onClick: handleFetch,
          disabled: loading,
        }, loading ? '...' : 'Fetch'),
      ),
      React.createElement('button', {
        className: 'load-structure-file-btn',
        onClick: () => fileInputRef.current?.click(),
      }, 'Open PDB File'),
      React.createElement('input', {
        ref: fileInputRef,
        type: 'file',
        accept: '.pdb,.ent,.pdb1',
        style: { display: 'none' },
        onChange: (e) => handleFile(e.target.files[0]),
      }),
      error && React.createElement('div', { className: 'load-structure-error' }, error),
    ),
  );
}

// --- App Root ---
export function ViewerApp() {
  const [mode, setMode] = useState('title');
  const [faded, setFaded] = useState(false);
  const [viewerInfo, setViewerInfo] = useState(null);
  const [viewerName, setViewerName] = useState('');
  const [viewerError, setViewerError] = useState('');
  const [viewerQuality, setViewerQuality] = useState(isMobile ? 'off' : 'low');
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [currentRep, setCurrentRep] = useState('cartoon');
  const [interpreter, setInterpreter] = useState(null);
  const legendUpdateRef = React.useRef(null);

  const handleOpenViewer = useCallback((pdbText, name) => {
    setMode('viewer');
    setViewerName(name || 'Structure');
    setViewerError('');
    setViewerInfo(null);
    ViewerEvents.emit('enterViewerMode', { pdbText, name: name || 'Structure', quality: viewerQuality });
  }, [viewerQuality]);

  const handleBackToTitle = useCallback(() => {
    ViewerEvents.emit('exitViewerMode');
    setMode('title');
    setViewerInfo(null);
    setViewerName('');
    setViewerError('');
    setViewerQuality(isMobile ? 'off' : 'low');
    setConsoleVisible(false);
    setCurrentRep('cartoon');
    setInterpreter(null);
    legendUpdateRef.current = null;
  }, []);

  const handleQualityChange = useCallback((q) => {
    setViewerQuality(q);
    ViewerEvents.emit('viewerQuality', { quality: q });
  }, []);

  // Listen for viewer events
  useEffect(() => {
    const onLoaded = (info) => setViewerInfo(info);
    const onError = (data) => setViewerError(data.message);
    const onReady = (data) => {
      setInterpreter(data.interpreter);
      legendUpdateRef.current = data.onLegendUpdate || null;
    };
    const onRepChanged = (data) => setCurrentRep(data.rep);
    ViewerEvents.on('viewerLoaded', onLoaded);
    ViewerEvents.on('viewerError', onError);
    ViewerEvents.on('viewerReady', onReady);
    ViewerEvents.on('viewerRepChanged', onRepChanged);
    return () => {
      ViewerEvents.off('viewerLoaded', onLoaded);
      ViewerEvents.off('viewerError', onError);
      ViewerEvents.off('viewerReady', onReady);
      ViewerEvents.off('viewerRepChanged', onRepChanged);
    };
  }, []);

  // Fade UI during camera gestures (mobile)
  useEffect(() => {
    if (!isMobile) return;
    const onGestureStart = () => setFaded(true);
    const onGestureEnd = () => setFaded(false);
    ViewerEvents.on('cameraGestureStart', onGestureStart);
    ViewerEvents.on('cameraGestureEnd', onGestureEnd);
    return () => {
      ViewerEvents.off('cameraGestureStart', onGestureStart);
      ViewerEvents.off('cameraGestureEnd', onGestureEnd);
    };
  }, []);

  // Backtick key toggles console in viewer mode
  useEffect(() => {
    if (mode !== 'viewer') return;
    const onKey = (e) => {
      if (e.code === 'Backquote' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setConsoleVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const toggleConsole = useCallback(() => {
    setConsoleVisible(v => !v);
  }, []);

  const handleRepChange = useCallback((rep) => {
    setCurrentRep(rep);
    ViewerEvents.emit('viewerRepChange', { rep });
  }, []);

  // Title screen
  if (mode === 'title') {
    return React.createElement(TitleScreen, {
      onOpenViewer: handleOpenViewer,
    });
  }

  // Viewer mode
  return React.createElement('div', {
    className: isMobile && faded ? 'ui-faded' : '',
    style: { display: 'contents' },
  },
    React.createElement(ViewerInfoBar, {
      info: viewerInfo,
      name: viewerName,
      onBack: handleBackToTitle,
      quality: viewerQuality,
      onQualityChange: handleQualityChange,
    }),
    React.createElement(ViewerError, { message: viewerError }),
    React.createElement(RepToolbar, {
      currentRep,
      onRepChange: handleRepChange,
    }),
    React.createElement('div', { className: 'viewer-bottom-left' },
      React.createElement(LoadStructureButton),
      React.createElement('button', {
        className: 'orient-btn',
        onClick: () => ViewerEvents.emit('viewerOrient'),
        title: 'Orient view (PCA)',
      }, 'Orient'),
    ),
    !consoleVisible && React.createElement('button', {
      className: 'console-fab',
      onClick: toggleConsole,
      title: 'Toggle console (`)',
    }, '>_'),
    React.createElement(PDBConsole, {
      visible: consoleVisible,
      interpreter: interpreter,
      onToggle: toggleConsole,
      onLegendUpdate: legendUpdateRef.current,
    }),
  );
}
