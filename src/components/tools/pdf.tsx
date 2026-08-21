"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, TextArea } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";

/* ---------------- Text to PDF ---------------- */

export function TextToPdf({ onResult }: ToolProps) {
  const [content, setContent] = useState("OmniKit Tools — Text to PDF\n\nThis document was generated 100% on-device.\n\n• No uploads\n• No servers\n• No data retention\n\nLine 1 of a paragraph that will wrap across the page width and demonstrate the export formatting engine built into the universal action bar.");
  const [title, setTitle] = useState("OmniKit Report");
  const [fontSize, setFontSize] = useState(11);
  const [done, setDone] = useState(false);

  const generate = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setProperties({ title });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, margin, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text("Generated on-device by OmniKit Tools", margin, 76);
    doc.setTextColor(20);
    doc.setFont("courier", "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(content, width);
    doc.text(lines, margin, 100);
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      doc.text(`Page ${i} — OmniKit Tools`, margin, doc.internal.pageSize.getHeight() - 28);
    }
    doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "document"}.pdf`);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  useEffect(() => {
    onResult?.({ text: `${title}\n\n${content}`, ext: "txt" });
  }, [title, content, onResult]);

  return (
    <div className="space-y-4">
      <Field label="Document title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Content"><TextArea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px]" /></Field>
      <div className="flex flex-wrap items-center gap-4">
        <Field label="Font size (pt)"><Input type="number" min={6} max={24} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-24" /></Field>
        <div className="mt-5">
          <Button onClick={() => void generate()}>{done ? "✓ PDF saved" : "⬇ Generate PDF (jsPDF)"}</Button>
        </div>
      </div>
      <p className="text-xs text-slate-500">jsPDF is dynamically imported on first use — your initial page load stays under 50KB.</p>
    </div>
  );
}

/* ---------------- PDF Metadata Generator ---------------- */

export function PdfMetadataGenerator({ onResult }: ToolProps) {
  const [title, setTitle] = useState("Quarterly Report");
  const [author, setAuthor] = useState("Hassan Asghar");
  const [subject, setSubject] = useState("On-device generated document");
  const [keywords, setKeywords] = useState("omnikit, pdf, metadata");
  const [done, setDone] = useState(false);

  const generate = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setProperties({ title, author, subject, keywords });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 48, 64);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110);
    doc.text(`Author: ${author} · Subject: ${subject} · Keywords: ${keywords}`, 48, 84);
    doc.setTextColor(20);
    doc.text("This blank PDF carries the metadata configured above.", 48, 110);
    doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "document"}.pdf`);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  useEffect(() => {
    onResult?.({
      text: `Title: ${title}\nAuthor: ${author}\nSubject: ${subject}\nKeywords: ${keywords}`,
      ext: "txt",
    });
  }, [title, author, subject, keywords, onResult]);

  return (
    <div className="space-y-4">
      <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Author"><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></Field>
      <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
      <Field label="Keywords"><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} /></Field>
      <Button onClick={() => void generate()}>{done ? "✓ PDF saved" : "⬇ Generate PDF with metadata"}</Button>
    </div>
  );
}
