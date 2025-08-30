import React, { useMemo, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

/**
 * Quick notes:
 * - This uses PayPal Sandbox via clientId: "sb". Replace with your real client ID when ready.
 * - Currency is USD. Change in the PayPalScriptProvider options if you like.
 * - No backend here: createOrder uses the client total for a simple demo.
 */

const PRODUCTS = [
    { id: "p1", name: "Sticker Pack", price: 4.99 },
    { id: "p2", name: "T-Shirt", price: 19.0 },
    { id: "p3", name: "Coffee Mug", price: 12.5 },
];

function LineItem({ item, qty, onInc, onDec }) {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: ".75rem",
            alignItems: "center",
            padding: ".75rem 0",
            borderBottom: "1px solid var(--border)"
        }}>
            <div>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: ".9rem", color: "var(--muted)" }}>${item.price.toFixed(2)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem", justifySelf: "end" }}>
                <button onClick={() => onDec(item.id)} aria-label={`Decrease ${item.name}`} style={btnSm}>−</button>
                <span style={{ minWidth: "2ch", textAlign: "center" }}>{qty}</span>
                <button onClick={() => onInc(item.id)} aria-label={`Increase ${item.name}`} style={btnSm}>+</button>
            </div>
            <div style={{ justifySelf: "end" }}>${(item.price * qty).toFixed(2)}</div>
        </div>
    );
}

const btnSm = {
    padding: ".25rem .6rem",
    borderRadius: ".5rem",
    border: "1px solid var(--border)",
    background: "var(--bg-soft)",
    cursor: "pointer",
};

const card = {
    border: "1px solid var(--border)",
    borderRadius: "1rem",
    padding: "1rem",
    background: "var(--bg)",
    boxShadow: "0 1px 2px rgba(0,0,0,.04)"
};

export default function ShoppingCart() {
    const [cart, setCart] = useState(() =>
        Object.fromEntries(PRODUCTS.map(p => [p.id, 0]))
    );
    const [status, setStatus] = useState(null); // "approved" | "cancelled" | "error" | null

    const total = useMemo(() =>
            PRODUCTS.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0),
        [cart]
    );

    const hasItems = total > 0;
    const cartLines = PRODUCTS.filter(p => (cart[p.id] || 0) > 0);

    const inc = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    const dec = (id) => setCart(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "1rem" }}>
            {/* Products */}
            <section style={card}>
                <h2 style={{ marginTop: 0, marginBottom: ".5rem", fontSize: "1.25rem" }}>Products</h2>
                {PRODUCTS.map(p => (
                    <div key={p.id} style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: ".75rem",
                        alignItems: "center",
                        padding: ".75rem 0",
                        borderBottom: "1px solid var(--border)"
                    }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: ".9rem", color: "var(--muted)" }}>${p.price.toFixed(2)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", justifySelf: "end" }}>
                            <button onClick={() => dec(p.id)} aria-label={`Decrease ${p.name}`} style={btnSm}>−</button>
                            <span style={{ minWidth: "2ch", textAlign: "center" }}>{cart[p.id] || 0}</span>
                            <button onClick={() => inc(p.id)} aria-label={`Increase ${p.name}`} style={btnSm}>+</button>
                        </div>
                    </div>
                ))}
            </section>

            {/* Cart + Checkout */}
            <aside style={card}>
                <h2 style={{ marginTop: 0, marginBottom: ".5rem", fontSize: "1.25rem" }}>Your Cart</h2>

                {cartLines.length === 0 ? (
                    <p style={{ color: "var(--muted)", marginTop: 0 }}>Your cart is empty.</p>
                ) : (
                    <>
                        {cartLines.map(p => (
                            <LineItem key={p.id} item={p} qty={cart[p.id]} onInc={inc} onDec={dec} />
                        ))}

                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".75rem", fontWeight: 700 }}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </>
                )}

                <div style={{ marginTop: "1rem" }}>
                    <PayPalScriptProvider options={{ clientId: "sb", currency: "USD", intent: "CAPTURE" }}>
                        <PayPalButtons
                            style={{ layout: "vertical" }}
                            disabled={!hasItems}
                            createOrder={(_data, actions) => {
                                // Build a simple purchase unit from the in-memory total
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
                                    // Optionally clear the cart:
                                    setCart(Object.fromEntries(PRODUCTS.map(p => [p.id, 0])));
                                } catch (e) {
                                    setStatus({ type: "error", message: String(e?.message || e) });
                                }
                            }}
                            onCancel={() => setStatus({ type: "cancelled" })}
                            onError={(err) => setStatus({ type: "error", message: String(err) })}
                        />
                    </PayPalScriptProvider>
                </div>

                {/* Status messages */}
                {status?.type === "approved" && (
                    <div style={{ marginTop: ".75rem", padding: ".5rem .75rem", borderRadius: ".5rem", background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
                        ✅ Payment approved. Thanks, {status.payer}! <div style={{ fontSize: ".9rem", color: "var(--muted)" }}>Order ID: {status.id}</div>
                    </div>
                )}
                {status?.type === "cancelled" && (
                    <div style={{ marginTop: ".75rem", padding: ".5rem .75rem", borderRadius: ".5rem", background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
                        ℹ️ Checkout was cancelled.
                    </div>
                )}
                {status?.type === "error" && (
                    <div style={{ marginTop: ".75rem", padding: ".5rem .75rem", borderRadius: ".5rem", background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
                        ❌ Something went wrong: <span style={{ color: "crimson" }}>{status.message}</span>
                    </div>
                )}
            </aside>
        </div>
    );
}
