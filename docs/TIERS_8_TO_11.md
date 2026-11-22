## Crystal growth reuse — architectural correction (2026-11-22)

Vanilla already grows **Fluxite crystal** from a Flux Emanator fed with Voidbloom (from RedSand and Amethelis), and physical **Auralite crystal** also grows. The silicon line must use this as the gameplay precedent: **visible, world-space solid growth, not a powder pixel or a counter disguised as a crystal**.

Correct proposed experience:
1. Feed purified Silicon into a seed/growth assembly placed in a physically enclosed and heated space.
2. A single connected solid ingot grows in the world tile by tile or through a native crystal-growth hook, limited by free space and feedstock.
3. Stop or slow growth when obstructed, and distinguish a complete ingot from the tiny seed.
4. A cutting head moves across or contacts the solid ingot, removes actual geometry, and yields **discrete wafer items** held in a carrier or machine inventory. Silicon dust returns as ordinary physical particles.
5. Wafers are transported on carriers/fixtures, not through pumps. Chips remain discrete device inventory and are installed in combinators or factory hardware.

**Critical implementation gate:** the mod code currently models the crystal as persistent `crystalMass` within a 3×3 structure. This is a *placeholder representation*, NOT a visible grown crystal. Do not label that finished. The mod must establish whether Sandkit exposes a native growing-crystal world API; otherwise implement world-space structure/terrain growth with cleanup, collision and harvest semantics before shipping.

This doesn't require another Tier 10–11 progression branch. The scope is primarily **Tier 8: silicon ingot/wafer production; Tier 9: photolithography and actual chips; earlier optional logistics/controls**. The previous speculative Tier 10–11 industries are deferred.

# Iono's Industrial Expansion — coherent Tiers 8–11 (2026-11-22)

**Design status:** authored specification, not registered playable recipes. Existing `main.js` still contains an obsolete quick-prototype fixed-machine chain and must not be considered the authoritative recipe list. This document supersedes its chemistry and production logic.

## Ground truth: existing systems

- Quartz is ground into Silica. Silica + Charcoal turn into Silicon **inside the existing sealed Reaction Chamber**.
- Existing Florin gas condenses into liquid Florinol. Florinol feeds energy production and the existing Synthesizer → Aurixite → Auralite → Aura pipeline. Aura is a research currency, **not a freely placeable chemistry pixel**. Using `aura` as a reagent or `auralite` as a generic fluid was an error.
- Existing Water can be electrolyzed into Hydrogen and Oxygen. Existing thermal machinery provides heating and cooling; existing pipes/portals move liquids/gases across enclosure walls.
- Existing Acid exists, but its composition is **not confirmed to be hydrofluoric acid**. Do not call acid a real oxide etchant automatically. Make wafer treatment an intentional **fictional game abstraction**, or introduce a verifiable dedicated chemistry route.
- The mod should make existing processing, battery production, Florinol, and Aura useful for later technology, not replace them.

## The silicon question: what should Florinol do?

**Best role: fictional photoactive coating / resist carrier.** In real microelectronics a photoresist protects selected portions of a wafer so patterns can be transferred by exposure and etching. The Sandustry abstraction can use a purified Florinol-derived coating, with an existing Laser / light source for exposure. This is *new fictional materials science*, not an assertion that real plant oil/Florinol is a semiconductor photoresist.

Separate jobs:
- Florinol-derived resist **defines the protected pattern**.
- Oxygen **oxidizes** silicon to form a passivating film; controlled thermal exposure matters.
- Acid **cleans / removes exposed surface films** and produces spent etchant. Because vanilla Acid is chemically unspecified, treat this as a fictionalized specialized etch medium, not HF chemistry.
- Water **rinses** residues. Hydrogen/Oxygen feed deposition/oxidation or power.
- Metal conductor (prefer vanilla Copper, if actually obtainable in current build) **forms interconnects**.
- Auralite should be a limited advanced-crystal or sensor material, not the semiconductor itself.
- Aura is used for research milestones/upgrades, **not a pixel input**.

## Tier 8: Crystal engineering (extend vanilla machinery)

### Stage A: reuse existing smelter and heat network
Existing Silicon is purified by a **Smelter with correct heat supply**, outputting **Purified/Molten Silicon** (new intermediate) if the Sandkit `structures.recipes.register` integration can attach a recipe to the vanilla smelter without bypassing heat. This must be validated before registering; a free global contact reaction is unacceptable.

### Stage B: first truly new machine — Crystal Puller
Molten/purified Silicon enters a slow-cooled crystal puller. Heat loss and flow stabilization determine whether it outputs:
- **Single-Crystal Silicon** (desired) or
- **Polycrystalline Silicon** (rework/recycle to smelter).

Crystals are then sliced by a **Crystal Saw**, producing **Wafer Blanks** and **Silicon Dust**. Dust returns to purification. Machine placement and output topology matter.

### Stage C: factory usefulness immediately
Earlier tech unlocks the numerical storage sensors, physical liquid/gas filters, combinators, thermal/energy monitors and controllable valves. Crystal pullers benefit from maintaining temperature and buffer level using these circuits. No arbitrary new ore.

## Tier 9: Wafer fabrication

