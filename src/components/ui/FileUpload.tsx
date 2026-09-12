"use client";
import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function FileUpload({ accept, multiple = false, onFiles, label = "Upload files", hint, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer select-none",
        dragging
          ? "border-gold-400 bg-gold-50"
          : "border-stone-300 hover:border-gold-400 hover:bg-stone-50",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
        disabled={disabled}
        aria-hidden
      />
      <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center">
        <Upload className="h-5 w-5 text-stone-400" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-stone-700">{label}</p>
        <p className="text-xs text-stone-400 mt-0.5">
          {hint ?? "Drag & drop or click to browse"}
        </p>
      </div>
    </div>
  );
}
