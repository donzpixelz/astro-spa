import React, { useEffect, useMemo, useState } from "react";

const SLUG_RE = /^[a-z0-9-]{3,32}$/; // lowercase, digits, hyphen; 3-32 chars
const STORE_KEY = "us-links";

function genSlug(len = 6) {
    const alpha = "abcdefghijkmnopqrstuvwxyz0123456789"; // no l to avoid confusion
    let s = "";
    for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
    return s;
}
function isValidUrl(v) {
    try { new URL(v); return true; } catch { return false; }
}

export default function UrlShortener() {
    const [base, setBase] = useState("https://example.com");
    const [url, setUrl] = useState("");
    const [slug, setSlug] = useState(genSlug());
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");

    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        // determine site origin for preview
        try { setBase(window.location.origin); } catch {}
    }, []);

    useEffect(() => {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch {}
    }, [items]);

    const shortUrl = useMemo(() => `${base}/s/${slug || ""}`, [base, slug]);

    function resetStatus() { setErr(""); setOk(""); }

    function onSubmit(e) {
        e.preventDefault();
        resetStatus();

        // validations
        if (!isValidUrl(url)) {
            setErr("Please enter a valid URL (including http:// or https://).");
            return;
        }
        if (!SLUG_RE.test(slug)) {
            setErr("Slug must be 3–32 chars of lowercase letters, numbers, or hyphens.");
            return;
        }
        const exists = items.some(it => it.slug === slug);
        if (exists) {
            setErr("That slug is already in use. Try another or generate a random one.");
            return;
        }

        const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            url,
            slug,
            createdAt: new Date().toISOString(),
            visits: 0,
        };
        setItems([entry, ...items]);
        setOk("Short link created.");
        setUrl("");
        setSlug(genSlug());
    }

    function copy(text) {
        try {
            navigator.clipboard.writeText(text);
            setOk("Copied to clipboard.");
            setErr("");
        } catch {
            setErr("Copy failed. Your browser may block clipboard writes.");
            setOk("");
        }
    }

    function openOriginal(entry) {
        // simulate visit count
        setItems(items.map(it => it.id === entry.id ? { ...it, visits: (it.visits || 0) + 1 } : it));
        window.open(entry.url, "_blank", "noopener,noreferrer");
    }

    function remove(entry) {
        setItems(items.filter(it => it.id !== entry.id));
    }

    function clearAll() {
        if (!confirm("Remove all saved links?")) return;
        setItems([]);
    }

    return (
        <div className="us">
            <form className="us-form" onSubmit={onSubmit}>
                <div className="us-row">
                    <label className="us-field">
                        <span className="us-label">Original URL</span>
                        <input
                            type="url"
                            placeholder="https://example.org/some/long/path"
                            value={url}
                            onChange={(e) => { resetStatus(); setUrl(e.target.value); }}
                            required
                            inputMode="url"
                        />
                    </label>

                    <label className="us-field us-field-slug">
                        <span className="us-label">Custom slug</span>
                        <div className="us-slugwrap">
                            <span className="us-base">{base}/s/</span>
                            <input
                                className="us-slug"
                                type="text"
                                placeholder="your-slug"
                                value={slug}
                                onChange={(e) => { resetStatus(); setSlug(e.target.value.trim()); }}
                                pattern="[a-z0-9-]{3,32}"
                                title="3–32 chars, lowercase letters, numbers, hyphens"
                                required
                            />
                            <button
                                className="us-btn ghost"
                                type="button"
                                onClick={() => { resetStatus(); setSlug(genSlug()); }}
                                aria-label="Generate random slug"
                                title="Generate random slug"
                            >
                                Random
                            </button>
                        </div>
                    </label>
                </div>

                <div className="us-actions">
                    <button className="us-btn" type="submit">Create</button>
                    <button
                        className="us-btn ghost"
                        type="button"
                        onClick={() => copy(shortUrl)}
                        title="Copy the preview short URL"
                    >
                        Copy preview
                    </button>
                    <div className="us-status" role="status" aria-live="polite">
                        {err && <span className="us-err">{err}</span>}
                        {ok && <span className="us-ok">{ok}</span>}
                    </div>
                </div>
            </form>

            <div className="us-list card">
                <div className="us-listhead">
                    <h2>Saved links</h2>
                    <button className="us-btn ghost danger" type="button" onClick={clearAll}>Clear all</button>
                </div>

                <div className="table-wrap">
                    <table className="ex-table us-table">
                        <thead>
                        <tr>
                            <th scope="col">Short</th>
                            <th scope="col">Original</th>
                            <th scope="col">Created</th>
                            <th scope="col" className="num">Visits</th>
                            <th scope="col" className="num">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                                    No links yet.
                                </td>
                            </tr>
                        ) : items.map((it) => (
                            <tr key={it.id}>
                                <th scope="row">
                                    <code>{base}/s/{it.slug}</code>
                                </th>
                                <td className="us-ellipsize" title={it.url}>{it.url}</td>
                                <td>
                                    <time dateTime={it.createdAt}>
                                        {new Date(it.createdAt).toLocaleString()}
                                    </time>
                                </td>
                                <td className="num">{it.visits || 0}</td>
                                <td className="num us-actions-cell">
                                    <button className="us-btn tiny" type="button" onClick={() => copy(`${base}/s/${it.slug}`)}>Copy</button>
                                    <button className="us-btn tiny" type="button" onClick={() => openOriginal(it)}>Open</button>
                                    <button className="us-btn ghost tiny" type="button" onClick={() => remove(it)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <p className="muted" style={{ marginTop: ".5rem" }}>
                    This is a mock UI. The “short” links are previews; clicking <strong>Open</strong> goes to the original URL.
                </p>
            </div>
        </div>
    );
}
