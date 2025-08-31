import React, { useEffect, useState } from "react";
import { readCart, setQty, removeItem, clearCart, money } from "../../lib/cart";

export default function CartView() {
    const [items, setItems] = useState([]);
    const refresh = () => setItems(readCart());

    useEffect(() => {
        refresh();
        const onChange = () => refresh();
        window.addEventListener("cart:changed", onChange);
        window.addEventListener("storage", onChange);
        return () => {
            window.removeEventListener("cart:changed", onChange);
            window.removeEventListener("storage", onChange);
        };
    }, []);

    const sub = items.reduce((n,i)=>n + i.price * i.qty, 0);

    return (
        <div className="cart-page">
            {!items.length ? (
                <div className="cart-empty">
                    <p>Your cart is empty.</p>
                    <a className="btn" href="/services">Browse services</a>
                </div>
            ) : (
                <>
                    <div className="cart">
                        <div className="cart-list">
                            {items.map(it => (
                                <article key={it.id} className="cart-row">
                                    <div className="cart-info">
                                        <strong>{it.name}</strong>
                                        <span className="muted">{money(it.price)} each</span>
                                    </div>

                                    <div className="cart-qty">
                                        <button className="btn ghost" onClick={()=>setQty(it.id, Math.max(1, it.qty-1))} aria-label="Decrease">−</button>
                                        <input className="qty" type="number" min="1" value={it.qty} onChange={(e)=>setQty(it.id, Number(e.target.value||1))}/>
                                        <button className="btn ghost" onClick={()=>setQty(it.id, it.qty+1)} aria-label="Increase">＋</button>
                                    </div>

                                    <div className="cart-line">{money(it.price * it.qty)}</div>

                                    <div className="cart-actions">
                                        <button className="btn ghost danger" onClick={()=>removeItem(it.id)}>Remove</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <hr />

                    <div className="cart-totals">
                        <div><span>Subtotal</span><strong>{money(sub)}</strong></div>
                        <div><span>Total</span><strong>{money(sub)}</strong></div>
                    </div>

                    <div className="cart-cta">
                        <button className="btn">Checkout (mock)</button>
                        <button className="btn ghost" onClick={()=>clearCart()}>Clear cart</button>
                    </div>
                </>
            )}
        </div>
    );
}
