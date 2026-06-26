#!/usr/bin/env node
// 스파게티 레시피 MCP 서버 (stdio). Task 4 — rabbit AI 챗이 on/off 토글로 붙이는 MCP.
// 레시피는 ../lib/spaghetti.ts 와 동일(독립 실행을 위해 인라인). 타깃: @modelcontextprotocol/sdk ^1.x
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const RECIPES = [
  { name: "Aglio e Olio", tags: ["simple", "vegetarian", "quick"], minutes: 15,
    ingredients: ["spaghetti 200g", "garlic 4", "olive oil", "chili flakes", "parsley"],
    steps: ["면을 al dente로 삶는다", "마늘+칠리를 올리브유에 약불로 향낸다", "면+면수로 버무린다", "파슬리 마무리"] },
  { name: "Carbonara", tags: ["creamy", "egg", "rich"], minutes: 20,
    ingredients: ["spaghetti 200g", "guanciale", "egg yolks 3", "pecorino", "black pepper"],
    steps: ["관찰레를 굽는다", "노른자+페코리노+후추 소스", "불 끄고 면수로 온도 낮춰 버무린다(스크램블 방지)"] },
  { name: "Pomodoro", tags: ["tomato", "vegetarian", "classic"], minutes: 25,
    ingredients: ["spaghetti 200g", "tomatoes", "garlic", "basil", "olive oil"],
    steps: ["마늘을 볶는다", "토마토를 졸인다", "면+바질 버무린다"] },
  { name: "Cacio e Pepe", tags: ["cheese", "simple", "vegetarian"], minutes: 15,
    ingredients: ["spaghetti 200g", "pecorino romano", "black pepper", "pasta water"],
    steps: ["후추를 볶아 향낸다", "면수+페코리노 유화 소스", "면과 빠르게 버무린다"] },
  { name: "Arrabbiata", tags: ["spicy", "tomato", "vegetarian"], minutes: 25,
    ingredients: ["spaghetti 200g", "tomatoes", "garlic", "dried chili", "olive oil"],
    steps: ["마늘+건고추 볶기", "토마토 졸이기", "면+파슬리 마무리"] },
];

function recommend(preferences) {
  const p = (preferences ?? "").toLowerCase();
  if (p) {
    const hit = RECIPES.find((r) => r.tags.some((t) => p.includes(t)));
    if (hit) return hit;
    if (/spicy|매운|매콤/.test(p)) return RECIPES.find((r) => r.name === "Arrabbiata");
    if (/cream|크림/.test(p)) return RECIPES.find((r) => r.name === "Carbonara");
    if (/cheese|치즈/.test(p)) return RECIPES.find((r) => r.name === "Cacio e Pepe");
    if (/tomato|토마토/.test(p)) return RECIPES.find((r) => r.name === "Pomodoro");
  }
  return RECIPES[0];
}

function format(r) {
  return [
    `🍝 ${r.name} (${r.minutes}분)`,
    `재료: ${r.ingredients.join(", ")}`,
    `만들기:`,
    ...r.steps.map((s, i) => `  ${i + 1}. ${s}`),
  ].join("\n");
}

const server = new McpServer({ name: "spagetti", version: "1.0.0" });

server.registerTool(
  "recommend_spaghetti_recipe",
  {
    title: "Recommend a spaghetti recipe",
    description: "선호(spicy/매운, creamy/크림, cheese/치즈, tomato/토마토, simple 등)에 맞는 스파게티 레시피 1개를 추천한다.",
    inputSchema: { preferences: z.string().optional() },
  },
  async ({ preferences }) => ({
    content: [{ type: "text", text: format(recommend(preferences)) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("spagetti MCP server running on stdio");
