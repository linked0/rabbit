# GC 심화 — 삼색(white/gray/black) 증분 마크 앤 스윕을 구현하고, 쓰기 배리어로 삼색 불변식을 지킨다.

class Obj:
    def __init__(self, name):
        self.name = name
        self.refs = []
        self.color = "white"

class IncrementalGC:
    def __init__(self, roots):
        self.gray = list(roots)
        for r in roots:
            r.color = "gray"

    def write_barrier(self, holder, new_ref):
        # 검은 객체가 흰 객체를 새로 가리키면, 흰 객체를 회색으로 되돌려 재방문시킨다
        holder.refs.append(new_ref)
        if holder.color == "black" and new_ref.color == "white":
            new_ref.color = "gray"
            self.gray.append(new_ref)

    def mark_step(self, budget=1):
        # 한 번에 budget개만 처리 — "멈추고 전부"가 아니라 조금씩 진행(증분 마킹)
        steps = 0
        while self.gray and steps < budget:
            obj = self.gray.pop()
            for r in obj.refs:
                if r.color == "white":
                    r.color = "gray"
                    self.gray.append(r)
            obj.color = "black"
            steps += 1

    def sweep(self, all_objs):
        return [o for o in all_objs if o.color != "white"]  # white == 도달 불가 -> 회수 대상

a, b, c, d = Obj("a"), Obj("b"), Obj("c"), Obj("d")
a.refs = [b]
b.refs = [c]
all_objs = [a, b, c, d]     # d는 아무도 참조하지 않는 쓰레기

gc = IncrementalGC(roots=[a])
while gc.gray:
    gc.mark_step(budget=1)  # 애플리케이션과 번갈아 실행된다고 가정 (증분 마킹 흉내)

# 마킹이 끝난 뒤, 이미 black인 a가 새 객체 e를 가리키게 되는 상황을 시뮬레이션
e = Obj("e")
all_objs.append(e)
gc.write_barrier(a, e)      # 쓰기 배리어가 e를 gray로 되돌려 재방문 대상에 넣어야 함
while gc.gray:
    gc.mark_step(budget=1)

survivors = gc.sweep(all_objs)
print("생존(black):", [o.name for o in survivors])
print("회수 대상(white, 도달 불가):", [o.name for o in all_objs if o.color == "white"])
assert d.color == "white" and e.color == "black"
