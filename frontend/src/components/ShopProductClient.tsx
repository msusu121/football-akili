"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

type Product = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  heroUrl?: string | null;
};

type CartItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  qty: number;
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

export default function ShopProductClient({ slug }: { slug: string }) {
  const { token } = useAuth(); // optional
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiJson<Product>(`/shop/products/${slug}`, token ? { token } : undefined)
      .then((d) => setProduct(d))
      .catch((e: any) => setError(e?.message || "Failed"))
      .finally(() => setLoading(false));
  }, [token, slug]);

  const priceLabel = useMemo(() => {
    if (!product) return "";
    return `${product.price} ${product.currency}`;
  }, [product]);

  const add = () => {
    if (!product) return;
    const cart = loadCart();
    const found = cart.find((c) => c.productId === product.id);
    const next = found
      ? cart.map((c) => (c.productId === product.id ? { ...c, qty: Math.min(20, c.qty + 1) } : c))
      : [
          ...cart,
          {
            productId: product.id,
            slug: product.slug,
            title: product.title,
            price: product.price,
            currency: product.currency,
            qty: 1,
            heroUrl: product.heroUrl,
          },
        ];
    saveCart(next);
    setToast("Added to cart ✓");
    window.setTimeout(() => setToast(null), 1600);
  };

  if (loading) return <div className="text-sm text-muted">Loading…</div>;
  if (error) return <div className="text-sm text-red-300">{error}</div>;
  if (!product) return <div className="text-sm text-muted">Not found.</div>;

  return (
    <div className="pb-24 md:pb-0">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black/70 text-white text-sm px-4 py-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/shop" className="text-sm text-muted hover:text-white">
          ← Back to shop
        </Link>
        <Link
          href="/shop"
          className="px-4 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm"
        >
          View cart
        </Link>
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
          <div className="mt-3 text-lg font-semibold">{priceLabel}</div>

          {product.description ? (
            <div
              className="mt-4 text-sm text-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : null}

          {/* Desktop button */}
          <button
            onClick={add}
            className="hidden md:block mt-6 w-full rounded-full bg-brand text-black font-semibold py-3"
          >
            Add to cart
          </button>
        </div>
      </div>

      {/* ✅ Mobile sticky bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-brand/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-white/60">Price</div>
            <div className="text-white font-extrabold">{priceLabel}</div>
          </div>
          <button
            onClick={add}
            className="shrink-0 rounded-full bg-white text-ink font-extrabold px-5 py-3"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}