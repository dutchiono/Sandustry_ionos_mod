# Factory production and consumption statistics

## In-game usage

Open **Factory statistics** at the upper-right of the Sandustry HUD (after loading Iono's expansion). It opens an optional panel with:

- **1 minute, 5 minutes or 1 hour** rolling windows.
- Filterable list of material/product names.
- **Produced/min, consumed/min and net/min** rates, and a compact per-material trend graph.
- **Collected** quantity separately from production.
- **Stored in / released** totals separately from material creation and consumption.

The panel is read-only; its global totals do not feed combinator networks. Factory control requires a physical wired sensor connected to its building.

## What is actually counted

Counters are attached to successful mod-owned processing transactions only:

| Operation | Consumed | Produced |
|---|---|---|
| Purified Silicon enters extruder | Purified Silicon | Solid Ingot terrain cells after every 3 inputs |
| Cutter removes ingot terrain | Solid Ingot cell | Wafer after a complete 3-cell cut |
| Wafer preparation | Wafer, Oxygen, Florinol | Coated Wafer |
| Patterning and etching | Coated Wafer, Acid | Patterned Wafer, Spent Etchant |
| Chip assembly | Patterned Wafer, Liquid Nickel | Chip |
| Controller chip installation | Chip | Device upgraded with chip |

**Storage transfers are not production:** input to a solid box/tank is recorded under `received`; release is `dispatched`.

**Resource collection is not production:** `resource:collected` event quantities appear as `collected`, not `produced`.

## Honest limitations

- Sandkit does not document a global, exact consumption/production event stream for all vanilla machines. Thus vanilla Grinder, Reaction Chamber and base-game Smelter production/consumption **are not yet recorded**. Their absence in the report does not mean they are idle.
- The mod-added Silicon purification recipe is attached to the native Smelter, and is **not included** in exact production rates because the API does not expose a confirmed output transaction callback for that recipe.
- Inter-machine inventory transfer (e.g. a wafer moving between benches) is not counted as new production.
- Total quantities are held in memory for the session. Rolling history retains at most 720 five-second buckets per material (60 minutes). Reloading the game resets this UI report.
- The in-game panel uses Sandkit's React HUD injection and must still be verified in Sandustry 0.6.x.
- Statistics are sampled in 5-second time buckets with real elapsed time; paused time affects rolling denominators.

## Why not infer vanilla gross production from scanning the whole world?

A simple scan of the number of pixels of each type tells **net change**. It cannot distinguish a grinder producing five units while another machine consumes five units: net change is zero, but gross production and consumption are both five. Treating net inventory differences as production rates would be misleading. For genuine Factorio-style coverage of every vanilla building, a tested engine hook or official machine processing callbacks are needed.

## Technical design

`main.js` embeds a bounded per-material `flowMetrics` accumulator. `meter(id, channel, amount)` records actual successful transactions. `meterSnapshot(windowMinutes)` returns rolling aggregates and graph bins. The lightweight, collapsible in-game panel is mounted with `api.ui.inject` and rendered using `sandkit.react`; it updates every five seconds and offers 1 / 5 / 60 minute views.

Source level checks: `node --check main.js && node --test tests/*.test.cjs`.
