import React, { useEffect, useMemo, useRef, useState } from "react";

const PRODUCTS = [
    { id: "p1", name: "Sticker Pack", price: 4.99 },
    { id: "p2", name: "T-Shirt",     price: 19.0 },
    { id: "p3", name: "Coffee Mug",  price: 12.5 },
];

function Line({ item, qty, inc, dec }) {
    return (
        <div className="line" style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:".75rem",alignItems:"center",padding:".75rem 0",borderBottom:"1px solid var(--border)"}}>
            <div>
                <div className="name" style={{fontWeight:600}}>{item.name}</div>
                <div className="price" style={{color:"var(--muted)"}}>${item.price.toFixed(2)}</div>
            </div>
            <div className="qty">
                <button className="btn" onClick={() => dec(item.id)} aria-label={`Decrease ${item.name}`} disabled={qty <= 0}>-</button>
                <span className="count">{qty}</span>
                <button className="btn" onClick={() => inc(item.id)} aria-label={`Increase ${item.name}`}>+</button>
            </div>
            <div style={{justifySelf:"end"}}>${(item.price * qty).toFixed(2)}</div>
        </div>
    );
}

export default function ShoppingCart(){
    const [cart, setCart] = useState(() => Object.fromEntries(PRODUCTS.map(p => [p.id, 0])));
    const paypalRef = useRef(null);
    const [sdkState, setSdkState] = useState("init"); // init | ready | missing | error

    const total = useMemo(
        () => PRODUCTS.reduce((s, p) => s + p.price * (cart[p.id] || 0), 0),
        [cart]
    );
    const items = useMemo(
        () => PRODUCTS.filter(p => (cart[p.id] || 0) > 0).map(p => ({ ...p, qty: cart[p.id] })),
        [cart]
    );

    const inc = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    const dec = (id) => setCart(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

    // Render/paypal buttons whenever items/total change
    useEffect(() => {
        // If no items, clear any previous buttons
        if (items.length === 0) {
            if (paypalRef.current) paypalRef.current.innerHTML = "";
            return;
        }

        // Check SDK
        const sdk = window?.paypal?.Buttons;
        if (typeof sdk !== "function") {
            setSdkState("missing");
            console.warn("[Cart] PayPal SDK not available. window.paypal =", window?.paypal);
            return;
        }

        setSdkState("ready");
        // Clear any previous render
        if (paypalRef.current) paypalRef.current.innerHTML = "";

        // Render buttons
        window.paypal.Buttons({
            style: { layout: "vertical" },
            createOrder: (_data, actions) => {
                return actions.order.create({
                    purchase_units: [
                        {
                            amount: {
                                currency_code: "USD",
                                value: total.toFixed(2),
                                breakdown: { item_total: { currency_code: "USD", value: total.toFixed(2) } }
                            },
                            items: items.map(i => ({
                                name: i.name,
                                unit_amount: { currency_code: "USD", value: i.price.toFixed(2) },
                                quantity: String(i.qty),
                                category: "PHYSICAL_GOODS"
                            }))
                        }
                    ]
                });
            },
            onApprove: async (_data, actions) => {
                try {
                    const details = await actions.order.capture();
                    alert(`✅ Payment approved. Order: ${details.id}`);
                    setCart(Object.fromEntries(PRODUCTS.map(p => [p.id, 0])));
                } catch (e) {
                    console.error("Capture failed", e);
                    alert(`❌ Capture failed: ${String(e?.message || e)}`);
                }
            },
            onError: (err) => {
                console.error("PayPal error", err);
                setSdkState("error");
                alert(`❌ PayPal error: ${String(err)}`);
            }
        }).render(paypalRef.current);
    }, [items, total]);

    return (
        <div className="cart-grid">
            <section className="cart-products">
                <h2 style={{margin:"0 0 .5rem 0", fontSize:"1.15rem"}}>Products</h2>
                {PRODUCTS.map(p => (
                    <div key={p.id} className="row" style={{display:"grid",gridTemplateColumns:"1fr auto",gap:".75rem",alignItems:"center",padding:".75rem 0",borderBottom:"1px solid var(--border)"}}>
                        <div>
                            <div className="name" style={{fontWeight:600}}>{p.name}</div>
                            <div className="price" style={{color:"var(--muted)"}}>${p.price.toFixed(2)}</div>
                        </div>
                        <div className="qty">
                            <button className="btn" onClick={() => dec(p.id)} aria-label={`Decrease ${p.name}`} disabled={(cart[p.id]||0) <= 0}>-</button>
                            <span className="count">{cart[p.id] || 0}</span>
                            <button className="btn" onClick={() => inc(p.id)} aria-label={`Increase ${p.name}`}>+</button>
                        </div>
                    </div>
                ))}
                <p className="cart-muted" style={{marginTop:".5rem"}}>Use +/- to adjust quantities.</p>
            </section>

            <aside className="cart-summary">
                <h2 style={{margin:"0 0 .5rem 0", fontSize:"1.15rem"}}>Your Cart</h2>

                {items.length === 0 ? (
                    <p className="cart-muted" style={{marginTop:0}}>Your cart is empty.</p>
                ) : (
                    <>
                        {items.map(p => (
                            <Line key={p.id} item={p} qty={p.qty} inc={inc} dec={dec} />
                        ))}
                        <div className="total" style={{display:"flex",justifyContent:"space-between",marginTop:".75rem",fontWeight:700}}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </>
                )}

                {/* PayPal buttons mount here */}
                <div className="paypal-wrap">
                    <div className="cart-muted" style={{marginBottom:".25rem"}}>
                        PayPal SDK: {sdkState}
                        {"  "}
                        (<a href="https://www.paypal.com/sdk/js?client-id=ASrkcLLY2_J5zbYK1SHFVxdosWRvwcwG2qWkNgA4C_PsrP5Qvs2UcbQH8V53OkicaVFzljp1QqoRIfpb&components=buttons&currency=USD" target="_blank" rel="noreferrer">open SDK</a>)
                    </div>
                    <div ref={paypalRef} />
                </div>
            </aside>
        </div>
    );
}
