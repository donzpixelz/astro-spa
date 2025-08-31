import React, { useEffect, useRef } from "react";

/**
 * Lightweight PayPal Buttons wrapper (no extra deps).
 * - clientId: "test" uses Sandbox; replace with your live Client ID later.
 * - amount: number (subtotal)
 * - items: [{ name, price, qty }]
 * - onSuccess(details): called after capture
 */
export default function PayPalCheckout({ clientId = "test", amount, items, onSuccess }) {
    const hostRef = useRef(null);

    // Load the PayPal JS SDK only once
    function loadSDK(id) {
        return new Promise((resolve, reject) => {
            if (window.paypal) return resolve(window.paypal);
            const existing = document.querySelector('script[data-pp="sdk"]');
            if (existing) {
                existing.addEventListener("load", () => resolve(window.paypal));
                existing.addEventListener("error", reject);
                return;
            }
            const s = document.createElement("script");
            s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(id)}&currency=USD&intent=capture`;
            s.async = true;
            s.dataset.pp = "sdk";
            s.onload = () => resolve(window.paypal);
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    useEffect(() => {
        let btns;
        if (!hostRef.current || !amount || amount <= 0) return;

        loadSDK(clientId)
            .then((paypal) => {
                btns = paypal.Buttons({
                    style: { layout: "vertical", label: "paypal" },
                    createOrder: (_data, actions) => {
                        // Build a simple order from your cart
                        const purchase_units = [{
                            description: "Astro Services",
                            amount: {
                                currency_code: "USD",
                                value: amount.toFixed(2),
                            },
                            items: (items || []).map((it) => ({
                                name: it.name,
                                quantity: String(it.qty || 1),
                                unit_amount: { currency_code: "USD", value: Number(it.price).toFixed(2) },
                            })),
                        }];
                        return actions.order.create({ purchase_units });
                    },
                    onApprove: async (_data, actions) => {
                        const details = await actions.order.capture();
                        onSuccess && onSuccess(details);
                    },
                    onError: (err) => {
                        console.error("PayPal error:", err);
                        alert("PayPal error. Please try again.");
                    },
                });
                btns.render(hostRef.current);
            })
            .catch((e) => {
                console.error("PayPal SDK failed to load:", e);
            });

        return () => { try { btns && btns.close(); } catch {} };
    }, [clientId, amount, JSON.stringify(items)]);

    return <div ref={hostRef} />;
}
