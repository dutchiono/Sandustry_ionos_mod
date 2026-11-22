# Sandustry — Iono's Industrial Expansion

A Sandkit mod project targeting Sandustry 0.6.x: **better factory controls now, Tier 8 and Tier 9 built from existing industrial outputs**.

> **Status: development / untested in-game.** This repository contains an initial playable API integration, tests, progression specifications, and explicit compatibility gaps. It is **not** a completed Tier 8–9 content release.

## Design principles
- Extend **Florinol, Aura, Silicon, Acid, Nickel and power cells**, not arbitrary new ores.
- Keep every measured quantity local to a *physical building*.
- Connect control devices with the existing **Signal Linker** where possible.
- Give players Factorio-like **deciders**, **arithmetic**, **memory**, **sensors**, and **actuators** without forcing them to use primitive gates.
- Build processes that need flow, temperature, balancing and throughput, not tedious collection contracts.

## What is implemented
- Placeable **Material Probe**: counts configured particles within a local bounded sampling window; emits ON/OFF over vanilla signal links.
- Placeable **Decider**: takes a local Material Probe reading, compares to a configurable threshold, emits ON/OFF to existing receivers.
- Placement configuration for material id, threshold, operator and sampling radius.
- A small optional vanilla processing-machine signal receiver bridge (only where the runtime exposes processor enable/disable; see source).
- In-game status toast and failure-isolated API registration.
- Pure logic unit tests.

**Important:** The Material Probe observes pixels. It is **not** a storage box, liquid tank or battery sensor, and the decider's numerical input is **adjacency-based**, not a numerical wire. These are deliberate visible limitations pending engineering and in-game validation.

## Install / pull
Clone this repo as a local Sandustry mod folder (Steam build):
```bash
git clone https://github.com/dutchiono/Sandustry_ionos_mod.git
```
Copy the repository folder into your Sandustry local `mods/` directory (the folder containing `modinfo.json`), enable it in the Mods menu, then restart as required. To update, `git pull` in that folder.

## Testing
```bash
node --check main.js
node --test tests/*.test.cjs
```
API registrations and placement must still be tested **in Sandustry 0.6.x**, with a throwaway save first.

## Documentation
- [Current implementation and limits](docs/IMPLEMENTATION.md)
- [Tier 8 / Tier 9 progression design](docs/PROGRESSION.md)
- [Engineering backlog and acceptance tests](docs/ROADMAP.md)
- [Vanilla mechanics and sources](docs/VANILLA_AUDIT.md)

## Sources
- [Official Sandkit API](https://sandustry.com/sandkit.html)
- [Community API documentation](https://sandustry.dev/)
- [Sandustry mod structure guide](https://sandustry.dev/wiki/adding-a-new-structure)
