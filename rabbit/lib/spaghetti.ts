// Task 4 — 스파게티 레시피 (하드코딩). 앱 챗 토글 + spagetties/ MCP 서버가 공유하는 소스.
// 설계: docs/tasks/jun-19-rabbit-design.md — Task 4.

export type Recipe = {
  name: string;
  tags: string[];
  minutes: number;
  ingredients: string[];
  steps: string[];
};

export const RECIPES: Recipe[] = [
  {
    name: "Aglio e Olio",
    tags: ["simple", "vegetarian", "quick", "기본"],
    minutes: 15,
    ingredients: ["spaghetti 200g", "garlic 4 cloves", "olive oil", "chili flakes", "parsley", "salt"],
    steps: [
      "면을 소금물에 삶는다 (al dente).",
      "올리브유에 편 마늘 + 칠리 플레이크를 약불로 향낸다.",
      "삶은 면 + 면수 약간을 넣고 버무린다.",
      "파슬리와 소금으로 마무리.",
    ],
  },
  {
    name: "Carbonara",
    tags: ["creamy", "egg", "rich", "크림"],
    minutes: 20,
    ingredients: ["spaghetti 200g", "guanciale or pancetta", "egg yolks 3", "pecorino", "black pepper"],
    steps: [
      "관찰레를 바삭하게 굽는다.",
      "달걀노른자 + 페코리노 + 후추를 섞어 소스를 만든다.",
      "삶은 면을 불 끄고 관찰레와 섞은 뒤, 면수로 온도를 낮춰 달걀 소스를 버무린다(스크램블 방지).",
    ],
  },
  {
    name: "Pomodoro",
    tags: ["tomato", "vegetarian", "classic", "토마토"],
    minutes: 25,
    ingredients: ["spaghetti 200g", "San Marzano tomatoes", "garlic", "basil", "olive oil", "salt"],
    steps: ["마늘을 올리브유에 볶는다.", "토마토를 으깨 넣고 졸인다.", "면 + 바질을 넣고 버무린다."],
  },
  {
    name: "Cacio e Pepe",
    tags: ["cheese", "simple", "vegetarian", "치즈"],
    minutes: 15,
    ingredients: ["spaghetti 200g", "pecorino romano", "black pepper", "pasta water"],
    steps: ["후추를 팬에 볶아 향낸다.", "면수 + 페코리노로 유화 소스를 만든다.", "면과 빠르게 버무린다."],
  },
  {
    name: "Arrabbiata",
    tags: ["spicy", "tomato", "vegetarian", "매운"],
    minutes: 25,
    ingredients: ["spaghetti 200g", "tomatoes", "garlic", "dried chili", "olive oil", "parsley"],
    steps: ["마늘 + 건고추를 올리브유에 볶는다.", "토마토를 넣고 졸인다(매운맛).", "면 + 파슬리로 마무리."],
  },
];

// 선호 키워드에 맞춰 1개 추천 (없으면 기본 Aglio e Olio). 결정적(랜덤 X).
export function recommendSpaghettiRecipe(preferences?: string): Recipe {
  const p = (preferences ?? "").toLowerCase();
  if (p) {
    const hit = RECIPES.find((r) => r.tags.some((t) => p.includes(t.toLowerCase())));
    if (hit) return hit;
    // 흔한 표현 매핑
    if (/spicy|매운|매콤/.test(p)) return RECIPES.find((r) => r.name === "Arrabbiata")!;
    if (/cream|크림|부드/.test(p)) return RECIPES.find((r) => r.name === "Carbonara")!;
    if (/cheese|치즈/.test(p)) return RECIPES.find((r) => r.name === "Cacio e Pepe")!;
    if (/tomato|토마토/.test(p)) return RECIPES.find((r) => r.name === "Pomodoro")!;
  }
  return RECIPES[0];
}

// 추천 결과를 사람이 읽는 텍스트로
export function formatRecipe(r: Recipe): string {
  return [
    `🍝 ${r.name} (${r.minutes}분)`,
    `재료: ${r.ingredients.join(", ")}`,
    `만들기:`,
    ...r.steps.map((s, i) => `  ${i + 1}. ${s}`),
  ].join("\n");
}
