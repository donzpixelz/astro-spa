import React, { useEffect, useRef, useState } from "react";

/**
 * A11y Tabs (submenu) — keyboard support + hash sync (no routing change)
 * Props:
 *  - tabs: [{ id, label, items: [{ href, label, desc? }] }]
 *  - defaultTabId?: string
 */
export default function Tabs({ tabs = [], defaultTabId }) {
    const initial = () => {
        if (typeof window !== "undefined") {
            const hash = window.location.hash?.slice(1);
            if (hash && tabs.some(t => t.id === hash)) return hash;
        }
        return defaultTabId || (tabs[0]?.id ?? "");
    };

    const [active, setActive] = useState(initial);
    const refs = useRef([]);

    useEffect(() => {
        if (!active || typeof window === "undefined") return;
        // Update hash without jumping
        if (window.location.hash.slice(1) !== active) {
            history.replaceState(null, "", `#${active}`);
        }
    }, [active]);

    const onKeyDown = (e, i) => {
        const N = tabs.length;
        const focus = (idx) => refs.current[idx]?.focus();
        switch (e.key) {
            case "ArrowRight": e.preventDefault(); focus((i + 1) % N); break;
            case "ArrowLeft":  e.preventDefault(); focus((i - 1 + N) % N); break;
            case "Home":       e.preventDefault(); focus(0); break;
            case "End":        e.preventDefault(); focus(N - 1); break;
            case "Enter":
            case " ":
                e.preventDefault();
                setActive(tabs[i].id);
                break;
            default: break;
        }
    };

    return (
        <div className="tabs">
            <div className="tablist" role="tablist" aria-label="Examples submenu">
                {tabs.map((t, i) => {
                    const selected = active === t.id;
                    return (
                        <button
                            key={t.id}
                            role="tab"
                            id={`tab-${t.id}`}
                            aria-selected={selected}
                            aria-controls={`panel-${t.id}`}
                            tabIndex={selected ? 0 : -1}
                            className="tab"
                            onClick={() => setActive(t.id)}
                            onKeyDown={(e) => onKeyDown(e, i)}
                            ref={(el) => (refs.current[i] = el)}
                            type="button"
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {tabs.map((t) => {
                const hidden = active !== t.id;
                return (
                    <div
                        key={t.id}
                        role="tabpanel"
                        id={`panel-${t.id}`}
                        aria-labelledby={`tab-${t.id}`}
                        className="tabpanel"
                        hidden={hidden}
                    >
                        <ul className="tab-links">
                            {t.items.map((it) => (
                                <li key={it.href}>
                                    <a href={it.href}>{it.label}</a>
                                    {it.desc ? <span className="muted"> — {it.desc}</span> : null}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}
