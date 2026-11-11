"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowUpRight, X } from "lucide-react";
import gsap from "gsap";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import ContactRequestForm, { contactTeams, contactWhatsAppHref } from "./contact-request-form";
import { legal } from "@/lib/legal";
import { isEventService, normalizeService } from "@/lib/service-options";
import { waterSubscription } from "@/lib/business-content";
import useSiteChoreography from "./use-site-choreography";

export type OfferHandler = (selection?: string) => void;

function offerContext(interest: string) {
  if (isEventService(interest)) return {
    title: "Cafea la evenimentul tău.",
    description: "Spune-ne data, localitatea și formatul dorit. Confirmăm disponibilitatea în ofertă.",
    compactDescription: "Spune-ne data, localitatea și formatul dorit.",
  };
  if (interest === waterSubscription.interest || [
    "Consultanță pentru filtrarea apei", "Instalare sistem de filtrare", "Schimb filtre și mentenanță",
  ].includes(interest)) return {
    title: "Apă pentru biroul tău.",
    description: "Spune-ne despre spațiu și consum. Confirmăm configurația și condițiile în ofertă.",
    compactDescription: "Spune-ne despre spațiu și consum.",
  };
  if (interest !== "Cafea + apă" && interest !== "Filtre pentru apă și cafea" && /cafea|prăjire/i.test(interest)) return {
    title: "Cafea pentru biroul tău.",
    description: "Spune-ne despre echipă și consum. Stabilim echipamentele și serviciile în ofertă.",
    compactDescription: "Spune-ne despre echipă și consum.",
  };
  return {
    title: "Solicită ofertă.",
    description: "Spune-ne ce ai nevoie. Îți pregătim o ofertă pentru soluția aleasă.",
    compactDescription: "Spune-ne ce soluție cauți.",
  };
}

