/**
 * Jomi Hisheb — page composition (MASTERPLAN §6 page anatomy).
 * Single page, mobile-first, max-w-2xl, converter is the visual focus.
 *
 * State ownership: App owns `from`, `to`, and `input` so that (a) quick
 * conversion chips can set units and (b) shareable-URL params (?from&to&value)
 * initialize the whole converter coherently. ConverterCard is fully controlled.
 * (Documented deviation from §5 in MASTERPLAN §19 milestones.)
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { LangProvider, useLang } from "./components/LangContext.tsx";
import Header from "./components/Header.tsx";
import ConverterCard from "./components/ConverterCard.tsx";
import QuickConversions from "./components/QuickConversions.tsx";
import AboutUnits from "./components/AboutUnits.tsx";
import FAQ from "./components/FAQ.tsx";
import Footer from "./components/Footer.tsx";
import type { UnitId } from "./data/units.ts";
import {
  buildSearch,
  createUrlWriter,
  DEFAULT_FROM,
  DEFAULT_TO,
  readStateFromUrl,
} from "./lib/share.ts";

function Page() {
  const { t } = useLang();

  // URL state is read exactly once on mount (MASTERPLAN §10).
  const initial = useMemo(() => readStateFromUrl(window.location.search), []);

  const [from, setFrom] = useState<UnitId>(initial.from);
  const [to, setTo] = useState<UnitId>(initial.to);
  const [input, setInput] = useState(initial.value);

  // Sync URL (debounced) whenever state settles; default state keeps URL clean.
  const writeUrl = useMemo(() => createUrlWriter(), []);
  useEffect(() => {
    const isDefault =
      from === DEFAULT_FROM && to === DEFAULT_TO && input === "" && !initial.hasParams;
    writeUrl(isDefault ? "" : buildSearch(from, to, input));
  }, [from, to, input, writeUrl, initial.hasParams]);

  const handleUnitsChange = useCallback((nextFrom: UnitId, nextTo: UnitId) => {
    setFrom(nextFrom);
    setTo(nextTo);
  }, []);

  const handlePick = useCallback(
    (pickedFrom: UnitId, pickedTo: UnitId) => {
      setFrom(pickedFrom);
      setTo(pickedTo);
      // Input value is preserved by design (MASTERPLAN §9).
      // Guarded: matchMedia is unavailable in jsdom and some embedded webviews.
      if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches) {
        document.getElementById("converter")?.scrollIntoView({ block: "start" });
      }
    },
    [],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8">
      <Header />

      <main>
        <section className="pt-4 pb-6 text-center sm:pt-6">
          <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">{t("title")}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </section>

        <div id="converter" className="scroll-mt-4">
          <ConverterCard
            input={input}
            onInputChange={setInput}
            from={from}
            to={to}
            onUnitsChange={handleUnitsChange}
          />
        </div>

        <QuickConversions from={from} to={to} onPick={handlePick} />
        <AboutUnits />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}
