import React, { useMemo, useState } from "react";

/**
 * Simple, dependency-free Markdown renderer for demo purposes.
 * Supports: headings (#..######), bold ** **, italic * * / _ _,
 * inline code `code`, fenced code ```lang\n...\n```,
 * links [text](https://...), unordered lists (- or *), and paragraphs.
 * NOTE: This is intentionally minimal for the demo.
 */

const SAMPLE = `# Markdown Previewer

Type on the left, preview on the right.

## Features
- **Bold**, *italic*, and \`inline code\`
- Fenced code blocks:
\`\`\`
function hello(name){ console.log("Hello, " + name); }
\`\`\`
- Headings (#..######)
- Links like [Astro](https://astro.build)
- Lists, paragraphs, etc.

> Tip: Try editing this text!
`;

export default function MarkdownPreviewer() {
    const [text, setText] = useState(SAMPLE);

    const html = useMemo(() => renderMarkdown(text), [text]);

    return (
        <div className="mdp-grid">
            <section className="mdp-pane">
                <div className="mdp-toolbar">
                    <strong>Markdown</strong>
                    <div className="mdp-actions">
                        <button className="btn" onClick={() => setText(SAMPLE)}>Reset</button>
                        <button
                            className="btn"
                            onClick={async () => {
                                try { await navigator.clipboard.writeText(text); } catch {}
                            }}
                            aria-label="Copy raw markdown"
                        >
                            Copy
                        </button>
                    </div>
                </div>
                <textarea
                    className="mdp-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck={false}
                    aria-label="Markdown input"
                />
            </section>

            <section className="mdp-pane">
                <div className="mdp-toolbar"><strong>Preview</strong></div>
                <div className="mdp-preview" dangerouslySetInnerHTML={{ __html: html }} />
            </section>
        </div>
    );
}

/* ---------- tiny renderer ---------- */

function escapeHTML(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function renderMarkdown(src) {
    if (!src) return "";

    // Normalize line endings
    let s = src.replace(/\r\n?/g, "\n");

    // Escape HTML first
    s = escapeHTML(s);

    // Fenced code blocks ``` ```
    s = s.replace(/```([\s\S]*?)```/g, (_m, code) => {
        const c = code.replace(/^\n+|\n+$/g, "");
        return `<pre class="mdp-code"><code>${c}</code></pre>`;
    });

    // Headings ###### .. #
    for (let n = 6; n >= 1; n--) {
        const re = new RegExp(`^${"#".repeat(n)}\\s+(.+)$`, "gm");
        s = s.replace(re, (_m, text) => `<h${n}>${text}</h${n}>`);
    }

    // Unordered lists (simple): group consecutive - or * lines
    s = s.replace(
        /(^(\s*[-*]\s+.+\n?)+)/gm,
        (block) => {
            const items = block
                .trim()
                .split(/\n/)
                .map((line) => line.replace(/^\s*[-*]\s+/, ""))
                .map((t) => `<li>${t}</li>`)
                .join("");
            return `<ul>${items}</ul>`;
        }
    );

    // Blockquotes (single-line)
    s = s.replace(/^\s*>\s?(.+)$/gm, (_m, q) => `<blockquote>${q}</blockquote>`);

    // Inline code
    s = s.replace(/`([^`\n]+)`/g, (_m, code) => `<code class="mdp-inline">${code}</code>`);

    // Bold **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, (_m, b) => `<strong>${b}</strong>`);

    // Italic *text* or _text_
    s = s.replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, (_m, pre, i) => `${pre}<em>${i}</em>`);
    s = s.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, (_m, pre, i) => `${pre}<em>${i}</em>`);

    // Links [text](http(s)://...)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, href) => {
        return `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
    });

    // Paragraphs: wrap plain text blocks that aren't already blocks
    const lines = s.split(/\n{2,}/).map((blk) => {
        if (/^\s*<(h\d|ul|ol|pre|blockquote)/.test(blk)) return blk;
        if (!blk.trim()) return "";
        return `<p>${blk.replace(/\n/g, "<br/>")}</p>`;
    });

    return lines.join("\n");
}
