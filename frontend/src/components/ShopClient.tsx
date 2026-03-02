// ============================================================
// FILE: frontend/src/components/ShopClient.tsx
// DROP-IN REPLACEMENT
//
// Shop page with:
//   - URL param ?kit=home|away|third to filter by kit type
//   - Kids (KES 1,200) and Adults (KES 1,600) pricing
//   - Size selector: Kids (S, M, L) / Adults (S, M, L, XL, XXL)
//   - Cart sidebar with checkout
//   - Membership-gated access
//
// When no ?kit= param: shows all 3 kits (normal shop page)
// When ?kit=home: filters to just that kit with sizes/pricing
//
// Jersey images served from MinIO S3 bucket
// ============================================================

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

const jerseyHome = "https://mombasaunited.com/club-media/shop/jersey-home.jpeg";
const jerseyAway = "https://mombasaunited.com/club-media/shop/jersey-away.jpeg";
const jerseyThird = "https://mombasaunited.com/club-media/shop/jersey-third.jpeg";

/* ── Types ── */
type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  category?: string | null;
  kitType?: string | null; // "home" | "away" | "third"
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
  size: string;
  ageGroup: string;
  heroUrl?: string | null;
};

/* ── Local cart helpers ── */
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

/* ── Static kit data (fallback when API has no products) ── */
const STATIC_KITS: Product[] = [
  {
    id: "kit-home",
    slug: "home-kit-2025",
    title: "2025/26 Home Kit",
    kitType: "home",
    category: "Jersey",
    isActive: true,
    heroUrl: jerseyHome,
    currency: "KES",
    price: 0,
  },
  {
    id: "kit-away",
    slug: "away-kit-2025",
    title: "2025/26 Away Kit",
    kitType: "away",
    category: "Jersey",
    isActive: true,
    heroUrl: jerseyAway,
    currency: "KES",
    price: 0,
  },
  {
    id: "kit-third",
    slug: "third-kit-2025",
    title: "2025/26 Third Kit",
    kitType: "third",
    category: "Jersey",
    isActive: true,
    heroUrl: jerseyThird,
    currency: "KES",
    price: 0,
  },
];

const KIDS_SIZES = ["S", "M", "L"];
const ADULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const KIDS_PRICE = 1200;
const ADULT_PRICE = 1600;

const KIT_LABELS: Record<string, string> = {
  home: "Home Kit",
  away: "Away Kit",
  third: "Third Kit",
};

