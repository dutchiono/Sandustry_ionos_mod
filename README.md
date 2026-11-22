# Sandustry — Iono's Industrial Expansion

An experimental Sandkit mod for Sandustry 0.6.x, built around **real pixel physics, visible silicon crystal growth, discrete semiconductor workpieces and wired automation**.

**Repository:** https://github.com/dutchiono/Sandustry_ionos_mod

> Development build: source-level integration and simulation tests are available. The mod has not yet been verified inside a live Sandustry 0.6.x game. It is not presented as a stable Workshop release.

## What this actually adds

### Industry — native-first
- **Vanilla Quartz → Grinder → Silica → Reaction Chamber + Charcoal → Silicon** remains unchanged.
- Existing **heat-powered Smelter** gains a Silicon → Purified Silicon processing recipe.
- **Silicon Crystal Growth Fixture** consumes purified Silicon from its left inlet. Each supplied particle becomes **one visible, solid, mineable terrain cell** in one three-cell-wide connected ingot above and to the right of the fixture. Growth stops if blocked.
- **Crystal Cutter** placed four cells to the right cuts an ingot only after it reaches its selected size. Every **three real terrain slices** make one held wafer. No falling-sand wafer pixels.
- **Wafer Preparation Bench** consumes held wafers, physical Oxygen and Florinol to make coated wafers (Florinol's photosensitive property is fictional).
- **Exposure & Etching Bench** consumes coated wafers and Acid, makes patterned wafers and stores a spent-bath count.
- **Chip Assembly Bench** consumes patterned wafers and Liquid Nickel to make **finished chip inventory objects**, not sand pixels.
- **Chip Carrier** holds up to 64 finished chips.
- **Chip-Based Process Controller** physically takes one chip from an adjacent carrier; it reads a numerical sensor bus above and outputs a hysteretic enable signal to the cable on its right. This makes chip manufacture useful.

### Earlier automation
- **Solid Box / Fluid Tank:** physical selected-material storage with left intake and right discharge; quantity can be read by nearby cables.
- **Data Cable:** contiguous physical network carrying mod-defined numeric signals.
- **Decider, Arithmetic and Memory Combinators** for logic and numerical transformations.
- **Signal Link Adapter** bridges a numerical condition into native boolean Sandustry signal links.
- **Area Probe** counts nearby actual pixels.
- **Valve** controls material flow.
- **Gas/Liquid Separator** routes selected gases or liquids, including Oxygen and Hydrogen, to separate exits.
- **Power Headroom Sensor** reads its physically attached network where the Sandkit energy API permits.

### Research
- **Industrial Automation** opens controls before endgame manufacturing.
- **Tier 8: Crystal Engineering** grows and cuts physical ingots.
- **Tier 9: Wafer & Chip Fabrication** processes discrete wafers and makes usable controllers.

No extra starter ores. No artificial collection contracts. No oversized Tier 10–11 megaprojects.

## Layout and use

```text
Vanilla Reaction Chamber -> Silicon
Vanilla heated Smelter -> Purified Silicon [falling-sand feedstock]

                        ingot terrain ↑ ↑ ↑
                                      █
                  crystal fixture     █
Purified Silicon -> [GROWER] [gap] [CUTTER] -> held wafers

[CUTTER] -> [WAFER PREP] -> [ETCHING] -> [CHIP ASSEMBLY] -> [CHIP CARRIER] -> [CHIP CONTROLLER]
                ↑   ↑         ↑                ↑                                 ↑
              oxygen Florinol acid         liquid nickel                    data cable
```

The fixture draws visible Silicon terrain **upwards** immediately right of itself. Cutter must be positioned **four cells right** of the growth fixture. Downstream benches exchange held workpieces when placed immediately beside one another. The chip controller consumes a chip from a carrier immediately left of itself.

For full details see [construction and recipe guide](docs/BUILD_AND_TEST.md).

## Install and update

Clone this repository into the local mods folder used by Sandustry, then select it in the game's Mods screen:

```sh
git clone https://github.com/dutchiono/Sandustry_ionos_mod.git
```

To update, run `git pull` inside the folder.

## Source checks

```sh
node --check main.js
node --test tests/*.test.cjs
```

GitHub Actions runs these automatically.

## Compatibility notes

- Current building sprites reuse native placeholder graphics.
- Sandkit's asynchronous/deferred grid mutations require live-game race testing.
- The Smelter recipe hook is documented, but whether the appended recipe inherits all native thermal prerequisites needs direct game verification.
- Physical ingot terrain persists as real terrain even if the fixture is removed; its per-fixture association is positional and does not yet prevent claiming a naturally placed matching mod terrain cell.
- Finishing a chip adds device inventory to a structure; it doesn't create a loose inventory item in the player's toolbox.
- In-game research identifiers, visuals and balance will need adjustment if the game's 0.6.x structures differ from the documented APIs.

**Documentation:** [Current recipe and construction guide](docs/BUILD_AND_TEST.md) · [Vanilla integration rationale](docs/VANILLA_PROCESSING_ARCHITECTURE.md) · [Reference progression research](docs/TIERS_8_TO_11.md)
