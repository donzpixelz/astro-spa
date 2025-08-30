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

    useEffect(() => {
        if (!paypalRef.current) return;
        paypalRef.current.innerHTML = "";
        if (items.length === 0) return;

        if (typeof window?.paypal?.Buttons !== "function") return;

        window.paypal.Buttons({
            style: { layout: "vertical" },
            createOrder: (_data, actions) => actions.order.create({
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
            }),
            onApprove: async (_data, actions) => {
                try {
                    const details = await actions.order.capture();
                    alert(`✅ Payment approved. Order: ${details.id}`);
                    setCart(Object.fromEntries(PRODUCTS.map(p => [p.id, 0])));
                } catch (e) {
                    alert(`❌ Capture failed: ${String(e?.message || e)}`);
                }
            },
            onError: (err) => alert(`❌ PayPal error: ${String(err)}`)
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

                <div className="paypal-wrap">
                    {/* Buttons mount here only if items exist */}
                    <div ref={paypalRef} />
                </div>
            </aside>
        </div>
    );
}
