import React, { useState } from "react";

export default function App() {
  const [garment, setGarment] = useState("tee_ss");
  const [size, setSize] = useState("M");

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>GMS (Garment Mockup Studio)</h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        Deployed test build. We’ll add the full features next—this confirms everything runs on Vercel.
      </p>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <label>
          <div style={{ fontSize: 12, color: "#666" }}>Garment</div>
          <select value={garment} onChange={(e) => setGarment(e.target.value)} style={fieldStyle}>
            <option value="tee_ss">Short Sleeve Tee</option>
            <option value="tee_ls">Long Sleeve Tee</option>
            <option value="hoodie">Hoodie</option>
            <option value="jacket">Jacket</option>
            <option value="cap">Cap / Hat</option>
            <option value="beanie">Beanie / Toboggan</option>
            <option value="other">Other (Custom)</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, color: "#666" }}>Size</div>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={fieldStyle}>
            <option>XS</option><option>S</option><option>M</option><option>L</option>
            <option>XL</option><option>2XL</option><option>3XL</option><option>4XL</option>
          </select>
        </label>
      </div>

      <div style={box}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Preview</div>
        <div style={{ border: "1px dashed #aaa", padding: 12, borderRadius: 8, background: "#f7f7f7" }}>
          <div>Garment: <b>{labelMap[garment]}</b></div>
          <div>Size: <b>{size}</b></div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
            (Next step: upload art, drag/resize in print area, export PNG.)
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#666", marginTop: 16 }}>
        Tip: Once it builds, open the live site in Chrome → “Add to Home screen”.
      </div>
    </div>
  );
}

const fieldStyle = { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" };
const box = { background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
const labelMap = {
  tee_ss: "Short Sleeve Tee",
  tee_ls: "Long Sleeve Tee",
  hoodie: "Hoodie",
  jacket: "Jacket",
  cap: "Cap / Hat",
  beanie: "Beanie / Toboggan",
  other: "Other (Custom)",
};
