"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { apiJson } from "@/lib/apiClient";

type SizeGroup = "ADULT" | "KIDS";

type DefaultVariant = {
  id: string;
  group: SizeGroup;
  size: string;
  price?: number | null;
};

type ProductListItem = {
  id: string;
  slug: string;
  title: string;
  currency: string;
  heroUrl?: string | null;

  category?: string | null; // KIT | MERCH
  kitType?: string | null; // HOME | AWAY | THIRD

  fromPrice: number;
  groups: SizeGroup[];
  variantCount: number;
  defaultVariant: DefaultVariant | null;
};

type Variant = {
  id: string;
  group: SizeGroup;
  size: string;
  price?: number | null;
  currency: string;
  stock?: number | null;
};

type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  heroUrl?: string | null;
  variants: Variant[];
};

type ProductsResp = { items: ProductListItem[] };

type CartItem = {
  productId: string;
  variantId: string;
  group: SizeGroup;
  size: string;

  slug: string;
  title: string;

  unitPrice: number;
  currency: string;
  qty: number;
  heroUrl?: string | null;
};

type StkStartResp = {
  orderId: string;
  transactionId: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  amount: number;
  currency: string;
  customerMessage: string;
};

type TxStatusResp = {
  status: "PENDING" | "SUCCESS" | "FAILED";
  orderId?: string;
};

const CART_KEY = "club_cart";

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function resolveImageUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (ASSET_BASE) {
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  return url;
}

function ProductThumb({
  src,
  alt,
  sizes,
  className = "object-cover",
  quality = 72,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  quality?: number;
  priority?: boolean;
}) {
  const resolved = resolveImageUrl(src);

  if (!resolved) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
        <span className="text-sm font-extrabold text-white/40 select-none">MU</span>
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={className}
    />
  );
}

function kitToKitType(kit: string): string {
  const k = kit.toLowerCase();
  if (k === "home") return "HOME";
  if (k === "away") return "AWAY";
  if (k === "third") return "THIRD";
  return "";
}

