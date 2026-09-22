# 2026-09-16 — jayverse-game

Source docs: no task/design doc for this one — it came from an ad-hoc request by jay
(reference clip "Dancing Tsuyoko 4", shared as a screen recording) to add a character of that
style to the game, and to make the street-level view the opening camera.

### Dancer character (Tsuyo) on the agent street

**Cause:** jay shared an anime reference (long black hair, oversized white tee, baggy cobalt
sweatpants, chunky white sneakers, hoop earrings) and asked for "this kind of character" in the
game. The X link was login-walled; the look was recovered by extracting frames from jay's screen
recording with a small AVFoundation/Swift script (no ffmpeg on this machine).

**Reasoning:** the reference is a detailed 2D illustration, and the scene's existing figures
(Jay, the agent) are hand-built primitive meshes. Reproducing the art as a sprite/billboard would
clash with the low-poly street, so the character was rebuilt in the scene's own visual language,
keeping only the palette and silhouette. Animation is a procedural loop in `useFrame`, not an
asset, matching how Jay already works.

**Change:** new `components/Dancer.tsx` — nested groups (hips → legs → shins, torso → arms →
forearms, head → hair) driven by one sine-based dance cycle; wired into `components/Scene.tsx`
opposite Jay at `[4.2, 0, 2.6]`. No game state, no dialogue: background life only.

**Result:** renders and animates. Three rig bugs found only by screenshotting the running app and
fixed: the leg chain put the soles ~0.2 units below y=0 (she floated sunk into the road); the left
arm used a positive z-rotation, which sweeps a limb toward +x and so crossed it over the chest;
and the bangs mesh overlapped the eyes, making the whole face read as a dark bar.

### Opening camera moved to street level

**Cause:** jay asked for the head-on street view (screenshot shared) to be the first viewpoint,
rather than the bird's-eye overview the scene mounted with.

**Reasoning:** the mount effect framed the whole street from `(16, 16, ~22)`. A street-level
camera has to stay inside OrbitControls' `maxPolarAngle` (`PI/2.1` ≈ 85.7°), or the first
`c.update()` silently snaps it back upward — so the framing is chosen with that headroom, not
placed flat on the horizon.

**Change:** mount framing is now `camera (0, 3.6, 15)` → `target (0, 1.5, -8)`. Because the ground
and road planes ended at `z = 6`, that camera stood off the end of the world and showed sky under
the road, so both planes gained a 20-unit entrance apron toward the viewer (`APRON` in
`Scene.tsx`), with the centre dashes extended to match.

**Result:** opening view matches jay's reference — Jay and his balloon on the left, the dancer on
the right, the settlement gate at the vanishing point, ground filling the frame. The old overview
is still one drag away. Not committed: left in the working tree for review, on branch
`claude/dancer-character`.

### Gotcha: blank WebGL canvas in headless Chrome was a stale GPU cache

**Cause:** mid-session, every headless screenshot came back with the 3D canvas empty (UI overlay
still drawing) — and it kept happening after a clean `next dev` restart, which made it look like a
code regression.

**Reasoning:** isolated it by putting the *original* camera values back; the canvas was still
blank, so the cause was outside the changed code.

**Change:** run headless Chrome with a throwaway `--user-data-dir` per shot.

**Result:** renders immediately. Worth remembering — a blank r3f canvas with no console error is a
browser/GPU-state problem, not an application bug.
