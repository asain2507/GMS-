import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * GMS — Improved silhouettes + color picker (plain JS)
 */

const GARMENTS = [
  { id: "tee_ss", name: "Short Sleeve Tee", base: { wIn: 20, hIn: 28 }, print: { topIn: 3, wIn: 12, hIn: 16 } },
  { id: "tee_ls", name: "Long Sleeve Tee",  base: { wIn: 20, hIn: 29 }, print: { topIn: 3, wIn: 12, hIn: 16 } },
  { id: "hoodie",  name: "Hoodie",          base: { wIn: 21, hIn: 28 }, print: { topIn: 4, wIn: 12, hIn: 14 } },
  { id: "jacket",  name: "Jacket",          base: { wIn: 22, hIn: 29 }, print: { topIn: 4, wIn: 11, hIn: 13 } },
  { id: "cap",     name: "Cap / Hat",       base: { wIn: 8,  hIn: 6  }, print: { topIn: 1.5, wIn: 4.25, hIn: 2 } },
  { id: "beanie",  name: "Beanie",          base: { wIn: 9,  hIn: 7  }, print: { topIn: 1.25, wIn: 4, hIn: 2 } },
  { id: "other",   name: "Other (Custom)",  base: { wIn: 20, hIn: 20 }, print: { topIn: 2, wIn: 10, hIn: 10 } },
];

const SIZES = [
  { code: "XS", dW: -2 }, { code: "S", dW: -1 }, { code: "M", dW: 0 }, { code: "L", dW: 1 },
  { code: "XL", dW: 2 },  { code: "2XL", dW: 3 }, { code: "3XL", dW: 4 }, { code: "4XL", dW: 5 },
];

const GARMENT_COLORS = [
  { id: "light",  name: "Light Heather", fill: "#e9ecef", shadow: "#d8dde3" },
  { id: "mid",    name: "Mid Gray",      fill: "#cbd3da", shadow: "#b7c1cb" },
  { id: "dark",   name: "Charcoal",      fill: "#9aa7b4", shadow: "#8896a3" }
];

