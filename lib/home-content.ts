// 홈(프로필) 콘텐츠 — linked0.github.io 미러.
// 프로필/프로젝트 메타는 여기서, 본문은 content/profile/, 이미지는 public/profile/.
// ko/en 병기 — 홈 페이지에서 언어 선택(pick)에 맞춰 표시. Ko 미지정 시 영어로 폴백.

export const PROFILE = {
  name: "Hyunjae Lee",
  // _config.yml: title
  heading: "Hello, world! I'm Hyunjae Lee",
  headingKo: "안녕하세요, 이현재입니다",
  // _config.yml: about-author
  tagline:
    "I specialize in smart contract development, blockchain infrastructure, and smart contract security — with a strong focus on technical depth. I've personally built an L1 blockchain engine from scratch, and have hands-on, end-to-end experience building DAO governance, NFT marketplace, and prediction market platforms.",
  taglineKo:
    "스마트 컨트랙트 개발, 블록체인 인프라, 스마트 컨트랙트 보안을 전문으로 하며, 기술적 깊이에 강점을 두고 있습니다. L1 블록체인 엔진을 직접 구현했고, DAO 거버넌스, NFT 마켓플레이스, 예측 시장까지 다양한 온체인 서비스를 처음부터 끝까지 만들어봤습니다.",
  photo: "/profile/hyunjae-lee.jpeg",
  email: "linked0@me.com",
  // handle — 홈 프로필의 연락 줄에 플랫폼 이름 대신 표시되는 값 (2026-08-06).
  // 마크가 이미 "어느 플랫폼인지"를 말하므로, 글자는 "거기서 그가 누구인지"를 말하는 게 낫다.
  // "GitHub / LinkedIn"은 모든 포트폴리오가 똑같이 적는 말이고, 핸들은 그 사람의 것이다.
  links: [
    { label: "GitHub", handle: "linked0", url: "https://github.com/linked0" },
    { label: "LinkedIn", handle: "feelsogood", url: "https://www.linkedin.com/in/feelsogood/" },
  ],
};

export type HomeProject = {
  slug: string;
  title: string;
  titleKo?: string;
  date: string;
  readTime: string;
  description: string;
  descriptionKo?: string;
  img: string; // public/profile/ 경로
  sourceUrl: string;
  liveUrl?: string; // 실제 운영(MVP) 사이트 — 있으면 상세 페이지에 링크 표시
  whitepaper?: { en: string; ko: string }; // 언어별 백서 경로 — 있으면 상세 페이지에 링크 표시
};

// 순서·날짜는 linked0.github.io _posts 기준 (최신이 위로 오도록 페이지에서 정렬).
export const PROJECTS: HomeProject[] = [
  {
    slug: "prediction-market",
    title: "Prediction Market (Nostra)",
    titleKo: "Prediction Market 개발",
    date: "2025-08-01",
    readTime: "2 min",
    description:
      "A Polymarket-style decentralized prediction market — sole developer, end-to-end (full-stack).",
    descriptionKo: "Polymarket 스타일의 탈중앙화 예측 시장 — 단독 설계·개발·운영(풀스택).",
    img: "/profile/prediction-market.svg",
    sourceUrl: "https://nostra-web-55509409482.asia-northeast3.run.app/",
    liveUrl: "https://nostra-web-55509409482.asia-northeast3.run.app/",
    whitepaper: { en: "/whitepaper/index.html", ko: "/whitepaper/ko.html" },
  },
  {
    slug: "bosagora-mainnet",
    title: "Bosagora Mainnet",
    titleKo: "Bosagora 메인넷",
    date: "2019-09-01",
    readTime: "2 min",
    description:
      "Blockchain network based on the Federated Byzantine Agreement (FBA) consensus model.",
    descriptionKo: "FBA(연합 비잔틴 합의) 모델 기반의 블록체인 네트워크.",
    img: "/profile/bosagora-title.png",
    sourceUrl: "https://linked0.github.io/bosagora-mainnet/",
  },
  {
    slug: "evm-bosagora",
    title: "EVM based Bosagora Mainnet",
    titleKo: "EVM 기반 Bosagora 메인넷",
    date: "2021-04-01",
    readTime: "2 min",
    description: "EVM-based blockchain network development.",
    descriptionKo: "EVM 기반 블록체인 네트워크 개발.",
    img: "/profile/evm-bosagora-title.png",
    sourceUrl: "https://linked0.github.io/evm-bosagora/",
  },
  {
    slug: "votera",
    title: "DAO Governance (Votera)",
    titleKo: "DAO 거버넌스 (Votera)",
    date: "2022-05-01",
    readTime: "2 min",
    description: "Decentralized governance system.",
    descriptionKo: "탈중앙화 거버넌스 시스템.",
    img: "/profile/votera-title.png",
    sourceUrl: "https://linked0.github.io/votera/",
  },
  {
    slug: "boaspace",
    title: "NFT Marketplace (BoaSpace)",
    titleKo: "NFT 마켓플레이스 (BoaSpace)",
    date: "2022-10-01",
    readTime: "2 min",
    description: "NFT marketplace platform.",
    descriptionKo: "NFT 마켓플레이스 플랫폼.",
    img: "/profile/boaspace-title.png",
    sourceUrl: "https://linked0.github.io/boaspace/",
  },
  {
    slug: "smart-contract-hacking",
    title: "Smart Contract Hacking",
    titleKo: "스마트 컨트랙트 해킹",
    date: "2024-06-01",
    readTime: "1 min",
    description: "Security exercises with solutions.",
    descriptionKo: "풀이가 포함된 보안 연습.",
    img: "/profile/hacking-title.jpeg",
    sourceUrl: "https://linked0.github.io/smart-contract-hacking-copy/",
  },
  {
    slug: "zksync",
    title: "zkSync L2 Layer",
    titleKo: "zkSync L2 레이어",
    date: "2024-06-01",
    readTime: "2 min",
    description: "Layer 2 testing and analysis.",
    descriptionKo: "레이어 2 테스트 및 분석.",
    img: "/profile/zksync-title.png",
    sourceUrl: "https://linked0.github.io/zksync/",
  },
];

export function findProject(slug: string): HomeProject | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
