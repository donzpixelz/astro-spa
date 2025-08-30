import React, { useMemo, useState } from "react";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

const PRODUCTS = [
    { id: "p1", name: "Sticker Pack", price: 4.99 },
    { id: "p2", name: "T-Shirt",     price: 19.0 },
    { id: "p3", name: "Coffee Mug",  price: 12.5 },
];

function ProductRow({ p, value, inc, dec }){
    return (
        <div className="row" style={{display:"grid",gridTemplateColumns:"1fr auto",gap:".75rem",alignItems:"center",padding:".75rem 0",borderBottom:"1px solid var(--border)"}}>
            <div>
                <div className="name" style={{fontWeight:600}}>{p.name}</div>
                <div className="price" style={{color:"var(--muted)"}}>${p.price.toFixed(2)}</div>
            </div>
            <div className="qty">
                <button className="btn" onClick={() => dec(p.id)} aria-label={`Decrease ${p.name}`} disabled={value <= 0}>-</button>
                <span className="count">{value}</span>
                <button className="btn" onClick={() => inc(p.id)} aria-label={`Increase ${p.name}`}>+</button>
            </div>
        </div>
    );
}

function CartLine({ item, qty, inc, dec }){
    return (
        <div className="line" style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:".75rem",alignItems:"center",padding:.75+"rem 0",borderBottom:"1px solid var(--border)"}}>
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

function PaypalSection({ items, total }) {
    const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
    const ready = isResolved && !isPending && !isRejected;

    return (
        <div className="paypal-wrap">
            <div className="cart-muted" style={{marginBottom:".25rem"}}>
                PayPal SDK: {isPending ? "loading…" : isRejected ? "blocked/error" : isResolved ? "ready" : "init"}
            </div>

            {items.length === 0 ? (
                <p className="cart-muted">Add something to enable checkout.</p>
            ) : !ready ? (
                <p className="cart-muted">Waiting for PayPal… (try an incognito window if it never changes)</p>
            ) : (
                <PayPalButtons
                    // force rerender when these change
                    key={`btn-${total.toFixed(2)}-USD`}
                    style={{ layout: "vertical" }}
                    createOrder={(_data, actions) => {
                        return actions.order.create({
                            purchase_units: [
                                {
                                    amount: {
                                        currency_code: "USD",
                                        value: total.toFixed(2),
                                        breakdown: { item_total: { currency_code: "USD", value: total.toFixed(2) } }
                                    },
                                    items: items.map(({ name, price, qty }) => ({
                                        name,
                                        unit_amount: { currency_code: "USD", value: price.toFixed(2) },
                                        quantity: String(qty),
                                        category: "PHYSICAL_GOODS"
                                    }))
                                }
                            ]
                        });
                    }}
                    onApprove={async (_data, actions) => {
                        try {
                            const details = await actions.order.capture();
                            alert(`✅ Payment approved. Order: ${details.id}`);
                        } catch (e) {
                            alert(`❌ Capture failed: ${String(e?.message || e)}`);
                        }
                    }}
                    onError={(err) => alert(`❌ PayPal error: ${String(err)}`)}
                />
            )}
        </div>
    );
}

export default function ShoppingCart(){
    const [cart, setCart] = useState(() =>
        Object.fromEntries(PRODUCTS.map(p => [p.id, 0]))
    );

    const total = useMemo(
        () => PRODUCTS.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0),
        [cart]
    );

    const cartItems = PRODUCTS
        .filter(p => (cart[p.id] || 0) > 0)
        .map(p => ({ name: p.name, price: p.price, qty: cart[p.id] }));

    const inc = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    const dec = (id) => setCart(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

    return (
        <PayPalScriptProvider
            options={{
                clientId: "ASrkcLLY2_J5zbYK1SHFVxdosWRvwcwG2qWkNgA4C_PsrP5Qvs2UcbQH8V53OkicaVFzljp1QqoRIfpb",
                currency: "USD",
                intent: "CAPTURE",
                components: "buttons"
            }}
        >
            <div className="cart-grid">
                <section className="cart-products">
                    <h2 style={{margin:"0 0 .5rem 0", fontSize:"1.15rem"}}>Products</h2>
                    {PRODUCTS.map(p => (
                        <ProductRow key={p.id} p={p} value={cart[p.id] || 0} inc={inc} dec={dec} />
                    ))}
                    <p className="cart-muted" style={{marginTop:".5rem"}}>Use +/- to adjust quantities.</p>
                </section>

                <aside className="cart-summary">
                    <h2 style={{margin:"0 0 .5rem 0", fontSize:"1.15rem"}}>Your Cart</h2>

                    {cartItems.length === 0 ? (
                        <p className="cart-muted" style={{marginTop:0}}>Your cart is empty.</p>
                    ) : (
                        <>
                            {PRODUCTS.filter(p => (cart[p.id] || 0) > 0).map(p => (
                                <CartLine key={p.id} item={p} qty={cart[p.id]} inc={inc} dec={dec} />
                            ))}
                            <div className="total" style={{display:"flex",justifyContent:"space-between",marginTop:".75rem",fontWeight:700}}>
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </>
                    )}

                    <PaypalSection items={cartItems} total={total} />
                </aside>
            </div>
        </PayPalScriptProvider>
    );
}
