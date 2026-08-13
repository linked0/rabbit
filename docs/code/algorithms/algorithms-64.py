# 시퀀서 분산화와 강제 포함(force inclusion) — 시퀀서가 검열해도 L1 inbox를 거치면 지연 창 이후 반드시 포함된다.
# 시퀀서가 특정 발신자를 계속 배제해도, 지연 창(DELAY)이 지난 forced tx는 다음 블록에 강제로 실린다.

DELAY = 3  # 강제 포함까지 걸리는 블록 수

class Sequencer:
    def __init__(self, censored_sender):
        self.censored_sender = censored_sender
        self.included = []

    def build_block(self, block_num, mempool, forced_inbox):
        already = {id(tx) for tx in self.included}
        # 강제 포함 마감이 지난 tx는 검열 여부와 무관하게 반드시 포함해야 유효한 블록이다
        due = [tx for tx in forced_inbox if block_num - tx["submitted_at"] >= DELAY and id(tx) not in already]
        censorable = [tx for tx in mempool if tx["sender"] != self.censored_sender and id(tx) not in already]
        block = due + [tx for tx in censorable if id(tx) not in {id(t) for t in due}]
        self.included.extend(block)
        return block

alice_tx = {"sender": "alice", "tx": "swap", "submitted_at": 0}
mempool = [alice_tx]
forced_inbox = [alice_tx]  # alice가 시퀀서 mempool과 L1 inbox에 동시 제출

seq = Sequencer(censored_sender="alice")
for block_num in range(6):
    block = seq.build_block(block_num, mempool, forced_inbox)
    status = [tx["sender"] for tx in block] if block else "(empty, 시퀀서가 검열 중)"
    print(f"블록 {block_num}: 포함된 tx = {status}")
    if block:
        break

print(f"\n시퀀서가 alice를 계속 배제했지만, 지연 창({DELAY}블록) 이후 강제 포함으로 결국 실렸다:", bool(seq.included))
