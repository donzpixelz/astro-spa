import React, { useEffect, useState } from "react";

/** ThemeSwitcher — Light / Dark / Sepia (persists to localStorage) */
export default function ThemeSwitcher() {
    const getInitial = () => {
        if (typeof window === "undefined") return "light";
        try {
            const saved = localStorage.getItem("theme");
            if (saved === "light" || saved === "dark" || saved === "sepia") return saved;
            const prefersDark =
                window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            return prefersDark ? "dark" : "light";
        } catch {
            return "light";
        }
    };

    const [theme, setTheme] = useState(getInitial);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem("theme", theme); } catch {}
    }, [theme]);

    return (
        <div className="theme-switcher">
            <fieldset className="segmented" aria-label="Theme">
                <legend className="visually-hidden">Theme</legend>

                <label className={theme === "light" ? "on" : ""}>
                    <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={theme === "light"}
                        onChange={() => setTheme("light")}
                    />
                    Light
                </label>

                <label className={theme === "dark" ? "on" : ""}>
                    <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={theme === "dark"}
                        onChange={() => setTheme("dark")}
                    />
                    Dark
                </label>

                <label className={theme === "sepia" ? "on" : ""}>
                    <input
                        type="radio"
                        name="theme"
                        value="sepia"
                        checked={theme === "sepia"}
                        onChange={() => setTheme("sepia")}
                    />
                    Sepia
                </label>
            </fieldset>
        </div>
    );
}
