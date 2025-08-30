import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * CommandPalette — Ctrl/Cmd-K to open, arrow keys to navigate, Enter to run, Esc to close.
 * No styles here; all styling lives in global.css (.cp-* classes).
 *
 * Props:
 *   commands?: Array<{ id, title, subtitle?, href?, run? }>
 */
export default function CommandPalette({ commands }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [i, setI] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const lastFocused = useRef(null);

    // Default command list (edit freely)
    const defaults = useMemo(() => ([
        { id: "home",    title: "Home",                    subtitle: "Go to homepage",                     href: "/" },
        { id: "about",   title: "About",                   subtitle: "Project overview",                   href: "/about" },
        { id: "contact", title: "Contact",                 subtitle: "Say hello",                          href: "/contact" },
        { id: "ex",      title: "Examples",                subtitle: "Examples landing page",              href: "/examples" },
        { id: "theme",   title: "Theme Switcher",          subtitle: "Light / Dark / Sepia",               href: "/examples/react-theme-switcher" },
        { id: "acc",     title: "Accordion",               subtitle: "Accessible React accordion",         href: "/examples/react-accordion" },
        { id: "table",   title: "Filterable List/Table",   subtitle: "Search · Filter · Sort",             href: "/examples/react-filter-table" },
        { id: "palette", title: "Command Palette (this)",  subtitle: "You are here",                       href: "/examples/react-command-palette" },
    ]), []);

    const cmds = commands && commands.length ? commands : defaults;

    // Simple filter (split on spaces; all tokens must match title or subtitle)
    const filtered = useMemo(() => {
        const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return cmds;
        return cmds.filter(c => {
            const hay = (c.title + " " + (c.subtitle || "")).toLowerCase();
            return tokens.every(t => hay.includes(t));
        });
    }, [cmds, q]);

    // Global hotkeys: Ctrl/Cmd-K opens; Esc closes
    useEffect(() => {
        const onKey = (e) => {
            const k = e.key.toLowerCase();
            const metaK = (k === "k" && (e.metaKey || e.ctrlKey));
            if (metaK) {
                e.preventDefault();
                lastFocused.current = document.activeElement;
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
            } else if (open && k === "escape") {
                e.preventDefault();
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    // Close → return focus to previous element
    useEffect(() => {
        if (!open && lastFocused.current) {
            (lastFocused.current)?.focus?.();
            setQ("");
            setI(0);
        }
    }, [open]);

    // Keyboard nav inside palette
    const onInputKeyDown = (e) => {
        if (!open) return;
        const k = e.key;
        if (k === "ArrowDown") {
            e.preventDefault();
            setI(v => Math.min(v + 1, Math.max(filtered.length - 1, 0)));
        } else if (k === "ArrowUp") {
            e.preventDefault();
            setI(v => Math.max(v - 1, 0));
        } else if (k === "Enter") {
            e.preventDefault();
            const sel = filtered[i];
            if (sel) runCommand(sel);
        }
    };

    // Click outside (backdrop) closes
    const onBackdropClick = (e) => {
        if (e.target === e.currentTarget) setOpen(false);
    };

    const runCommand = (cmd) => {
        if (cmd.run) cmd.run();
        if (cmd.href) window.location.href = cmd.href;
        setOpen(false);
    };

    // Keep highlighted row visible
    useEffect(() => {
        if (!open) return;
        const el = listRef.current?.querySelector('[data-active="true"]');
        el?.scrollIntoView?.({ block: "nearest" });
    }, [i, open, filtered.length]);

    // Basic focus trap (Tab wraps inside)
    useEffect(() => {
        if (!open) return;
        const trap = (e) => {
            if (e.key !== "Tab") return;
            const focusables = Array.from(
                document.querySelectorAll('.cp-panel input, .cp-panel button, .cp-panel a, .cp-panel [tabindex]:not([tabindex="-1"])')
            ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        };
        document.addEventListener("keydown", trap);
        return () => document.removeEventListener("keydown", trap);
    }, [open]);

    return (
        <>
            {/* Optional launcher button for mouse users */}
            <button className="cp-launch" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
                Open Command Palette ⌘K
            </button>

            {open && (
                <div className="cp-overlay" role="presentation" onMouseDown={onBackdropClick}>
                    <div className="cp-panel" role="dialog" aria-modal="true" aria-labelledby="cp-label">
                        <div className="cp-header">
                            <div id="cp-label" className="cp-title">Command Palette</div>
                            <button className="cp-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
                        </div>

                        <div className="cp-inputwrap">
                            <input
                                ref={inputRef}
                                className="cp-input"
                                placeholder="Type a command…"
                                value={q}
                                onChange={(e) => { setQ(e.target.value); setI(0); }}
                                onKeyDown={onInputKeyDown}
                                aria-activedescendant={filtered[i]?.id ? `cp-opt-${filtered[i].id}` : undefined}
                            />
                            <div className="cp-hint">Enter ↵ · Esc · ↑/↓ · ⌘K</div>
                        </div>

                        <div className="cp-listwrap" ref={listRef}>
                            {filtered.length === 0 ? (
                                <div className="cp-empty muted">No matches.</div>
                            ) : (
                                <ul className="cp-list" role="listbox">
                                    {filtered.map((cmd, idx) => {
                                        const active = idx === i;
                                        return (
                                            <li
                                                key={cmd.id}
                                                id={`cp-opt-${cmd.id}`}
                                                data-active={active ? "true" : undefined}
                                                className={`cp-item${active ? " active" : ""}`}
                                                role="option"
                                                aria-selected={active}
                                                tabIndex={-1}
                                                onMouseEnter={() => setI(idx)}
                                                onMouseDown={(e) => { e.preventDefault(); runCommand(cmd); }}
                                            >
                                                <div className="cp-item-title">{cmd.title}</div>
                                                {cmd.subtitle && <div className="cp-item-sub">{cmd.subtitle}</div>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
