import Nav from "../../Nav";
import DefiClient from "./DefiClient";

// Jayverse #3 — DeFi (EtherFi-from-scratch LST study). Design: docs/features/jayverse-defi.md.
// The UI itself is authored in the jayverse-defi repo (web/src) and *served* here per the hub
// policy "Rabbit imports, it doesn't contain" — lib/jayverse-defi-ui is a generated copy
// (scripts/sync-defi-ui.mjs), never edited on the rabbit side.
export const metadata = { title: "Jayverse DeFi — LST study" };

export default function DefiPage() {
  return (
    <>
      <Nav />
      <DefiClient />
    </>
  );
}
