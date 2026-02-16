// ============================================================
// renderer.js — Viewer-only Three.js scene, TrackballControls
// ============================================================

import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { ViewerEvents } from './events.js';

// --- Scene ---
export const scene = new THREE.Scene();

// --- Camera ---
export const camera = new THREE.PerspectiveCamera(
  45, window.innerWidth / window.innerHeight, 0.1, 500
);
camera.position.set(0, 0, 50);

// --- WebGL Renderer ---
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Replace existing display canvas
const oldCanvas = document.getElementById('display');
if (oldCanvas) {
  renderer.domElement.id = 'display';
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.zIndex = '1';
  oldCanvas.parentNode.replaceChild(renderer.domElement, oldCanvas);
}

// --- CSS2DRenderer (HTML labels overlaid on 3D) ---
export const cssRenderer = new CSS2DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.zIndex = '2';
cssRenderer.domElement.style.pointerEvents = 'none';
renderer.domElement.parentNode.appendChild(cssRenderer.domElement);

// --- TrackballControls (free rotation) ---
export const controls = new TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 2.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.dynamicDampingFactor = 0.12;
// Disable pan on touch devices to prevent erratic pinch-zoom
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
controls.noPan = isTouchDevice;

// --- Camera gesture events (fade UI during orbit/pan/zoom) ---
controls.addEventListener('start', () => ViewerEvents.emit('cameraGestureStart'));
controls.addEventListener('end', () => ViewerEvents.emit('cameraGestureEnd'));

// --- Update controls (call each frame) ---
export function updateControls() {
  controls.update();
}

// --- Resize ---
export function resize() {
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  controls.handleResize();
}
