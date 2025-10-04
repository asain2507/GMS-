import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Rnd } from "react-rnd";
import { Upload, Trash2, Image as ImageIcon, Ruler } from "lucide-react";

const GARMENTS = [
  { id: "tee_ss", label: "Short Sleeve Tee", baseInches: { width: 20, height: 28 }, printArea: { top: 3, width: 12, height: 16 } },
  { id: "tee_ls", label: "Long Sleeve Tee", baseInches: { width: 20, height: 29 }, printArea: { top: 3, width: 12, height: 16 } },
  { id: "hoodie", label: "Hoodie", baseInches: { width: 21, height: 28 }, printArea: { top: 4, width: 12, height: 14 } },
  { id: "jacket", label: "Jacket", baseInches: { width: 22, height: 29 }, printArea: { top: 4, width: 11, height: 13 } },
  { id: "cap", label: "Cap / Hat", baseInches: { width: 8, height: 6 }, printArea: { top: 1.5, width: 4.25, height: 2 } },
  { id: "beanie", label: "Beanie / Toboggan", baseInches: { width: 9, height: 7 }, printArea: { top: 1.25, width: 4, height: 2 } },
  { id: "other", label: "Other (Custom)", baseInches: { width: 20, height: 20 }, printArea: { top: 2, width: 10, height: 10 } },
];const SIZES = [
  { code: "XS", widthDelta: -2 },
  { code: "S", widthDelta: -1 },
  { code: "M", widthDelta: 0 },
  { code: "L", widthDelta: 1 },
  { code: "XL", widthDelta: 2 },
  { code: "2XL", widthDelta: 3 },
  { code: "3XL", widthDelta: 4 },
  { code: "4XL", widthDelta: 5 },
];

function useImage(url) {
  const [img, setImg] = useState(null);
  React.useEffect(() => {
    if (!url) return;
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = url;
  }, [url]);
  return img;
}export default function GarmentMockupStudio() {
  const [garmentId, setGarmentId] = useState("tee_ss");
  const [sizeCode, setSizeCode] = useState("M");
  const [ppi, setPpi] = useState(30);
  const [library, setLibrary] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [graphicInches, setGraphicInches] = useState(10);
  const [lockAspect, setLockAspect] = useState(true);
  const [snap, setSnap] = useState(true);
  const stageRef = useRef(null);

  const garment = useMemo(() => GARMENTS.find(g => g.id === garmentId), [garmentId]);
  const size = useMemo(() => SIZES.find(s => s.code === sizeCode), [sizeCode]);

  const garmentInches = useMemo(() => {
    const w = garment.baseInches.width + (size?.widthDelta ?? 0);
    const h = garment.baseInches.height + (size?.widthDelta ?? 0) * 1.2;
    return { w, h };
  }, [garment, size]);

  const garmentPx = useMemo(() => ({ w: garmentInches.w * ppi, h: garmentInches.h * ppi }), [garmentInches, ppi]);
  const printAreaPx = useMemo(() => ({
    x: (garmentInches.w - garment.printArea.width) / 2 * ppi,
    y: garment.printArea.top * ppi,
    w: garment.printArea.width * ppi,
    h: garment.printArea.height * ppi,
  }), [garmentInches, garment, ppi]);return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold mb-4">GMS (Garment Mockup Studio)</h1>
      <p>Coming soon — this placeholder confirms your app structure is working!</p>
      <p className="text-sm text-gray-500 mt-2">Once hosted, you’ll upload graphics and preview placements here.</p>
    </div>
  );
}
