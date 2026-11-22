# Sandustry — Iono's Industrial Expansion

> **Design correction (2026-11-22):** [Tiers 8–11 vanilla-first architecture](docs/TIERS_8_TO_11.md) is the authoritative progression and chemistry specification. The fixed two-input recipes still in `main.js` are legacy experimental scaffolding, **not approved production recipes**. In particular, Florinol is proposed as a fictional photoresist feedstock, existing Silicon already comes from the vanilla Reaction Chamber, and Aura is currency rather than a physical crafting ingredient. These discrepancies must be eliminated before release.


**Repository:** https://github.com/dutchiono/Sandustry_ionos_mod

Sandkit mod adding Tier 8 and Tier 9 industry, built on the EXISTING Sandustry economy: Silicon, Acid, Florinol, Aura and Nickel. It does not introduce another starter ore or resource-collection contracts.

## Implemented in source

### Control hardware
- Inventory Box and Fluid Tank: locally stored pixel inventory, inlet on the left, outlet on the right, selectable material and storage capacity.
- Data Cable: contiguous physical numerical signal network.
- Decider Combinator: comparison threshold, signal selection and configured numeric output.
- Arithmetic Combinator: add, subtract, multiply, divide, modulus, min and max.
- Memory Combinator: latch, sum and max modes.
- Area Probe: count actual pixels of a selected material near the probe.
- Signal Link Adapter: converts numeric output to ON/OFF for Sandustry's native signal infrastructure.
- Valve: conditionally transfers selected real material pixels, controlled by numerical signals.

### Tier 8: Instrumentation & Fabrication
- Wafer Furnace: Silicon + Charcoal → Silicon Wafer.
- Acid Etcher: Silicon Wafer + Acid → Logic Die.
- Module Assembler: Logic Die + Nickel → Control Module.
- Etchant Bath: Acid + Florinol → Spent Etchant.
- Reclaimer: Spent Etchant + Florinol → Purified Process Medium.
- Tier 8 research node and associated unlocks.

### Tier 9: Autonomous Industry
- Control Core Forge: Control Module + Aura → Industrial Control Core.
- Supervisor Assembler: Industrial Control Core + Purified Process Medium → Factory Supervisor.
- Tier 9 research node and associated unlocks.

Seven new particle materials have registered powder/liquid properties. Machines consume physical inputs from immediately LEFT and ABOVE, and place output immediately RIGHT. Each machine can be switched ON/OFF via Sandustry's Signal Linker. Obstructing output blocks processing.

## Installation / updates

Clone the repo into the local Sandustry mods directory shown by your version of the game's Mods interface:

```sh
git clone https://github.com/dutchiono/Sandustry_ionos_mod.git
```

To update later, run `git pull` from that folder.

## Development checks

```sh
node --check main.js
node --test tests/*.test.cjs
```

GitHub Actions also checks syntax and runs tests on every push.

## API compatibility and caveats

**Source implementation is complete for the systems listed above, but NOT verified in Sandustry 0.6.1.** In-game installation, sprite availability, material internal IDs, research-tree placement, and the game’s deferred mutation ordering still require runtime validation. Automated mocks cannot prove compatibility with the game engine. Development is ongoing; this should not be represented as a tested or finished gameplay release.

Initial machines reuse existing graphics keys; custom sprite artwork, battery-charge telemetry, actual power/heat costs, advanced controller UI and a long-duration orbital megaproject are not included.

There is a known limitation in the current physical storage implementation: deferred mutation of neighboring pixels and immediate stored-count changes can race if multiple neighboring machines act on the same pixel in the same tick. Avoid shared inlet locations until transaction validation is integrated.

## References

- [Build and operation guide](docs/BUILD_AND_TEST.md)
- [Tier 8–9 industrial progression](docs/PROGRESSION.md)
- [Development checklist](docs/ROADMAP.md)
- [Official Sandkit API](https://sandustry.com/sandkit.html)
