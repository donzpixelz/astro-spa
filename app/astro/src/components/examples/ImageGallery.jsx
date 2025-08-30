import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ImageGallery — grid of thumbnails + lightbox modal
 * Keyboard: Enter to open, Esc to close, ←/→ to navigate, Tab focus-trapped
 * Props:
 *   items: [{ id, src, full, alt, caption }]
 */
export default function ImageGallery({ items = [] }) {
    const [open, setOpen] = useState(false);
    const [idx, setIdx] = useState(0);
    const lastFocused = useRef(null);
    const panelRef = useRef(null);

    const count = items.length;
    const current = items[idx] || null;

    const go = (delta) => {
        if (!count) return;
        setIdx((i) => (i + delta + count) % count);
    };

    // Preload neighbors for snappy nav
    useEffect(() => {
        if (!open || !count) return;
        const next = new Image();
        next.src = items[(idx + 1) % count]?.full || "";
        const prev = new Image();
        prev.src = items[(idx - 1 + count) % count]?.full || "";
    }, [open, idx, count, items]);

    // Global keyboard when open
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
            else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    // Focus management: open -> focus panel; close -> restore focus
    useEffect(() => {
        if (open) {
            setTimeout(() => panelRef.current?.focus(), 0);
        } else if (lastFocused.current) {
            lastFocused.current.focus?.();
        }
    }, [open]);

    // Basic focus trap inside the dialog
    const onKeyDownTrap = (e) => {
        if (e.key !== "Tab") return;
        const focusables = panelRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables || []).filter(el => !el.hasAttribute("disabled"));
        if (list.length < 2) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
        }
    };

    const openAt = (i, el) => {
        lastFocused.current = el || document.activeElement;
        setIdx(i);
        setOpen(true);
    };

    const onBackdropMouseDown = (e) => {
        if (e.target === e.currentTarget) setOpen(false);
    };

    return (
        <div className="ig">
            <ul className="ig-grid" role="list">
                {items.map((it, i) => (
                    <li key={it.id} className="ig-card">
                        <button
                            type="button"
                            className="ig-thumbbtn"
                            onClick={(e) => openAt(i, e.currentTarget)}
                            aria-haspopup="dialog"
                            aria-label={`Open image ${i + 1} of ${count}${it.caption ? `: ${it.caption}` : ""}`}
                        >
                            <img className="ig-thumb" src={it.src} alt={it.alt || ""} loading="lazy" />
                        </button>
                        {it.caption && <div className="ig-cap">{it.caption}</div>}
                    </li>
                ))}
            </ul>

            {open && current && (
                <div className="ig-overlay" role="presentation" onMouseDown={onBackdropMouseDown}>
                    <div
                        className="ig-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Image viewer"
                        ref={panelRef}
                        tabIndex={-1}
                        onKeyDown={onKeyDownTrap}
                    >
                        <div className="ig-topbar">
                            <div className="ig-counter">{idx + 1} / {count}</div>
                            <button className="ig-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
                        </div>

                        <div className="ig-stage">
                            <button className="ig-nav prev" type="button" onClick={() => go(-1)} aria-label="Previous image">‹</button>
                            <img className="ig-full" src={current.full} alt={current.alt || ""} />
                            <button className="ig-nav next" type="button" onClick={() => go(1)} aria-label="Next image">›</button>
                        </div>

                        {current.caption && <div className="ig-caption">{current.caption}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
