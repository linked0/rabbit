로컬에서 테스트하는 가장 확실한 방법은 (1) Redis를 띄우고 (2) 워커 여러 개가 같은 락을 동시에 노리는 스크립트를 돌려 "딱 하나만 이긴다"를 보는 거예요. 둘 다 준비해 드릴게요.

*EN: The surest way to test this locally is to (1) start Redis and (2) run a script where several workers race for the same lock, so you can see "only one wins." I'll set up both.*

**1) Redis 띄우기 (둘 중 하나)**

*EN: Start Redis (pick one):*

```bash
# Docker
docker run --rm -p 6379:6379 -d --name redistest redis:7
# 또는 Homebrew
brew install redis && redis-server     # 포그라운드 실행
```

**2) redis-cli로 30초 만에 손맛 보기 (코드 없이)**

*EN: A 30-second manual feel with redis-cli (no code):*

```bash
docker exec redistest redis-cli SET lock:settle:42 workerA NX PX 30000   # → OK   (락 획득)
docker exec redistest redis-cli SET lock:settle:42 workerB NX PX 30000   # → (nil) 다른 워커는 실패
docker exec redistest redis-cli GET lock:settle:42                        # → "workerA"
# 안전 해제: 내 토큰일 때만 DEL (Lua)
docker exec redistest redis-cli EVAL "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:settle:42 workerA
```

`NX`(없을 때만) 덕분에 두 번째 `SET`이 `nil`로 떨어지는 게 핵심이에요.

*EN: The key point is that thanks to `NX` (set only if absent), the second `SET` returns `nil`.*

**3) 동시성까지 진짜로 검증하는 스크립트** — 워커 5개가 동시에 같은 락을 노리게 해서 "1개만 정산 실행"을 확인합니다. 폴더에 저장해뒀어요.

*EN: A script that truly tests concurrency — 5 workers racing for the same lock to confirm "only one runs settle." Saved to your folder.*실행:

*EN: To run it:*

```bash
npm i ioredis
node examples/redis-lock-test.mjs
```

기대 출력은 워커 5개 중 **1개만 "✅ 락 획득 → settle 실행"** 이고 나머지 4개는 "⛔ skip", 그리고 `settle 실행 횟수 = 1 → ✅ PASS`. 2라운드에서는 락이 해제됐으니 새 워커가 다시 획득합니다.

*EN: Expected output: of the 5 workers, only one shows "✅ acquired → run settle" and the other four "⛔ skip," with `settle runs = 1 → ✅ PASS`. In round 2, since the lock was released, a new worker acquires it again.*

세 가지만 눈여겨보세요: `NX`가 동시 획득을 막고(1개만 성공), `PX 30000`이 워커가 죽어도 30초 뒤 자동 해제(데드락 방지)하며, Lua 해제가 *내 토큰일 때만* DEL해서 "내 락이 만료된 뒤 다른 워커가 잡은 락을 내가 실수로 지우는" 사고를 막습니다.

*EN: Watch three things: `NX` prevents concurrent acquisition (only one succeeds), `PX 30000` auto-releases after 30s even if a worker dies (deadlock safety), and the Lua release deletes only when the token is yours — preventing the bug where, after your lock expired, you accidentally delete a lock another worker now holds.*

한 가지 덧붙이면: 이 단일 인스턴스 방식은 로컬·소규모엔 충분하지만, Redis가 여러 노드로 HA 구성되면 페일오버 순간 락 안전성이 깨질 수 있어요. 그 경우엔 **Redlock** 알고리즘(여러 독립 Redis에 과반 획득)을 씁니다. 원하시면 Redlock 버전 예제도 만들어 드릴게요.

*EN: One note: this single-instance approach is fine for local/small scale, but if Redis is run as a multi-node HA setup, lock safety can break during failover. For that, use the Redlock algorithm (acquire a majority across several independent Redis nodes). I can provide a Redlock version if you'd like.*