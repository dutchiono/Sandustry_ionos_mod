# Delivery ledger — Sandustry Iono Industrial Expansion

Updated 2026-11-22. This file tracks the state of the **actual GitHub source**, not unrelated ideas or inflated future tiers.

## Implemented and source-simulated
- [x] Vanilla silicon route preserved; additional Purified Silicon recipe bound to existing Smelter
- [x] World-space solid Silicon terrain registration
- [x] Purified-Silicon feed grows visible terrain, one connected solid cell per consumed particle (three-wide ingot)
- [x] Growth obstruction stops material consumption
- [x] Face cutter only cuts adjacent terrain at the end of the physical extrusion track; three cuts make one held wafer
- [x] No falling-sand chip/wafer elements
- [x] Wafer preparation consumes existing Oxygen and Florinol
- [x] Etch processing consumes Acid; spent bath held as quantity
- [x] Chip assembly consumes Liquid Nickel and patterned wafer workpiece
- [x] Physical chip carrier and chip-consuming hysteresis controller
- [x] Physical solid/liquid storage and local numeric sensor signals
- [x] Decider, arithmetic, memory, binary adapter, controllable valve
- [x] Oxygen/hydrogen fluid-gas separator; rejected material preserved
- [x] Power headroom sensor read from physically connected network
- [x] Earlier Industrial Automation and Tier 8/Tier 9 research node definitions
- [x] Main script syntax compiled in a source-level test environment
- [x] End-to-end source simulation: purified feed → grown ingot → cut wafers → coated wafer → patterned wafer → chip assembly → carrier → installed controller
- [x] GitHub Actions test workflow and mock regression suite committed

## In-game validation (not performed here)
- [ ] Actual Sandustry 0.6.1 mod loading, sprite resolution and research menu
- [ ] Appended Smelter silicon recipe obeys vanilla heat and intake constraints
- [ ] Native terrain registration, collision, mining, persistence and world save/reload
- [ ] Real-world structure anchor/footprint positions and placement limitations
- [ ] Grid mutation concurrency with other moving particles
- [ ] Power headroom and Signal Linker adapters with real targets

## Deliberately excluded rather than pretending complete
- Tier 10/11 megafactory chains, orbital contracts and extra fictional ores
- Per-wafer lithography graphics and moving physical blade animation
- Standalone silicon furnace or instant silicon-to-chip conversion
- Global invisible storage counters / unconnected factory telemetry

## Authoritative documentation
- [README](../README.md)
- [Build and construction guide](BUILD_AND_TEST.md)
- [Current progression](PROGRESSION.md)

Source-level validation does **not** constitute verified in-game compatibility; the user intends to test only after the code/build has been implemented.
