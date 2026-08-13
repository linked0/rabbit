# 브랜치 예측·프리페치·데이터 지향 설계 — AoS(객체 배열) vs SoA(필드별 배열)로 캐시 활용률이 어떻게 달라지는지 구조로 보여준다.
# SoA 는 "합계를 구할 필드"만 연속 메모리로 붙어 있어, 프리페처가 stride 패턴을 예측하기 쉽고 캐시 라인 낭비가 적다.

class Particle:
    __slots__ = ("x", "y", "hp", "team")
    def __init__(self, x, y, hp, team):
        self.x, self.y, self.hp, self.team = x, y, hp, team

# AoS: 객체 배열 — hp 만 훑어도 x, y, team 까지 같은 캐시 라인에 끌려 들어와 낭비된다.
aos = [Particle(x=i, y=i * 2, hp=100 - i, team=i % 2) for i in range(8)]

def sum_hp_aos(particles):
    return sum(p.hp for p in particles)  # 접근 패턴: 객체마다 점프하며 hp 필드만 뽑아씀 (포인터 추적에 가까움)

# SoA: 필드별 배열 — hp 만 쓰는 질의는 hp 배열 하나만 순차로 읽으면 끝난다(=예측 가능한 stride 접근).
soa = {
    "x": [i for i in range(8)],
    "y": [i * 2 for i in range(8)],
    "hp": [100 - i for i in range(8)],
    "team": [i % 2 for i in range(8)],
}

def sum_hp_soa(fields):
    return sum(fields["hp"])  # 접근 패턴: 연속 배열 순차 스캔 (하드웨어 프리페처가 가장 좋아하는 패턴)

# 조건부 분기 없이 마스크 곱으로 team==0 인 hp 합만 뽑는 예 — 분기 예측 실패를 아예 피하는 기법의 축소판.
def sum_hp_team0_branchless(fields):
    return sum(hp * (1 - team) for hp, team in zip(fields["hp"], fields["team"]))

aos_total = sum_hp_aos(aos)
soa_total = sum_hp_soa(soa)
team0_total = sum_hp_team0_branchless(soa)

print("AoS sum(hp):", aos_total)
print("SoA sum(hp):", soa_total, " <- 같은 결과, 다만 hp 배열만 순차 접근하면 됨")
print("결과 일치:", aos_total == soa_total)
print("branchless sum(hp) where team==0:", team0_total)
