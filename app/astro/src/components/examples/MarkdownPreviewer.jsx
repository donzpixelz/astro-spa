import React, { useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

const IS_BROWSER = typeof window !== "undefined";

marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
});

// ✅ Add classes for task lists
marked.use({
    renderer: {
        list(body, ordered) {
            const type = ordered ? "ol" : "ul";
            const className = body.includes('type="checkbox"')
                ? ' class="contains-task-list"'
                : "";
            return `<${type}${className}>${body}</${type}>`;
        },
        listitem(text) {
            if (/^\s*<input[^>]+type="checkbox"/.test(text)) {
                return `<li class="task-list-item">${text}</li>`;
            }
            return `<li>${text}</li>`;
        },
    },
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
        const maybeSanitize =
            (DOMPurify && DOMPurify.sanitize) ||
            (DOMPurify && DOMPurify.default && DOMPurify.default.sanitize);
        return maybeSanitize ? maybeSanitize(raw) : raw;
    }, [text]);

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
                                try {
                                    await navigator.clipboard.writeText(text);
                                } catch {}
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
                <div
                    className="mdp-preview"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </section>
        </div>
    );
}
