import React, { useState } from "react";
import { addItem, money } from "../../lib/cart";

const CATALOG = [
    {
        category: "Design",
        serviceId: "logo",
        name: "Logo Design",
        tiers: [
            { id: "basic",  name: "Starter", price: 99,  desc: "1 concept, 1 revision" },
            { id: "pro",    name: "Pro",     price: 249, desc: "2 concepts, 3 revisions" },
            { id: "elite",  name: "Elite",   price: 499, desc: "3 concepts, unlimited revisions" },
        ]
    },
    {
        category: "Development",
        serviceId: "audit",
        name: "Site Audit",
        tiers: [
            { id: "basic", name: "Lite",   price: 149, desc: "Core vitals snapshot" },
            { id: "pro",   name: "Pro",    price: 299, desc: "Perf + accessibility" },
            { id: "elite", name: "Max",    price: 599, desc: "Full audit + roadmap" },
        ]
    }
];

export default function ServicePicker() {
    const [picked, setPicked] = useState({}); // key: serviceId -> tierId
    const [status, setStatus] = useState("");

    function onAdd(service, tier) {
        addItem({
            id: `${service.serviceId}:${tier.id}`,
            sku: `${service.serviceId}-${tier.id}`,
            name: `${service.name} — ${tier.name}`,
            price: tier.price,
            qty: 1
        });
        setStatus(`Added: ${service.name} — ${tier.name}`);
        setTimeout(()=>setStatus(""), 1600);
    }

    return (
        <div className="svc">
            {CATALOG.map(svc => (
                <section className="svc-section" key={svc.serviceId}>
                    <header className="svc-head">
                        <h2>{svc.category}</h2>
                        <p className="muted">{svc.name}</p>
                    </header>

                    <div className="svc-grid">
                        {svc.tiers.map(tier => {
                            const k = `${svc.serviceId}-${tier.id}`;
                            const active = picked[svc.serviceId] === tier.id;
                            return (
                                <article className={`svc-card ${active ? "active": ""}`} key={k}>
                                    <header className="svc-card-head">
                                        <strong>{tier.name}</strong>
                                        <span className="price">{money(tier.price)}</span>
                                    </header>
                                    <p className="muted">{tier.desc}</p>
                                    <div className="svc-actions">
                                        <label className="svc-radio">
                                            <input
                                                type="radio"
                                                name={`choose-${svc.serviceId}`}
                                                checked={active}
                                                onChange={()=>setPicked(p => ({...p, [svc.serviceId]: tier.id}))}
                                            />
                                            <span>Select</span>
                                        </label>
                                        <button className="btn" type="button" onClick={()=>onAdd(svc, tier)}>Add to cart</button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}

            {status && <div className="svc-status ok">{status}</div>}
        </div>
    );
}
