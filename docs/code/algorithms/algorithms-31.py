# 메모리 할당자 설계 — jemalloc/mimalloc 아이디어: size class segregated free list + 스레드 로컬 캐시(tcache).
# 요청 크기를 몇 개의 size class 로 반올림해 같은 클래스끼리 free list 로 묶으면, 할당/해제가 O(1) 에 가까워진다.

SIZE_CLASSES = [8, 16, 32, 64, 128, 256]

def size_class_for(n):
    for c in SIZE_CLASSES:
        if n <= c:
            return c
    raise ValueError("too large for this toy allocator")

class TinyAllocator:
    def __init__(self):
        # 클래스별 free list (한 번 반환된 블록은 재사용) — jemalloc 의 segregated free list 흉내.
        self.free_lists = {c: [] for c in SIZE_CLASSES}
        self.next_addr = 0
        self.live = {}  # addr -> size_class (누가 뭘 들고 있는지 추적)

    def alloc(self, n):
        c = size_class_for(n)
        if self.free_lists[c]:
            addr = self.free_lists[c].pop()   # 스레드 로컬 캐시 hit 에 해당 — 락 없이 즉시 재사용
        else:
            addr = self.next_addr
            self.next_addr += c                # 새 청크는 size class 단위로만 늘어남(내부 단편화로 흡수)
        self.live[addr] = c
        return addr

    def free(self, addr):
        c = self.live.pop(addr)
        self.free_lists[c].append(addr)        # OS 에 즉시 반환하지 않고 재사용 대기열에 둔다(decay 정책 흉내)

alloc = TinyAllocator()
a = alloc.alloc(10)   # 10 -> class 16
b = alloc.alloc(60)   # 60 -> class 64
alloc.free(a)
c = alloc.alloc(15)   # 같은 class 16 free list 를 즉시 재사용 → 새 청크를 늘리지 않음

print("a addr:", a, "class:", alloc.live.get(a))
print("b addr:", b, "class:", alloc.live[b])
print("c addr:", c, "reused a's slot:", c == a)
print("free list state:", {k: v for k, v in alloc.free_lists.items() if v or k in (16, 64)})
print("total bytes carved from OS:", alloc.next_addr)
