# Sandustry — Iono's Industrial Expansion

An experimental Sandkit mod for Sandustry 0.6.x, built around **real pixel physics, visible silicon crystal growth, discrete semiconductor workpieces and wired automation**.

**Repository:** https://github.com/dutchiono/Sandustry_ionos_mod

> Development build: source-level integration and simulation tests are available. The mod has not yet been verified inside a live Sandustry 0.6.x game. It is not presented as a stable Workshop release.

## What this actually adds

### Industry — native-first
- **Vanilla Quartz → Grinder → Silica → Reaction Chamber + Charcoal → Silicon** remains unchanged.
- Existing **heat-powered Smelter** gains a Silicon → Purified Silicon processing recipe.
- **Silicon Ingot Extruder:** three incoming Purified Silicon pixels become one **three-high solid cross-section**. The complete ingot is shifted physically one cell to the RIGHT each time a new cross-section is added. Every terrain cell is physically present, never teleported into the cutter.
- **Crystal Face Cutter:** place it **seven cells right of the extruder** so the six-column ingot reaches its cutting face. The cutter removes three real cells from the leading face, one per cycle; only then does it yield **one held wafer**. Missing cutter, obstruction, full track or damage halts extrusion without consuming extra feed.
- **Wafer Preparation Bench** consumes held wafers, physical Oxygen and Florinol to make coated wafers (Florinol's photosensitive property is fictional).
- **Exposure & Etching Bench** consumes coated wafers and Acid, makes patterned wafers and stores a spent-bath count.
- **Copper Interconnect Plater** takes patterned wafers and Liquid Copper from the existing smelting economy to make held circuit wafers with conductive traces.
- **Nickel Chip Packager** consumes circuit wafers and Liquid Nickel to make **finished packaged chips**, not sand pixels. Optional Liquid Gold from below makes a separately tracked gold-contact chip.
- **Chip Carrier** holds up to 64 finished chips, keeping standard and gold-contact grades separate.
- **Chip-Based Process Controller** physically takes one chip from an adjacent carrier; it reads a numerical sensor bus above and outputs a hysteretic enable signal to the cable on its right. This makes chip manufacture useful.

### Earlier automation
- **Solid Box / Fluid Tank:** physical selected-material storage with left intake and right discharge; quantity can be read by nearby cables.
- **Data Cable:** contiguous physical network carrying mod-defined numeric signals.
- **Decider, Arithmetic and Memory Combinators** for logic and numerical transformations.
- **Signal Link Adapter** bridges a numerical condition into native boolean Sandustry signal links.
- **Area Probe** counts nearby actual pixels.
- **Valve** controls material flow.
- **Gas Filter, Liquid Filter and Combined Separator** route selected gases or liquids, including Oxygen and Hydrogen, to distinct physical outlets. All can be enabled by a physical signal cable.
- **Circuit Pump, Gas Vent and Liquid Outlet** move only the chosen fluid phase through their actual adjacent world cells; blocked outlets do not consume matter.
- **Circuit Pipe Gate** controls an adjacent **vanilla pipe segment** with the documented Sandkit pipe API, providing circuit on/off for real pipe-linked pumps and vents.
- **Power Headroom Sensor** reads its physically attached network where the Sandkit energy API permits.

### Research
- **Industrial Automation** opens controls before endgame manufacturing.
- **Tier 8: Crystal Engineering** grows and cuts physical ingots.
- **Tier 9: Wafer & Chip Fabrication** processes discrete wafers and makes usable controllers.

No extra starter ores. No artificial collection contracts. No oversized Tier 10–11 megaprojects.

## Layout and use

```text
Vanilla Quartz -> Grinder -> Silica + Charcoal -> Reaction Chamber -> Silicon
Existing heated Smelter -> Purified Silicon

                                            3-high solid ingot moves RIGHT
                                               >>>>>>>>>
feed -> [EXTRUDER] [###][###][###][###][###][###] [CUTTER] -> held wafers
                       physical terrain cells         | wafer inventory
                                                   [WAFER PREP] -> [ETCHING]
                                                                        |
                                                            [CHIP ASSEMBLER]
                                                                        |
                                                                [CHIP CARRIER] -> [CONTROLLER]
```

The cutter is **seven cells right** of the extruder: the ingot extends through the six cells between them. Wafers and chips are held workpieces, not flying pixels. The machine-to-machine bench transfer path is currently direct adjacency.

See [construction instructions](docs/BUILD_AND_TEST.md).

## Production and consumption statistics

The optional **Factory statistics** HUD button opens a Factorio-style production report with 1-minute, 5-minute and 1-hour rates, net changes, trends and a filterable material list. Storage movement and resource collection have their own categories, rather than being misrepresented as manufacturing. These are precise for **mod-owned processes**; Sandkit doesn't expose a confirmed global event for every vanilla crafting transaction, so vanilla recipes aren't claimed as tracked.

See [production statistics guide](docs/PRODUCTION_STATISTICS.md) for exact accounting and what still requires API verification.

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

**Documentation:** [Fluid flow and circuit guide](docs/FLOW_CONTROL.md) · [Current recipe and construction guide](docs/BUILD_AND_TEST.md) · [Vanilla integration rationale](docs/VANILLA_PROCESSING_ARCHITECTURE.md) · [Reference progression research](docs/TIERS_8_TO_11.md)
