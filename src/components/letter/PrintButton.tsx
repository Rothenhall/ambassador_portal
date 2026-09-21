"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary no-print">
      Print or save as PDF
    </button>
  );
}
