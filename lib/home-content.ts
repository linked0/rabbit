// 홈(프로필) 콘텐츠 — linked0.github.io 미러.
// 프로필/프로젝트 메타는 여기서, 본문은 content/profile/, 이미지는 public/profile/.

export const PROFILE = {
  name: "Hyunjae Lee",
  // _config.yml: title
  heading: "Hello, world! I'm Hyunjae Lee",
  // _config.yml: about-author
  tagline:
    "I specialize in smart contract development, blockchain infrastructure, and smart contract security — with a strong focus on technical depth.",
  photo: "/profile/hyunjae-lee.jpeg",
  email: "linked0@me.com",
  links: [
    { label: "GitHub", url: "https://github.com/linked0" },
  ],
};

export type HomeProject = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  description: string;
  img: string; // public/profile/ 경로
  sourceUrl: string;
};

// 순서·날짜는 linked0.github.io _posts 기준 (최신이 위로 오도록 페이지에서 정렬).
export const PROJECTS: HomeProject[] = [
  {
    slug: "bosagora-mainnet",
    title: "Bosagora Mainnet",
    date: "2019-09-01",
    readTime: "2 min",
    description:
      "Blockchain network based on the Federated Byzantine Agreement (FBA) consensus model.",
    img: "/profile/bosagora-title.png",
    sourceUrl: "https://linked0.github.io/bosagora-mainnet/",
  },
  {
    slug: "evm-bosagora",
    title: "EVM based Bosagora Mainnet",
    date: "2021-04-01",
    readTime: "2 min",
    description: "EVM-based blockchain network development.",
    img: "/profile/evm-bosagora-title.png",
    sourceUrl: "https://linked0.github.io/evm-bosagora/",
  },
  {
    slug: "votera",
    title: "DAO Governance (Votera)",
    date: "2022-05-01",
    readTime: "2 min",
    description: "Decentralized governance system.",
    img: "/profile/votera-title.png",
    sourceUrl: "https://linked0.github.io/votera/",
  },
  {
    slug: "boaspace",
    title: "NFT Marketplace (BoaSpace)",
    date: "2022-10-01",
    readTime: "2 min",
    description: "NFT marketplace platform.",
    img: "/profile/boaspace-title.png",
    sourceUrl: "https://linked0.github.io/boaspace/",
  },
  {
    slug: "uniswap-v2-hardhat",
    title: "Uniswap V2 to Hardhat",
    date: "2024-01-01",
    readTime: "2 min",
    description: "Smart contract analysis and Hardhat migration.",
    img: "/profile/uniswap-hardhat.png",
    sourceUrl: "https://linked0.github.io/uniswap-v2-hardhat/",
  },
  {
    slug: "smart-contract-hacking",
    title: "Smart Contract Hacking",
    date: "2024-06-01",
    readTime: "1 min",
    description: "Security exercises with solutions.",
    img: "/profile/hacking-title.jpeg",
    sourceUrl: "https://linked0.github.io/smart-contract-hacking-copy/",
  },
  {
    slug: "zksync",
    title: "zkSync L2 Layer",
    date: "2024-06-01",
    readTime: "2 min",
    description: "Layer 2 testing and analysis.",
    img: "/profile/zksync-title.png",
    sourceUrl: "https://linked0.github.io/zksync/",
  },
];

export function findProject(slug: string): HomeProject | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
