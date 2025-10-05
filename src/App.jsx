import React, { useEffect, useMemo, useRef, useState } from "react";

/** GMS — Image-based mockups (uses /public/mockups if present; falls back to a simple block) */

const GARMENTS = [
  { id: "tee_ss", name: "Short Sleeve Tee", base: { wIn: 20, hIn: 28 }, print: { topIn: 3, wIn: 12, hIn: 16 } },
  { id: "tee_ls", name: "Long Sleeve Tee",  base: { wIn: 20, hIn: 29 }, print: { topIn: 3, wIn: 12, hIn: 16 } },
  { id: "hoodie", name: "Hoodie",           base: { wIn: 21, hIn: 28 }, print: { topIn: 4, wIn: 12, hIn: 14 } },
  { id: "jacket", name: "Jacket",           base: { wIn: 22, hIn: 29 }, print: { topIn: 4, wIn: 11, hIn: 13 } },
  { id: "cap",    name: "Cap / Hat",        base: { wIn: 8,  hIn: 6  }, print: { topIn: 1.5, wIn: 4.25, hIn: 2 } },
  { id: "beanie", name: "Beanie",           base: { wIn: 9,  hIn: 7  }, print: { topIn: 1.25, wIn: 4, hIn: 2 } },
];

const SIZES = [
  { code: "XS", dW: -2 }, { code: "S", dW: -1 }, { code: "M", dW: 0 }, { code: "L", dW: 1 },
  { code: "XL", dW: 2 },  { code: "2XL", dW: 3 }, { code: "3XL", dW: 4 }, { code: "4XL", dW: 5 },
];

const GARMENT_COLORS = [
  { id: "white", name: "White",      hex: "#ffffff" },
  { id: "heath", name: "Light Heather", hex: "#e9ecef" },
  { id: "gray",  name: "Mid Gray",   hex: "#cbd3da" },
  { id: "char",  name: "Charcoal",   hex: "#9aa7b4" },
  { id: "black", name: "Black",      hex: "#111111" },
  { id: "panth", name: "Panthers Blue", hex: "#009FDA" },
];

const MOCKUP_SRC = (id) => `/mockups/${id}.png`; // put images in /public/mockups/, e.g. tee_ss.png

