# 프루닝·아카이브·스냅 싱크 — 오래된 상태 트라이를 지운 프루닝 노드와 전부 보관한 아카이브 노드의 조회 가능 범위 차이.
# 프루닝 노드는 지운 과거 블록의 상태를 조회할 때 "missing trie node"에 해당하는 오류를 낸다.

class ChainState:
    def __init__(self):
        self.history = {}   # block_number -> {account: balance}

    def commit_block(self, block_number, state):
        self.history[block_number] = dict(state)

class PrunedNode:
    def __init__(self, chain, keep_last=3):
        self.chain = chain
        self.keep_last = keep_last

    def get_balance(self, block_number, account):
        latest = max(self.chain.history)
        if block_number < latest - self.keep_last + 1:
            raise LookupError(f"missing trie node: block {block_number} state pruned")
        return self.chain.history[block_number].get(account)

class ArchiveNode:
    def __init__(self, chain):
        self.chain = chain

    def get_balance(self, block_number, account):
        return self.chain.history[block_number].get(account)  # 모든 과거 상태 보존

chain = ChainState()
balance = 1000
for block in range(10):
    balance += 10
    chain.commit_block(block, {"alice": balance})

pruned = PrunedNode(chain, keep_last=3)
archive = ArchiveNode(chain)

print("최신 블록(9) 잔고 - pruned:", pruned.get_balance(9, "alice"), "/ archive:", archive.get_balance(9, "alice"))

try:
    pruned.get_balance(2, "alice")
except LookupError as e:
    print("오래된 블록(2) 조회 - pruned 노드:", e)

print("오래된 블록(2) 조회 - archive 노드:", archive.get_balance(2, "alice"))

def snap_sync(chain, latest_block):
    # 실제로는 range proof 검증이 들어가지만, 여기선 "최신 상태 스냅샷만 받는다"는 특성만 재현
    return dict(chain.history[latest_block])

synced_state = snap_sync(chain, latest_block=9)
print("snap sync로 받은 상태(최신만):", synced_state, "— 과거 블록 상태는 없음")
