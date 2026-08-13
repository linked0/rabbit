"""Isaac GR00T staged plan: a small state machine walking
cloud_gpu_inference -> lerobot_arm -> jetson_deploy, gated by a mock VRAM
check before the first stage is allowed to start.
"""

STAGES = ["cloud_gpu_inference", "lerobot_arm", "jetson_deploy"]
MIN_VRAM_GB = 16


def check_vram(device_name, vram_gb):
    ok = vram_gb >= MIN_VRAM_GB
    print(f"  VRAM check: {device_name} has {vram_gb}GB (need {MIN_VRAM_GB}GB+) -> {'OK' if ok else 'BLOCKED'}")
    return ok


def run_stage(stage, device_name, vram_gb):
    if stage == "cloud_gpu_inference":
        if not check_vram(device_name, vram_gb):
            return False, "insufficient VRAM for GR00T N1.7-3B inference"
        return True, f"ran inference on rented {device_name} ({vram_gb}GB)"
    if stage == "lerobot_arm":
        return True, "fine-tuned GR00T checkpoint via LeRobot on SO-101 arm ($100-130)"
    if stage == "jetson_deploy":
        return True, "deployed to Jetson AGX Thor for real-time on-device inference"
    return False, "unknown stage"


def run_plan(device_name, vram_gb):
    print(f"attempting plan on candidate device: {device_name} ({vram_gb}GB VRAM)")
    for stage in STAGES:
        print(f"-> stage: {stage}")
        ok, message = run_stage(stage, device_name, vram_gb)
        print(f"   {message}")
        if not ok:
            print(f"   plan halted at {stage!r}\n")
            return
    print("   plan complete: cloud -> arm -> Jetson\n")


run_plan("Jetson Orin Nano Super", vram_gb=8)   # blocked at stage 1
run_plan("rented RTX 4090", vram_gb=24)          # proceeds through all stages