export default function App() {
  const [garmentId, setGarmentId] = useState("tee_ss");
  const [sizeCode, setSizeCode] = useState("M");
  const [colorId, setColorId] = useState("heath");
  const [ppi, setPpi] = useState(30);
  const [imgUrl, setImgUrl] = useState("");
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [widthIn, setWidthIn] = useState(10);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const garment = useMemo(() => GARMENTS.find(g => g.id === garmentId), [garmentId]);
  const size = useMemo(() => SIZES.find(s => s.code === sizeCode), [sizeCode]);
  const color = useMemo(() => GARMENT_COLORS.find(c => c.id === colorId) || GARMENT_COLORS[0], [colorId]);

  // garment dimensions (inches)
  const garmentIn = useMemo(() => {
    const w = garment.base.wIn + (size?.dW ?? 0);
    const h = garment.base.hIn + (size?.dW ?? 0) * 1.2;
    return { wIn: w, hIn: h };
  }, [garment, size]);

  // convert inches to pixels
  const garmentPx = useMemo(() => ({ w: garmentIn.wIn * ppi, h: garmentIn.hIn * ppi }), [garmentIn, ppi]);
  const printPx = useMemo(() => ({
    x: (garmentIn.wIn - garment.print.wIn) / 2 * ppi,
    y: garment.print.topIn * ppi,
    w: garment.print.wIn * ppi,
    h: garment.print.hIn * ppi,
  }), [garmentIn, garment, ppi]);

  const graphicPx = useMemo(() => {
    const w = Math.max(1, widthIn * ppi);
    const ratio = natural.w / natural.h || 1;
    return { w, h: w / ratio };
  }, [widthIn, ppi, natural]);

  // upload
  function onUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    const i = new Image();
    i.onload = () => setNatural({ w: i.naturalWidth, h: i.naturalHeight });
    i.src = url;
  }

  // center graphic on size changes
  useEffect(() => {
    if (!imgUrl) return;
    setPos({
      x: printPx.x + (printPx.w - graphicPx.w) / 2,
      y: printPx.y + (printPx.h - graphicPx.h) / 2,
    });
  }, [imgUrl, graphicPx.w, graphicPx.h, printPx.x, printPx.y, printPx.w, printPx.h]);

  // drag & resize
  const dragRef = useRef(null);
  const getPoint = (e) => ("touches" in e && e.touches.length)
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
    : { x: e.clientX, y: e.clientY };

  function startDrag(e) {
    e.preventDefault();
    const p = getPoint(e);
    dragRef.current = { type: "move", sx: p.x, sy: p.y, ox: pos.x, oy: pos.y };
    onWindowDrag(true);
  }
  function onDrag(e) {
    if (!dragRef.current || dragRef.current.type !== "move") return;
    e.preventDefault();
    const p = getPoint(e);
    let nx = dragRef.current.ox + (p.x - dragRef.current.sx);
    let ny = dragRef.current.oy + (p.y - dragRef.current.sy);
    nx = Math.min(Math.max(nx, printPx.x), printPx.x + printPx.w - graphicPx.w);
    ny = Math.min(Math.max(ny, printPx.y), printPx.y + printPx.h - graphicPx.h);
    setPos({ x: nx, y: ny });
  }
  function endDrag() { dragRef.current = null; onWindowDrag(false); }

  function startResize(e) {
    e.stopPropagation(); e.preventDefault();
    const p = getPoint(e);
    dragRef.current = { type: "resize", sx: p.x, sw: graphicPx.w };
    onWindowResize(true);
  }
  function onResize(e) {
    if (!dragRef.current || dragRef.current.type !== "resize") return;
    e.preventDefault();
    const p = getPoint(e);
    const dx = p.x - dragRef.current.sx;
    const newWpx = Math.min(Math.max(40, dragRef.current.sw + dx), printPx.w);
    setWidthIn(Number((newWpx / ppi).toFixed(2)));
  }
  function endResize() { dragRef.current = null; onWindowResize(false); }

  function onWindowDrag(on) {
    const m = on ? window.addEventListener : window.removeEventListener;
    m("mousemove", onDrag); m("touchmove", onDrag, { passive: false });
    m("mouseup", endDrag);  m("touchend", endDrag);
  }
  function onWindowResize(on) {
    const m = on ? window.addEventListener : window.removeEventListener;
    m("mousemove", onResize); m("touchmove", onResize, { passive: false });
    m("mouseup", endResize);  m("touchend", endResize);
  }

  // mockup image loader
  const [mockupImg, setMockupImg] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setMockupImg(img);
    img.onerror = () => setMockupImg(null);
    img.src = MOCKUP_SRC(garmentId);
  }, [garmentId]);

  // export
  function exportPNG() {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(garmentPx.w);
    canvas.height = Math.round(garmentPx.h);
    const ctx = canvas.getContext("2d");

    // always keep background light blue
    ctx.fillStyle = "#EAF6FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mockupImg) {
      // draw mockup
      ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
      // apply garment color as multiply over shirt pixels
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = color.hex;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // ensure white sits beneath (keeps outside areas clean)
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    } else {
      // simple fallback block
      ctx.fillStyle = "#dfe4ea";
      ctx.fillRect(canvas.width * 0.2, canvas.height * 0.25, canvas.width * 0.6, canvas.height * 0.55);
    }

    // print area
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeRect(printPx.x, printPx.y, printPx.w, printPx.h);
    ctx.restore();

    // user art
    if (imgUrl) {
      const img = new Image();
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
        <Row label="Garment">
          <select value={garmentId} onChange={(e)=>setGarmentId(e.target.value)} style={select}>
            {GARMENTS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Row>

        <Row label="Size">
          <select value={sizeCode} onChange={(e)=>setSizeCode(e.target.value)} style={select}>
            {SIZES.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
          </select>
        </Row>

        <Row label="Garment color">
          <select value={colorId} onChange={(e)=>setColorId(e.target.value)} style={select}>
            {GARMENT_COLORS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Row>

        <Row label="Pixels per inch">
          <input type="range" min="16" max="60" value={ppi} onChange={(e)=>setPpi(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={mono}>{ppi}</span>
        </Row>

        <Row label="Graphic width (in)">
          <input
            type="number" step="0.1" min="1" max={garment.print.wIn} value={widthIn}
            onChange={(e)=>setWidthIn(Math.max(0.5, Math.min(Number(e.target.value)||1, garment.print.wIn)))} style={num}
          />
          <span style={{fontSize:12,color:"#666"}}>max {garment.print.wIn}"</span>
        </Row>

        <Row label="Upload graphic"><input type="file" accept="image/*" onChange={onUpload} /></Row>

        <button onClick={exportPNG} style={btn}>Export PNG</button>
      </div>

      {/* Preview */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ ...stage, width: garmentPx.w, height: garmentPx.h }}>
          {/* fixed light-blue background */}
          <div style={{ position:"absolute", inset:0, background:"#EAF6FF", zIndex:0 }} />

          {mockupImg ? (
            <>
              {/* mockup image */}
              <img src={MOCKUP_SRC(garmentId)} alt="mockup"
                   style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", pointerEvents:"none", zIndex:1 }} />

              {/* color tint over shirt pixels */}
              <div style={{ position:"absolute", inset:0, background: color.hex, mixBlendMode:"multiply", opacity:1, pointerEvents:"none", zIndex:2 }} />
            </>
          ) : (
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(#f7f7f8,#ececee)", borderRadius:16 }} />
          )}

          {/* guides */}
          <div style={{ position:"absolute", left: garmentPx.w/2, top:0, width:1, height:"100%", background:"rgba(0,0,0,0.06)" }} />
          <div style={{ position:"absolute", left: printPx.x, top: printPx.y, width: printPx.w, height: printPx.h, border:"2px dashed rgba(100,100,100,0.55)", borderRadius:8 }} />

          {/* artwork */}
          {imgUrl && (
            <div onMouseDown={(e)=>startDrag(e)} onTouchStart={(e)=>startDrag(e)}
                 style={{ position:"absolute", left: pos.x, top: pos.y, width: graphicPx.w, height: graphicPx.h, touchAction:"none", cursor:"move" }}>
              <img src={imgUrl} alt="art" style={{ width:"100%", height:"100%", objectFit:"contain", pointerEvents:"none", userSelect:"none" }} />
              <div onMouseDown={(e)=>startResize(e)} onTouchStart={(e)=>startResize(e)}
                   style={{ position:"absolute", right:-8, bottom:-8, width:20, height:20, background:"#009FDA", borderRadius:10, border:"2px solid white", boxShadow:"0 1px 4px rgba(0,0,0,0.25)", touchAction:"none" }}
                   title="Drag to resize" />
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

/* ——— UI bits ——— */
function Row({ label, children }) {
  return <div style={row}><label style={lab}>{label}</label><div style={{display:"flex",gap:8,alignItems:"center",flex:1}}>{children}</div></div>;
}
function Info({ label, children }) {
  return (
    <div style={{ background:"#fff", padding:10, borderRadius:10, boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:.4, color:"#888" }}>{label}</div>
      <div style={{ fontWeight:600 }}>{children}</div>
    </div>
  );
}

/* styles */
const page = { fontFamily:"system-ui, Arial", padding:12, maxWidth:900, margin:"0 auto" };
const h1 = { fontSize:22, fontWeight:700, margin:"4px 0 10px 0" };
const panel = { background:"#fff", borderRadius:12, padding:12, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", marginBottom:12 };
const row = { display:"flex", alignItems:"center", gap:8, marginBottom:8 };
const lab = { width:120, fontSize:12, color:"#555" };
const select = { flex:1, padding:"8px 10px", borderRadius:8, border:"1px solid #ccc" };
const num = { width:90, padding:"8px 10px", borderRadius:8, border:"1px solid #ccc" };
const btn = { marginTop:6, padding:"10px 14px", borderRadius:10, background:"#009FDA", color:"white", fontWeight:600, border:"none" };
const stage = { position:"relative", background:"#EAF6FF", borderRadius:16, boxShadow:"inset 0 1px 6px rgba(0,0,0,0.06)", margin:"8px auto" };
const readouts = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:8, marginTop:8 };
const mono = { fontFamily:"ui-monospace, Menlo, Consolas, monospace", fontSize:12, paddingLeft:6, minWidth:28, textAlign:"right" };

/* download helper */
function downloadCanvas(canvas, filename) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
