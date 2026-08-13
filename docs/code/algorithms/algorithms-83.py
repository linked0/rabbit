# HMAC·AEAD와 웹훅 서명 검증 — 타임스탬프 포함 HMAC 서명을 만들고, 상수시간 비교 +
# 허용 시간창 검사로 재전송 공격을 막는 최소 웹훅 검증기를 구현한다. (교육용)

import hashlib
import hmac
import time

WEBHOOK_SECRET = b"whsec_example_only"
TOLERANCE_SECONDS = 300

def sign_webhook(payload: bytes, timestamp: int) -> str:
    signed_data = f"{timestamp}.".encode() + payload
    return hmac.new(WEBHOOK_SECRET, signed_data, hashlib.sha256).hexdigest()

def verify_webhook(payload: bytes, timestamp: int, signature: str, now: int) -> bool:
    if abs(now - timestamp) > TOLERANCE_SECONDS:
        return False  # 재전송(replay) 공격 방지: 너무 오래된 서명은 거부
    expected = sign_webhook(payload, timestamp)
    return hmac.compare_digest(expected, signature)  # 상수 시간 비교 — 타이밍 사이드채널 방지

# --- 정상 케이스 ---
now = int(time.time())
payload = b'{"event":"payment.succeeded","amount":1000}'
sig = sign_webhook(payload, now)
print("valid webhook accepted:", verify_webhook(payload, now, sig, now))

# --- 재전송 공격: 유효했던 서명을 그대로 재사용하되 시간이 지남 ---
old_timestamp = now - 1000
old_sig = sign_webhook(payload, old_timestamp)
print("replayed (stale) webhook rejected:",
      not verify_webhook(payload, old_timestamp, old_sig, now))

# --- 변조 공격: payload만 바꾸고 서명은 그대로 재사용 ---
tampered_payload = b'{"event":"payment.succeeded","amount":999999}'
print("tampered payload rejected:",
      not verify_webhook(tampered_payload, now, sig, now))

# --- 위조 공격: 비밀키 없이 서명을 추측 ---
forged_sig = "0" * 64
print("forged signature rejected:", not verify_webhook(payload, now, forged_sig, now))
