import React, { useMemo, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

/**
 * Notes:
 * - Uses PayPal Sandbox via clientId: "sb". Swap for your real ID when ready.
 * - Currency: USD.
 * - No server in this demo; we compute totals on the client for simplicity.
 */

const PRODUCTS = [
    { id: "p1", name: "Sticker Pack", price: 4.99 },
    { id: "p2", name: "T-Shirt",     price: 19.0 },
    { id: "p3", name: "Coffee Mug",  price: 12.5 },
];

function ProductRow({ p, value, inc, dec }){
    return (
        <div className="row">
            <div>
                <div className="name">{p.name}</div>
                <div className="price">${p.price.toFixed(2)}</div>
            </div>
            <div className="qty">
                <button className="btn" onClick={() => dec(p.id)} aria-label={`Decrease ${p.name}`}>−</button>
                <span className="count">{value}</span>
                <button className="btn" onClick={() => inc(p.id)} aria-label={`Increase ${p.name}`}>+</button>
            </div>
        </div>
    );
}

function CartLine({ item, qty, inc, dec }){
    return (
        <div className="line" style={{gridTemplateColumns:"1fr auto auto"}}>
            <div>
                <div className="name">{item.name}</div>
                <div className="price">${item.price.toFixed(2)}</div>
            </div>
            <div className="qty">
                <button className="btn" onClick={() => dec(item.id)} aria-label={`Decrease ${item.name}`}>−</button>
                <span className="count">{qty}</span>
                <button className="btn" onClick={() => inc(item.id)} aria-label={`Increase ${item.name}`}>+</button>
            </div>
            <div style={{justifySelf:"end"}}>${(item.price * qty).toFixed(2)}</div>
        </div>
    );
}

export default function ShoppingCart(){
    const [cart, setCart] = useState(() =>
        Object.fromEntries(PRODUCTS.map(p => [p.id, 0]))
    );
    const [status, setStatus] = useState(null);

    const total = useMemo(
        () => PRODUCTS.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0),
        [cart]
    );
    const hasItems = total > 0;
    const cartLines = PRODUCTS.filter(p => (cart[p.id] || 0) > 0);

    const inc = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    const dec = (id) => setCart(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

    return (
        <div className="cart-grid">
            {/* Products */}
            <section className="cart-products">
                <h2 style={{margin:"0 0 .5rem 0", fontSize:"1.15rem"}}>Products</h2>
                {PRODUCTS.map(p => (
                    <ProductRow key={p.id} p={p} value={cart[p.id] || 0} inc={inc} dec={dec} />
                ))}
                <p className="cart-muted" style={{marginTop:".5rem"}}>Use +/− to adjust quantities.</p>
            </section>

            {/* Cart + Checkout */}
            <aside className="cart-summary">
                <h2 style={{margin:"0 0 .5rem 0", fontSize:"1.15rem"}}>Your Cart</h2>

                {cartLines.length === 0 ? (
                    <p className="cart-muted" style={{marginTop:0}}>Your cart is empty.</p>
                ) : (
                    <>
                        {cartLines.map(p => (
                            <CartLine key={p.id} item={p} qty={cart[p.id]} inc={inc} dec={dec} />
                        ))}

                        <div className="total">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </>
                )}

                {/* PayPal buttons only render when there are items, so it's obvious */}
                <div className="paypal-wrap">
                    {hasItems ? (
                        <PayPalScriptProvider options={{ clientId: "sb", currency: "USD", intent: "CAPTURE" }}>
                            <PayPalButtons
                                style={{ layout: "vertical" }}
                                createOrder={(_data, actions) => {
                                    return actions.order.create({
                                        purchase_units: [
                                            {
                                                amount: {
                                                    currency_code: "USD",
                                                    value: total.toFixed(2),
                                                    breakdown: {
                                                        item_total: { currency_code: "USD", value: total.toFixed(2) }
                                                    }
                                                },
                                                items: PRODUCTS
                                                    .filter(p => (cart[p.id] || 0) > 0)
                                                    .map(p => ({
                                                        name: p.name,
                                                        unit_amount: { currency_code: "USD", value: p.price.toFixed(2) },
                                                        quantity: String(cart[p.id]),
                                                        category: "PHYSICAL_GOODS"
                                                    }))
                                            }
                                        ]
                                    });
                                }}
                                onApprove={async (_data, actions) => {
                                    try {
                                        const details = await actions.order.capture();
                                        setStatus({ type: "approved", id: details.id, payer: details?.payer?.name?.given_name || "friend" });
                                        setCart(Object.fromEntries(PRODUCTS.map(p => [p.id, 0])));
                                    } catch (e) {
                                        setStatus({ type: "error", message: String(e?.message || e) });
                                    }
                                }}
                                onCancel={() => setStatus({ type: "cancelled" })}
                                onError={(err) => setStatus({ type: "error", message: String(err) })}
                            />
                        </PayPalScriptProvider>
                    ) : (
                        <p className="cart-muted">Add something to enable checkout.</p>
                    )}
                </div>

                {/* Status messages */}
                {status?.type === "approved" && (
                    <div className="cart-muted" style={{marginTop:".75rem"}}>
                        ✅ Payment approved. Thanks, {status.payer}! <span style={{fontSize:".9rem"}}>Order ID: {status.id}</span>
                    </div>
                )}
                {status?.type === "cancelled" && (
                    <div className="cart-muted" style={{marginTop:".75rem"}}>
                        ℹ️ Checkout was cancelled.
                    </div>
                )}
                {status?.type === "error" && (
                    <div className="cart-muted" style={{marginTop:".75rem"}}>
                        ❌ Something went wrong: <span style={{ color: "crimson" }}>{status.message}</span>
                    </div>
                )}
            </aside>
        </div>
    );
}
