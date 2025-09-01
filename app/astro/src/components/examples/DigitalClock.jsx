import { useEffect, useState, useMemo } from "react";

/**
 * DigitalClock — self-contained; prevents halo from reaching the overline.
 * - A top cover strip hides any glow that would creep upward.
 * - Small side padding avoids AM/PM clipping on mobile.
 * - No external CSS changes required.
 */
export default function DigitalClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const line = useMemo(() => {
        const date = now.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "2-digit",
        });
        const time = now.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
        return `${date} • ${time}`;
    }, [now]);

    // Tweak these if you want a slightly bigger/smaller guard.
    const GUARD = 10;        // px of protected area under the overline
    const SIDE_PAD = 12;     // px to avoid AM/PM clipping
    const BG = "var(--bg, #fff)";

    return (
        <div style={{ position: "relative", display: "block" }} aria-live="polite">
            {/* Top cover strip: blocks any halo from reaching the overline */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: GUARD,
                    background: BG,
                    zIndex: 2,
                    pointerEvents: "none",
                }}
            />
            {/* Clock with a tiny top gap + side padding; all halo stays below the strip */}
            <div
                className="clock-shell"
                style={{
                    position: "relative",
                    zIndex: 1,
                    paddingTop: GUARD,
                    paddingInline: SIDE_PAD,
                }}
            >
                <div
                    className="clock-time"
                    style={{
                        whiteSpace: "nowrap",
                        fontSize: "clamp(14px, 5.2vw, 20px)",
                        letterSpacing: "0.08em",
                    }}
                >
                    {line}
                </div>
            </div>
        </div>
    );
}
