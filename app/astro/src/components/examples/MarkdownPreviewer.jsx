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
        // 1) Render to HTML
        let raw = marked.parse(text);

        // 2) Normalize task list markup IN THE STRING
        // Case A: renderer split into two <li>s:
        //   <li><input …></li><li>Label…</li>  ->  <li class="task-fix"><input …><span>Label…</span></li>
        raw = raw.replace(
            /<li>\s*(<input[^>]*type="checkbox"[^>]*>)\s*<\/li>\s*<li>([\s\S]*?)<\/li>/g,
            '<li class="task-fix">$1<span>$2</span></li>'
        );
        // Case B: checkbox + label already in one <li> (ensure class & span wrapper)
        raw = raw.replace(
            /<li>\s*(<input[^>]*type="checkbox"[^>]*>)([\s\S]*?)<\/li>/g,
            '<li class="task-fix">$1<span>$2</span></li>'
        );

        // 3) Sanitize for the browser
        if (!IS_BROWSER) return raw;
        const purify =
            (DOMPurify && DOMPurify.sanitize) ||
            (DOMPurify && DOMPurify.default && DOMPurify.default.sanitize);
        return purify ? purify(raw) : raw;
    }, [text]);

    return (
        <div className="mdp-grid">
            <section className="mdp-pane">
                <div className="mdp-toolbar">
                    <strong>Markdown</strong>
                    <div className="mdp-actions">
                        <button className="btn" onClick={() => setText(SAMPLE)} type="button">Reset</button>
                        <button
                            className="btn"
                            type="button"
                            onClick={async () => { try { await navigator.clipboard.writeText(text); } catch {} }}
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
