"use client";
import React, { useEffect, useRef } from "react";

export interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500/60 resize-none shadow-inner"
      spellCheck={false}
      rows={10}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};
