"""
Day 4/50 — 토크나이저 & 임베딩 테스트 / Tokenizer & Embedding tests.

main.py 의 세 가지 동작을 검증한다 / Verifies the three pieces of main.py:
  1. tokenize()         — BPE 토큰화 (tiktoken, 로컬·결정적 / local, deterministic)
  2. cosine_similarity() — 순수 수학 (네트워크 불필요 / pure math, no network)
  3. get_embedding()     — Ollama 임베딩 (mock 단위 + 실서버 통합 / mocked + live)

Run:
    cd /Users/jay/work/task/ai/tokenizer-embedding
    uv run pytest -v                  # 전체 / all (live embedding auto-skips if Ollama down)
    uv run pytest -v -m "not ollama"  # 네트워크 없이 / offline-only
"""
import math
import socket

import pytest

import main


# ──────────────────────────────────────────────────────────────
# 1. Tokenization — tiktoken BPE (deterministic, no network)
# ──────────────────────────────────────────────────────────────
class TestTokenize:
    def test_returns_count_and_tokens(self):
        out = main.tokenize("Hello")
        assert set(out) == {"tokens", "count"}
        assert all(isinstance(t, int) for t in out["tokens"])

    @pytest.mark.parametrize("text", ["Hello", "blockchain", "예측시장", "0xDEADBEEF", ""])
    def test_count_matches_token_list_length(self, text):
        out = main.tokenize(text)
        assert out["count"] == len(out["tokens"])

    def test_empty_string_is_zero_tokens(self):
        assert main.tokenize("")["count"] == 0

    def test_common_english_word_is_few_tokens(self):
        # 흔한 단어는 1~2 토큰 / common word → 1–2 BPE tokens
        assert main.tokenize("blockchain")["count"] <= 2

    def test_roundtrip_decode_is_lossless(self):
        # cl100k_base 는 무손실: decode(encode(s)) == s
        s = "Verex 예측시장 0xDEADBEEF"
        ids = main.tokenize(s)["tokens"]
        assert main._enc.decode(ids) == s

    def test_korean_costs_more_than_english_same_meaning(self):
        # Day-4 핵심: 한국어 프롬프트가 토큰을 더 먹는다
        ko = main.tokenize("예측시장")["count"]
        en = main.tokenize("prediction market")["count"]
        assert ko > en

    def test_eth_address_fragments_heavily(self):
        # 온체인 데이터(주소)는 BPE에서 조각화 심함 → 토큰 낭비
        addr = "0x742d35Cc6634C0532925a3b8D4C9C0fb2D8c0e2"
        assert main.tokenize(addr)["count"] >= 10


# ──────────────────────────────────────────────────────────────
# 2. Cosine similarity — pure math (no network)
# ──────────────────────────────────────────────────────────────
class TestCosineSimilarity:
    def test_identical_vectors_is_one(self):
        v = [1.0, 2.0, 3.0]
        assert main.cosine_similarity(v, v) == pytest.approx(1.0)

    def test_orthogonal_vectors_is_zero(self):
        assert main.cosine_similarity([1, 0], [0, 1]) == pytest.approx(0.0)

    def test_opposite_vectors_is_minus_one(self):
        assert main.cosine_similarity([1, 2, 3], [-1, -2, -3]) == pytest.approx(-1.0)

    def test_forty_five_degrees(self):
        # (1,0) 과 (1,1) 사이 각 45° → cos = 1/√2
        assert main.cosine_similarity([1, 0], [1, 1]) == pytest.approx(1 / math.sqrt(2))

    def test_scale_invariant(self):
        # 방향 같고 크기만 다르면 유사도 1.0 / same direction → 1.0
        assert main.cosine_similarity([1, 2, 3], [2, 4, 6]) == pytest.approx(1.0)


# ──────────────────────────────────────────────────────────────
# 3. Embedding — mocked unit tests (no network)
# ──────────────────────────────────────────────────────────────
class TestEmbeddingMocked:
    def test_parses_embedding_from_response(self, monkeypatch):
        monkeypatch.setattr(main, "_post", lambda ep, payload: {"embedding": [0.1, 0.2, 0.3]})
        assert main.get_embedding("anything") == [0.1, 0.2, 0.3]

    def test_sends_correct_endpoint_and_payload(self, monkeypatch):
        captured = {}

        def fake_post(endpoint, payload):
            captured["endpoint"], captured["payload"] = endpoint, payload
            return {"embedding": [0.0]}

        monkeypatch.setattr(main, "_post", fake_post)
        main.get_embedding("hi", model="nomic-embed-text")
        assert captured["endpoint"] == "/api/embeddings"
        assert captured["payload"] == {"model": "nomic-embed-text", "prompt": "hi"}


# ──────────────────────────────────────────────────────────────
# 4. Embedding — live Ollama integration (auto-skips if server down)
# ──────────────────────────────────────────────────────────────
def _embeddings_ready(host: str = "localhost", port: int = 11434) -> bool:
    """True only if Ollama is up AND the embed model actually answers.

    Socket-open alone isn't enough: if the server is up but the model isn't
    pulled, the request errors — that should *skip* these tests, not fail them.
    """
    try:
        with socket.create_connection((host, port), timeout=0.5):
            pass
    except OSError:
        return False
    try:
        return len(main.get_embedding("ping")) > 0
    except Exception:
        return False  # server up but model missing / API error → skip


@pytest.mark.ollama
@pytest.mark.skipif(
    not _embeddings_ready(),
    reason="Ollama embed model not available on :11434 (try: ollama pull nomic-embed-text)",
)
class TestEmbeddingLive:
    def test_embedding_dimension_is_768(self):
        assert len(main.get_embedding("prediction market")) == 768

    def test_related_more_similar_than_unrelated(self):
        pm = main.get_embedding("prediction market")
        related = main.cosine_similarity(pm, main.get_embedding("betting platform"))
        unrelated = main.cosine_similarity(pm, main.get_embedding("banana bread recipe"))
        assert related > unrelated
