"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

type Product = { id: string; slug: string; title: string; price: number; currency: string; heroUrl?: string | null };
type CartItem = { productId: string; slug: string; title: string; price: number; currency: string; qty: number; heroUrl?: string | null };

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("club_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("club_cart", JSON.stringify(items));
}

export default function ShopClient() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tx, setTx] = useState<{ transactionId: string; amount: number; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const membershipActive = useMemo(() => {
    if (!user) return false;
    if (user.membership !== "ACTIVE") return false;
    if (!user.membershipUntil) return true;
    return new Date(user.membershipUntil).getTime() > Date.now();
  }, [user]);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    if (!token || !membershipActive) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiJson<{ items: Product[] }>("/shop/products", { token })
      .then((d) => setItems(d.items || []))
      .catch((e: any) => setError(e?.message || "Failed"))
      .finally(() => setLoading(false));
  }, [token, membershipActive]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const currency = items?.[0]?.currency || cart?.[0]?.currency || "KES";

  const inc = (p: Product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.productId === p.id);
      if (found) return prev.map((i) => (i.productId === p.id ? { ...i, qty: Math.min(20, i.qty + 1) } : i));
      return [...prev, { productId: p.id, slug: p.slug, title: p.title, price: p.price, currency: p.currency, qty: 1, heroUrl: p.heroUrl }];
    });
  };

  const dec = (productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty - 1 } : i));
    });
  };

  const checkout = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiJson<any>("/payments/shop/checkout", {
        method: "POST",
        token,
        body: { items: cart.map((c) => ({ productId: c.productId, qty: c.qty })) },
      });
      setTx({ transactionId: data.transactionId, amount: data.amount, currency: data.currency });
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!token || !tx) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson<any>("/payments/mock/confirm", { method: "POST", token, body: { transactionId: tx.transactionId } });
      setTx(null);
      setCart([]);
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="mt-6 rounded-3xl border border-line bg-card p-6">
        <div className="text-sm font-semibold">Members-only shop</div>
        <div className="mt-2 text-sm text-muted">Sign in, then purchase membership to unlock official merchandise.</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="px-5 py-3 rounded-full bg-brand text-black font-semibold" href="/login?next=/shop">Sign in</Link>
          <Link className="px-5 py-3 rounded-full border border-line bg-white/5 hover:bg-white/10" href="/membership">Membership</Link>
        </div>
      </div>
    );
  }

  if (!membershipActive) {
    return (
      <div className="mt-6 rounded-3xl border border-line bg-card p-6">
        <div className="text-sm font-semibold">Membership required</div>
        <div className="mt-2 text-sm text-muted">Your account does not have an active membership. Activate membership to access the shop.</div>
        <div className="mt-4">
          <Link className="px-5 py-3 rounded-full bg-brand text-black font-semibold" href="/membership">Activate membership</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-muted">Official Merchandise</div>
            <h2 className="text-2xl font-bold mt-1">Shop</h2>
          </div>
          <div className="text-sm text-muted">Items: <span className="text-white font-semibold">{items.length}</span></div>
        </div>

        {loading ? <div className="mt-6 text-sm text-muted">Loading products…</div> : null}
        {error ? <div className="mt-6 text-sm text-red-300">{error}</div> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-2xl border border-line bg-card overflow-hidden">
              <Link href={`/shop/${p.slug}`} className="block">
                <div className="aspect-[4/3] bg-black/30">
                  {p.heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.heroUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
              </Link>
              <div className="p-4">
                <div className="font-semibold line-clamp-1">{p.title}</div>
                <div className="mt-1 text-sm text-muted">{p.price} {p.currency}</div>
                <button onClick={() => inc(p)} className="mt-4 w-full rounded-full bg-brand text-black font-semibold py-2">
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* cart */}
      <aside className="rounded-3xl border border-line bg-card p-5 h-fit sticky top-28">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Your cart</div>
          <button onClick={() => setCart([])} className="text-xs text-muted hover:text-white">Clear</button>
        </div>

        {!cart.length ? (
          <div className="mt-4 text-sm text-muted">Cart is empty.</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {cart.map((c) => (
              <div key={c.productId} className="flex items-center justify-between gap-3 border border-line rounded-2xl p-3 bg-black/20">
                <div className="min-w-0">
                  <div className="text-sm font-semibold line-clamp-1">{c.title}</div>
                  <div className="text-xs text-muted">{c.price} {c.currency}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => dec(c.productId)} className="h-8 w-8 rounded-full border border-line bg-white/5 hover:bg-white/10">-</button>
                  <div className="text-sm w-6 text-center">{c.qty}</div>
                  <button onClick={() => setCart((p) => p.map((i) => i.productId === c.productId ? { ...i, qty: Math.min(20, i.qty + 1) } : i))} className="h-8 w-8 rounded-full border border-line bg-white/5 hover:bg-white/10">+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm">
          <div className="text-muted">Total</div>
          <div className="font-semibold">{cartTotal} {currency}</div>
        </div>

        {cart.length ? (
          <div className="mt-4 grid gap-2">
            {!tx ? (
              <button disabled={busy} onClick={checkout} className="w-full rounded-full bg-brand text-black font-semibold py-3 disabled:opacity-60">
                {busy ? "Starting…" : "Checkout"}
              </button>
            ) : (
              <button disabled={busy} onClick={confirm} className="w-full rounded-full bg-brand text-black font-semibold py-3 disabled:opacity-60">
                {busy ? "Confirming…" : `DEV: Confirm payment (${tx.amount} ${tx.currency})`}
              </button>
            )}
            <div className="text-xs text-muted">Payment integration hook is ready (replace mock confirm with M-Pesa).</div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
