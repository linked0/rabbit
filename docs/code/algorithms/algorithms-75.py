# 인덱싱 파이프라인 설계 — 재생 가능성(replayability) — 동일 입력을 두 번 인덱싱해도 같은 결과가 나오고, reorg 시 롤백·재처리된다.
# 커서(블록번호, 로그인덱스)로 진행 상태를 추적하고 쓰기를 멱등하게 만들어, 중단 후 재시작·재구성이 안전하도록 한다.

def index_blocks(blocks, table=None):
    table = table if table is not None else {}
    for b in blocks:
        for log in b["logs"]:
            key = (b["number"], log["index"])          # 커서 = (블록번호, 로그인덱스) → 자연스러운 멱등 키
            table[key] = {"block_hash": b["hash"], "value": log["value"]}
    return table

def reorg_rollback(table, from_block):
    # 확정되지 않은 구간을 되돌린다: from_block 이상인 항목을 모두 제거
    stale_keys = [k for k in table if k[0] >= from_block]
    for k in stale_keys:
        del table[k]
    return len(stale_keys)

chain_v1 = [
    {"number": 0, "hash": "0xa0", "logs": [{"index": 0, "value": 100}]},
    {"number": 1, "hash": "0xa1", "logs": [{"index": 0, "value": 200}]},
    {"number": 2, "hash": "0xa2", "logs": [{"index": 0, "value": 300}]},
]

table_a = index_blocks(chain_v1)
table_b = index_blocks(chain_v1)   # 같은 구간을 처음부터 다시 인덱싱

print("두 번 인덱싱한 결과가 동일한가:", table_a == table_b)

# 블록 2가 reorg로 다른 해시·값으로 교체되었다고 가정
removed = reorg_rollback(table_a, from_block=2)
chain_v2_block2 = {"number": 2, "hash": "0xb2-reorged", "logs": [{"index": 0, "value": 999}]}
index_blocks([chain_v2_block2], table=table_a)

print(f"reorg 롤백: 블록 2 이상 {removed}개 항목 제거 후 재처리")
print("reorg 이후 블록 2 상태:", table_a[(2, 0)])
print("블록 0,1은 그대로 유지:", table_a[(0, 0)], table_a[(1, 0)])
