# Build, layout and recipe guide — Iono's Industrial Expansion

**Applies to source after 2026-11-22 crystal growth redesign.**

## Install

Use the local `mods` directory in the Sandustry game interface. Clone `https://github.com/dutchiono/Sandustry_ionos_mod.git` as a folder inside it. Use `git pull` to update.

Run source tests with:

```sh
node --check main.js
node --test tests/*.test.cjs
```

These are mock/simulation tests, not proof of compatibility with the game binary.

## Crystal extrusion and cutting (Tier 8)

1. Vanilla Quartz → Grinder → Silica; existing Reaction Chamber with Charcoal → Silicon.
2. The existing heat-powered Smelter converts Silicon to Purified Silicon (recipe hook added by mod).
3. Feed Purified Silicon to the **LEFT** of the Silicon Ingot Extruder.
4. Every **three feed pixels** make one three-cell-high cross-section of solid world terrain. The extruder **advances every existing terrain cell exactly one cell right**, then forms the newest cross-section at its nozzle. This is physical linear extrusion, not magic growth elsewhere.
5. Place the Crystal Face Cutter at **x = extruder x + 7**, on the same y. The six cells between the buildings hold the extruded ingot.
6. The cutter must be physically touching a solid cross-section on its LEFT. It removes the leading face one terrain cell at a time; after **three actual cuts**, it adds one discrete wafer to its local output inventory.
7. The extruder stalls while the bar fills the track; cutting clears space for another pushed cross-section. If a destination is obstructed it does not consume the third feed pixel. If terrain is partially damaged or broken, the extruder fails closed rather than duplicating it.
8. Place the next processing bench immediately **RIGHT** of the cutter to receive held wafers, not sand pixels.

**Inventory law:** 3 purified-silicon pixels = one three-cell-high section = eventually one wafer. If partially cut, the remaining terrain plus the cutter's progress tracks the consumed work. Buffer state is stored on the extruder. No remote transport occurs.

## Wafer processing and chip production (Tier 9)

Each bench is **one cell** and should be placed immediately to the right of its previous station. They transfer held workpieces, without a falling-sand chip element.

| Step | Machine | Physically required materials | Result |
|---|---|---|---|
| 1 | Wafer Preparation Bench | held wafer from cutter on LEFT; Oxygen ABOVE; Florinol BELOW | 1 held coated wafer |
| 2 | Exposure & Etching Bench | held coated wafer from bench on LEFT; Acid ABOVE | 1 held patterned wafer and 1 unit spent bath |
| 3 | Chip Assembly Bench | held patterned wafer from bench on LEFT; Liquid Nickel ABOVE | 1 finished chip in local inventory |
| 4 | Chip Carrier | finished chip from assembler on LEFT | up to 64 discrete chips |
| 5 | Chip Process Controller | chip from carrier on LEFT; numerical signal cable ABOVE; output cable RIGHT | consumes one chip when installed, drives hysteretic ON/OFF |

Florinol serving as a photoresist is **invented Sandustry chemistry**. Oxidation and exposure are currently combined into a bench recipe; the source does not yet simulate a moving mask or actual laser illumination. Spent bath is held as a local counter, not a fully modeled acid-recovery liquid. These choices are intentionally small-scale, but are not a complete photolithography simulation.

## Automation

- Inventory Box / Fluid Tank: LEFT is selected-material input; RIGHT is output when release is enabled. Storage is on the placed building, never global.
- Data Cables are physically adjacent; a storage device broadcasts its selected material quantity into neighboring cables.
- Decider / Arithmetic / Memory: LEFT is input cable and RIGHT is output cable.
- Chip Controller: TOP is sensor cable; RIGHT is output. It consumes one chip from a Chip Carrier on its LEFT. The low/high thresholds prevent rapid switching around a single threshold.
- Binary Signal Link Adapter: reads a numeric cable on LEFT and sends a native ON/OFF output via Signal Linker.
- Phase Filter: left feed, right selected fluid/gas, below rejected fluid/gas. Solids are not processed.
- Area Probe: read material pixels within a bounded radius.
- Power Headroom: read physically connected free energy capacity where API supports it.
- Valve: a numeric control input determines whether its left-feed particle moves to the right.

## Research

Industrial Automation branches off Signal Devices; Tier 8 branches from native Refining8; Tier 9 branches from the expansion's Tier 8. Registrations use separate Sandkit definitions, nodes and unlock sets.

## Data safety and testing

Use a disposable save for the first in-game test. World ingots are genuine terrain blocks that may persist after destroying a growth fixture. The live engine's collision, sprite registration and deferred mutation behavior have not been verified. The source tests simulate the API and verify material flow in a deterministic model.

Official references: [Sandkit](https://sandustry.com/sandkit.html), [official Smelter](https://wiki.hoodedhorse.com/Sandustry/Smelter), [Reaction Chamber](https://wiki.hoodedhorse.com/Sandustry/Reaction_Chamber).
