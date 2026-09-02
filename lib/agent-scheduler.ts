import { runAgentTick, type TickSettings } from "@/lib/agent-tick";

// J2 / R-F — 스케줄러 (jay, 2026-09-02). 계획서가 "빠진 조각"이라 부르던 것:
// 방에 아무도 없을 때 틱을 부르는 타이머. 브라우저가 아니라 **서버**에 산다 —
// 탭을 닫아도 돌아야 "무인"이라는 주장이 성립한다.
//
// setInterval 하나짜리 싱글턴이다. Cloud Run 같은 곳에서는 프로세스가 죽으면
// 함께 죽지만, 이 콘솔은 로컬 전용이고 그 한계는 상태(startedAt)가 화면에
// 보이므로 숨겨지지 않는다. globalThis 에 두는 이유: Next dev 의 HMR 이 모듈을
// 다시 평가해도 돌던 타이머를 잃지 않기 위해서다.

export type SchedulerState = {
  running: boolean;
  intervalSec: number;
  settings: TickSettings | null;
  startedAt: string | null;
  runs: number;
  lastRunAt: string | null;
  lastVerdict: string | null;
  lastError: string | null;
  busy: boolean;
};

type SchedulerStore = SchedulerState & { timer: ReturnType<typeof setInterval> | null };

const store: SchedulerStore = ((globalThis as Record<string, unknown>).__agentScheduler as SchedulerStore) ?? {
  running: false,
  intervalSec: 60,
  settings: null,
  startedAt: null,
  runs: 0,
  lastRunAt: null,
  lastVerdict: null,
  lastError: null,
  busy: false,
  timer: null,
};
(globalThis as Record<string, unknown>).__agentScheduler = store;

async function runOnce() {
  // 이전 틱이 아직 돌고 있으면 겹쳐 돌리지 않는다 — LLM 호출이 인터벌보다 길 수 있다.
  if (store.busy || !store.settings) return;
  store.busy = true;
  try {
    const r = await runAgentTick(store.settings);
    store.runs += 1;
    store.lastRunAt = new Date().toISOString();
    if ("error" in r) {
      store.lastVerdict = null;
      store.lastError = r.error;
    } else {
      store.lastVerdict = r.tick.verdict;
      store.lastError = null;
    }
  } catch (e) {
    store.runs += 1;
    store.lastRunAt = new Date().toISOString();
    store.lastVerdict = null;
    store.lastError = String(e instanceof Error ? e.message : e);
  } finally {
    store.busy = false;
  }
}

export function startScheduler(settings: TickSettings, intervalSec: number) {
  stopScheduler();
  store.running = true;
  store.intervalSec = Math.max(5, Math.floor(intervalSec));
  store.settings = settings;
  store.startedAt = new Date().toISOString();
  store.runs = 0;
  store.lastRunAt = null;
  store.lastVerdict = null;
  store.lastError = null;
  // 시작 즉시 한 번 돌린다 — "시작을 눌렀는데 인터벌만큼 아무 일도 없다"는 첫인상을 피한다.
  void runOnce();
  store.timer = setInterval(() => void runOnce(), store.intervalSec * 1000);
}

export function stopScheduler() {
  if (store.timer) clearInterval(store.timer);
  store.timer = null;
  store.running = false;
}

export function schedulerState(): SchedulerState {
  const { timer: _timer, ...state } = store;
  return state;
}
