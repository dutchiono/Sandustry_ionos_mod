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

## Tier 8 — Silicon Crystal Engineering

1. Smelter (existing heat requirement): Silicon → Purified Silicon (new powder).
2. Crystal Growth Fixture: converts one Purified Silicon **pixel** into one real **solid Silicon Ingot terrain cell**, growing upward in a single contiguous world-space column.
3. Cutter: once the ingot reaches configured height, remove ingot cells one by one. **Four real cells cut produce one discrete wafer**. No wafer powder, no free instant crafting.
4. Industrial control can regulate source stream and storage to avoid blocked ingots.

Crystals are structures in the world, physically mined or cuttable, not invisible counter items.

## Tier 9 — Wafer and Chip Fabrication

1. Wafer Preparation Bench: one wafer (held) + Oxygen (pixel) + Florinol (pixel) → one **coated wafer workpiece**.
2. Exposure & Etching Bench: one coated wafer + Acid pixel → one **patterned wafer workpiece**, plus one unit spent bath. Florinol's proposed photoresist behavior is *fictional Sandustry chemistry*.
3. Chip Assembly Bench: one patterned wafer + Liquid Nickel pixel → **one manufactured chip**.
4. Chip Carrier: physical device inventory (capacity 64).
5. Chip-Based Process Controller: consumes **one chip from carrier**; then reads a physically wired numeric signal and outputs a hysteretic control condition.

Unlike an arbitrary counter, a produced chip unlocks a genuinely useful factory-control device.

## Future ideas, NOT part of this delivery

- Visual moving saw animation, reusable etchant recovery.
- A larger mask/deposition/oxidation photolithography model.
- Optional higher tiers beyond the chip economy, only after validating whether further complexity makes the game more enjoyable.
- More native-machine signal targets once tested against game 0.6.x.

## Validation contract

Code-level simulations cover physical ingot growth/cutting, blocked growth, wafer and chip transfer, chip consumption, filters, power reading, and numerical signal switching. **Live Sandustry integration is not validated until someone runs the build in-game.**