export default function ShopClient() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const kitFilter = searchParams.get("kit")?.toLowerCase() || null;

  const [apiItems, setApiItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [tx, setTx] = useState<{ transactionId: string; amount: number; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Selected size per kit
  const [selectedSizes, setSelectedSizes] = useState<Record<string, { age: "kids" | "adults"; size: string }>>({});

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

  // Fetch products from API
  useEffect(() => {
    if (!token || !membershipActive) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiJson<{ items: Product[] }>("/shop/products", { token })
      .then((d) => setApiItems(d.items || []))
      .catch(() => {}) // silently fall back to static kits
      .finally(() => setLoading(false));
  }, [token, membershipActive]);

  // Merge API items with static kits (static as fallback)
  const allKits = useMemo(() => {
    if (apiItems.length > 0) return apiItems;
    return STATIC_KITS;
  }, [apiItems]);

  // Filter by kit type from URL param ?kit=home
  const displayKits = useMemo(() => {
    if (!kitFilter) return allKits;
    return allKits.filter(
      (k) =>
        (k.kitType || "").toLowerCase() === kitFilter ||
        (k.slug || "").toLowerCase().includes(kitFilter)
    );
  }, [allKits, kitFilter]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const addToCart = (kit: Product, ageGroup: "kids" | "adults", size: string) => {
    const price = ageGroup === "kids" ? KIDS_PRICE : ADULT_PRICE;

    setCart((prev) => {
      const found = prev.find(
        (i) => i.productId === kit.id && i.ageGroup === ageGroup && i.size === size
      );
      if (found) {
        return prev.map((i) =>
          i.productId === kit.id && i.ageGroup === ageGroup && i.size === size
            ? { ...i, qty: Math.min(20, i.qty + 1) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: kit.id,
          slug: kit.slug,
          title: `${kit.title} (${ageGroup === "kids" ? "Kids" : "Adults"} ${size})`,
          price,
          currency: kit.currency || "KES",
          qty: 1,
          size,
          ageGroup,
          heroUrl: kit.heroUrl,
        },
      ];
    });
    setShowCart(true);
  };

  const removeFromCart = (productId: string, ageGroup: string, size: string) => {
    setCart((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && i.ageGroup === ageGroup && i.size === size)
      )
    );
  };

  const updateQty = (productId: string, ageGroup: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId === productId && i.ageGroup === ageGroup && i.size === size) {
            const newQty = i.qty + delta;
            if (newQty <= 0) return null;
            return { ...i, qty: Math.min(20, newQty) };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const checkout = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiJson<any>("/payments/shop/checkout", {
        method: "POST",
        token,
        body: { items: cart.map((c) => ({ productId: c.productId, qty: c.qty, size: c.size, ageGroup: c.ageGroup })) },
      });
      setTx({ transactionId: data.transactionId, amount: data.amount, currency: data.currency });
    } catch (e: any) {
      setError(e?.message || "Checkout failed");
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
      setError(e?.message || "Confirmation failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Not logged in ──
  if (!token) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center max-w-lg mx-auto mt-10">
        <div className="h-serif text-3xl font-extrabold text-ink">SignIn-Only Shop</div>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Sign in  to unlock official Mombasa United merchandise at exclusive prices.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-xl bg-brand px-8 py-3.5 text-sm font-extrabold text-ink hover:bg-brand-dark transition"
            href="/login?next=/shop"
          >
            Sign In
          </Link>
          
        </div>
      </div>
    );
  }

  

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] font-extrabold tracking-[0.25em] uppercase text-muted">
            Official Merchandise
          </div>
          <h1 className="h-serif text-4xl md:text-5xl font-extrabold text-ink mt-1">
            {kitFilter ? KIT_LABELS[kitFilter] || "Shop" : "Shop"}
          </h1>
          <div className="mt-2 h-[3px] w-14 bg-brand rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          {/* Kit filter tabs */}
          <div className="flex gap-2">
            <Link
              href="/shop"
              className={`px-4 py-2 rounded-lg text-[11px] font-extrabold tracking-wider uppercase transition ${
                !kitFilter
                  ? "bg-ink text-white"
                  : "bg-white border border-line text-ink hover:border-brand"
              }`}
            >
              ALL
            </Link>
            {["home", "away", "third"].map((k) => (
              <Link
                key={k}
                href={`/shop?kit=${k}`}
                className={`px-4 py-2 rounded-lg text-[11px] font-extrabold tracking-wider uppercase transition ${
                  kitFilter === k
                    ? "bg-brand text-ink"
                    : "bg-white border border-line text-ink hover:border-brand"
                }`}
              >
                {k === "third" ? "THIRD" : k.toUpperCase()}
              </Link>
            ))}
          </div>

          {/* Cart button */}
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-extrabold text-ink hover:border-brand transition"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-brand text-[10px] font-extrabold text-ink flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-muted py-8 text-center">Loading products…</div>}
      {error && <div className="text-sm text-red-500 mb-4 text-center">{error}</div>}

      <div className={`grid gap-8 ${showCart ? "lg:grid-cols-[1fr_360px]" : ""}`}>
        {/* ── Product Cards ── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayKits.map((kit) => {
            const sel = selectedSizes[kit.id] || { age: "adults" as const, size: "L" };

            return (
              <div
                key={kit.id}
                className="rounded-2xl border border-line bg-white overflow-hidden card-lift"
              >
                {/* Jersey image */}
                <div className="relative aspect-[4/5] bg-[#f0f2f8] overflow-hidden flex items-center justify-center p-6">
                  {kit.heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={kit.heroUrl}
                      alt={kit.title}
                      className="w-full h-full object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,.15)]"
                    />
                  ) : (
                    <span className="h-serif text-6xl text-ink/10 font-extrabold">MU</span>
                  )}

                  {kit.isActive === false && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="rounded-full bg-ink text-white px-5 py-2 text-xs font-extrabold tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-muted mb-1">
                    {kit.category || "Jersey"}
                  </div>
                  <h3 className="font-extrabold text-ink text-base leading-tight">
                    {kit.title}
                  </h3>

                  {kit.isActive !== false && (
                    <>
                      {/* Age group toggle */}
                      <div className="mt-4">
                        <div className="text-[10px] font-extrabold tracking-[0.15em] uppercase text-muted mb-2">
                          Category
                        </div>
                        <div className="flex gap-2">
                          {(["kids", "adults"] as const).map((age) => (
                            <button
                              key={age}
                              onClick={() =>
                                setSelectedSizes((prev) => ({
                                  ...prev,
                                  [kit.id]: {
                                    age,
                                    size: age === "kids" ? "M" : "L",
                                  },
                                }))
                              }
                              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold tracking-wider uppercase transition ${
                                sel.age === age
                                  ? "bg-ink text-white"
                                  : "bg-white border border-line text-ink hover:border-brand"
                              }`}
                            >
                              {age === "kids" ? "Kids — KES 1,200" : "Adults — KES 1,600"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size selector */}
                      <div className="mt-3">
                        <div className="text-[10px] font-extrabold tracking-[0.15em] uppercase text-muted mb-2">
                          Size
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {(sel.age === "kids" ? KIDS_SIZES : ADULT_SIZES).map((size) => (
                            <button
                              key={size}
                              onClick={() =>
                                setSelectedSizes((prev) => ({
                                  ...prev,
                                  [kit.id]: { ...sel, size },
                                }))
                              }
                              className={`h-9 min-w-[40px] px-3 rounded-lg text-xs font-extrabold transition ${
                                sel.size === size
                                  ? "bg-brand text-ink shadow-sm"
                                  : "bg-white border border-line text-ink hover:border-brand"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price + Add to cart */}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-extrabold text-ink">
                          KES {(sel.age === "kids" ? KIDS_PRICE : ADULT_PRICE).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(kit, sel.age, sel.size)}
                        className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-extrabold text-ink hover:bg-brand-dark transition shadow-sm"
                      >
                        Add to Cart — {sel.age === "kids" ? "Kids" : "Adults"} {sel.size}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Cart Sidebar ── */}
        {showCart && (
          <aside className="rounded-2xl border border-line bg-white p-5 h-fit sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-ink text-lg">Your Cart</h3>
              <button
                onClick={() => setCart([])}
                className="text-xs font-bold text-muted hover:text-ink transition"
              >
                Clear All
              </button>
            </div>

            {!cart.length ? (
              <p className="text-sm text-muted py-4 text-center">Cart is empty.</p>
            ) : (
              <div className="grid gap-3">
                {cart.map((c) => (
                  <div
                    key={`${c.productId}-${c.ageGroup}-${c.size}`}
                    className="flex items-center justify-between gap-3 border border-line rounded-xl p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-ink line-clamp-1">{c.title}</div>
                      <div className="text-xs text-muted">
                        KES {c.price.toLocaleString()} × {c.qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(c.productId, c.ageGroup, c.size, -1)}
                        className="h-7 w-7 rounded-lg border border-line text-xs font-bold hover:border-brand transition"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{c.qty}</span>
                      <button
                        onClick={() => updateQty(c.productId, c.ageGroup, c.size, 1)}
                        className="h-7 w-7 rounded-lg border border-line text-xs font-bold hover:border-brand transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(c.productId, c.ageGroup, c.size)}
                        className="ml-1 text-xs text-muted hover:text-red-500 transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm font-bold text-muted">Total</span>
              <span className="text-xl font-extrabold text-ink">
                KES {cartTotal.toLocaleString()}
              </span>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 grid gap-2">
                {!tx ? (
                  <button
                    disabled={busy}
                    onClick={checkout}
                    className="w-full rounded-xl bg-brand py-3.5 text-sm font-extrabold text-ink hover:bg-brand-dark transition disabled:opacity-60"
                  >
                    {busy ? "Starting…" : "Checkout"}
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={confirm}
                    className="w-full rounded-xl bg-brand py-3.5 text-sm font-extrabold text-ink hover:bg-brand-dark transition disabled:opacity-60"
                  >
                    {busy ? "Confirming…" : `Confirm Payment (${tx.amount} ${tx.currency})`}
                  </button>
                )}
                <p className="text-[10px] text-muted text-center">
                  Payment via M-Pesa coming soon.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
