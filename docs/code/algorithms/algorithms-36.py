# 메모리 모델과 원자성 순서 — release/acquire 페어링이 만드는 happens-before 관계를 흉내낸다.
# (Python 은 GIL 때문에 진짜 하드웨어 재배열은 안 보이지만, release-store -> acquire-load 짝짓기 패턴 자체는 동일하다.)

import threading

data = 0
ready = threading.Event()  # release/acquire 짝을 흉내내는 신호: set()=release, wait()=acquire
observations = []

def writer():
    global data
    data = 42                 # release 이전의 모든 쓰기는...
    ready.set()                # ...release. 이 시점 이후 acquire 한 쪽에는 반드시 42가 보여야 한다.

def reader():
    ready.wait()               # acquire: release 이전의 모든 쓰기가 happens-before 로 보장되어 보인다.
    observations.append(data)  # 만약 순서 보장이 없었다면(relaxed) 0을 볼 수도 있었다.

# seq_cst 라면 여기에 더해 "모든 스레드가 동의하는 단일 전역 순서"까지 보장하지만, 비용이 가장 크다.
runs_correct = 0
for _ in range(1000):
    data = 0
    ready.clear()
    t_r = threading.Thread(target=reader)
    t_w = threading.Thread(target=writer)
    t_r.start(); t_w.start()
    t_r.join(); t_w.join()
    if observations[-1] == 42:
        runs_correct += 1

print("total runs:", len(observations))
print("runs where acquire correctly saw release's write:", runs_correct)
print("release/acquire happens-before held every time:", runs_correct == len(observations))
