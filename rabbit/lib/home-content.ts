// Task 5 — www.jaylabs.xyz 홈 콘텐츠 (linked0.github.io 일회성 미러)
// 설계: docs/tasks/jun-19-rabbit-design.md — Task 5. 원문 전체는 sourceUrl 참고.

export const PROFILE = {
  name: "Hyunjae Lee",
  tagline:
    "Smart contract development, blockchain infrastructure, and smart contract security — with a strong focus on technical depth.",
  email: "linked0@gmail.com",
  links: [
    { label: "GitHub", url: "https://github.com/linked0" },
    { label: "Source site", url: "https://linked0.github.io/" },
  ],
};

export type HomeProject = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  description: string;
  sourceUrl: string;
};

export const PROJECTS: HomeProject[] = [
  {
    slug: "bosagora-mainnet",
    title: "Bosagora Mainnet",
    date: "2019-08-31",
    readTime: "2 min",
    description: "Blockchain network using Federated Byzantine Agreement consensus.",
    sourceUrl: "https://linked0.github.io/bosagora-mainnet/",
  },
  {
    slug: "evm-bosagora",
    title: "EVM based Bosagora Mainnet",
    date: "2021-03-31",
    readTime: "2 min",
    description: "EVM-based blockchain network development.",
    sourceUrl: "https://linked0.github.io/evm-bosagora/",
  },
  {
    slug: "votera",
    title: "DAO Governance (Votera)",
    date: "2022-04-30",
    readTime: "2 min",
    description: "Decentralized governance system.",
    sourceUrl: "https://linked0.github.io/votera/",
  },
  {
    slug: "boaspace",
    title: "NFT Marketplace (BoaSpace)",
    date: "2022-09-30",
    readTime: "2 min",
    description: "NFT marketplace platform.",
    sourceUrl: "https://linked0.github.io/boaspace/",
  },
  {
    slug: "uniswap-v2-hardhat",
    title: "Uniswap V2 to Hardhat",
    date: "2023-12-31",
    readTime: "2 min",
    description: "Smart contract analysis and Hardhat migration.",
    sourceUrl: "https://linked0.github.io/uniswap-v2-hardhat/",
  },
  {
    slug: "smart-contract-hacking",
    title: "Smart Contract Hacking",
    date: "2024-05-31",
    readTime: "1 min",
    description: "Security exercises with solutions.",
    sourceUrl: "https://linked0.github.io/smart-contract-hacking-copy/",
  },
  {
    slug: "zksync",
    title: "zkSync L2 Layer",
    date: "2024-05-31",
    readTime: "2 min",
    description: "Layer 2 testing and analysis.",
    sourceUrl: "https://linked0.github.io/zksync/",
  },
];

export function findProject(slug: string): HomeProject | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