### Stage A: oxidation/cleaning
- Wafer Blank + Oxygen + controlled heat → **Oxidized Wafer**.
- Oxidized Wafer + **purified Florinol coating** → **Coated Wafer**.
- Coated Wafer exposed to existing laser/light source under a physical mask → **Exposed Wafer**.
- Exposed Wafer treated with Acid then rinsed with Water → **Patterned Wafer** + **Spent Etchant**.
- Patterned Wafer + conductive layer (Copper/other verified metal) → **Circuit Wafer**.
- Circuit Wafer → **Logic Die** using precision cutting.

Use existing Reaction Chamber *only* for processes where enclosed reaction and feed/withdrawal are meaningful. Sandkit contact reactions are global; an enclosure gate must be verified, not assumed. Coating, masking and slicing require specialized structures because vanilla machinery cannot perform those operations.

### Stage B: controller products
Logic Die + metal housing + power → **Controller Module**. Modules unlock arithmetic/memory combinator upgrades, recipe selectors and real-machine actuators. This gives chips a concrete reason to exist.

### Byproducts
Silicon Dust → recycle to smelter; Spent Etchant → neutralization/reclaim; excess liquid → flow management. Nothing disappears when an output is blocked.

## Tier 10: Precision materials and sensor networks

**Theme:** high-purity production as a control challenge, not new rocks.

- Extract a limited **Auralite Sensor Crystal** from the existing *physical* Auralite stream, via controlled crystal growth (do not spend Aura currency pixels).
- Use Sensor Crystal + Logic Die → **Precision Sensor Array**.
- Use Florinol-derived coating + precision chemistry → **Optical / Photoactive Film**. This is where a Florinol-derived material becomes genuinely important.
- Extend power and chemistry into **Closed-Loop Refinery** systems: monitor physical pressure proxy, temperature, purity/contamination, battery charge, and output buffering.
- High-efficiency control challenges require temperature bands and stable output; bad control generates reclaimable off-spec intermediates.

**New structures only where necessary:** purity analyzer (physical sample stream), thin-film coater, sensor module assembler. Existing heat/cooling, pipes, smelters and the chamber remain central.

## Tier 11: Autonomous production and orbital systems

**Theme:** a responsive industrial ecosystem rather than single terminal crafting.

- Precision Sensor Array + Controller Module + advanced physical Auralite product → **Industrial Controller Core**.
- Controller Core + Nickel power cell + physical wiring and sensors → **Autonomous Factory Controller** (configurable finite-state sequences, hysteresis, alarms, load shedding and buffer logic).
- Maintain multiple physically delivered outputs simultaneously: electronics, recovered chemicals, power cells and Auralite derivatives.
- **Orbital payloads** are assembled through multiple factory stages using those outputs, then launched/delivered through a real endpoint.
- Quality is measured by sustained flow and uptime; *not* arbitrary collect-10,000 contracts.
- Unlock a compact factory dashboard that reports only **wired** sensors, so disconnected containers do not magically appear.

## Material inventory

| Type | Proposed physical product | Factory role |
|---|---|---|
| Powder / melt | Purified/Molten Silicon | Heated refinement |
| Solid | Single-Crystal Silicon | Controlled crystal pull |
| Solid | Polycrystalline Silicon | Reject/rework |
| Powder | Silicon Dust | Recycled cutting byproduct |
| Solid | Wafer Blank | Substrate |
| Solid | Oxidized Wafer | Surface layer |
| Liquid | Florinol-derived Resist | Fictional photosensitive coating |
| Solid | Coated / Exposed Wafer | Laser/light patterning |
| Solid | Patterned Wafer | Acid cleaning/etch + water rinse |
| Liquid | Spent Etchant | Reclaim and waste routing |
| Solid | Circuit Wafer / Logic Die | Logic chip fabrication |
| Solid | Controller Module | Programmable logic |
| Solid | Auralite Sensor Crystal | Optical/precision sensor |
| Solid | Sensor Array | Tier 10 controls |
| Solid | Controller Core | Tier 11 automation |
| Solid | Orbital Payload | Production endpoint |

## Implementation constraints and next coding decisions

1. Do not blindly register `api.reactions.registerContact` to represent chamber-only reactions; a global silicon reaction would fundamentally violate vanilla's enclosure physics.
2. Prefer `api.structures.recipes.register` on a stock structure only if it inherits that structure's normal heat/processing rules.
3. Add actual physical processes (not arbitrary left+above combiners); maintain a conservation ledger and recoverable byproducts.
4. Confirm whether input materials are recognized pixel types or counters (Aura is a currency) before putting them in a recipe.
5. Split research unlocks: controls early; Tier 8 crystal growth; Tier 9 electronics; Tier 10 high-purity sensors; Tier 11 autonomous megafactory.
6. Add deterministic mock tests, but reserve game compatibility claims until a human runs the actual mod.
7. Acid and Florinol chemistry are deliberately fictional abstractions; never state these are real etching chemicals.
8. The user will test only once there is a genuinely feature-complete build.

## References
- https://wiki.hoodedhorse.com/Sandustry/Reaction_Chamber
- https://wiki.hoodedhorse.com/Sandustry/Aura_Extractor
- https://sandustry.com/sandkit.html
- https://sandustry.dev/api/structures
- https://www.osha.gov/semiconductors/silicon/device-fabrication
- https://www.epa.gov/system/files/documents/2021-07/owm0145_0.pdf
