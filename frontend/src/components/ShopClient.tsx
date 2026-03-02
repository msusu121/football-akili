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
// Jersey images served from MinIO S3 bucket
// ============================================================

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

const jerseyHome = "https://mombasaunited.com/club-media/shop/jersey-home.jpg";
const jerseyAway = "https://mombasaunited.com/club-media/shop/jersey-away.jpg";
const jerseyThird = "https://mombasaunited.com/club-media/shop/jersey-third.jpg";
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
const STATIC_KITS = [
  {
    id: "kit-home",
    slug: "home-kit-2025",
    title: "2025/26 Home Kit",
    kitType: "home",
    category: "Jersey",
    isActive: true,
    heroUrl: jerseyHome,
    currency: "KES",
    price: 0, // set by age group
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
    return STATIC_KITS as Product[];
  }, [apiItems]);

  // Filter by kit type from URL
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
    const itemKey = `${kit.id}-${ageGroup}-${size}`;

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
        <div className="h-serif text-3xl font-extrabold text-ink">Members-Only Shop</div>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Sign in and activate your membership to unlock official Mombasa United merchandise at exclusive prices.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-xl bg-brand px-8 py-3.5 text-sm font-extrabold text-ink hover:bg-brand-dark transition"
            href="/login?next=/shop"
          >
            Sign In
          </Link>
          <Link
            className="rounded-xl border-2 border-line bg-white px-8 py-3.5 text-sm font-extrabold text-ink hover:border-brand transition"
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
      <div className="rounded-2xl border border-line bg-white p-10 text-center max-w-lg mx-auto mt-10">
        <div className="h-serif text-3xl font-extrabold text-ink">Membership Required</div>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Activate your membership to access the shop and enjoy exclusive discounts on official kits.
        </p>
        <Link
          className="mt-8 inline-block rounded-xl bg-brand px-8 py-3.5 text-sm font-extrabold text-ink hover:bg-brand-dark transition"
          href="/membership"
        >
          Activate Membership →
        </Link>
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

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Product Cards ── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {displayKits.map((kit) => {
            const sel = selectedSizes[kit.id] || { age: "adults", size: "L" };

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

                  {!kit.isActive && (
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
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-ink text-lg">Your Cart</h3>
              <button
                onClick={() => setCart([])}
                className="text-xs text-muted hover:text-ink transition font-bold"
              >
                Clear All
              </button>
            </div>

            {!cart.length ? (
              <p className="text-sm text-muted py-6 text-center">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((c) => (
                  <div
                    key={`${c.productId}-${c.ageGroup}-${c.size}`}
                    className="flex items-center gap-3 rounded-xl border border-line p-3"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg bg-[#f0f2f8] shrink-0 overflow-hidden flex items-center justify-center">
                      {c.heroUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.heroUrl}
                          alt={c.title}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-ink/20 font-extrabold text-xs">MU</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-ink line-clamp-1">{c.title}</div>
                      <div className="text-[10px] text-muted">
                        {c.ageGroup === "kids" ? "Kids" : "Adults"} · Size {c.size}
                      </div>
                      <div className="text-xs font-bold text-ink mt-0.5">
                        KES {c.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(c.productId, c.ageGroup, c.size, -1)}
                        className="h-7 w-7 rounded-full border border-line text-ink hover:border-brand text-xs font-extrabold"
                      >
                        −
                      </button>
                      <span className="text-sm font-extrabold w-5 text-center">{c.qty}</span>
                      <button
                        onClick={() => updateQty(c.productId, c.ageGroup, c.size, 1)}
                        className="h-7 w-7 rounded-full border border-line text-ink hover:border-brand text-xs font-extrabold"
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
              <span className="text-xl font-extrabold text-ink">
                KES {cartTotal.toLocaleString()}
              </span>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 space-y-2">
                {!tx ? (
                  <button
                    disabled={busy}
                    onClick={checkout}
                    className="w-full rounded-xl bg-ink text-white py-3.5 font-extrabold text-sm hover:opacity-90 transition disabled:opacity-60"
                  >
                    {busy ? "Processing…" : "Checkout"}
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={confirm}
                    className="w-full rounded-xl bg-brand text-ink py-3.5 font-extrabold text-sm hover:bg-brand-dark transition disabled:opacity-60"
                  >
                    {busy ? "Confirming…" : `Confirm Payment (KES ${tx.amount.toLocaleString()})`}
                  </button>
                )}
                <p className="text-[10px] text-muted text-center">
                  M-Pesa integration ready — replace mock confirm in production.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
