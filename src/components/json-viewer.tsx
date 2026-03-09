"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";

interface JsonViewerProps {
    readonly data: Record<string, unknown>;
    readonly title?: string;
}

function JsonArray({ value, depth }: { readonly value: unknown[]; readonly depth: number }) {
    const [collapsed, setCollapsed] = useState(depth > 1);

    if (value.length === 0) return <span className="text-slate-500">[]</span>;

    return (
        <span>
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="inline-flex items-center text-slate-500 hover:text-slate-700 transition-colors"
            >
                {collapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                )}
                <span className="text-xs ml-1">
                    [{value.length} item{value.length !== 1 && "s"}]
                </span>
            </button>
            {!collapsed && (
                <div className="ml-4 border-l border-slate-200 pl-3">
                    {value.map((item, i) => (
                        <div key={`${i}-${JSON.stringify(item).slice(0, 20)}`} className="py-0.5">
                            <span className="text-slate-600 text-xs mr-2">{i}</span>
                            <JsonValue value={item} depth={depth + 1} />
                        </div>
                    ))}
                </div>
            )}
        </span>
    );
}

function JsonObject({ value, depth }: { readonly value: Record<string, unknown>; readonly depth: number }) {
    const [collapsed, setCollapsed] = useState(depth > 1);
    const entries = Object.entries(value);

    if (entries.length === 0) return <span className="text-slate-500">{"{}"}</span>;

    return (
        <span>
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="inline-flex items-center text-slate-500 hover:text-slate-700 transition-colors"
            >
                {collapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                )}
                <span className="text-xs ml-1">
                    {"{"}
                    {entries.length} key{entries.length !== 1 && "s"}
                    {"}"}
                </span>
            </button>
            {!collapsed && (
                <div className="ml-4 border-l border-slate-200 pl-3">
                    {entries.map(([k, v]) => (
                        <div key={k} className="py-0.5">
                            <span className="text-sky-600">&quot;{k}&quot;</span>
                            <span className="text-slate-600">: </span>
                            <JsonValue value={v} depth={depth + 1} />
                        </div>
                    ))}
                </div>
            )}
        </span>
    );
}

function JsonValue({ value, depth = 0 }: { readonly value: unknown; readonly depth?: number }) {
    if (value === null) {
        return <span className="text-slate-500 italic">null</span>;
    }
    if (typeof value === "boolean") {
        return (
            <span className={value ? "text-green-600" : "text-red-600"}>
                {String(value)}
            </span>
        );
    }
    if (typeof value === "number") {
        return <span className="text-amber-600">{value}</span>;
    }
    if (typeof value === "string") {
        return <span className="text-emerald-700">&quot;{value}&quot;</span>;
    }
    if (Array.isArray(value)) {
        return <JsonArray value={value} depth={depth} />;
    }
    if (typeof value === "object") {
        return <JsonObject value={value as Record<string, unknown>} depth={depth} />;
    }
    // At this point, value can only be undefined, bigint, symbol, or function
    if (value === undefined || typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
        return <span className="text-slate-600">{String(value)}</span>;
    }
    // Fallback for any other type
    return <span className="text-slate-600">unknown</span>;
}

export default function JsonViewer({ data, title = "Generated Ticket" }: JsonViewerProps) {
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);

    const rawJson = JSON.stringify(data, null, 2);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(rawJson);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        {showRaw ? "Tree View" : "Raw JSON"}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-green-600" /> Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" /> Copy
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className="max-h-[500px] overflow-auto p-4 font-mono text-sm">
                {showRaw ? (
                    <pre className="whitespace-pre-wrap text-slate-700">{rawJson}</pre>
                ) : (
                    <JsonValue value={data} depth={0} />
                )}
            </div>
        </div>
    );
}
