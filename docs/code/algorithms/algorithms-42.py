# 이벤트 루프 vs 스레드 vs 액터 모델 — 상태를 액터 안에 가두고 메시지 큐로만 통신하는 최소 액터를 구현한다.
# 공유 메모리가 없으니 락도 필요 없고, 순서 보장은 "한 액터는 메일박스 메시지를 하나씩만 처리한다"에서 나온다.

import threading
import queue

class Actor:
    def __init__(self, name, handle_fn):
        self.name = name
        self.mailbox = queue.Queue()      # 오직 메시지로만 상태에 접근 — 공유 메모리 자체가 없다
        self._handle_fn = handle_fn
        self._state = {}
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def send(self, msg):
        self.mailbox.put(msg)              # 비동기 전송 — 보내는 쪽은 블록되지 않는다

    def _run(self):
        while True:
            msg = self.mailbox.get()        # 메시지를 하나씩만 순차 처리 -> 액터 내부 상태는 절대 경합하지 않음
            if msg is None:                 # 종료 신호
                break
            self._handle_fn(self._state, msg)

    def stop_and_join(self):
        self.send(None)
        self._thread.join()

def counter_handler(state, msg):
    op, payload = msg
    if op == "incr":
        state["value"] = state.get("value", 0) + payload
    elif op == "get":
        reply_queue = payload
        reply_queue.put(state.get("value", 0))   # 결과는 회신용 큐로 되돌려줌 — 여기도 메시지 전달일 뿐

account = Actor("counter", counter_handler)

# 여러 "클라이언트" 가 동시에 메시지를 보내도, 액터 내부 값은 큐를 통해 직렬화되어 안전하다.
def client(n):
    for _ in range(100):
        account.send(("incr", n))

clients = [threading.Thread(target=client, args=(i,)) for i in (1, 2, 3, 4)]
for t in clients:
    t.start()
for t in clients:
    t.join()

reply_queue = queue.Queue()
account.send(("get", reply_queue))
total = reply_queue.get(timeout=5)   # get 메시지가 처리되어 회신이 올 때까지 블로킹 대기(결정론적 동기화)

account.stop_and_join()

expected = (1 + 2 + 3 + 4) * 100
print("expected total:", expected)
print("actor-computed total:", total)
print("no locks used, no data race possible:", total == expected)
