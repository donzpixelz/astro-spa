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
        // Keep it simple; sanitize normally
        return purify ? purify(raw) : raw;
    }, [text]);

    // Normalize task-list markup and add a stable class for CSS
    useEffect(() => {
        if (!IS_BROWSER) return;
        const root = document.querySelector(".mdp-preview");
        if (!root) return;

        // 1) Merge patterns like: <li><input …></li><li>Write demo</li>
        root.querySelectorAll("ul,ol").forEach((list) => {
            const items = Array.from(list.children);
            for (let i = 0; i < items.length - 1; i++) {
                const a = items[i];
                const b = items[i + 1];
                if (!a || !b || a.tagName !== "LI" || b.tagName !== "LI") continue;
                const box = a.querySelector('input[type="checkbox"]');
                const aHasOnlyBox =
                    box &&
                    // a has no text other than whitespace and no other elements
                    Array.from(a.childNodes).every((n) => {
                        if (n === box) return true;
                        if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim() === "";
                        return false;
                    });
                if (aHasOnlyBox) {
                    // move all children from b into a (after the checkbox)
                    while (b.firstChild) a.appendChild(b.firstChild);
                    b.remove();
                    // skip over the removed item
                    items.splice(i + 1, 1);
                }
            }
        });

        // 2) Tag every <li> that contains a checkbox
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
