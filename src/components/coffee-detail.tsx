"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUpRight,
  Coffee,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  categoryLabel,
  money,
  type CoffeeProduct,
} from "@/lib/coffee-catalog";
import CoffeePack from "./coffee-pack";
import CustomSelect from "./custom-select";
import { useCart } from "./cart-provider";
import { CoffeeProductCard } from "./coffee-shop";
import { useCatalog } from "./catalog-provider";
import { defaultProductFormat, isGroundCoffee, isWholeBean, packageLabel } from "@/lib/product-format";
import GrindGuide, { grindDescriptions } from "./grind-guide";
import { productDescription } from '@/lib/product-description';

export default function CoffeeDetail({ product }: { product: CoffeeProduct }) {
  const { products: coffeeProducts, ready, unavailable, refresh } = useCatalog();
  const catalogHasProduct = coffeeProducts.some(item => item.slug === product.slug);
  const canAdd = ready && !unavailable && catalogHasProduct;
  const [quantity, setQuantity] = useState(1),
    [grind, setGrind] = useState(defaultProductFormat(product));
  const complementary = product.category === "complementare";
  const { add } = useCart();
  const description = productDescription(product.description);
  const specs = [
    ["SKU", product.sku],
    ["Format", categoryLabel(product.category)],
    ["Cantitate", packageLabel(product)],
    ...(!complementary ? [["Origine", product.origin], ["Altitudine", product.altitude], ["Varietate", product.variety], ["Procesare", product.processing], ["Prăjire", product.roast]] : []),
  ].filter((row): row is [string, string] => !!row[1]);
  const related = coffeeProducts
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 3);
  return (
    <>
      <div className="product-breadcrumb section-padding">
        <Link href="/cafea">
          <ArrowLeft size={15} />
          Toate produsele
        </Link>
        <span>SwitchMorn / {product.name}</span>
      </div>
      <section className="coffee-detail section-padding">
        <div className="detail-visual detail-product-gallery">
          <div className="detail-gallery-header"><span className="eyebrow">{product.collection}</span></div>
          <div className="detail-gallery-stage"><CoffeePack product={product} /></div>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {complementary ? "MAKEON" : "SWITCHMORN COFFEE"} / {categoryLabel(product.category)}
          </span>
          <h1>{product.name}</h1>
          <div className="detail-notes">
            {product.notes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
          <p className="detail-description">{description.intro}</p>
          {description.isLong && <a className="detail-story-link" href="#poveste-produs">Citește descrierea completă <ArrowDown size={15} aria-hidden="true" /></a>}
          <div className="detail-price">
            {product.price == null ? "Preț la cerere" : money(product.price)}
            <small>
              {product.price == null
                ? "Solicită prețul și disponibilitatea pentru acest produs."
                : "Preț pe ambalaj, cu TVA inclus."}
            </small>
          </div>
          <div className="detail-options">
            <div>
              <label>Cantitate / ambalaj</label>
              <span className="pack-size-option">
                {packageLabel(product)}
              </span>
            </div>
            {!complementary && <div>
              <label htmlFor="grind">
                {isGroundCoffee(product) ? "Măcinare pentru" : "Format"}
              </label>
              {isGroundCoffee(product) ? (
                <>
                  <CustomSelect
                    id="grind"
                    label="Măcinare pentru"
                    value={grind}
                    onChange={setGrind}
                    options={["Ibric", "Moka", "Espresso"].map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                  <p className="grind-description" aria-live="polite" aria-atomic="true">
                    {grindDescriptions[grind]}
                  </p>
                  <GrindGuide selected={grind} onSelect={setGrind}/>
                </>
              ) : (
                <span className="pack-size-option">{grind}</span>
              )}
            </div>}
          </div>
          <div className="detail-add-row">
            <div className="quantity-control">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Scade cantitatea"
              >
                <Minus size={16} />
              </button>
              <label className="sr-only" htmlFor="product-quantity">
                Număr de ambalaje
              </label>
              <input
                id="product-quantity"
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                  )
                }
              />
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                disabled={quantity >= 99}
                aria-label="Crește cantitatea"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="primary-button"
              disabled={!canAdd}
              aria-describedby={!canAdd ? "product-catalog-status" : undefined}
              onClick={() => add(product.slug, grind, quantity)}
            >
              {product.stock != null && quantity > product.stock ? "Comandă la cerere" : "Adaugă în coș"}
              <ShoppingBag size={18} />
            </button>
          </div>
          {!canAdd && <div className="detail-catalog-status">
            <p id="product-catalog-status" role={ready ? "alert" : "status"}>
              {!ready ? "Verificăm disponibilitatea produsului…" : unavailable ? "Nu putem verifica produsul momentan." : "Produsul nu este disponibil în catalogul curent."}
            </p>
            {ready && <button type="button" className="text-link" onClick={refresh}>Reîncearcă verificarea</button>}
          </div>}
          <p className="detail-order-note">
            {product.price == null || (product.stock != null && quantity > product.stock) ? "Adaugă selecția în coș și completează datele pentru comanda la cerere. Te contactăm telefonic pentru confirmare." : "Adaugă produsul în coș. Datele de livrare și metoda de plată se aleg la finalizarea comenzii."}
            {product.stock != null && <span className="stock-note">{product.stock > 0 ? `${product.stock} unități / ambalaje disponibile` : "Disponibil la cerere. Te contactăm telefonic pentru confirmare; pregătirea începe după plată."}</span>}
          </p>
          <div className="detail-ritual">
            <Coffee size={19} />
            <span>
              {complementary ? "Accesorii și consumabile pentru ritualul tău." : isGroundCoffee(product)
                ? "Măcinată pentru ibric, moka sau espresso."
                : isWholeBean(product)
                  ? "Cafea boabe. Măcinarea face parte din ritual."
                  : "Un ritual simplu, cu apă sau lapte."}
            </span>
          </div>
        </div>
      </section>
      {description.isLong && <section className="detail-story section-padding" id="poveste-produs" aria-labelledby="product-story-title" tabIndex={-1}>
        <div className="detail-story-heading">
          <span className="eyebrow">{product.name} / {complementary ? 'ÎN DETALIU' : 'POVESTEA CAFELEI'}</span>
          <h2 id="product-story-title">{complementary ? 'Detaliile fac diferența.' : <>Din origine,<br />în ceașca ta.</>}</h2>
          {product.notes.length > 0 && <div className="detail-story-notes" aria-label="Note de gust">{product.notes.map(note => <span key={note}>{note}</span>)}</div>}
        </div>
        <div className="detail-story-content">
          {description.paragraphs.map((paragraph,index) => <p key={index}>{paragraph}</p>)}
        </div>
      </section>}
      <section className="detail-specs section-padding">
        <div>
          <span className="eyebrow">{complementary ? "DETALII PRODUS" : "CUNOAȘTE-ȚI CAFEAUA"}</span>
          <h2>
            {complementary ? "Lucrurile mici completează ritualul." : <>Fiecare origine<br/>are povestea ei.</>}
          </h2>
        </div>
        <dl>
          {specs.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {related.length > 0 && (
        <section className="related-coffees section-padding">
          <div className="section-top">
            <h2>Continuă descoperirea.</h2>
            <Link href="/cafea" className="text-link">
              Toate cafelele
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="shop-grid">
            {related.map((p) => (
              <CoffeeProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
