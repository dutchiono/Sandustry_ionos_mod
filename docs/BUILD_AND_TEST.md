# Build and test notes

The mod runs as a JavaScript Sandkit mod. It requires no npm dependencies or bundling.

Install with a Git checkout inside Sandustry's recognized local mod folder. Consult the game mod menu to locate the exact folder for your platform. Run `git pull` to update.

Automated checks: `node --check main.js`, then `node --test tests/*.test.cjs`. GitHub Actions runs these on pushes.

## Factory construction

**Storage:** place box/tank with a feeder to its immediate left and clear space to its right. Set release 0 to hold stored material. Each accepted pixel increments the local per-instance inventory. The box has a cable port on any adjacent side.

**Numeric circuits:** place connected Data Cable structures. A sensor/box/tank broadcasts its material count into an adjacent bus. Place a combinator with an input cable immediately left and output cable immediately right. Decider turns a numeric condition into another numeric signal. Arithmetic handles a number and constant. Memory retains a numeric value. Adapter converts numbers to Sandustry's native binary Signal Link receivers. Valve directly responds to numeric cable value.

**Industry:** each processing machine takes exactly one unit of first input immediately LEFT and one unit of second input immediately ABOVE, and creates one output immediately RIGHT. A disabled machine does nothing. Output blockage stops processing. These are particle-level crafting steps, not global resource transactions.

## Recipe flow

- Silicon + Charcoal → Silicon Wafer
- Silicon Wafer + Acid → Logic Die
- Logic Die + Nickel → Control Module
- Acid + Florinol → Spent Etchant
- Spent Etchant + Florinol → Process Medium
- Control Module + Aura → Control Core
- Control Core + Process Medium → Factory Supervisor

These are provisional balance recipes. Recipe names/vanilla pixel IDs are checked at runtime through Sandkit and will need gameplay confirmation.

## Limitations worth knowing before manual validation

- No bespoke textures yet: initial machines reuse native sprite keys.
- No energy consumption, battery charge sensor or thermal control in this source release.
- Numeric cables run as script-side topology, rather than replacing the vanilla boolean wiring.
- Processing uses deferred grid mutations; the current implementation has not been observed under simultaneous multibuilding contention in the game.
- Tier 8 unlock is anchored to known SignalDevices tech until the complete vanilla Tier 7 id is confirmed.
- No actual game binary was available in this environment; passing source tests does not constitute in-game compatibility testing.
