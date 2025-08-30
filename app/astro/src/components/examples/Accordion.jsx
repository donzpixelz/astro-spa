import React, { useId, useMemo, useRef, useState } from "react";

export default function Accordion({ items = [], allowMultiple = false, defaultOpenIds = [] }) {
    const baseId = useId();
    const [openIds, setOpenIds] = useState(new Set(defaultOpenIds));
    const headerRefs = useRef([]);

    const ids = useMemo(() => {
        return items.map((item, i) => {
            const hid = `${baseId}-h-${item.id ?? i}`;
            const pid = `${baseId}-p-${item.id ?? i}`;
            return { hid, pid };
        });
    }, [items, baseId]);

    function toggle(id) {
        setOpenIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else allowMultiple ? next.add(id) : (next.clear(), next.add(id));
            return next;
        });
    }

    function onKeyDown(e, index) {
        const count = items.length;
        const focus = (i) => headerRefs.current[i]?.focus();
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault(); focus((index + 1) % count); break;
            case "ArrowUp":
                e.preventDefault(); focus((index - 1 + count) % count); break;
            case "Home":
                e.preventDefault(); focus(0); break;
            case "End":
                e.preventDefault(); focus(count - 1); break;
            default:
                break;
        }
    }

    return (
        <div className="accordion" role="presentation">
            {items.map((item, i) => {
                const { hid, pid } = ids[i];
                const isOpen = openIds.has(item.id ?? i);
                return (
                    <section className={`acc-item ${isOpen ? "open" : ""}`} key={item.id ?? i}>
                        <h3 className="acc-header">
                            <button
                                id={hid}
                                ref={(el) => (headerRefs.current[i] = el)}
                                className="acc-trigger"
                                aria-controls={pid}
                                aria-expanded={isOpen}
                                onClick={() => toggle(item.id ?? i)}
                                onKeyDown={(e) => onKeyDown(e, i)}
                                type="button"
                            >
                                <span className="acc-title">{item.title}</span>
                                <span aria-hidden="true" className="acc-indicator">{isOpen ? "−" : "+"}</span>
                            </button>
                        </h3>
                        <div
                            id={pid}
                            role="region"
                            aria-labelledby={hid}
                            className="acc-panel"
                            hidden={!isOpen}
                        >
                            <div className="acc-panel-inner">
                                {item.body}
                            </div>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
