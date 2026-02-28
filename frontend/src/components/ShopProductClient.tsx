"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

type Product = { id: string; slug: string; title: string; description?: string | null; price: number; currency: string; heroUrl?: string | null };

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

export default function ShopProductClient({ slug }: { slug: string }) {
  const { token, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const membershipActive = useMemo(() => {
    if (!user) return false;
    if (user.membership !== "ACTIVE") return false;
    if (!user.membershipUntil) return true;
    return new Date(user.membershipUntil).getTime() > Date.now();
  }, [user]);

  useEffect(() => {
    if (!token || !membershipActive) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiJson<Product>(`/shop/products/${slug}`, { token })
      .then((d) => setProduct(d))
      .catch((e: any) => setError(e?.message || "Failed"))
      .finally(() => setLoading(false));
  }, [token, membershipActive, slug]);

  const add = () => {
    if (!product) return;
    const cart = loadCart();
    const found = cart.find((c) => c.productId === product.id);
    const next = found
      ? cart.map((c) => (c.productId === product.id ? { ...c, qty: Math.min(20, c.qty + 1) } : c))
      : [...cart, { productId: product.id, slug: product.slug, title: product.title, price: product.price, currency: product.currency, qty: 1, heroUrl: product.heroUrl }];
    saveCart(next);
    alert("Added to cart");
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="text-sm font-semibold">Members-only shop</div>
        <div className="mt-2 text-sm text-muted">Sign in, then purchase membership to view product details.</div>
        <div className="mt-4 flex gap-3">
          <Link className="px-5 py-3 rounded-full bg-brand text-black font-semibold" href={`/login?next=${encodeURIComponent(`/shop/${slug}`)}`}>Sign in</Link>
          <Link className="px-5 py-3 rounded-full border border-line bg-white/5 hover:bg-white/10" href="/membership">Membership</Link>
        </div>
      </div>
    );
  }

  if (!membershipActive) {
    return (
      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="text-sm font-semibold">Membership required</div>
        <div className="mt-2 text-sm text-muted">Activate membership to access the shop and product details.</div>
        <div className="mt-4">
          <Link className="px-5 py-3 rounded-full bg-brand text-black font-semibold" href="/membership">Activate membership</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-sm text-muted">Loading…</div>;
  if (error) return <div className="text-sm text-red-300">{error}</div>;
  if (!product) return <div className="text-sm text-muted">Not found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/shop" className="text-sm text-muted hover:text-white">← Back to shop</Link>
        <Link href="/shop" className="px-4 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">View cart</Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-black/30 overflow-hidden">
          {product.heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.heroUrl} alt={product.title} className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="text-xs tracking-widest text-muted">OFFICIAL MERCH</div>
          <h1 className="mt-2 text-3xl font-bold">{product.title}</h1>
          <div className="mt-3 text-lg font-semibold">{product.price} {product.currency}</div>
          {product.description ? (
            <div className="mt-4 text-sm text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : null}
          <button onClick={add} className="mt-6 w-full rounded-full bg-brand text-black font-semibold py-3">
            Add to cart
          </button>
          <div className="mt-3 text-xs text-muted">Checkout is available in /shop (DEV confirm included).</div>
        </div>
      </div>
    </div>
  );
}
