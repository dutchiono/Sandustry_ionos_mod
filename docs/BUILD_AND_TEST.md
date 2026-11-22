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

## Wafer processing, copper deposition and chip packaging (Tier 9)

Silicon is produced with the vanilla Reaction Chamber and smelted into Purified Silicon in the existing heated Smelter. After extrusion and slicing, the **wafer is a held workpiece, not a falling-sand pixel**.

| Stage | Physical feeds | Discrete machine output |
|---|---|---|
| Wafer Preparation | held wafer on LEFT, Oxygen ABOVE, Florinol BELOW | coated wafer |
| Exposure & Etching | coated wafer on LEFT, Acid ABOVE | patterned wafer, spent-bath counter |
| Copper Interconnect Plater | patterned wafer on LEFT, **Liquid Copper ABOVE** | copper-plated circuit wafer |
| Nickel Chip Packager | circuit wafer on LEFT, **Liquid Nickel ABOVE** | ordinary packaged chip |
| Optional gold contact plating | same packager, **Liquid Gold BELOW** in addition to Nickel | gold-contact packaged chip |
| Chip Carrier | output from packager on LEFT | holds separate ordinary and gold-chip counts |
| Chip Process Controller | carrier on LEFT | consumes one ordinary chip if available; otherwise a gold chip |

The intent is not a random Copper+Nickel alloy. **Copper forms the conductive traces; Nickel packages and plates the external contacts.** Gold is an optional higher-grade contact finish, with one Liquid Gold pixel consumed only when that feed is present. None of these chip types becomes a loose sand element.

**Existing Gold forms and native production:** Gold → heated Smelter → Liquid Gold. Separately, Blacksand → Steam Dryer → Gold Vapor → Condenser → Liquid Gold. Later research lets the existing Synthesizer turn Liquid Gold into Gold Granulate (a higher-density Gold-storage material). The mod consumes **Liquid Gold only** for optional chip contact finishing; it does not divert or reverse the Gold Granulate process. Native Gold can still be collected as research currency.

A real silicon chip also needs controlled doping, masking and deposition conditions. The currently coded benches are *Sandustry-scale abstractions* rather than a chemically complete fabrication simulator. Florinol's proposed photoresist behavior is fictional.

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
