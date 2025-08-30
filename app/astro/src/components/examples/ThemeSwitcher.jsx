import React, { useEffect, useState } from "react";

/**
 * ThemeSwitcher — Light / Dark / Sepia
 * - Persists to localStorage("theme")
 * - Applies to <html data-theme="..."> for global CSS variables
 */
export default function ThemeSwitcher() {
    // Default to saved value; if none, detect system dark vs light
    const getInitial = () => {
        if (typeof window === "undefined") return "light";
        const saved = localStorage.getItem("theme");
        if (saved === "light" || saved === "dark" || saved === "sepia") return saved;
        const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        return systemDark ? "dark" : "light";
    };

    const [theme, setTheme] = useState(getInitial);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
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
                        name="
