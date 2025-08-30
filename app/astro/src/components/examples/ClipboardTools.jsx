import React, { useEffect, useState } from "react";

/**
 * ClipboardTools — copy code, copy deep link, optional line numbers, and filename badge.
 *
 * Props:
 *   snippets: Array<{
 *     id: string;
 *     title?: string;
 *     language?: string;
 *     code: string;
 *     filename?: string;        // shows a badge; clicking it copies the filename
 *     lineNumbers?: boolean;    // turn on line numbers for this snippet
 *   }>
 */
export default function ClipboardTools({ snippets = [] }) {
    const [status, setStatus] = useState({}); // { [id]: "Copied!" | "Link copied!" | "Name copied!" | "Copy failed" }

    // Clear per-snippet status after a short delay
    useEffect(() => {
        if (!Object.keys(status).length) return;
        const t = setTimeout(() => setStatus({}), 1500);
        return () => clearTimeout(t);
    }, [status]);

    async function writeText(text) {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            // Fallback
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "absolute";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }

    async function copyCode(snippet) {
        const ok = await writeText(snippet.code);
        setStatus({ [snippet.id]: ok ? "Copied!" : "Copy failed" });
    }

    async function copyLink(snippet) {
        const url = `${location.origin}${location.pathname}#${snippet.id}`;
        const ok = await writeText(url);
        setStatus({ [snippet.id]: ok ? "Link copied!" : "Copy failed" });
    }

    async function copyFilename(snippet) {
        if (!snippet.filename) return;
        const ok = await writeText(snippet.filename);
        setStatus({ [snippet.id]: ok ? "Name copied!" : "Copy failed" });
    }

    const renderCode = (s) => {
        if (s.lineNumbers) {
            // Keep whitespace and prevent wrapping so numbers align
            const lines = s.code.replace(/\n$/, "\n").split("\n");
            return (
                <div className="clip-code has-lines">
                    <div className="clip-lnums" aria-hidden="true">
                        {lines.map((_, idx) => (
                            <span key={idx + 1}>{idx + 1}</span>
                        ))}
                    </div>
                    <pre className="clip-pre" tabIndex={0}>
            <code className={`language-${(s.language || "").toLowerCase()}`}>{s.code}</code>
          </pre>
                </div>
            );
        }
        // No line numbers (simple)
        return (
            <div className="clip-code">
        <pre className="clip-pre" tabIndex={0}>
          <code className={`language-${(s.language || "").toLowerCase()}`}>{s.code}</code>
        </pre>
            </div>
        );
    };

    return (
        <div className="clip">
            {snippets.map((s) => (
                <section key={s.id} id={s.id} className="clip-block">
                    <header className="clip-head">
                        <div className="clip-titles">
                            <h3 className="clip-title">{s.title || "Snippet"}</h3>
                            {s.language ? <span className="clip-lang">{s.language}</span> : null}
                            {s.filename ? (
                                <button
                                    className="clip-file"
                                    type="button"
                                    onClick={() => copyFilename(s)}
                                    title="Copy filename"
                                    aria-label={`Copy filename ${s.filename}`}
                                >
                                    {s.filename}
                                </button>
                            ) : null}
                        </div>

                        <div className="clip-toolbar" role="group" aria-label="Clipboard actions">
                            <button className="clip-btn" type="button" onClick={() => copyCode(s)} aria-label="Copy code">
                                Copy
                            </button>
                            <button className="clip-btn ghost" type="button" onClick={() => copyLink(s)} aria-label="Copy link to this snippet">
                                Copy link
                            </button>
                            <span className="clip-status" role="status" aria-live="polite">
                {status[s.id] || ""}
              </span>
                        </div>
                    </header>

                    <div className="clip-codewrap">{renderCode(s)}</div>
                </section>
            ))}
        </div>
    );
}
