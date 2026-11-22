# Iono's Industrial Expansion — playable-scale progression

This is the **current code-level production plan**, superseding the earlier speculative Tier 10–11 megafactory concepts.

## Existing Sandustry unchanged

Quartz → Grinder → Silica, then Silica + Charcoal in enclosed Reaction Chamber → Silicon.

Continue using vanilla Thermal Buffer and Smelter, pipes, portals, electricity, Florinol batteries, and the existing Auralite/Aura upgrade economy.

## Early automation (no semiconductor requirement)

Unlocked via Industrial Automation, branching off Signal Devices:
- Physical solid storage and liquid tank
- Oxygen/Hydrogen/liquid separator
- Data cable, area and battery-network sensor
- Decider, Arithmetic and Memory combinators
- Native ON/OFF Signal Link adapter and signal valve

Building these first means players can stabilize basic plants *before* they manufacture chips.

## Tier 8 — Silicon Ingot Extrusion and Cutting

1. Existing heated Smelter: Silicon → Purified Silicon.
2. Extruder receives individual Purified Silicon pixels; every three feed pixels build one complete three-high terrain cross-section at the nozzle.
3. Existing solid geometry **moves right cell by cell** when new feed arrives. A bounded six-column track is physically required between extruder and cutter; obstacles stop movement.
4. A cutter installed at the track exit **only acts on adjacent physical terrain**, slicing down the three-high leading face. Every full three-cell slice yields one **held wafer**.
5. A fully occupied track causes backpressure; the extruder stops taking new feed until the cutter has cleared room.

Neither wafer nor chip is a powder pixel. The factory must physically route Silicon feed to the extrusion device and place the cutter at the machine face, not teleport a completed object from one arbitrary location to another.

## Tier 9 — Wafer and chip fabrication

The chip is a **manufactured device**, not a powder, liquid or currency pixel:

1. Wafer from cutter + Oxygen + Florinol → **coated wafer**, physically fed to preparation bench.
2. Coated wafer + Acid → **patterned wafer**, producing spent etchant requiring future recovery.
3. Patterned wafer + **Liquid Copper** → **copper circuit wafer** in a distinct Copper Interconnect Plater. Copper supplies metal traces.
4. Copper circuit wafer + **Liquid Nickel** → **packaged chip** in the Nickel Chip Packager. Nickel serves plating and the package.
5. Optional **Liquid Gold** at the packager's lower inlet → **gold-contact packaged chip**, preserving ordinary chip production without Gold.
6. Chip Carrier stores ordinary and gold-contact variants separately; controller physically consumes a chip when installed.

The existing Smelter and metal supply chains remain essential. No new ore is introduced, and Gold Granulate or Gold Vapor are not assigned invented conversion recipes. Gold-contact quality differences are recorded as device grade but do not yet change circuit control logic.

## Future ideas, NOT part of this delivery

- Visual moving saw animation, reusable etchant recovery.
- A larger mask/deposition/oxidation photolithography model.
- Optional higher tiers beyond the chip economy, only after validating whether further complexity makes the game more enjoyable.
- More native-machine signal targets once tested against game 0.6.x.

## Validation contract

Code-level simulations cover physical ingot growth/cutting, blocked growth, wafer and chip transfer, chip consumption, filters, power reading, and numerical signal switching. **Live Sandustry integration is not validated until someone runs the build in-game.**
