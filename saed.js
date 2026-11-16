(() => {
  const input = document.getElementById('saedPlane');
  if (!input) return;
  const preset = document.getElementById('saedPreset');
  const rangeSelect = document.getElementById('saedRange');
  const svg = document.getElementById('saedPattern');
  const spotLayer = document.getElementById('saedSpots');
  const list = document.getElementById('saedSpotList');
  const error = document.getElementById('saedError');
  const countOutput = document.getElementById('saedSpotCount');
  const beamOutput = document.getElementById('saedBeamDirection');
  const selectedOutput = document.getElementById('saedReflection');
  const spacingOutput = document.getElementById('saedSpacing');
  const A = 3.209;
  const C = 5.211;
  const TAU = 2 * Math.PI;
  const NS = 'http://www.w3.org/2000/svg';
  let selectedKey = '';
  let currentSpots = [];

  function parsePlane(value) {
    const values = value.trim().replace(/[()[\],]/g, ' ').split(/\s+/).filter(Boolean).map(Number);
    if (values.length !== 4 || values.some(n => !Number.isInteger(n))) return null;
    if (values[0] + values[1] + values[2] !== 0 || values.every(n => n === 0)) return null;
    return values;
  }

  function gVector(h, k, l) {
    return [
      TAU * h / A,
      TAU * (h + 2 * k) / (Math.sqrt(3) * A),
      TAU * l / C
    ];
  }

  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(v) { return Math.sqrt(dot(v, v)); }
  function scale(v, n) { return [v[0] * n, v[1] * n, v[2] * n]; }
  function subtract(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function normalize(v) { const n = norm(v); return n ? scale(v, 1 / n) : [0, 0, 0]; }
  function keyOf(s) { return s.h + ',' + s.k + ',' + s.l; }
  function labelOf(s) { return '(' + [s.h, s.k, -s.h - s.k, s.l].join(' ') + ')'; }

  function basisIntensity(h, k, l) {
    const phase = TAU * (2 * h / 3 + k / 3 + l / 2);
    return 4 * Math.pow(Math.cos(phase / 2), 2);
  }

  function makeSvg(tag, attributes) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
    return node;
  }

  function selectSpot(spot) {
    selectedKey = keyOf(spot);
    spotLayer.querySelectorAll('.saed-spot').forEach(node => node.classList.toggle('selected', node.dataset.key === selectedKey));
    list.querySelectorAll('button').forEach(node => node.classList.toggle('selected', node.dataset.key === selectedKey));
    selectedOutput.textContent = labelOf(spot);
    spacingOutput.textContent = (TAU / norm(spot.g)).toFixed(4) + ' Å';
  }

  function render() {
    const plane = parsePlane(input.value);
    if (!plane) {
      error.textContent = '请输入有效的四指数晶面，例如 0 0 0 1；须满足 h + k + i = 0。';
      spotLayer.replaceChildren();
      list.replaceChildren();
      countOutput.textContent = '0 个反射';
      beamOutput.textContent = '—';
      selectedOutput.textContent = '—';
      spacingOutput.textContent = '—';
      return;
    }
    error.textContent = '';
    const beamReciprocal = gVector(plane[0], plane[1], plane[3]);
    const beam = normalize(beamReciprocal);
    beamOutput.textContent = '[' + beam.map(n => n.toFixed(3)).join(', ') + ']';
    let reference = Math.abs(beam[0]) < 0.85 ? [1, 0, 0] : [0, 1, 0];
    const axisX = normalize(subtract(reference, scale(beam, dot(reference, beam))));
    const axisY = normalize(cross(beam, axisX));
    const maxIndex = Number(rangeSelect.value);
    const spots = [];
    for (let h = -maxIndex; h <= maxIndex; h++) {
      for (let k = -maxIndex; k <= maxIndex; k++) {
        const i = -h - k;
        if (Math.abs(i) > maxIndex) continue;
        for (let l = -maxIndex; l <= maxIndex; l++) {
          const g = gVector(h, k, l);
          const gLength = norm(g);
          if (gLength < 1e-9) continue;
          const zoneError = Math.abs(dot(beamReciprocal, g));
          if (zoneError > 1e-8 * norm(beamReciprocal) * gLength) continue;
          const intensity = basisIntensity(h, k, l);
          if (intensity < 1e-8) continue;
          spots.push({ h, k, l, g, intensity, x: dot(g, axisX), y: dot(g, axisY) });
        }
      }
    }
    spots.sort((a, b) => norm(a.g) - norm(b.g) || a.h - b.h || a.k - b.k || a.l - b.l);
    currentSpots = spots;
    countOutput.textContent = spots.length + ' 个允许反射';

    const width = 480, height = 350, cx = width / 2, cy = height / 2;
    const maxRadius = spots.reduce((m, s) => Math.max(m, Math.hypot(s.x, s.y)), 0) || 1;
    const pxPerReciprocal = Math.min((width / 2 - 44) / maxRadius, (height / 2 - 34) / maxRadius);
    const center = makeSvg('circle', { cx, cy, r: 5.2, class: 'saed-direct-beam' });
    const centerTitle = makeSvg('title', {});
    centerTitle.textContent = '透射束 (0 0 0 0)';
    center.append(centerTitle);
    spotLayer.replaceChildren(center);
    list.replaceChildren();

    spots.forEach(spot => {
      const key = keyOf(spot);
      const x = cx + spot.x * pxPerReciprocal;
      const y = cy - spot.y * pxPerReciprocal;
      const reflection = makeSvg('g', { class: 'saed-reflection', tabindex: '0', role: 'button', 'aria-label': labelOf(spot), 'data-key': key });
      const hit = makeSvg('circle', { cx: x, cy: y, r: 11, class: 'saed-hit-area' });
      const dotNode = makeSvg('circle', { cx: x, cy: y, r: 2.2 + Math.sqrt(spot.intensity) * 1.15, class: 'saed-spot', 'data-key': key });
      dotNode.style.opacity = String(0.52 + 0.48 * Math.sqrt(spot.intensity / 4));
      const title = makeSvg('title', {});
      title.textContent = labelOf(spot) + ' · |g|=' + norm(spot.g).toFixed(4) + ' Å⁻¹';
      reflection.append(hit, dotNode, title);
      const activate = () => selectSpot(spot);
      reflection.addEventListener('click', activate);
      reflection.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } });
      spotLayer.append(reflection);

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'saed-index-chip';
      chip.textContent = labelOf(spot);
      chip.dataset.key = key;
      chip.setAttribute('aria-label', '选择衍射斑点 ' + labelOf(spot));
      chip.addEventListener('click', activate);
      list.append(chip);
    });

    const preferred = spots.find(s => s.h === 1 && s.k === 0 && s.l === 0) || spots[0];
    const selected = spots.find(s => keyOf(s) === selectedKey) || preferred;
    if (selected) selectSpot(selected);
    else {
      selectedOutput.textContent = '—';
      spacingOutput.textContent = '—';
    }
  }

  preset.addEventListener('change', () => {
    const values = preset.value.split(',').map(Number);
    input.value = values.join(' ');
    selectedKey = '';
    render();
  });
  input.addEventListener('input', () => { preset.value = 'custom'; selectedKey = ''; render(); });
  rangeSelect.addEventListener('change', () => { selectedKey = ''; render(); });
  render();
})();