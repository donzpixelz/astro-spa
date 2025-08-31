import React, { useEffect, useState } from "react";
import { getCount, subscribe } from "../../lib/cart.js";

export default function CartButton() {
    const [count, setCount] = useState(0);
    useEffect(() => subscribe(({count}) => setCount(count || 0)), []);
    return (
        <>
            <a href="/cart" className="cart-link" aria-label={`Cart (${count})`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
                    <path d="M6 6h14l-1.5 9h-11zM6 6l-1-3H2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/>
                </svg>
                <span className="cart-badge" aria-hidden="true">{count}</span>
            </a>
            <style>{`
        .cart-link{position:relative;display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .55rem;border:1px solid var(--border);border-radius:.6rem;background:#fff;color:var(--text);}
        .cart-link:hover{background:var(--bg-soft)}
        .cart-badge{position:absolute;top:-.45rem;right:-.45rem;min-width:1.15rem;height:1.15rem;border-radius:999px;background:#000;color:#fff;font-size:.72rem;display:grid;place-items:center;padding:0 .25rem;border:2px solid #fff;}
      `}</style>
        </>
    );
}
