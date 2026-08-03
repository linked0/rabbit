// Shared card shape for the demo-hub menus (PoCs /etc, TIL /til).
// ko/en bilingual, same pattern as lib/home-content.ts's PROJECTS.

export type DemoCard = {
  key: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  status: "live" | "soon";
  href?: string; // omitted while "soon" and no page exists yet
  howTo: string;
  howToKo: string;
};
