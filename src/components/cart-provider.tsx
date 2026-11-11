"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { money } from "@/lib/coffee-catalog";
import { useCatalog } from "./catalog-provider";
import CoffeePack from "./coffee-pack";
import useDialogMotion from "./use-dialog-motion";
import useCheckoutReturn from "./use-checkout-return";
import { needsProductionRequest } from "@/lib/cart-availability";
import { packageLabel } from "@/lib/product-format";

/** Persist selections only; the server resolves current prices and reserves inventory. */
export type CartLine = { slug: string; grind: string; quantity: number };
type CartContextValue = {
  items: CartLine[];
  add: (slug: string, grind: string, quantity?: number) => void;
  open: () => void;
  count: number;
  clear: (snapshot?: string) => void;
  checkoutRecovery: ReturnType<typeof useCheckoutReturn>;
};
const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "makeon-coffee-cart-v1";
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider is required");
  return context;
}

export function CartButton() {
  const { count, open } = useCart();
  return (
    <button
      className="cart-button"
      onClick={open}
      aria-label={`Deschide coșul de cafea (${count})`}
    >
      <ShoppingBag size={19} />
      <span>{count}</span>
    </button>
  );
}

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalog = useCatalog();
  const checkoutRecovery = useCheckoutReturn(() => catalog.refresh());
  const productBySlug = useCallback(
    (slug: string) => catalog.products.find((p) => p.slug === slug),
    [catalog.products],
  );
  const [items, setItems] = useState<CartLine[]>([]),
    [loaded, setLoaded] = useState(false),
    [opened, setOpened] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useDialogMotion(dialog, opened, "cart");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved))
        setItems(
          saved
            .filter((item: unknown): item is CartLine => {
              if (!item || typeof item !== "object") return false;
              const v = item as CartLine;
              return (
                typeof v.slug === "string" &&
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug) &&
                typeof v.grind === "string" &&
                ["Boabe", "Ibric", "Moka", "Espresso", "Instant", "Standard"].includes(
                  v.grind,
                ) &&
                Number.isInteger(v.quantity) &&
                v.quantity > 0 &&
                v.quantity <= 99
              );
            })
            .slice(0, 100),
        );
    } catch {
      /* An unavailable store must not prevent shopping. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
        /* Keep the current in-memory selection. */
      }
    }
  }, [items, loaded]);
  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );
  const add = useCallback(
    (slug: string, grind: string, quantity = 1) => {
      const product = productBySlug(slug);
      if (!product) return;
      const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
      setItems((previous) => {
        const found = previous.find(
          (i) => i.slug === slug && i.grind === grind,
        );
        return found
          ? previous.map((i) =>
              i === found
                ? { ...i, quantity: Math.min(99, i.quantity + qty) }
                : i,
            )
          : [...previous, { slug, grind, quantity: qty }];
      });
      setNotice(`${product.name} a fost adăugată în coș.`);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(""), 3500);
    },
    [productBySlug],
  );
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const hasUnavailableProducts = catalog.ready && !catalog.unavailable &&
    items.some((line) => !productBySlug(line.slug));
  const completePrices =
    items.length > 0 &&
    items.every((i) => productBySlug(i.slug)?.price != null);
  const total = items.reduce(
    (sum, i) => sum + (productBySlug(i.slug)?.price ?? 0) * i.quantity,
    0,
  );
  // UI hint only: the server performs the atomic stock check.
  const canPay =
    (catalog.checkout || catalog.cod) &&
    completePrices &&
    items.every((i) => {
      const p = productBySlug(i.slug);
      const quantity = items
        .filter((line) => line.slug === i.slug)
        .reduce((sum, line) => sum + line.quantity, 0);
      return (
        (p?.stock != null && p.stock >= quantity)
      );
    });
  const needsRequest =
    catalog.managed &&
    catalog.ready &&
    !catalog.unavailable &&
    needsProductionRequest(items, catalog.products);
  const changeQuantity = (line: CartLine, value: number) =>
    setItems((previous) =>
      previous.map((i) =>
        i.slug === line.slug && i.grind === line.grind
          ? { ...i, quantity: Math.min(99, Math.max(1, value)) }
          : i,
      ),
    );
  const remove = (line: CartLine) =>
    setItems((previous) =>
      previous.filter((i) => !(i.slug === line.slug && i.grind === line.grind)),
    );
  return (
    <CartContext.Provider
      value={{
        items,
        checkoutRecovery,
        add,
        count,
        clear: (snapshot) => setItems(previous => !snapshot || JSON.stringify(previous) === snapshot ? [] : previous),
        open: () => {
          setOpened(true);
        },
      }}
    >
      {children}
      {checkoutRecovery.error && <div className="cart-toast" role="alert"><span>{checkoutRecovery.error}</span><button type="button" disabled={checkoutRecovery.busy} onClick={() => void checkoutRecovery.retry()}>Reîncearcă</button></div>}
      {notice && (
        <div className="cart-toast" role="status">
          <Check size={17} />
          <span>{notice}</span>
          <button
            onClick={() => {
              setOpened(true);
              setNotice("");
            }}
          >
            Vezi coșul
            <ArrowUpRight size={15} />
          </button>
        </div>
      )}
      <dialog
        className="cart-drawer"
        ref={dialog}
        aria-label="Coșul de cafea"
        onCancel={(event) => {
          event.preventDefault();
          setOpened(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpened(false);
        }}
      >
        <div className="cart-drawer-inner">
          <div className="cart-drawer-top">
            <div>
              <span className="eyebrow">SWITCHMORN COFFEE</span>
              <h2>
                Coșul tău <span>({count})</span>
              </h2>
            </div>
            <button
              className="cart-close"
              onClick={() => setOpened(false)}
              aria-label="Închide coșul"
            >
              <X />
            </button>
          </div>
          {items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={49} />
              <h3>Un ritual bun începe cu alegerea ta.</h3>
              <p>Descoperă cafelele și adaugă preferatele în coș.</p>
              <Link
                className="primary-button"
                href="/cafea"
                onClick={() => setOpened(false)}
              >
                Explorează cafelele
                <ArrowUpRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <div className="cart-lines">
                {!catalog.ready || catalog.unavailable ? (
                  <p className="cart-catalog-status" role="status">
                    {catalog.unavailable ? "Nu putem verifica produsele momentan. Selecția ta este păstrată." : "Verificăm produsele din coș…"}
                  </p>
                ) : items.map((line) => {
                  const p = productBySlug(line.slug);
                  if (!p)
                    return (
                      <article
                        className="cart-line cart-line-unavailable"
                        key={`${line.slug}-${line.grind}`}
                      >
                        <div className="cart-line-copy">
                          <strong>Produs indisponibil</strong>
                          <p>{line.slug.replaceAll("-", " ")} · {line.quantity} {line.quantity === 1 ? "bucată" : "bucăți"}</p>
                          <span>Acest produs nu mai este disponibil în magazin.</span>
                          <button className="cart-remove-unavailable" onClick={() => remove(line)}>
                            <Trash2 size={15} aria-hidden="true" />
                            Elimină din coș
                          </button>
                        </div>
                      </article>
                    );
                  return (
                    <article
                      className="cart-line"
                      key={`${line.slug}-${line.grind}`}
                    >
                      <Link
                        className="cart-line-art"
                        href={`/cafea/${line.slug}`}
                        onClick={() => setOpened(false)}
                      >
                        <CoffeePack product={p} />
                      </Link>
                      <div className="cart-line-copy">
                        <Link
                          href={`/cafea/${line.slug}`}
                          onClick={() => setOpened(false)}
                        >
                          {p.name}
                        </Link>
                        <span>
                          {packageLabel(p)}{p.category !== "complementare" && ` · ${line.grind}`}
                        </span>
                        <small>
                          {p.price == null ? "Preț la cerere" : money(p.price)}
                        </small>
                        <div className="cart-line-controls">
                          <div className="quantity-control">
                            <button
                              aria-label={`Scade cantitatea ${p.name}`}
                              onClick={() =>
                                changeQuantity(line, line.quantity - 1)
                              }
                              disabled={line.quantity <= 1}
                            >
                              <Minus size={13} />
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              aria-label={`Crește cantitatea ${p.name}`}
                              onClick={() =>
                                changeQuantity(line, line.quantity + 1)
                              }
                              disabled={line.quantity >= 99}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            className="remove-line"
                            aria-label={`Elimină ${p.name}, ${line.grind}`}
                            onClick={() => remove(line)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!catalog.ready || catalog.unavailable || hasUnavailableProducts ? (
                <div className="cart-summary cart-summary-unavailable">
                  {catalog.unavailable ? (
                    <button className="primary-button cart-phone" onClick={catalog.refresh}>Reîncearcă verificarea</button>
                  ) : hasUnavailableProducts ? (
                    <>
                      <p role="status">Elimină produsele indisponibile pentru a continua comanda.</p>
                      <Link className="primary-button cart-phone" href="/cafea" onClick={() => setOpened(false)}>
                        Explorează cafelele <ArrowUpRight size={18} />
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : (
              <div className="cart-summary">
                <div className="cart-summary-total">
                  <span>
                    {completePrices ? "Total produse" : "Selecția ta"}
                  </span>
                  <strong>
                    {completePrices
                      ? money(total)
                      : `${count} ${count === 1 ? "produs" : "produse"}`}
                  </strong>
                </div>
                <p>
                  {needsRequest
                    ? "Preț estimativ. Confirmăm telefonic totalul, transportul și termenul înainte de plată."
                    : (catalog.checkout || catalog.cod) && completePrices
                      ? `Transport: ${money((catalog.shippingBani ?? 0) / 100)}. Total: ${money(total + (catalog.shippingBani ?? 0) / 100)}.`
                      : completePrices
                        ? "Livrarea și disponibilitatea se confirmă la comandă."
                        : "Solicită prețurile și disponibilitatea pentru cafelele alese."}
                </p>
                {needsRequest || ((catalog.checkout || catalog.cod) && completePrices) ? (
                  <Link className="primary-button cart-phone" href="/finalizare-comanda" onClick={() => setOpened(false)} aria-disabled={!needsRequest && !canPay}>
                    Continuă comanda <ArrowUpRight size={18} />
                  </Link>
                ) : (
                  <a
                    className="primary-button cart-phone"
                    href="tel:+40744524728"
                  >
                    <Phone size={17} />
                    Solicită ofertă
                    <ArrowUpRight size={18} />
                  </a>
                )}
                {!needsRequest &&
                  (catalog.checkout || catalog.cod) &&
                  completePrices &&
                  !canPay && (
                    <p className="checkout-error">
                      Verifică disponibilitatea și cantitățile din coș.
                    </p>
                  )}
                <span className="cart-summary-note">
                  {needsRequest
                    ? "Card sau ramburs, după confirmarea telefonică."
                    : (catalog.checkout || catalog.cod) && completePrices
                      ? catalog.checkout && catalog.cod ? "Alegi plata cu cardul sau ramburs la finalizarea comenzii." : catalog.checkout ? "Plată online cu cardul la finalizarea comenzii." : "Plată ramburs, la livrare."
                      : "+40 744 524 728 · Nicio comandă nu este trimisă automat."}
                </span>
              </div>
              )}
            </>
          )}
        </div>
      </dialog>
    </CartContext.Provider>
  );
}
