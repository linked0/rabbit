# FFI·ABI 경계와 안전성 — ctypes 로 구조체 레이아웃(패딩)을 확인하고, 패닉이 경계를 넘지 못하도록 에러 코드로 변환한다.

import ctypes

class Header(ctypes.Structure):
    # C ABI 기준: int8 뒤에 int32 가 오면 정렬(4바이트) 때문에 3바이트 패딩이 끼어든다.
    _fields_ = [("flag", ctypes.c_int8), ("value", ctypes.c_int32)]

h = Header(flag=1, value=1000)
print("sizeof(Header):", ctypes.sizeof(h), "bytes  (1 + 3 padding + 4, not 5)")
print("offsetof(value):", Header.value.offset, "  <- 정렬 때문에 1이 아니라 4")

# FFI 경계에서는 상대 언어 런타임이 이해 못 하는 예외/패닉이 넘어가면 정의되지 않은 동작이 된다.
# 규칙: 경계 함수는 절대 예외를 던지지 않고, 항상 (ok, error_code) 형태로 변환해 반환한다.
ERR_OK = 0
ERR_DIVIDE_BY_ZERO = 1
ERR_OUT_OF_RANGE = 2

def ffi_safe_divide(a, b):
    """다른 언어에서 호출한다고 가정한 경계 함수 — 내부 예외를 절대 누출시키지 않는다."""
    try:
        return (ERR_OK, a / b)
    except ZeroDivisionError:
        return (ERR_DIVIDE_BY_ZERO, None)   # 예외 대신 에러 코드로 변환해서 경계를 넘긴다
    except OverflowError:
        return (ERR_OUT_OF_RANGE, None)

ok1, r1 = ffi_safe_divide(10, 2)
ok2, r2 = ffi_safe_divide(10, 0)

print("divide(10, 2) ->", "code", ok1, "result", r1)
print("divide(10, 0) ->", "code", ok2, "result", r2, " (호출자는 예외가 아니라 코드로 실패를 본다)")
