# Technical state (v0.1.0)

## Existing code
- Sandkit structures: Material Probe and Decider; intended for `SignalDevices` unlock.
- Probe periodically counts element pixels in an area around its own placed position. Bounded radius prevents unbounded scanning.
- Configurable thresholds; an adjacent Decider reads a Probe and emits ON/OFF using Sandkit's signal sender system.
- Optional target registrations for known vanilla machine IDs, only if present in current build.

## Exact shortcomings
1. No physical material *storage*. A sampled area can contain flowing or escaping pixels. Do not label it a tank.
2. Material selection defaults to the internal id `florinol`. The correct 0.6.x runtime id must be verified.
3. Decider's numerical input is **one of four immediately adjacent probes**, not transmitted through a numerical wire network.
4. Built-in Sandkit signals are boolean; the existence of a custom sender does not prove any attached machine supports ON/OFF.
5. Optional receiver registrations might control only Sandkit-managed processors; no claims about vanilla pumps, conveyors or other native logic until in-game tests.
6. Render image keys are placeholders; asset binding and actual in-game appearance must be verified.
7. API signatures come from documentation, not a runtime test in v0.6.1. Watch console for registration warnings.
8. No Tier 8/9 recipes, actual semiconductors, new storage container, liquid vessel or power sensors have been shipped.

## Engineering path
- Validate structure loading, build menu, placement data, signal linker, save/reload and processing API in 0.6.1.
- Replace sampled area with physical **Inventory Box** and **Fluid Tank** that own material quantities; implement real intake, capacity, back-pressure and release without duplication or loss.
- Support explicit wire linking of quantities using a mod-owned numeric network with durable node ids and topology serialization. Use vanilla binary wires as adapter.
- Implement arithmetic combinator and memory cell with deterministic bounded tick propagation and loop handling.
- Add safe controllable interfaces for pumps, valves, conveyors, grinders, smelters, grower, dispenser and reaction chamber; only show supported endpoints.
- Add charging meter and battery grid sensor after verifying energy API.
- Build Tier 8 and Tier 9 in the research tree and balance existing resource output sinks.

## Reference
Official API: https://sandustry.com/sandkit.html
Community implementation guide: https://sandustry.dev/wiki/adding-a-new-structure
