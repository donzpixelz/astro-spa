// cart.js — tiny localStorage cart with events
const KEY = "cart_v1";

export function readCart() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
}
export function writeCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cart:changed"));
}
export function addItem(item) {
    const cart = readCart();
    const ix = cart.findIndex(x => x.id === item.id);
    if (ix >= 0) cart[ix].qty += item.qty || 1;
    else cart.push({ ...item, qty: item.qty || 1 });
    writeCart(cart);
}
export function removeItem(id) {
    writeCart(readCart().filter(x => x.id !== id));
}
export function setQty(id, qty) {
    const cart = readCart();
    const it = cart.find(x => x.id === id);
    if (!it) return;
    it.qty = Math.max(1, qty|0);
    writeCart(cart);
}
export function clearCart() { writeCart([]); }
export function countItems() { return readCart().reduce((n, x) => n + x.qty, 0); }
export const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
