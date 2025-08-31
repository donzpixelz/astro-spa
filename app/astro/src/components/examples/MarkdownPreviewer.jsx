import React, { useMemo, useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

const IS_BROWSER = typeof window !== "undefined";

// GFM on
marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
});

const SAMPLE = `# Markdown Previewer

Type on the left, preview on the right.

## Features
- **Bold**, _italic_, and \`inline code\`
- Fenced code:

\`\`\`js
function hello(name){ console.log("Hello, " + name); }
\`\`\`

- Tables:

| Animal | Sound |
|-------:|:------|
| Cat    | meow  |
| Dog    | woof  |

- Task list:
- [x] Write demo
- [ ] Ship it

- ~~Strikethrough~~
- Links like [Astro](https://astro.build)

> Tip: Try editing this text!
`;

export default function MarkdownPreviewer() {
    const [text, setText] = useState(SAMPLE);

    const html = useMemo(() => {
        const raw = marked.parse(text);
        if (!IS_BROWSER) return raw;
        const purify =
            (DOMPurify && DOMPurify.sanitize) ||
            (DOMPurify && DOMPurify.default && DOMPurify.default.sanitize);
        return purify ? purify(raw) : raw;
    }, [text]);

    // Normalize task-list markup produced by the renderer/sanitizer:
    // If we ever get <li><input …></li><li>Label</li>, merge them into one.
    useEffect(() => {
        if (!IS_BROWSER) return;
        const root = document.querySelector(".mdp-preview");
        if (!root) return;

        root.querySelectorAll("ul, ol").forEach((list) => {
            const items = Array.from(list.children).filter((n) => n.tagName === "LI");
            for (let i = 0; i < items.length - 1; i++) {
                const a = items[i];
                const b = items[i + 1];
                if (!a || !b) continue;

                const checkbox = a.querySelector('input[type="checkbox"]');
                if (!checkbox) continue;

                // Is "a" only the checkbox (plus whitespace)?
                const aOnlyCheckbox =
                    Array.from(a.childNodes).every((n) => {
                        if (n === checkbox) return true;
                        if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim() === "";
                        return false;
                    });

                // Is "b" a text-only or text-with-<p> item (and *not* another checkbox li)?
                const bHasCheckbox = !!b.querySelector('input[type="checkbox"]');
                if (aOnlyCheckbox && !bHasCheckbox) {
                    // Move b's children after the checkbox inside a, then remove b.
                    while (b.firstChild) a.appendChild(b.firstChild);
                    b.remove();
                    // Tag as a normalized task item for CSS
                    a.classList.add("task-fix");
                    // Recompute array shape
                    items.splice(i + 1, 1);
                    i--; // re-check current index in case of chains
                }
            }
        });

        // Also tag any li that already contains checkbox + text in one
        root.querySelectorAll('li > input[type="checkbox"]').forEach((input) => {
            const li = input.closest("li");
            if (li) li.classList.add("task-fix");
        });
    }, [html]);

    return (
        <div className="mdp-grid">
            <section className="mdp-pane">
                <div className="mdp-toolbar">
                    <strong>Markdown</strong>
                    <div className="mdp-actions">
                        <button className="btn" onClick={() => setText(SAMPLE)} type="button">
                            Reset
                        </button>
                        <button
                            className="btn"
                            type="button"
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
