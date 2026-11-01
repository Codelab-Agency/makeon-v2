"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { CoffeeProduct } from "@/lib/coffee-catalog";

type Catalog = {
  products: CoffeeProduct[];
  managed: boolean;
  checkout: boolean;
  cod: boolean;
  easybox: boolean;
  easyboxShippingBani: number | null;
  shippingBani: number | null;
  ready: boolean;
  unavailable: boolean;
  refresh: () => void;
};
const Context = createContext<Catalog | null>(null);
export const useCatalog = () => {
  const context = useContext(Context);
  if (!context) throw new Error("CatalogProvider is required");
  return context;
};
/** Refresh uncached stock; keep browsing available but disable payment on fetch failures. */
export default function CatalogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [catalog, setCatalog] = useState<Omit<Catalog, "refresh">>({
    products: [],
    managed: false,
    checkout: false,
    cod: false,
    easybox: false,
    easyboxShippingBani: null,
    shippingBani: null,
    ready: false,
    unavailable: false,
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCatalog(previous => ({ ...previous, ready: previous.products.length > 0, unavailable: false }));
    fetch("/api/catalog", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        const data = await response.json();
        if (!controller.signal.aborted)
          setCatalog({ ...data, ready: true, unavailable: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setCatalog((previous) => ({
            ...previous,
            checkout: false,
            cod: false,
            easybox: false,
            ready: true,
            unavailable: true,
          }));
      });
    return () => controller.abort();
  }, [revision]);
  return (
    <Context.Provider
      value={{ ...catalog, refresh: () => setRevision((n) => n + 1) }}
    >
      {children}
    </Context.Provider>
  );
}
