import React, { useEffect, useState } from "react";

/**
 * ClipboardTools — copy code + copy deep link per snippet.
 * Props:
 *   snippets: Array<{ id, title?, language?, code }>
 */
export default function ClipboardTools({ snippets = [] }) {
    const [status, setStatus] = useState({}); // { [id]: "Copied!" | "Link copied!" | "Error" }

    // Clear status after a short delay
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

    return (
        <div className="clip">
            {snippets.map((s) => (
                <section key={s.id} id={s.id} className="clip-block">
                    <header className="clip-head">
                        <div className="clip-titles">
                            <h3 className="clip-title">{s.title || "Snippet"}</h3>
                            {s.language ? <span className="clip-lang">{s.language}</span> : null}
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

                    <div className="clip-codewrap">
            <pre className="clip-pre" tabIndex={0}>
              <code className={`language-${(s.language || "").toLowerCase()}`}>{s.code}</code>
            </pre>
                    </div>
                </section>
            ))}
        </div>
    );
}
