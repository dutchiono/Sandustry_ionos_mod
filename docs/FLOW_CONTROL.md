# Circuit-controlled fluid infrastructure

Implemented in `main.js` for the experimental Sandustry mod.

## Early automation (available before semiconductor tiers)

All of the following devices are intended to be available with **Industrial Automation**, rather than locked behind semiconductor fabrication.

| Building | Material inlet | Material outlet | Circuit input | Behavior |
|---|---|---|---|---|
| Gas Filter | LEFT | matched RIGHT, rejected BELOW | ABOVE | Gas-only selection. Other phases remain untouched |
| Liquid Filter | LEFT | matched RIGHT, rejected BELOW | ABOVE | Liquid-only selection. Other phases remain untouched |
| Combined Separator | LEFT | matched RIGHT, rejected BELOW | ABOVE | Works on liquids and gases |
| Signal Pump | LEFT | RIGHT | ABOVE | Moves gas/liquid as configured; cannot pull solids |
| Gas Vent | LEFT | ABOVE | BELOW | Emits gas into physical world |
| Liquid Outlet | LEFT | BELOW | ABOVE | Releases liquid into physical world |
| Circuit Pipe Gate | existing pipe segment RIGHT | original pipe network | ABOVE | Enables/disables a **vanilla pipe segment** via `api.pipes.setEnabledAtCell` |

The **Circuit Pipe Gate** is the route for controlling existing vanilla pumps and Liquid Vents through native pipe flow; it does **not** replace or teleport their contents. Place a data cable on the top of the gate, with the pipe segment on the right.

## Signal setup

1. Connect the selected sensor / storage reading through physical **Data Cable** segments.
2. Run that circuit to the control port indicated above. Gas Vent has a BELOW circuit port so its output can vent upward.
3. In the building's configuration, choose **Control = circuit**.
4. Select a signal, typically `enable`. Set the threshold. A reading at or above threshold enables the transfer; otherwise it stops.
5. With **Control = always**, the new pump, vent, or filter runs without requiring a circuit. The pipe gate defaults to circuit mode.

Signal propagation is tick-delayed through the existing combinator network. Lack of a connected wire yields a zero signal. The custom devices must not remove material if their outlet is blocked. Gas-only structures never move liquid; liquid-only ones never move gas; neither moves solids.

## How this relates to native pumps

The game's existing Pump and Liquid Vent use real Pipe networks. The new `pipe-gate` calls the documented `sandkit.api.pipes.setEnabledAtCell(x,y,enabled)` on the **adjacent native pipe segment**. This is the safest currently documented integration for gating vanilla fluid delivery.

The `fluid-pump`, `gas-vent`, `liquid-outlet`, `gas-filter`, `liquid-filter` and `phase-filter` are separate *mod-added, single-cell spatial transfer devices*, not patches to the vanilla Pump or Liquid Vent. They operate on individual world particles at a configured rate. A native pipe segment can carry liquid or gas along the existing simulation topology, whereas a spatial transfer building performs a single local cell-to-cell move. Do not confuse them.

## Limitations

- A vanilla Pump's own motor/speed is not directly toggled. The pipe gate shuts its selected adjoining pipe. Different network layouts must be validated in-game.
- A native Liquid Vent may have specific internal flow mechanics, so whether shutting the selected pipe has the intended immediate backpressure needs live testing.
- No new Liquid Hydrogen or Liquid Oxygen elements are in this delivery. Cryogenic production requires verifying real phase/temperature hooks before release.
- This mod still has not been installed and confirmed in a live Sandustry build; all device behavior described here has been source-level simulated.

## Tier 10/11 scope

**Tier 10 candidate:** cryogenic gas compression, hydrogen/oxygen liquefaction with refrigeration and genuinely insulated storage, plus thermal monitoring. This should be optional infrastructure and must reuse existing Electrolyzer, Condenser, thermal buffers, and pipe-network controls where possible.

**Tier 11 candidate:** optional advanced circuit-grade equipment using completed chips for plant-wide orchestration. Do not lock everyday pumps, vents, filters or storage behind Tier 11; they're core quality-of-life mechanics.

## References

- https://sandustry.dev/api/pipes
- https://sandustry.dev/api/structures
- https://sandustry.dev/enums/structure-type