export default function App() {
  const [garmentId, setGarmentId] = useState("tee_ss");
  const [sizeCode, setSizeCode] = useState("M");
  const [colorId, setColorId] = useState("light");
  const [ppi, setPpi] = useState(30);
  const [imgUrl, setImgUrl] = useState("");
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [widthIn, setWidthIn] = useState(10);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(null);

  const garment = useMemo(() => GARMENTS.find(g => g.id === garmentId), [garmentId]);
  const color = useMemo(() => GARMENT_COLORS.find(c => c.id === colorId) || GARMENT_COLORS[0], [colorId]);
  const size = useMemo(() => SIZES.find(s => s.code === sizeCode), [sizeCode]);

  const garmentIn = useMemo(() => {
    const w = garment.base.wIn + (size?.dW ?? 0);
    const h = garment.base.hIn + (size?.dW ?? 0) * 1.2;
    return { wIn: w, hIn: h };
  }, [garment, size]);

  const garmentPx = useMemo(() => ({ w: garmentIn.wIn * ppi, h: garmentIn.hIn * ppi }), [garmentIn, ppi]);
  const printPx = useMemo(() => ({
    x: (garmentIn.wIn - garment.print.wIn) / 2 * ppi,
    y: garment.print.topIn * ppi,
    w: garment.print.wIn * ppi,
    h: garment.print.hIn * ppi,
  }), [garmentIn, garment, ppi]);

  const graphicPx = useMemo(() => {
    const targetW = Math.max(1, widthIn * ppi);
    const ratio = natural.w / natural.h || 1;
    return { w: targetW, h: targetW / ratio };
  }, [widthIn, ppi, natural]);

  useEffect(() => {
    if (!imgUrl) return;
    const nx = printPx.x + (printPx.w - graphicPx.w) / 2;
    const ny = printPx.y + (printPx.h - graphicPx.h) / 2;
    setPos({ x: nx, y: ny });
  }, [imgUrl, graphicPx.w, graphicPx.h, printPx.x, printPx.y, printPx.w, printPx.h]);

  function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const i = new Image();
    i.onload = () => setNatural({ w: i.naturalWidth, h: i.naturalHeight });
    i.src = url;
  }

  const getPoint = (e) => ("touches" in e && e.touches.length)
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
    : { x: e.clientX, y: e.clientY };

  function startDrag(e) {
    e.preventDefault();
    const p = getPoint(e);
    draggingRef.current = { mode: "move", startX: p.x, startY: p.y, origX: pos.x, origY: pos.y };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("touchmove", onDrag, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
  }
  function onDrag(e) {
    if (!draggingRef.current || draggingRef.current.mode !== "move") return;
    e.preventDefault();
    const p = getPoint(e);
    const { startX, startY, origX, origY } = draggingRef.current;
    let nx = origX + (p.x - startX);
    let ny = origY + (p.y - startY);
    nx = Math.min(Math.max(nx, printPx.x), printPx.x + printPx.w - graphicPx.w);
    ny = Math.min(Math.max(ny, printPx.y), printPx.y + printPx.h - graphicPx.h);
    setPos({ x: nx, y: ny });
  }
  function endDrag() {
    draggingRef.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("touchmove", onDrag);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchend", endDrag);
  }

  function startResize(e) {
    e.stopPropagation();
    e.preventDefault();
    const p = getPoint(e);
    draggingRef.current = { mode: "resize", startX: p.x, startW: graphicPx.w };
    window.addEventListener("mousemove", onResize);
    window.addEventListener("touchmove", onResize, { passive: false });
    window.addEventListener("mouseup", endResize);
    window.addEventListener("touchend", endResize);
  }
  function onResize(e) {
    if (!draggingRef.current || draggingRef.current.mode !== "resize") return;
    e.preventDefault();
    const p = getPoint(e);
    const dx = p.x - draggingRef.current.startX;
    const newWpx = Math.min(Math.max(40, draggingRef.current.startW + dx), printPx.w);
    setWidthIn(Number((newWpx / ppi).toFixed(2)));
  }
  function endResize() {
    draggingRef.current = null;
    window.removeEventListener("mousemove", onResize);
    window.removeEventListener("touchmove", onResize);
    window.removeEventListener("mouseup", endResize);
    window.removeEventListener("touchend", endResize);
  }

  function exportPNG() {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(garmentPx.w);
    canvas.height = Math.round(garmentPx.h);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSilhouette(ctx, garmentId, canvas.width, canvas.height, color);

    ctx.strokeStyle = "rgba(60,60,60,.55)";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeRect(printPx.x, printPx.y, printPx.w, printPx.h);
    ctx.setLineDash([]);

    if (imgUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, pos.x, pos.y, graphicPx.w, graphicPx.h);
        downloadCanvas(canvas, `GMS_${garment.name}_${size.code}.png`);
      };
      img.src = imgUrl;
    } else {
      downloadCanvas(canvas, `GMS_${garment.name}_${size.code}.png`);
    }
  }

  return (
    <div style={page}>
      <h1 style={h1}>GMS</h1>

      <div style={panel}>
        <div style={row}>
          <label style={label}>Garment</label>
          <select value={garmentId} onChange={(e)=>setGarmentId(e.target.value)} style={select}>
            {GARMENTS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div style={row}>
          <label style={label}>Size</label>
          <select value={sizeCode} onChange={(e)=>setSizeCode(e.target.value)} style={select}>
            {SIZES.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
          </select>
        </div>

        <div style={row}>
          <label style={label}>Garment color</label>
          <select value={colorId} onChange={(e)=>setColorId(e.target.value)} style={select}>
            {GARMENT_COLORS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={row}>
          <label style={label}>Pixels per inch</label>
          <input type="range" min="16" max="60" value={ppi} onChange={(e)=>setPpi(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={mono}>{ppi}</span>
        </div>

        <div style={row}>
          <label style={label}>Graphic width (in)</label>
          <input
            type="number" step="0.1" min="1" max={garment.print.wIn} value={widthIn}
            onChange={(e)=>setWidthIn(Math.max(0.5, Math.min(Number(e.target.value)||1, garment.print.wIn)))} style={num}
          />
          <span style={{fontSize:12,color:"#666"}}>max {garment.print.wIn}"</span>
        </div>

        <div style={row}>
          <label style={label}>Upload graphic</label>
          <input type="file" accept="image/*" onChange={onUpload} />
        </div>

        <button onClick={exportPNG} style={btn}>Export PNG</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ ...stage, width: garmentPx.w, height: garmentPx.h }}>
          <SilhouetteSVG garmentId={garmentId} color={color} />
          <div style={{ position:"absolute", left: garmentPx.w/2, top:0, width:1, height:"100%", background:"rgba(0,0,0,0.06)" }} />
          <div style={{ position:"absolute", left: printPx.x, top: printPx.y, width: printPx.w, height: printPx.h, border: "2px dashed rgba(100,100,100,0.55)", borderRadius: 8 }} />
          {imgUrl && (
            <div onMouseDown={startDrag} onTouchStart={startDrag} style={{ position:"absolute", left: pos.x, top: pos.y, width: graphicPx.w, height: graphicPx.h, touchAction: "none", cursor: "move" }}>
              <img src={imgUrl} alt="art" style={{ width:"100%", height:"100%", objectFit:"contain", pointerEvents:"none", userSelect:"none" }} />
              <div onMouseDown={startResize} onTouchStart={startResize} style={{ position:"absolute", right:-8, bottom:-8, width:20, height:20, background:"#009FDA", borderRadius:10, border:"2px solid white", boxShadow:"0 1px 4px rgba(0,0,0,0.25)", touchAction:"none" }} title="Drag to resize" />
            </div>
          )}
        </div>
      </div>

      <div style={readouts}>
        <Info label="Garment (in)">{garmentIn.wIn.toFixed(1)} × {garmentIn.hIn.toFixed(1)}</Info>
        <Info label="Print Area (in)">{garment.print.wIn.toFixed(1)} × {garment.print.hIn.toFixed(1)}</Info>
        <Info label="Graphic width (in)">{widthIn.toFixed(2)}</Info>
        <Info label="Graphic pos (in)">{((pos.x - printPx.x)/ppi).toFixed(2)}, {((pos.y - printPx.y)/ppi).toFixed(2)}</Info>
      </div>
    </div>
  );
}

/* ---------- visuals ---------- */

function SilhouetteSVG({ garmentId, color }) {
  const base = color.fill;
  const shade = color.shadow;

  if (garmentId === "cap") {
    return (
      <svg viewBox="0 0 300 260" style={sil}>
        <rect width="100%" height="100%" fill="transparent" />
        <path d="M45 160c0-62 48-112 105-112s105 50 105 112" fill={base}/>
        <path d="M160 160h110c0 20-42 44-120 44-40 0-66-6-89-14 12-12 38-23 99-30z" fill={shade}/>
      </svg>
    );
  }

  if (garmentId === "beanie") {
    return (
      <svg viewBox="0 0 300 380" style={sil}>
        <rect width="100%" height="100%" fill="transparent" />
        <rect x="60" y="120" width="180" height="140" rx="40" fill={base}/>
        <rect x="50" y="240" width="200" height="50" rx="12" fill={shade}/>
      </svg>
    );
  }

  if (garmentId === "hoodie") {
    return (
      <svg viewBox="0 0 360 520" style={sil}>
        <rect width="100%" height="100%" fill="transparent" />
        <path d="M70 120l40-60h140l40 60v260l-40 60H110l-40-60V120z" fill={base}/>
        <path d="M110 60c30-25 110-25 140 0l10 25-80 35-80-35z" fill={shade}/>
        <rect x="130" y="300" width="100" height="40" rx="10" fill={shade} opacity="0.35"/>
      </svg>
    );
  }

  if (garmentId === "jacket") {
    return (
      <svg viewBox="0 0 360 520" style={sil}>
        <rect width="100%" height="100%" fill="transparent" />
        <path d="M60 120l70-40h100l70 40v260l-40 60H100l-40-60V120z" fill={base}/>
        <rect x="178" y="130" width="4" height="250" fill={shade}/>
        <rect x="120" y="200" width="120" height="12" rx="6" fill={shade} opacity="0.4"/>
      </svg>
    );
  }

  if (garmentId === "tee_ls") {
    return (
      <svg viewBox="0 0 360 520" style={sil}>
        <rect width="100%" height="100%" fill="transparent" />
        <path d="M80 140l60-35h80l60 35-18 40-32-8v240H130V172l-32 8z" fill={base}/>
        <path d="M80 140l-40 30v200l30 30h30V180l35-20z" fill={shade}/>
        <path d="M280 140l40 30v200l-30 30h-30V180l-35-20z" fill={shade}/>
      </svg>
    );
  }

  // short sleeve tee default
  return (
    <svg viewBox="0 0 360 520" style={sil}>
      <rect width="100%" height="100%" fill="transparent" />
      <path d="M80 140l60-35h80l60 35-18 40-32-8v240H130V172l-32 8z" fill={base}/>
      <path d="M80 140l-40 30 28 32 64-32z" fill={shade}/>
      <path d="M280 140l40 30-28 32-64-32z" fill={shade}/>
    </svg>
  );
}

function drawSilhouette(ctx, garmentId, W, H, color) {
  const base = color.fill;
  const shade = color.shadow;
  ctx.save();
  ctx.fillStyle = base;

  const r = (n) => Math.round(n);
  ctx.clearRect(0,0,W,H);

  if (garmentId === "cap") {
    ctx.beginPath();
    ctx.moveTo(r(W*0.15), r(H*0.62));
    ctx.quadraticCurveTo(r(W*0.15), r(H*0.18), r(W*0.5), r(H*0.18));
    ctx.quadraticCurveTo(r(W*0.85), r(H*0.18), r(W*0.85), r(H*0.62));
    ctx.lineTo(r(W*0.15), r(H*0.62));
    ctx.fill();
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(r(W*0.53), r(H*0.62));
    ctx.lineTo(r(W*0.93), r(H*0.62));
    ctx.bezierCurveTo(r(W*0.93), r(H*0.75), r(W*0.6), r(H*0.86), r(W*0.35), r(H*0.86));
    ctx.lineTo(r(W*0.2), r(H*0.82));
    ctx.closePath(); ctx.fill();
    ctx.restore(); return;
  }

  if (garmentId === "beanie") {                   // <-- fixed: no stray parenthesis
    ctx.fillRect(r(W*0.2), r(H*0.32), r(W*0.6), r(H*0.37));
    ctx.fillStyle = shade;