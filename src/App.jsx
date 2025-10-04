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
    ct
