/**
 * Jomi Hisheb — page composition (MASTERPLAN §6 page anatomy).
 * Single page, mobile-first, max-w-2xl, converter is the visual focus.
 */
import { useState } from "react";
import { LangProvider, useLang } from "./components/LangContext.tsx";
import Header from "./components/Header.tsx";
import ConverterCard from "./components/ConverterCard.tsx";
import QuickConversions from "./components/QuickConversions.tsx";
import AboutUnits from "./components/AboutUnits.tsx";
import FAQ from "./components/FAQ.tsx";
import Footer from "./components/Footer.tsx";
import type { UnitId } from "./data/units.ts";
import { DEFAULT_FROM, DEFAULT_TO } from "./lib/share.ts";

function Page() {
  const { t } = useLang();
  const [from, setFrom] = useState<UnitId>(DEFAULT_FROM);
  const [to, setTo] = useState<UnitId>(DEFAULT_TO);

  // Quick-conversion picks update App-level state; ConverterCard syncs via props-driven state.
  const handlePick = (pickedFrom: UnitId, pickedTo: UnitId) => {
    setFrom(pickedFrom);
    setTo(pickedTo);
    if (window.matchMedia("(max-width: 767px)").matches) {
      document.getElementById("converter")?.scrollIntoView({ block: "start" });
    }
  };

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
          <ConverterCard from={from} to={to} onUnitsChange={(f, tt) => { setFrom(f); setTo(tt); }} />
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
