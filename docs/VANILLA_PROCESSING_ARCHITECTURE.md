# Vanilla-first production architecture (design correction, 2026-11-22)

## Why the earlier Tier 8/9 source design is wrong

The first industrial machines were fabricated as fixed adjacent-pixel recipes: Silicon+Charcoal→Wafer, Wafer+Acid→Die, Die+Nickel→Module, etc. Those equations are not validated against Sandustry's mechanics and cannot be treated as correct manufacturing steps. The fixed machines also make the existing Grinder, Smelter, Reaction Chamber, Thermal Buffer and Conveyor Portal less useful. **These recipes are rejected as design.**

The code currently contains these experiments; their presence is NOT signoff to ship. The implementation needs replacement before an actual playable release.

## Vanilla facts, sourced

1. Quartz is ground to Silica.
2. Silica and Charcoal react to make Silicon inside an *enclosed* Reaction Chamber. It can be fed with Pipes and Conveyor Portals; ordinary belts/launchers cannot pass its sealed walls.
3. Vanilla Smelter is heat-operated: metal/ore contacts TOP; a hot Thermal Buffer contacts another side, or Lava sits below.
4. Condenser is a separate cold-operated process for gases.
5. Sandkit `api.reactions.registerContact({inputA,inputB,outputA,outputB})` registers **global contact reactions**. It provides no documented requirement for a Reaction Chamber enclosure, so using it naively for a chamber-only recipe would be wrong.
6. `api.structures.recipes.register(type,recipe)` attaches **single-input** recipes to a structure, including a stock one. For silicon purification this may let us reuse the vanilla Smelter and preserve its heat rules, *subject to runtime verification*.

Sources:
- https://wiki.hoodedhorse.com/Sandustry/Reaction_Chamber
- https://wiki.hoodedhorse.com/Sandustry/Smelter
- https://sandustry.dev/api/reactions
- https://sandustry.dev/api/structures
- https://sandustry.dev/wiki/recipes-and-processing

## Proposed industrial sequence, pending API integration

Vanilla: Quartz → Grinder → Silica + Charcoal → enclosed Reaction Chamber → Silicon.

Expansion A (crystal line):
1. **Silicon → molten/crude silicon** using the **existing Smelter**, powered by a Thermal Buffer (not a magic furnace requiring charcoal again).
2. **Thermally controlled solidification → Silicon Crystal**. Requires a real cooling/casting process and a suitable API hook, not a chemistry shortcut.
3. **Crystal → wafer blank** via a physically plausible slicer/cutter. The Grinder would destroy the crystal; the Kinetic Press also isn't a wafer saw.
4. **Wafer preparation**: cleaning with controlled acid then rinse with water, producing *spent acid*, **not logic dies**.
5. **Circuit fabrication** needs deposition/masking/doping/etching or a sensible simplified Sandustry analogue. Only then should it yield a logic die.
6. **Circuit assembly** combines electronic dies with existing conductive/metal outputs and energy requirements; nickel's primary role should remain connected to batteries/metalworking unless a real material rationale emerges.

Expansion B (process infrastructure):
- Existing physical pipe/portal logistics connect a mixed-material **Reaction Chamber**. New chemistry should only occur in a chamber if we can reliably test the enclosure or attach it to a chamber-specific processor.
- Filter gas/liquid streams into oxygen, hydrogen and other existing substances without destroying rejected particles.
- Add physical storage, sensors, circuits and controllable actuator interfaces to *existing* infrastructure.
- Acid becomes a renewable/recycled cleaning and etching input, not a shortcut for manufacturing semiconductors.
- Use Florinol where its actual native energy and Aura relationships make sense; do not invent it as a generic solvent.

## Decisions the implementation must respect

- Prefer enhancing an existing stock building/heat mechanism over introducing another dedicated reactor.
- Any new building must do something the vanilla ones cannot: e.g. crystal-puller/slicer, mask deposition.
- Thermal/cold/pressure/flow conditions should physically affect production.
- Reactions must conserve actual particles and not silently duplicate/erase resources.
- Source code must NOT claim completion just because it registers new materials and recipes.
