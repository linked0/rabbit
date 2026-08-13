# [복습] 실행 계층 지도 — 렉싱 -> 파싱(AST) -> 최적화(상수 전파) -> 실행 까지, 한 표현식으로 전 단계를 통과시킨다.

import re

# 1) 프론트엔드: 렉서 — 소스 문자열을 토큰으로 쪼갠다.
def lex(src):
    return re.findall(r"\d+|[+\-*/()]", src)

# 1) 프론트엔드: 파서 — 토큰을 AST(중첩 튜플)로 만든다. 우선순위: * / > + -
def parse(tokens):
    pos = 0
    def peek():
        return tokens[pos] if pos < len(tokens) else None
    def parse_expr():
        nonlocal pos
        node = parse_term()
        while peek() in ('+', '-'):
            op = tokens[pos]; pos += 1
            node = (op, node, parse_term())
        return node
    def parse_term():
        nonlocal pos
        node = parse_factor()
        while peek() in ('*', '/'):
            op = tokens[pos]; pos += 1
            node = (op, node, parse_factor())
        return node
    def parse_factor():
        nonlocal pos
        tok = tokens[pos]; pos += 1
        if tok == '(':
            node = parse_expr(); pos += 1  # skip ')'
            return node
        return int(tok)
    return parse_expr()

# 2) 미들엔드: 최적화 — 상수 전파/폴딩 (양쪽이 이미 리터럴이면 컴파일 타임에 계산해 버린다)
def constant_fold(node):
    if isinstance(node, int):
        return node
    op, left, right = node
    left, right = constant_fold(left), constant_fold(right)
    if isinstance(left, int) and isinstance(right, int):
        return {'+': left + right, '-': left - right, '*': left * right, '/': left // right}[op]
    return (op, left, right)

# 3) 백엔드/런타임: 인터프리터 — 최종 AST(또는 폴딩된 상수)를 실제로 실행한다.
def interpret(node):
    if isinstance(node, int):
        return node
    op, left, right = node
    l, r = interpret(left), interpret(right)
    return {'+': l + r, '-': l - r, '*': l * r, '/': l // r}[op]

source = "1 + 2 * (3 + 4)"
tokens = lex(source)
ast = parse(tokens)
folded = constant_fold(ast)
result = interpret(ast)

print("source     :", source)
print("tokens     :", tokens)
print("ast        :", ast)
print("folded ast :", folded, " <- 상수 전파로 이미 스칼라 하나로 굳음")
print("result     :", result)
