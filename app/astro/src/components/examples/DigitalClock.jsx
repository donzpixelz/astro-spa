import { useEffect, useState, useMemo } from "react";

export default function DigitalClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const { timeStr, dateStr, ariaLabel } = useMemo(() => {
        // Time (24h vs 12h will follow user locale)
        const time = new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).format(now);

        // Date, compact: Sat, Aug 30
        const date = new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric"
        }).format(now);

        const label = new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit"
        }).format(now);

        return { timeStr: time, dateStr: date, ariaLabel: label };
    }, [now]);

    return (
        <div className="clock-shell" role="group" aria-label="Current time and date">
            <div className="clock-line" aria-label={ariaLabel}>
                <span className="clock-time">{timeStr}</span>
                <span className="clock-sep" aria-hidden="true">•</span>
                <span className="clock-date">{dateStr}</span>
            </div>
        </div>
    );
}
