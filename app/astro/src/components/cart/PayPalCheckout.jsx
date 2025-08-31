import React, { useEffect, useRef } from "react";

/**
 * PayPal Smart Buttons wrapper (no extra deps).
 * Props:
 *  - clientId: "test" for Sandbox; replace with your Live ID to go live
 *  - amount: number (subtotal)
 *  - items: [{ name, price, qty }]
 *  - onSuccess(details): called after capture
 *  - height: 32–55 (button height); default 38 for compact
 *  - disableFunding: e.g. ["paylater","card"] to suppress extra buttons
 */
export default function PayPalCheckout({
                                           clientId = "test",
                                           amount,
                                           items,
                                           onSuccess,
                                           height = 38,
                                           disableFunding = ["paylater", "card"], // default: show a single compact PayPal button
                                       }) {
    const hostRef = useRef(null);

    function loadSDK({ clientId, disableFunding }) {
        return new Promise((resolve, reject) => {
            if (window.paypal) return resolve(window.paypal);

            const params = new URLSearchParams({
                "client-id": clientId,
                currency: "USD",
                intent: "capture",
                components: "buttons",
            });
            if (disableFunding?.length) params.set("disable-funding", disableFunding.join(","));

            const src = `https://www.paypal.com/sdk/js?${params.toString()}`;
            const existing = document.querySelector('script[src^="https://www.paypal.com/sdk/js"]');
            if (existing) {
                existing.addEventListener("load", () => resolve(window.paypal));
                existing.addEventListener("error", reject);
                return;
            }
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.onload = () => resolve(window.paypal);
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    useEffect(() => {
        let buttons;
        if (!hostRef.current || !amount || amount <= 0) return;

        // clean host before (re)render
        hostRef.current.innerHTML = "";

        loadSDK({ clientId, disableFunding })
            .then((paypal) => {
                buttons = paypal.Buttons({
                    style: {
                        layout: "vertical",
                        height: Math.max(32, Math.min(55, Number(height) || 38)),
                        shape: "rect",
                        label: "paypal",
                        tagline: false,
                    },
                    createOrder: (_data, actions) => {
                        const purchase_units = [{
                            description: "Astro Services",
                            amount: { currency_code: "USD", value: amount.toFixed(2) },
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
                buttons.render(hostRef.current);
            })
            .catch((e) => console.error("PayPal SDK failed to load:", e));

        return () => {
            try { buttons && buttons.close(); } catch {}
        };
    }, [clientId, amount, height, JSON.stringify(items), JSON.stringify(disableFunding)]);

    return <div ref={hostRef} className="paypal-host" />;
}
