# Day 2: 균형 트리 계열 비교 — Red-Black vs B+Tree vs Skip List (동시성 관점)
# 락 경합 없이 계층 구조로 O(log n) 탐색을 내는 Skip List를 구현해 확인한다.

import random

class Node:
    __slots__ = ("value", "forward")
    def __init__(self, value, level):
        self.value = value
        self.forward = [None] * (level + 1)

class SkipList:
    MAX_LEVEL = 4

    def __init__(self):
        self.head = Node(None, self.MAX_LEVEL)
        self.level = 0

    def _random_level(self):
        lvl = 0
        while random.random() < 0.5 and lvl < self.MAX_LEVEL:
            lvl += 1
        return lvl

    def insert(self, value):
        update = [self.head] * (self.MAX_LEVEL + 1)
        node = self.head
        for i in range(self.level, -1, -1):
            while node.forward[i] and node.forward[i].value < value:
                node = node.forward[i]
            update[i] = node
        lvl = self._random_level()
        if lvl > self.level:
            update[self.level + 1:lvl + 1] = [self.head] * (lvl - self.level)
            self.level = lvl
        new_node = Node(value, lvl)
        for i in range(lvl + 1):
            new_node.forward[i] = update[i].forward[i]
            update[i].forward[i] = new_node

    def search(self, value):
        node, hops = self.head, 0
        for i in range(self.level, -1, -1):
            while node.forward[i] and node.forward[i].value < value:
                node = node.forward[i]
                hops += 1
        node = node.forward[0]
        hops += 1
        return (node is not None and node.value == value), hops

random.seed(1)
sl = SkipList()
values = list(range(0, 200, 2))
random.shuffle(values)
for v in values:
    sl.insert(v)

found, hops = sl.search(150)
missing, hops2 = sl.search(151)
print(f"n=100개 삽입, 이론 기대 홉 수 ≈ log2(100) ≈ 6.6")
print(f"search(150) -> found={found}, hops={hops}")
print(f"search(151) -> found={missing}, hops={hops2}")