/** The offer owns its lifecycle; the menu/cart motion and their state stay separate. */
function useOfferDialogMotion(
  ref: RefObject<HTMLDialogElement | null>,
  opened: boolean,
  setPresent: (present: boolean) => void,
) {
  const previousOverflow = useRef<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const position = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    const paper = node?.querySelector<HTMLElement>(".dialog-content");
    const shade = node?.querySelector<HTMLElement>(".contact-offer-shade");
    if (!node || !paper || !shade) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let timeline: gsap.core.Timeline | undefined;
    const restoreOverflow = () => {
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    };
    const finishClose = () => {
      node.dataset.offerState = "closed";
      node.close();
      restoreOverflow();
      setPresent(false);
      const original = opener.current;
      const visible = (element: HTMLElement | null) => !!element?.isConnected
        && element.getClientRects().length > 0 && !element.closest("dialog:not([open])");
      const fallback = Array.from(document.querySelectorAll<HTMLElement>(".header-actions .offer-button,.header-actions .menu-button")).find(visible);
      (visible(original) ? original : fallback)?.focus({ preventScroll: true });
      if (Math.abs(scrollY - position.current.y) > 1 || Math.abs(scrollX - position.current.x) > 1) {
        window.scrollTo({ left: position.current.x, top: position.current.y, behavior: "instant" });
      }
    };
    const keyboardFocus = (event: KeyboardEvent) => {
      node.dataset.keyboardFocus = "true";
      if (event.key !== "Tab" || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
      const controls = Array.from(node.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,[tabindex]"))
        .filter(element => element.tabIndex >= 0 && !element.matches(":disabled")
          && !element.closest("[hidden],[inert]") && element.getClientRects().length > 0
          && getComputedStyle(element).visibility !== "hidden");
      const first = controls[0], last = controls.at(-1);
      // Native modality keeps the page inert; wrap the boundary too so Tab
      // cannot leave the document for the browser toolbar between controls.
      if (first && last && (document.activeElement === (event.shiftKey ? first : last)
        || !node.contains(document.activeElement))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    const pointerFocus = () => { node.dataset.keyboardFocus = "false"; };

    if (opened) {
      if (!node.open) {
        opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        position.current = { x: scrollX, y: scrollY };
        previousOverflow.current = document.body.style.overflow;
        node.dataset.keyboardFocus = String(opener.current?.matches(":focus-visible") ?? false);
        node.showModal();
        node.scrollTop = 0;
        gsap.set(shade, { opacity: preference.matches ? 1 : 0 });
        gsap.set(paper, { opacity: preference.matches ? 1 : 0, y: preference.matches ? 0 : 18 });
      }
      document.body.style.overflow = "hidden";
      if (preference.matches) {
        gsap.set(shade, { opacity: 1 });
        gsap.set(paper, { opacity: 1, y: 0 });
        node.dataset.offerState = "open";
      } else {
        node.dataset.offerState = "opening";
        timeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" }, onComplete: () => { node.dataset.offerState = "open"; } })
          .to(shade, { opacity: 1, duration: .2 }, 0)
          .to(paper, { opacity: 1, y: 0, duration: .3 }, 0);
      }
    } else if (node.open) {
      node.dataset.offerState = "closing";
      if (preference.matches) finishClose();
      else timeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" }, onComplete: finishClose })
        .to(shade, { opacity: 0, duration: .2, ease: "none" }, 0)
        .to(paper, { opacity: 0, duration: .2, ease: "none" }, 0)
        .to(paper, { y: 16, duration: .2 }, 0);
    }
    const reduceMotion = (event: MediaQueryListEvent) => { if (event.matches) timeline?.progress(1); };
    preference.addEventListener("change", reduceMotion);
    node.addEventListener("keydown", keyboardFocus);
    node.addEventListener("pointerdown", pointerFocus);
    return () => {
      // GSAP leaves the current transform/opacity in place when interrupted.
      timeline?.kill();
      preference.removeEventListener("change", reduceMotion);
      node.removeEventListener("keydown", keyboardFocus);
      node.removeEventListener("pointerdown", pointerFocus);
    };
  }, [opened, ref, setPresent]);

  useLayoutEffect(() => {
    const node = ref.current;
    return () => {
      node?.close();
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    };
  }, [ref]);
}

/** Keeps the existing contact payload, validation, request ID and success/error UI. */
export default function BusinessShell({ children, initialInterest = "Cafea + apă", className = "" }: {
  children: (onOffer: OfferHandler) => ReactNode;
  initialInterest?: string;
  className?: string;
}) {
  const [opened, setOpened] = useState(false);
  const [present, setPresent] = useState(false);
  const [interest, setInterest] = useState(initialInterest);
  const [team, setTeam] = useState(contactTeams[1]);
  const dialog = useRef<HTMLDialogElement>(null);
  const presentation = useRef<HTMLDivElement>(null);
  useOfferDialogMotion(dialog, opened, setPresent);
  useSiteChoreography(presentation);
  const context = offerContext(interest);

  const onOffer: OfferHandler = (selection = initialInterest) => {
    setInterest(normalizeService(selection));
    if (!present) setTeam(contactTeams[1]);
    setPresent(true);
    setOpened(true);
  };

  return <div ref={presentation} className={`site b2b-site ${className}`}>
    <SiteHeader onOffer={() => onOffer()} />
    <main id="main-content" tabIndex={-1}>{children(onOffer)}</main>
    <SiteFooter onOffer={() => onOffer()} offerAnchor={className.includes("b2b-home") ? "abonamente" : undefined} />
    <dialog ref={dialog} className="contact-dialog b2b-offer-dialog contact-offer-dialog" aria-labelledby="contact-dialog-title"
      aria-describedby="contact-dialog-description"
      onCancel={event => { event.preventDefault(); setOpened(false); }}
      onClick={event => { if (event.target === event.currentTarget) setOpened(false); }}>
      <div className="contact-offer-shade" aria-hidden="true" />
      <div className="dialog-content">
        <button type="button" className="dialog-close" aria-label="Închide formularul" onClick={() => setOpened(false)}><X size={21} aria-hidden="true" /></button>
        <aside className="dialog-intro">
          <div>
            <p className="b2b-eyebrow">SOLICITARE DE OFERTĂ</p>
            <h2 id="contact-dialog-title">{context.title}</h2>
            <p className="dialog-description" id="contact-dialog-description"><span className="dialog-description-full">{context.description}</span><span className="dialog-description-compact">{context.compactDescription}</span></p>
          </div>
          <div className="dialog-contact-links">
            <a className="dialog-phone" href={legal.phoneHref}>{legal.phone}<ArrowUpRight size={17} aria-hidden="true" /></a>
            <a className="dialog-email" href={`mailto:${legal.email}`}>{legal.email}<ArrowUpRight size={16} aria-hidden="true" /></a>
            <a className="contact-whatsapp" target="_blank" rel="noopener noreferrer" href={contactWhatsAppHref(interest, team)}>Preferi WhatsApp?<ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </aside>
        <div className="dialog-form-panel">{present && <ContactRequestForm interest={interest} onInterestChange={setInterest} onTeamChange={setTeam} showWhatsApp={false} />}</div>
      </div>
    </dialog>
  </div>;
}
