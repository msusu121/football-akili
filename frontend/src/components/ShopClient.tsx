"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  category?: string | null;
  isActive?: boolean;
  heroUrl?: string | null;
};

type CartItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  qty: number;
  size?: string;
  heroUrl?: string | null;
};

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

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function ShopClient() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tx, setTx] = useState<{
    transactionId: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCart, setShowCart] = useState(false);

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

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const currency = items?.[0]?.currency || cart?.[0]?.currency || "KES";

  const addToCart = (p: Product, size?: string) => {
    setCart((prev) => {
      const key = `${p.id}-${size || "default"}`;
      const found = prev.find(
        (i) => i.productId === p.id && (i.size || "default") === (size || "default")
      );
      if (found)
        return prev.map((i) =>
          i.productId === p.id && (i.size || "default") === (size || "default")
            ? { ...i, qty: Math.min(20, i.qty + 1) }
            : i
        );
      return [
        ...prev,
        {
          productId: p.id,
          slug: p.slug,
          title: p.title,
          price: p.price,
          currency: p.currency,
          qty: 1,
          size,
          heroUrl: p.heroUrl,
        },
      ];
    });
    setShowCart(true);
  };

  const dec = (productId: string, size?: string) => {
    setCart((prev) => {
      const item = prev.find(
        (i) =>
          i.productId === productId &&
          (i.size || "default") === (size || "default")
      );
      if (!item) return prev;
      if (item.qty <= 1)
        return prev.filter(
          (i) =>
            !(
              i.productId === productId &&
              (i.size || "default") === (size || "default")
            )
        );
      return prev.map((i) =>
        i.productId === productId &&
        (i.size || "default") === (size || "default")
          ? { ...i, qty: i.qty - 1 }
          : i
      );
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
        body: {
          items: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
        },
      });
      setTx({
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
      });
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
      await apiJson<any>("/payments/mock/confirm", {
        method: "POST",
        token,
        body: { transactionId: tx.transactionId },
      });
      setTx(null);
      setCart([]);
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Not logged in ──
  if (!token) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center max-w-md mx-auto mt-10">
        <div className="h-serif text-2xl font-bold text-ink">Members-Only Shop</div>
        <p className="mt-3 text-sm text-muted">
          Sign in and activate your membership to unlock official merchandise at exclusive prices.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition"
            href="/login?next=/shop"
          >
            Sign In
          </Link>
          <Link
            className="rounded-xl border border-line bg-white px-6 py-3 text-sm font-bold text-ink hover:bg-ink/5 transition"
            href="/membership"
          >
            Join Membership
          </Link>
        </div>
      </div>
    );
  }

  // ── No membership ──
  if (!membershipActive) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center max-w-md mx-auto mt-10">
        <div className="h-serif text-2xl font-bold text-ink">Membership Required</div>
        <p className="mt-3 text-sm text-muted">
          Activate your membership to access the shop and enjoy exclusive discounts.
        </p>
        <div className="mt-6">
          <Link
            className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition"
            href="/membership"
          >
            Activate Membership →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs font-bold tracking-[0.25em] uppercase text-muted">
            Official Merchandise
          </div>
          <h1 className="h-serif text-3xl md:text-4xl font-bold text-ink mt-1">
            Shop
          </h1>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-ink/5 transition"
        >
          🛒 Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-brand text-[10px] font-bold text-white flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="text-sm text-muted">Loading products…</div>
      )}
      {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Product Grid — Murang'a Seal style */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const isComingSoon = !p.isActive;
            const category = p.category || "Merchandise";

            return (
              <div
                key={p.id}
                className="group rounded-2xl border border-line bg-white overflow-hidden hover:shadow-md transition"
              >
                {/* Image */}
                <Link href={`/shop/${p.slug}`} className="block">
                  <div className="relative aspect-square bg-[#f5f3ee] overflow-hidden">
                    {p.heroUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.heroUrl}
                        alt={p.title}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="h-serif text-5xl text-ink/10 font-bold">
                          MU
                        </span>
                      </div>
                    )}

                    {/* Coming Soon overlay */}
                    {isComingSoon && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="rounded-full bg-ink text-white px-4 py-1.5 text-xs font-bold tracking-wide">
                          Coming Soon !
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="p-4">
                  {/* Category tag */}
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-1.5">
                    {category}
                  </div>

                  <h3 className="font-bold text-sm text-ink leading-tight line-clamp-2">
                    {p.title}
                  </h3>

                  <div className="mt-3 flex items-center justify-between">
                    {isComingSoon ? (
                      <span className="text-sm font-bold text-brand">
                        Coming Soon !
                      </span>
                    ) : (
                      <span className="text-lg font-extrabold text-ink">
                        Ksh.{p.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {!isComingSoon && (
                    <button
                      onClick={() => addToCart(p)}
                      className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:opacity-90 transition"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart sidebar */}
        {showCart && (
          <aside className="rounded-2xl border border-line bg-white p-5 h-fit sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink">Your Cart</h3>
              <button
                onClick={() => setCart([])}
                className="text-xs text-muted hover:text-ink transition"
              >
                Clear All
              </button>
            </div>

            {!cart.length ? (
              <p className="text-sm text-muted py-4">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((c) => (
                  <div
                    key={`${c.productId}-${c.size || "default"}`}
                    className="flex items-center gap-3 rounded-xl border border-line p-3"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg bg-[#f5f3ee] shrink-0 overflow-hidden flex items-center justify-center">
                      {c.heroUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.heroUrl}
                          alt={c.title}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-ink/20 font-bold text-xs">
                          MU
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink line-clamp-1">
                        {c.title}
                      </div>
                      {c.size && (
                        <div className="text-[10px] text-muted">
                          Size: {c.size}
                        </div>
                      )}
                      <div className="text-xs text-muted">
                        Ksh.{c.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => dec(c.productId, c.size)}
                        className="h-7 w-7 rounded-full border border-line text-ink hover:bg-ink/5 text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold w-5 text-center">
                        {c.qty}
                      </span>
                      <button
                        onClick={() => addToCart({ id: c.productId, slug: c.slug, title: c.title, price: c.price, currency: c.currency, heroUrl: c.heroUrl }, c.size)}
                        className="h-7 w-7 rounded-full border border-line text-ink hover:bg-ink/5 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="text-lg font-extrabold text-ink">
                Ksh.{cartTotal.toLocaleString()}
              </span>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 space-y-2">
                {!tx ? (
                  <button
                    disabled={busy}
                    onClick={checkout}
                    className="w-full rounded-xl bg-ink text-white py-3 font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
                  >
                    {busy ? "Processing…" : "Checkout"}
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={confirm}
                    className="w-full rounded-xl bg-brand text-white py-3 font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
                  >
                    {busy
                      ? "Confirming…"
                      : `DEV: Confirm (${tx.amount} ${tx.currency})`}
                  </button>
                )}
                <p className="text-[10px] text-muted text-center">
                  Replace mock confirm with M-Pesa webhook in production.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
