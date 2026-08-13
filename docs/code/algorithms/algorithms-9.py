# Day 9: 문자열 인덱스 — 서픽스 배열로 부분 문자열 검색을 이분 탐색으로 처리
# 모든 접미사를 정렬해 배열로 두면, 패턴 검색이 선형 스캔 대신 O(log n · m)에 끝난다.

def build_suffix_array(text):
    return sorted(range(len(text)), key=lambda i: text[i:])

def search(text, sa, pattern):
    lo, hi = 0, len(sa)
    while lo < hi:
        mid = (lo + hi) // 2
        if text[sa[mid]:sa[mid] + len(pattern)] < pattern:
            lo = mid + 1
        else:
            hi = mid
    if lo == len(sa) or text[sa[lo]:sa[lo] + len(pattern)] != pattern:
        return []
    hits, i = [sa[lo]], lo + 1
    while i < len(sa) and text[sa[i]:sa[i] + len(pattern)] == pattern:
        hits.append(sa[i]); i += 1
    return sorted(hits)

text = "the quick brown fox jumps over the lazy dog the fox runs"
sa = build_suffix_array(text)
print("서픽스 배열(앞 10개 시작 위치) =", sa[:10])
for pattern in ["fox", "the", "cat"]:
    print(f"search('{pattern}') -> 위치 {search(text, sa, pattern)}")
