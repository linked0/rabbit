# WASM 실행 모델과 샌드박싱 경계 — 선형 메모리에 경계 검사를 강제하고, 벗어나면 트랩을 내며,
# import 목록에 없는 호스트 함수는 절대 호출할 수 없게 한다.

class Trap(Exception):
    pass

class WasmModule:
    def __init__(self, memory_pages=1, page_size=65536, imports=None):
        self.memory = bytearray(memory_pages * page_size)
        self.imports = imports or {}        # 명시적으로 허용된 호스트 함수만 호출 가능

    def load(self, addr, size=4):
        if addr < 0 or addr + size > len(self.memory):
            raise Trap(f"out-of-bounds load @ {addr} (memory size={len(self.memory)})")
        return int.from_bytes(self.memory[addr:addr + size], "little")

    def store(self, addr, value, size=4):
        if addr < 0 or addr + size > len(self.memory):
            raise Trap(f"out-of-bounds store @ {addr} (memory size={len(self.memory)})")
        self.memory[addr:addr + size] = int(value).to_bytes(size, "little")

    def call_import(self, name, *args):
        if name not in self.imports:         # import 목록 밖은 바깥세상에 절대 닿지 못함
            raise Trap(f"unauthorized host call: {name}")
        return self.imports[name](*args)

mod = WasmModule(memory_pages=1, imports={"log": lambda x: f"host-logged({x})"})

mod.store(0, 42)
print("정상 store/load:", mod.load(0))
print("허용된 import 호출:", mod.call_import("log", 42))

for addr in (len(mod.memory) - 2, -1):
    try:
        mod.load(addr, size=4)
        print(f"addr={addr}: 트랩 없이 통과 (버그)")
    except Trap as e:
        print(f"addr={addr}: 트랩 발생 -> {e}")

try:
    mod.call_import("read_file", "/etc/passwd")
except Trap as e:
    print(f"미허용 import 호출 차단: {e}")
