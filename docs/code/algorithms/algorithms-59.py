# Casper FFG + LMD-GHOST — 체크포인트가 스테이크 2/3 이상의 지지를 받으면 justified,
# 연속된 justification이 성립하면 finalized. finalize 전 구간에서만 reorg가 일어난다.

class Checkpoint:
    def __init__(self, epoch, parent=None):
        self.epoch = epoch
        self.parent = parent
        self.justified = False
        self.finalized = False

def cast_votes(checkpoint, stake_fraction_voting):
    """스테이크의 stake_fraction_voting 만큼이 이 체크포인트로의 링크에 투표"""
    checkpoint.justified = stake_fraction_voting >= (2 / 3)
    if checkpoint.justified and checkpoint.parent and checkpoint.parent.justified:
        # 부모도 justified고, 부모->자신 링크가 justified면 부모가 finalized 됨
        checkpoint.parent.finalized = True

genesis = Checkpoint(0)
genesis.justified = True  # genesis는 항상 justified로 취급

epoch1 = Checkpoint(1, parent=genesis)
epoch2 = Checkpoint(2, parent=epoch1)
epoch3 = Checkpoint(3, parent=epoch2)

# 정상 케이스: 매 에포크 2/3 이상 투표
cast_votes(epoch1, stake_fraction_voting=0.90)
cast_votes(epoch2, stake_fraction_voting=0.85)

print("정상 진행:")
for cp in [genesis, epoch1, epoch2]:
    print(f"  epoch {cp.epoch}: justified={cp.justified}, finalized={cp.finalized}")

# 문제 케이스: epoch3는 네트워크 지연으로 2/3 미달 -> justified 실패
cast_votes(epoch3, stake_fraction_voting=0.55)
print(f"\nepoch 3: justified={epoch3.justified}, finalized={epoch3.finalized} "
      f"(2/3 미달 -> 아직 확정 안 됨, 이 구간은 reorg 가능)")

# LMD-GHOST 헤드 선택: justified 여부와 무관하게 최근 투표 가중치가 큰 서브트리를 따라간다
votes_on_epoch2_children = {"blockA(epoch3)": 0.55, "blockB(epoch3, competing)": 0.30}
head = max(votes_on_epoch2_children, key=votes_on_epoch2_children.get)
print(f"\nLMD-GHOST 헤드 선택 (epoch2 이후 미확정 구간): "
      f"{votes_on_epoch2_children} -> head = {head}")
print("-> finalized 체크포인트(epoch1, epoch2)는 슬래싱 없이는 뒤집을 수 없지만,")
print("   미확정 헤드는 투표 가중치가 바뀌면 자연스럽게 reorg 될 수 있다.")