function kitTypeToKitParam(kitType: string): string {
  const k = kitType.toUpperCase();
  if (k === "HOME") return "home";
  if (k === "AWAY") return "away";
  if (k === "THIRD") return "third";
  return "";
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((x: any) => x && typeof x.variantId === "string" && x.variantId);
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function isEmail(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function ShopPageClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // URL params
  const kitParam = (sp.get("kit") || "").toLowerCase();
  const categoryParam = (sp.get("category") || "").toUpperCase();
  const kitTypeParam = (sp.get("kitType") || "").toUpperCase();
  const qParam = sp.get("q") || "";

  // Derived filters
  const derivedCategory = kitParam
    ? "KIT"
    : categoryParam === "KIT"
      ? "KIT"
      : categoryParam === "MERCH"
        ? "MERCH"
        : "";

  const derivedKitType = kitParam
    ? kitToKitType(kitParam)
    : kitTypeParam === "HOME" || kitTypeParam === "AWAY" || kitTypeParam === "THIRD"
      ? kitTypeParam
      : "";

  // Listing state
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(qParam);
  const [qDebounced, setQDebounced] = useState(qParam);

  // Cart + UI
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Variant picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerProduct, setPickerProduct] = useState<ProductDetail | null>(null);
  const [pickerGroup, setPickerGroup] = useState<SizeGroup>("ADULT");
  const [pickerVariantId, setPickerVariantId] = useState<string>("");
  const [detailCache, setDetailCache] = useState<Record<string, ProductDetail>>({});

  // Checkout form (guest)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Payment state
  const [payError, setPayError] = useState<string | null>(null);
  const [payState, setPayState] = useState<
    "IDLE" | "STARTING" | "WAITING" | "SUCCESS" | "FAILED"
  >("IDLE");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setLoading(true);

    const qs = new URLSearchParams();
    if (qDebounced.trim()) qs.set("q", qDebounced.trim());
    if (derivedCategory) qs.set("category", derivedCategory);
    if (derivedCategory === "KIT" && derivedKitType) qs.set("kitType", derivedKitType);

    const url = `/shop/products${qs.toString() ? `?${qs.toString()}` : ""}`;

    apiJson<ProductsResp>(url)
      .then((d) => setProducts(d.items || []))
      .finally(() => setLoading(false));
  }, [qDebounced, derivedCategory, derivedKitType]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    };
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
    [cart]
  );

  const count = useMemo(
    () => cart.reduce((sum, i) => sum + i.qty, 0),
    [cart]
  );

  const cartCurrency = cart[0]?.currency || "KES";

  function persist(next: CartItem[]) {
    setCart(next);
    saveCart(next);
  }

  function inc(variantId: string) {
    persist(
      cart.map((c) =>
        c.variantId === variantId ? { ...c, qty: Math.min(20, c.qty + 1) } : c
      )
    );
  }

  function dec(variantId: string) {
    const next = cart
      .map((c) => (c.variantId === variantId ? { ...c, qty: c.qty - 1 } : c))
      .filter((c) => c.qty > 0);
    persist(next);
  }

  function remove(variantId: string) {
    persist(cart.filter((c) => c.variantId !== variantId));
  }

  function clearCart() {
    persist([]);
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  }

  function pushUrl(next: { category?: string; kit?: string; kitType?: string; q?: string }) {
    const qs = new URLSearchParams(sp.toString());

    const nextQ = (next.q ?? q).trim();
    if (nextQ) qs.set("q", nextQ);
    else qs.delete("q");

    qs.delete("kit");
    qs.delete("category");
    qs.delete("kitType");

    if (next.kit) {
      qs.set("kit", next.kit);
    } else if (next.category) {
      qs.set("category", next.category);
      if (next.category === "KIT" && next.kitType) {
        const kit = kitTypeToKitParam(next.kitType);
        if (kit) qs.set("kit", kit);
        else qs.set("kitType", next.kitType);
      }
    }

    router.push(`/shop${qs.toString() ? `?${qs.toString()}` : ""}`);
  }

  async function openPickerBySlug(slug: string) {
    setPayError(null);

    const cached = detailCache[slug];
    if (cached) {
      setupPicker(cached);
      return;
    }

    try {
      const detail = await apiJson<ProductDetail>(`/shop/products/${slug}`);
      setDetailCache((prev) => ({ ...prev, [slug]: detail }));
      setupPicker(detail);
    } catch (e: any) {
      showToast(e?.message || "Failed to load sizes");
    }
  }

  function setupPicker(detail: ProductDetail) {
    setPickerProduct(detail);

    const hasAdult = detail.variants.some((v) => v.group === "ADULT");
    const hasKids = detail.variants.some((v) => v.group === "KIDS");
    const g: SizeGroup = hasAdult ? "ADULT" : hasKids ? "KIDS" : "ADULT";
    setPickerGroup(g);

    const first = detail.variants.find((v) => v.group === g) || detail.variants[0];
    setPickerVariantId(first?.id || "");

    setPickerOpen(true);
  }

  const pickerVariants = useMemo(() => {
    if (!pickerProduct) return [];
    return pickerProduct.variants.filter((v) => v.group === pickerGroup);
  }, [pickerProduct, pickerGroup]);

  const selectedVariant = useMemo(() => {
    if (!pickerProduct) return null;
    return pickerProduct.variants.find((v) => v.id === pickerVariantId) || null;
  }, [pickerProduct, pickerVariantId]);

  const selectedUnitPrice = useMemo(() => {
    if (!pickerProduct) return 0;
    return selectedVariant?.price ?? pickerProduct.price;
  }, [pickerProduct, selectedVariant]);

  function addSelectedToCart() {
    if (!pickerProduct || !selectedVariant) {
      showToast("Select a size first");
      return;
    }

    if (typeof selectedVariant.stock === "number" && selectedVariant.stock <= 0) {
      showToast("Out of stock");
      return;
    }

    const existing = cart.find((c) => c.variantId === selectedVariant.id);
    const next = existing
      ? cart.map((c) =>
          c.variantId === selectedVariant.id
            ? { ...c, qty: Math.min(20, c.qty + 1) }
            : c
        )
      : [
          ...cart,
          {
            productId: pickerProduct.id,
            variantId: selectedVariant.id,
            group: selectedVariant.group,
            size: selectedVariant.size,
            slug: pickerProduct.slug,
            title: pickerProduct.title,
            unitPrice: selectedUnitPrice,
            currency: pickerProduct.currency,
            qty: 1,
            heroUrl: pickerProduct.heroUrl,
          },
        ];

    persist(next);
    setPickerOpen(false);
    showToast("Added to cart ✓");
  }

  function onAddFromListing(p: ProductListItem) {
    if (p.variantCount === 1 && p.defaultVariant?.id) {
      const unitPrice = (p.defaultVariant.price ?? p.fromPrice) || p.fromPrice;

      const existing = cart.find((c) => c.variantId === p.defaultVariant!.id);
      const next = existing
        ? cart.map((c) =>
            c.variantId === p.defaultVariant!.id
              ? { ...c, qty: Math.min(20, c.qty + 1) }
              : c
          )
        : [
            ...cart,
            {
              productId: p.id,
              variantId: p.defaultVariant.id,
              group: p.defaultVariant.group,
              size: p.defaultVariant.size,
              slug: p.slug,
              title: p.title,
              unitPrice,
              currency: p.currency,
              qty: 1,
              heroUrl: p.heroUrl,
            },
          ];

      persist(next);
      showToast("Added to cart ✓");
      return;
    }

    openPickerBySlug(p.slug);
  }

  function validateCheckout(): string | null {
    if (cart.length === 0) return "Your cart is empty.";
    if (!fullName.trim()) return "Enter full name.";
    if (!email.trim() || !isEmail(email)) return "Enter a valid email.";
    if (!phone.trim()) return "Enter phone (M-Pesa).";
    if (!addressLine1.trim()) return "Enter billing address.";
    if (!city.trim()) return "Enter city / town.";
    if (!deliveryLocation.trim()) return "Enter delivery location.";
    return null;
  }

  async function startStk() {
    setPayError(null);
    setPayState("STARTING");

    const v = validateCheckout();
    if (v) {
      setPayError(v);
      setPayState("IDLE");
      return;
    }

    try {
      const resp = await apiJson<StkStartResp>("/payments/shop/checkout/stk", {
        method: "POST",
        body: {
          fullName,
          email,
          phone,
          billingAddress: {
            line1: addressLine1,
            line2: addressLine2 || null,
            city,
          },
          delivery: {
            location: deliveryLocation,
            notes: deliveryNotes || null,
          },
          items: cart.map((c) => ({
            productId: c.productId,
            variantId: c.variantId,
            qty: c.qty,
          })),
        },
      });

      setCheckoutRequestId(resp.checkoutRequestId);
      setOrderId(resp.orderId);
      setPayState("WAITING");

      const startedAt = Date.now();
      const maxMs = 90_000;

      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);

      pollTimerRef.current = window.setInterval(async () => {
        try {
          const s = await apiJson<TxStatusResp>(
            `/payments/tx/status/${encodeURIComponent(resp.checkoutRequestId)}`
          );

          if (s.status === "SUCCESS") {
            if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
            setPayState("SUCCESS");
            clearCart();
            return;
          }

          if (s.status === "FAILED") {
            if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
            setPayState("FAILED");
            setPayError("Payment failed or was cancelled on the phone.");
            return;
          }

          if (Date.now() - startedAt > maxMs) {
            if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
            setPayState("FAILED");
            setPayError("Timed out. If you approved on phone, refresh to see updated status.");
          }
        } catch {
          // ignore transient polling errors
        }
      }, 2200);
    } catch (e: any) {
      setPayState("FAILED");
      setPayError(e?.message || "Failed to start STK push.");
    }
  }

  return (
    <div className="pb-24 md:pb-0">
      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">Official Shop</div>
          <div className="mt-1 text-sm text-muted">
            {derivedCategory === "KIT" && derivedKitType
              ? `Showing: ${derivedKitType} KIT`
              : derivedCategory === "MERCH"
                ? "Showing: MERCH"
                : "Browse kits and merch. Select size, add to cart, pay via M-Pesa STK."}
          </div>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          View cart ({count})
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => pushUrl({ category: "", kit: "" })}
          className={`rounded-full border px-4 py-2 text-xs font-extrabold tracking-widest ${
            !derivedCategory
              ? "border-brand bg-brand text-black"
              : "border-line bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          ALL
        </button>

        <button
          onClick={() => pushUrl({ category: "KIT" })}
          className={`rounded-full border px-4 py-2 text-xs font-extrabold tracking-widest ${
            derivedCategory === "KIT"
              ? "border-brand bg-brand text-black"
              : "border-line bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          KIT
        </button>

        <button
          onClick={() => pushUrl({ category: "MERCH" })}
          className={`rounded-full border px-4 py-2 text-xs font-extrabold tracking-widest ${
            derivedCategory === "MERCH"
              ? "border-brand bg-brand text-black"
              : "border-line bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          MERCH
        </button>

        {derivedCategory === "KIT" && (
          <div className="ml-2 flex items-center gap-2">
            {(["HOME", "AWAY", "THIRD"] as const).map((kt) => (
              <button
                key={kt}
                onClick={() => pushUrl({ category: "KIT", kitType: kt })}
                className={`rounded-full border px-4 py-2 text-xs font-extrabold tracking-widest ${
                  derivedKitType === kt
                    ? "border-brand bg-brand text-black"
                    : "border-line bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {kt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
          placeholder="Search products…"
          className="w-full rounded-full border border-line bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10 sm:w-[420px]"
        />
      </div>

      {/* Listing */}
      {loading ? (
        <div className="mt-8 text-sm text-muted">Loading…</div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
          {products.map((p, idx) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-3xl border border-line bg-card"
            >
              <Link href={`/shop/${p.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-black/30">
                  <ProductThumb
                    src={p.heroUrl}
                    alt={p.title}
                    sizes="(max-width: 767px) 50vw, 33vw"
                    className="object-cover"
                    quality={72}
                    priority={idx < 3}
                  />
                </div>
              </Link>

              <div className="p-4">
                <div className="text-xs tracking-widest text-muted">OFFICIAL MERCH</div>
                <div className="mt-2 line-clamp-2 font-bold">{p.title}</div>

                <div className="mt-2 text-xs text-muted">
                  {p.category === "KIT" && p.kitType ? `${p.kitType} KIT` : p.category || "PRODUCT"}
                  {" · "}
                  {p.groups?.includes("ADULT") && p.groups?.includes("KIDS")
                    ? "Adults & Kids"
                    : p.groups?.includes("ADULT")
                      ? "Adults"
                      : "Kids"}
                </div>

                <div className="mt-2 text-sm font-extrabold">
                  From {p.fromPrice} {p.currency}
                </div>

                <button
                  onClick={() => onAddFromListing(p)}
                  className="mt-3 w-full rounded-full bg-brand py-2.5 font-extrabold text-black"
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop cart + checkout */}
      <div className="mt-10 hidden rounded-3xl border border-line bg-card p-6 md:block">
        <CartAndCheckout
          cart={cart}
          inc={inc}
          dec={dec}
          remove={remove}
          total={total}
          currency={cartCurrency}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          addressLine1={addressLine1}
          setAddressLine1={setAddressLine1}
          addressLine2={addressLine2}
          setAddressLine2={setAddressLine2}
          city={city}
          setCity={setCity}
          deliveryLocation={deliveryLocation}
          setDeliveryLocation={setDeliveryLocation}
          deliveryNotes={deliveryNotes}
          setDeliveryNotes={setDeliveryNotes}
          payError={payError}
          payState={payState}
          startStk={startStk}
          checkoutRequestId={checkoutRequestId}
          orderId={orderId}
        />
      </div>

      {/* Mobile sticky cart bar */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-0 left-0 right-0 z-40 bg-ink text-white md:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-extrabold">Cart · {count} items</div>
          <div className="text-sm font-extrabold">
            {total} {cartCurrency} →
          </div>
        </div>
      </button>

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-extrabold text-ink">Checkout</div>
              <button
                className="text-sm font-bold text-ink"
                onClick={() => setCartOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <CartAndCheckout
                cart={cart}
                inc={inc}
                dec={dec}
                remove={remove}
                total={total}
                currency={cartCurrency}
                fullName={fullName}
                setFullName={setFullName}
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                addressLine1={addressLine1}
                setAddressLine1={setAddressLine1}
                addressLine2={addressLine2}
                setAddressLine2={setAddressLine2}
                city={city}
                setCity={setCity}
                deliveryLocation={deliveryLocation}
                setDeliveryLocation={setDeliveryLocation}
                deliveryNotes={deliveryNotes}
                setDeliveryNotes={setDeliveryNotes}
                payError={payError}
                payState={payState}
                startStk={startStk}
                checkoutRequestId={checkoutRequestId}
                orderId={orderId}
                mobile
              />
            </div>
          </div>
        </div>
      )}

      {/* Size picker */}
      {pickerOpen && pickerProduct && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setPickerOpen(false)}
          />

          {/* Desktop modal */}
          <div className="absolute left-1/2 top-1/2 hidden w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-card p-6 md:block">
            <PickerContent
              product={pickerProduct}
              group={pickerGroup}
              setGroup={setPickerGroup}
              variants={pickerVariants}
              variantId={pickerVariantId}
              setVariantId={setPickerVariantId}
              unitPrice={selectedUnitPrice}
              selectedVariant={selectedVariant}
              onClose={() => setPickerOpen(false)}
              onAdd={addSelectedToCart}
            />
          </div>

          {/* Mobile bottom sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white p-4 md:hidden">
            <PickerContent
              product={pickerProduct}
              group={pickerGroup}
              setGroup={setPickerGroup}
              variants={pickerVariants}
              variantId={pickerVariantId}
              setVariantId={setPickerVariantId}
              unitPrice={selectedUnitPrice}
              selectedVariant={selectedVariant}
              onClose={() => setPickerOpen(false)}
              onAdd={addSelectedToCart}
              mobile
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PickerContent(props: {
  product: ProductDetail;
  group: SizeGroup;
  setGroup: (g: SizeGroup) => void;
  variants: Variant[];
  variantId: string;
  setVariantId: (id: string) => void;
  unitPrice: number;
  selectedVariant: Variant | null;
  onClose: () => void;
  onAdd: () => void;
  mobile?: boolean;
}) {
  const {
    product,
    group,
    setGroup,
    variants,
    variantId,
    setVariantId,
    unitPrice,
    selectedVariant,
    onClose,
    onAdd,
    mobile,
  } = props;

  const hasAdult = product.variants.some((v) => v.group === "ADULT");
  const hasKids = product.variants.some((v) => v.group === "KIDS");
  const priceLabel = `${unitPrice} ${product.currency}`;

  return (
    <div className={mobile ? "text-ink" : ""}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-extrabold">
          {mobile ? "Select Size" : "Select group & size"}
        </div>
        <button onClick={onClose} className="text-sm font-bold">
          Close
        </button>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/10">
          <ProductThumb
            src={product.heroUrl}
            alt={product.title}
            sizes="96px"
            className="object-cover"
            quality={72}
          />
        </div>

        <div className="min-w-0">
          <div className="line-clamp-2 font-extrabold">{product.title}</div>
          <div className="mt-1 text-sm text-muted">
            Price: <span className="font-extrabold">{priceLabel}</span>
          </div>
          {selectedVariant ? (
            <div className="mt-1 text-xs text-muted">
              Selected:{" "}
              <span className="font-extrabold">
                {selectedVariant.group === "ADULT" ? "Adults" : "Kids"} ·{" "}
                {selectedVariant.size}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {(hasAdult || hasKids) && (
        <div className="mt-5">
          <div className="text-xs font-extrabold tracking-widest text-muted">GROUP</div>
          <div className="mt-2 inline-flex rounded-full border border-line bg-white/10 p-1">
            {hasAdult && (
              <button
                onClick={() => {
                  setGroup("ADULT");
                  const first = product.variants.find((v) => v.group === "ADULT");
                  setVariantId(first?.id || "");
                }}
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                  group === "ADULT"
                    ? "bg-brand text-black"
                    : "text-muted hover:text-ink"
                }`}
              >
                Adults
              </button>
            )}
            {hasKids && (
              <button
                onClick={() => {
                  setGroup("KIDS");
                  const first = product.variants.find((v) => v.group === "KIDS");
                  setVariantId(first?.id || "");
                }}
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                  group === "KIDS"
                    ? "bg-brand text-black"
                    : "text-muted hover:text-ink"
                }`}
              >
                Kids
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <div className="text-xs font-extrabold tracking-widest text-muted">SIZE</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {variants.map((v) => {
            const disabled = typeof v.stock === "number" && v.stock <= 0;
            const active = v.id === variantId;

            return (
              <button
                key={v.id}
                disabled={disabled}
                onClick={() => setVariantId(v.id)}
                className={`rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                  active
                    ? "border-brand bg-brand text-black"
                    : "border-line bg-white/10 text-ink hover:bg-black/5"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onAdd}
        className="mt-6 w-full rounded-full bg-brand py-3 font-extrabold text-black"
      >
        Add to cart
      </button>
    </div>
  );
}

function CartAndCheckout(props: {
  cart: CartItem[];
  inc: (variantId: string) => void;
  dec: (variantId: string) => void;
  remove: (variantId: string) => void;
  total: number;
  currency: string;

  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  addressLine1: string;
  setAddressLine1: (v: string) => void;
  addressLine2: string;
  setAddressLine2: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  deliveryLocation: string;
  setDeliveryLocation: (v: string) => void;
  deliveryNotes: string;
  setDeliveryNotes: (v: string) => void;

  payError: string | null;
  payState: "IDLE" | "STARTING" | "WAITING" | "SUCCESS" | "FAILED";
  startStk: () => void;
  checkoutRequestId: string | null;
  orderId: string | null;

  mobile?: boolean;
}) {
  const {
    cart,
    inc,
    dec,
    remove,
    total,
    currency,
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    addressLine1,
    setAddressLine1,
    addressLine2,
    setAddressLine2,
    city,
    setCity,
    deliveryLocation,
    setDeliveryLocation,
    deliveryNotes,
    setDeliveryNotes,
    payError,
    payState,
    startStk,
    checkoutRequestId,
    orderId,
    mobile,
  } = props;

  const shell = mobile ? "text-ink" : "";

  return (
    <div className={shell}>
      {cart.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white/60 p-6 text-center">
          <div className="font-extrabold">Cart is empty</div>
          <div className="mt-1 text-sm text-muted">Add items then checkout.</div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cart.map((c) => (
              <div
                key={c.variantId}
                className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{c.title}</div>
                  <div className="text-xs text-muted">
                    {c.group === "ADULT" ? "Adults" : "Kids"} · Size {c.size}
                  </div>
                  <div className="text-sm text-muted">
                    {c.unitPrice} {c.currency}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dec(c.variantId)}
                    className="h-9 w-9 rounded-full border border-line font-extrabold"
                  >
                    −
                  </button>
                  <div className="w-8 text-center font-extrabold">{c.qty}</div>
                  <button
                    onClick={() => inc(c.variantId)}
                    className="h-9 w-9 rounded-full border border-line font-extrabold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => remove(c.variantId)}
                  className="text-sm font-extrabold text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-white/70 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">Total</div>
              <div className="text-lg font-extrabold">
                {total} {currency}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <Field
                label="FULL NAME"
                value={fullName}
                onChange={setFullName}
                placeholder="Full name"
              />
              <Field
                label="EMAIL"
                value={email}
                onChange={setEmail}
                placeholder="you@email.com"
              />
              <Field
                label="PHONE (M-PESA)"
                value={phone}
                onChange={setPhone}
                placeholder="07xx… or 2547xx…"
              />
            </div>

            <div className="mt-5">
              <div className="text-xs font-extrabold tracking-widest text-muted">
                BILLING ADDRESS
              </div>
              <div className="mt-2 grid gap-3">
                <Field
                  label="ADDRESS LINE 1"
                  value={addressLine1}
                  onChange={setAddressLine1}
                  placeholder="Street / Estate / Plot"
                />
                <Field
                  label="ADDRESS LINE 2 (OPTIONAL)"
                  value={addressLine2}
                  onChange={setAddressLine2}
                  placeholder="Apartment / Landmark"
                />
                <Field
                  label="CITY / TOWN"
                  value={city}
                  onChange={setCity}
                  placeholder="Mombasa"
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-extrabold tracking-widest text-muted">
                DELIVERY
              </div>
              <div className="mt-2 grid gap-3">
                <Field
                  label="DELIVERY LOCATION"
                  value={deliveryLocation}
                  onChange={setDeliveryLocation}
                  placeholder="Area / Stage / Landmark"
                />
                <Field
                  label="DELIVERY NOTES (OPTIONAL)"
                  value={deliveryNotes}
                  onChange={setDeliveryNotes}
                  placeholder="Extra instructions…"
                />
              </div>
            </div>

            {payError && <div className="mt-3 text-sm text-red-600">{payError}</div>}

            <button
              onClick={startStk}
              disabled={payState === "STARTING" || payState === "WAITING"}
              className="mt-4 w-full rounded-full bg-brand py-3 font-extrabold text-black disabled:opacity-60"
            >
              {payState === "STARTING"
                ? "Starting STK…"
                : payState === "WAITING"
                  ? "Waiting for phone approval…"
                  : "Pay with M-Pesa (STK)"}
            </button>

            {payState === "WAITING" && checkoutRequestId && (
              <div className="mt-3 text-xs text-muted">
                Ref: <span className="font-mono">{checkoutRequestId}</span>
              </div>
            )}

            {payState === "SUCCESS" && (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="font-extrabold text-green-800">
                  Payment successful ✓
                </div>
                {orderId ? (
                  <div className="mt-1 text-xs text-green-700">
                    Order: <span className="font-mono">{orderId}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
        {props.label}
      </label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}