"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, FileImage } from "lucide-react";

interface FileUploadProps {
    readonly onFileSelect: (file: File) => void;
    readonly selectedFile: File | null;
    readonly previewUrl: string | null;
}

const ACCEPTED_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/heic",
]);
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.tiff,.heic";
const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
    onFileSelect,
    selectedFile,
    previewUrl,
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateAndSelect = useCallback(
        (file: File) => {
            setError(null);
            const ext = file.name.split(".").pop()?.toLowerCase();
            const validExt = ["jpg", "jpeg", "png", "tiff", "heic"];
            if (!ACCEPTED_TYPES.has(file.type) && (!ext || !validExt.includes(ext))) {
                setError("Unsupported file type. Use JPG, PNG, TIFF, or HEIC.");
                return;
            }
            if (file.size > MAX_SIZE_BYTES) {
                setError("File exceeds 200 MB limit.");
                return;
            }
            onFileSelect(file);
        },
        [onFileSelect]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) validateAndSelect(file);
        },
        [validateAndSelect]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) validateAndSelect(file);
        },
        [validateAndSelect]
    );

    return (
        <div className="space-y-4">
            {/* Drop zone */}
            <button
                type="button"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
          w-full relative cursor-pointer rounded-xl border-2 border-dashed 
          transition-all duration-300 ease-in-out p-8 text-center
          ${isDragging
                        ? "border-red-500 bg-red-500/10 scale-[1.02]"
                        : "border-slate-300 bg-slate-100 hover:border-slate-400 hover:bg-slate-200"
                    }
        `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={handleChange}
                    className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                    <div
                        className={`rounded-full p-4 transition-colors ${isDragging ? "bg-red-500/20" : "bg-slate-200"
                            }`}
                    >
                        <Upload
                            className={`h-8 w-8 ${isDragging ? "text-red-500" : "text-slate-500"}`}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Drag & drop your waste image here
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Accepted: JPG, JPEG, PNG, TIFF, HEIC · Max 200 MB
                        </p>
                    </div>
                </div>
            </button>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Preview */}
            {selectedFile && previewUrl && (
                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            <p className="text-sm font-medium text-slate-800 truncate">
                                {selectedFile.name}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            {formatSize(selectedFile.size)}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFileSelect(null as unknown as File);
                        }}
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
