"""Google Glass form factor note: "use only when needed" rather than
always-on. A minimal simulation of on-demand vs. always-on activation.
"""
import random


class AlwaysOnDisplay:
    """Always active -- constant power draw, constant attention cost."""
    def tick(self, has_relevant_info):
        return "rendering (always on)"


class OnDemandDisplay:
    """Activates only when there's something worth showing."""
    def tick(self, has_relevant_info):
        return "rendering (activated)" if has_relevant_info else "idle (off)"


def simulate(display, ticks=8, seed=0):
    random.seed(seed)
    active_ticks = 0
    log = []
    for t in range(ticks):
        relevant = random.random() < 0.3  # info worth showing ~30% of the time
        state = display.tick(relevant)
        if "off" not in state and "idle" not in state:
            active_ticks += 1
        log.append(state)
    return log, active_ticks


for name, display in [("always-on", AlwaysOnDisplay()), ("on-demand (Glass-style)", OnDemandDisplay())]:
    log, active_ticks = simulate(display)
    print(f"{name}: {log}")
    print(f"  active {active_ticks}/{len(log)} ticks\n")
