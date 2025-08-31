import React, { useEffect, useState } from "react";
import { readCart, setQty, removeItem, clearCart, money } from "../../lib/cart";
import PayPalCheckout from "./PayPalCheckout.jsx";

export default function CartView() {
    const [items, setItems] = useState([]);
    const [paidMsg, setPaidMsg] = useState("");

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

    const sub = items.reduce((n, i) => n + i.price * i.qty, 0);

    const handlePaid = (details) => {
        clearCart();
        refresh();
        const paid = details?.purchase_units?.[0]?.amount?.value || sub;
        setPaidMsg(`Payment captured: ${money(Number(paid))}. Thank you!`);
    };

    if (!items.length) {
        return (
            <div className="cart-page">
                {paidMsg && <div className="cart-paid ok">{paidMsg}</div>}
                <div className="cart-empty">
                    <p>Your cart is empty.</p>
                    <a className="btn" href="/services">Browse services</a>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            {paidMsg && <div className="cart-paid ok">{paidMsg}</div>}

            <div className="cart">
                <div className="cart-list">
                    {items.map((it) => (
                        <article key={it.id} className="cart-row">
                            <div className="cart-info">
                                <strong>{it.name}</strong>
                                <span className="muted">{money(it.price)} each</span>
                            </div>

                            <div className="cart-qty">
                                <button className="btn ghost" onClick={() => setQty(it.id, Math.max(1, it.qty - 1))} aria-label="Decrease">−</button>
                                <input className="qty" type="number" min="1" value={it.qty} onChange={(e) => setQty(it.id, Number(e.target.value || 1))} />
                                <button className="btn ghost" onClick={() => setQty(it.id, it.qty + 1)} aria-label="Increase">＋</button>
                            </div>

                            <div className="cart-line">{money(it.price * it.qty)}</div>

                            <div className="cart-actions">
                                <button className="btn ghost danger" onClick={() => removeItem(it.id)}>Remove</button>
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
                {/* Keep a basic button if you like, or remove it */}
                {/* <button className="btn">Checkout (mock)</button> */}
                <button className="btn ghost" onClick={() => { clearCart(); refresh(); }}>Clear cart</button>
            </div>

            {/* PayPal Buttons appear ONLY when there’s something to pay */}
            {sub > 0 && (
                <div className="cart-paypal">
                    <PayPalCheckout
                        clientId="test"            // ← replace with your Live Client ID later
                        amount={sub}
                        items={items}
                        onSuccess={handlePaid}
                    />
                </div>
            )}
        </div>
    );
}
