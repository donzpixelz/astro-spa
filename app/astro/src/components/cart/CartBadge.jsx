import React, { useEffect, useState } from "react";
import { countItems } from "../../lib/cart";

export default function CartBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const update = () => setCount(countItems());
        update();
        window.addEventListener("cart:changed", update);
        window.addEventListener("storage", update);
        return () => {
            window.removeEventListener("cart:changed", update);
            window.removeEventListener("storage", update);
        };
    }, []);

    return (
        /* Reuse your nav button sizing exactly via nav-link + active */
        <a
            className="nav-link cart-link active"
            href="/cart"
            aria-label={`Cart with ${count} item${count===1?"":"s"}`}
        >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A1 1 0 0 0 9 18h10v-2H9.42l.93-1.67h6.45a1 1 0 0 0 .9-.55l3.24-6.48A1 1 0 0 0 20 5H7zM7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 17 20z" fill="currentColor"/>
            </svg>
            <span className="count">{count}</span>
        </a>
    );
}
