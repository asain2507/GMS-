import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * GMS — minimal, dependency-free
 * - choose garment & size
 * - upload image
 * - drag within dashed print area
 * - resize via handle or by width (inches)
 * - PPI slider scales the preview
 * - export PNG snapshot
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

export default function App() {
  const [garmentId, setGarmentId] = useState("tee_ss");
  const [sizeCode, setSizeCode] = useState("M");
  const [ppi, setPpi] = useState(30);               // pixels-per-inch (preview scale)
  const [imgUrl, setImgUrl] = useState("");         // uploaded image object URL
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [widthIn, setWidthIn] = useState(10);
  const [pos, setPos] = useState({ x: 0, y: 0 });   // top-left of image in px (preview coords)
  const draggingRef = useRef(null);                 // drag/resize state

  const garment = useMemo(() => GARMENTS.find(g => g.id === garmentId), [garmentId]);
  const size = useMemo(() => SIZES.find(s => s.code === sizeCode), [sizeCode]);

  // garment size (inches) changes with sizeCode
  const garmentIn = useMemo(() => {
    const w = garment.base.wIn + (size?.dW ?? 0);
    const h = garment.base.hIn + (size?.dW ?? 0) * 1.2;
    return { wIn: w, hIn: h };
  }, [garment, size]);

  // convert to preview pixels
  const garmentPx = useMemo(() => ({ w: garmentIn.wIn * ppi, h: garmentIn.hIn * ppi }), [garmentIn, ppi]);
  const printPx = useMemo(() => ({
    x: (garmentIn.wIn - garment.print.wIn) / 2 * ppi,
    y: garment.print.topIn * ppi,
    w: garment.print.wIn * ppi,
    h: garment.print.hIn * ppi,
  }), [garmentIn, garment, ppi]);

  // desired graphic pixel size from widthIn & image ratio
  const graphicPx = useMemo(() => {
    const targetW = Math.max(1, widthIn * ppi);
    const ratio = natural.w / natural.h || 1;
    return { w: targetW, h: targetW / ratio };
  }, [widthIn, ppi, natural]);

  // center image when uploaded or when size changes
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

  // pointer helpers (mouse+touch)
  function getPoint(e) {
    if ("touches" in e && e.touches.length) {
      const t = e.touches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  // drag
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
    // constrain to print area
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

  // resize via handle
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

  // export snapshot
  function exportPNG() {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(garmentPx.w);
    canvas.height = Math.round(garmentPx.h);
    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // garment silhouette
    ctx.fillStyle = "#e5e7eb";
    drawSilhouette(ctx, garmentId, canvas.width, canvas.height);

    // print area guide
    ctx.strokeStyle = "#9ca3af";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeRect(printPx.x, printPx.y, printPx.w, printPx.h);
    ctx.setLineDash([]);

    // image
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

      {/* controls */}
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

      {/* preview stage */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ ...stage, width: garmentPx.w, height: garmentPx.h }}>
          <SilhouetteSVG garmentId={garmentId} />

          {/* center guide */}
          <div style={{ position:"absolute", left: garmentPx.w/2, top:0, width:1, height:"100%", background:"rgba(0,0,0,0.06)" }} />

          {/* print area */}
          <div
            style={{ position:"absolute", left: printPx.x, top: printPx.y, width: printPx.w, height: printPx.h,
                     border: "2px dashed rgba(100,100,100,0.55)", borderRadius: 8 }}
          />

          {/* image layer */}
          {imgUrl && (
            <div
              onMouseDown={startDrag}
              onTouchStart={startDrag}
              style={{ position:"absolute", left: pos.x, top: pos.y, width: graphicPx.w, height: graphicPx.h,
                       touchAction: "none", cursor: "move" }}
            >
              <img
                src={imgUrl}
                alt="art"
                style={{ width:"100%", height:"100%", objectFit:"contain", pointerEvents:"none", userSelect:"none" }}
              />
              {/* resize handle */}
              <div
                onMouseDown={startResize}
                onTouchStart={startResize}
                style={{ position:"absolute", right:-8, bottom:-8, width:20, height:20,
                         background:"#009FDA", borderRadius:10, border:"2px solid white",
                         boxShadow:"0 1px 4px rgba(0,0,0,0.25)", touchAction:"none" }}
                title="Drag to resize"
              />
            </div>
          )}
        </div>
      </div>

      {/* readouts */}
      <div style={readouts}>
        <Info label="Garment (in)">{garmentIn.wIn.toFixed(1)} × {garmentIn.hIn.toFixed(1)}</Info>
        <Info label="Print Area (in)">{garment.print.wIn.toFixed(1)} × {garment.print.hIn.toFixed(1)}</Info>
        <Info label="Graphic width (in)">{widthIn.toFixed(2)}</Info>
        <Info label="Graphic pos (in)">{((pos.x - printPx.x)/ppi).toFixed(2)}, {((pos.y - printPx.y)/ppi).toFixed(2)}</Info>
      </div>
    </div>
  );
}

/* ---- visuals ---- */
function SilhouetteSVG({ garmentId }) {
  if (garmentId === "cap") return (
    <svg viewBox="0 0 200 150" style={sil}>
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <path d="M30 90c0-30 25-55 55-55s55 25 55 55" fill="#e5e7eb" />
      <path d="M110 90h60c0 10-20 25-60 25" fill="#d1d5db" />
    </svg>
  );
  if (garmentId === "beanie") return (
    <svg viewBox="0 0 200 200" style={sil}>
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <rect x="40" y="70" width="120" height="80" rx="20" fill="#e5e7eb" />
      <rect x="35" y="140" width="130" height="25" rx="8" fill="#d1d5db" />
    </svg>
  );
  if (garmentId === "hoodie") return (
    <svg viewBox="0 0 300 400" style={sil}>
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <path d="M80 40c30-30 110-30 140 0l30 60v220l-40 40H90l-40-40V100z" fill="#e5e7eb" />
      <path d="M110 60c20-10 60-10 80 0l10 20-50 20-50-20z" fill="#d1d5db" />
    </svg>
  );
  if (garmentId === "jacket") return (
    <svg viewBox="0 0 300 400" style={sil}>
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <path d="M70 60l60-30h40l60 30v260l-40 40H110l-40-40z" fill="#e5e7eb" />
      <rect x="145" y="80" width="10" height="240" fill="#d1d5db" />
    </svg>
  );
  // tees default
  return (
    <svg viewBox="0 0 300 400" style={sil}>
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <path d="M60 60l60-30h60l60 30-20 40-40-10v250H120V90l-40 10z" fill="#e5e7eb" />
    </svg>
  );
}

function drawSilhouette(ctx, garmentId, W, H) {
  ctx.fillStyle = "#e5e7eb";
  if (garmentId === "cap") {
    ctx.beginPath();
    ctx.ellipse(W*0.35, H*0.35, W*0.18, H*0.18, 0, 0, Math.PI, true);
    ctx.fill();
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(W*0.55, H*0.55, W*0.25, H*0.06);
    return;
  }
  if (garmentId === "beanie") {
    ctx.fillRect(W*0.15, H*0.25, W*0.7, H*0.35);
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(W*0.12, H*0.55, W*0.76, H*0.06);
    return;
  }
  if (garmentId === "hoodie") {
    roundRect(ctx, W*0.2, H*0.1, W*0.6, H*0.7, 20, "#e5e7eb");
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(W*0.35, H*0.2, W*0.3, H*0.06);
    return;
  }
  if (garmentId === "jacket") {
    roundRect(ctx, W*0.18, H*0.12, W*0.64, H*0.7, 10, "#e5e7eb");
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(W*0.48, H*0.2, 4, H*0.6);
    return;
  }
  // tee default
  roundRect(ctx, W*0.18, H*0.12, W*0.64, H*0.72, 12, "#e5e7eb");
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function downloadCanvas(canvas, filename) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

/* --- styles --- */
const page = { fontFamily: "system-ui, Arial", padding: 12, maxWidth: 900, margin: "0 auto" };
const h1 = { fontSize: 22, fontWeight: 700, margin: "4px 0 10px 0" };
const panel = { background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 12 };
const row = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
const label = { width: 120, fontSize: 12, color: "#555" };
const select = { flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" };
const num = { width: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" };
const btn = { marginTop: 6, padding: "10px 14px", borderRadius: 10, background: "#009FDA", color: "white", fontWeight: 600, border: "none" };
const stage = { position: "relative", background: "linear-gradient(#f7f7f8,#ececee)", borderRadius: 16, boxShadow: "inset 0 1px 6px rgba(0,0,0,0.06)", margin: "8px auto" };
const sil = { position: "absolute", inset: 0, width: "100%", height: "100%" };
const readouts = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginTop: 8 };
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12, paddingLeft: 6, minWidth: 28, textAlign: "right" };

function Info({ label, children }) {
  return (
    <div style={{ background: "#fff", padding: 10, borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: .4, color: "#888" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{children}</div>
    </div>
  );
}
