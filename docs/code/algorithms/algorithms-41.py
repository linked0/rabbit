# 커널 바이패스와 zero-copy — io_uring 의 핵심 아이디어(제출 큐 SQ / 완료 큐 CQ 를 유저-커널이 공유)를 순수 파이썬으로 흉내낸다.
# 진짜 io_uring 은 시스템 콜 없이 링 버퍼만으로 요청/완료를 주고받지만, 여기서는 그 인터페이스 모양만 재현한다.

from collections import deque

class TinyIoUring:
    def __init__(self):
        self.submission_queue = deque()   # SQ: 유저가 써넣고 커널이 소비
        self.completion_queue = deque()   # CQ: 커널이 써넣고 유저가 소비
        self._next_id = 0

    def submit(self, op, payload):
        """유저 공간: 요청을 SQ 에 밀어넣는다 — 요청마다 시스템 콜을 하지 않고 큐에만 쌓는다."""
        req_id = self._next_id
        self._next_id += 1
        self.submission_queue.append((req_id, op, payload))
        return req_id

    def kernel_process_batch(self):
        """커널 쪽 처리를 흉내: SQ 에 쌓인 요청을 한 번에(배치로) 처리해 CQ 에 완료를 채운다.
        여기서 핵심은 요청 N개를 시스템 콜 1번(=이 함수 호출 1번)으로 끝낸다는 것 — zero-copy 의 핵심도
        '경계를 넘는 횟수'와 '복사 횟수'를 줄이는 데 있다."""
        processed = 0
        while self.submission_queue:
            req_id, op, payload = self.submission_queue.popleft()
            if op == "read":
                result = f"data({payload})"      # 실제로는 유저 버퍼로 직접 DMA 되어 복사가 생략됨
            elif op == "write":
                result = f"written:{len(payload)}bytes"
            else:
                result = None
            self.completion_queue.append((req_id, result))
            processed += 1
        return processed

    def reap_completions(self):
        """유저 공간: CQ 에서 완료된 결과를 꺼낸다 — 이것도 시스템 콜 없이 공유 메모리 읽기만으로 끝난다."""
        out = []
        while self.completion_queue:
            out.append(self.completion_queue.popleft())
        return out

ring = TinyIoUring()

# 전통적 블로킹 I/O 라면 read() 5번 = 시스템 콜 5번이지만, 여기서는 SQ 에 5개를 한꺼번에 밀어넣는다.
req_ids = [ring.submit("read", f"/file{i}") for i in range(5)]
req_ids.append(ring.submit("write", "payload-bytes"))

requests_processed = ring.kernel_process_batch()   # 이 함수 호출 자체가 "시스템 콜 1회"에 대응한다
enter_syscalls = 1                                  # io_uring_enter() 를 딱 한 번만 부른 셈
completions = ring.reap_completions()

print("submitted requests:", len(req_ids))
print("requests completed in this batch:", requests_processed)
print("io_uring_enter() calls needed:", enter_syscalls,
      f"-> 전통적 blocking read/write였다면 {len(req_ids)}번의 시스템 콜이 필요했다")
print("completions:", completions)
