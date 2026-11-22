# Tier 8 & Tier 9 — Industrial Expansion design

**Design spec, not shipped gameplay.** Requires verifying actual 0.6.x vanilla IDs, quantities, recipes, unlock positions and asset hooks.

## Premise
New industry consumes established intermediate and advanced products. Do not introduce a third starter ore. Florinol remains relevant as a large-scale fluid feedstock and Aura remains an expensive bottleneck, not a dead-end display resource.

## Tier 8: Instrumentation & Fabrication
Entry: after Tier 7 orbital/silicon branch; integrate late Tier 5/6 sensors earlier so basic logic is accessible before silicon.

### Processes
- **Silicon → Wafers** via precision furnace, with heat/cooling constraints.
- **Wafers + Aura → Logic Dies** via lithography, with waste/defect output affected by temperature stability.
- **Logic Dies + Nickel → Control Modules**: prerequisite for programmable industrial controllers.
- **Acid** becomes a functional cleaning/etching reagent; unsafe overfeeding wastes product and demands recycle loops.
- **Florinol** becomes process cooling/chemical feedstock with closed-loop recovery instead of arbitrary money sinks.

### Unlockable equipment
- Physical solid warehouse, liquid/gas vessels, metered collector adapter, power meter.
- Decider, arithmetic combinator, memory cell, numeric signals and proper wiring visualization.
- Signal controllable valves, pumps, conveyors, sorting devices, furnace and reaction chamber.
- Wafer furnace, lithography station, acid recovery plant, module assembler.

### Challenges
- Manufacture logic dies consistently under temperature and pressure limits.
- Recover most of the Florinol rather than consuming infinite fresh supplies.
- Handle waste/Acid without contaminating adjacent streams.
- Keep controls functional after save/load, disconnection and power loss.

## Tier 9: Autonomous Industry
Entry: manufacturing Control Modules at throughput, plus verified original Tier 7/8 milestone prerequisites.

### Processes
- **Logic Dies + Aura + Power Cells → Industrial Control Cores**.
- **Florinol + Acid recycle → Ultra-pure Process Medium**; economic demand constrained by real losses.
- **Control Cores + Nickel + advanced fluid processing → Factory Supervisors**.
- Existing alloys and materials should be reused where possible. Any new intermediates must have real engineering function.

### Equipment
- Multi-input chemical plant with sensors and controllable routing.
- Industrial controller with user-defined state machine, PID-like control (optional), circuit display/debugger.
- High-volume storage, demand-based dispatch and load shedding.
- Factory supervisory terminal reading physically wired sensors.

### Megaproject
**Autonomous Orbital Supply Plant**: maintain concurrent output quotas for Silicon components, processed Aura and Power Cells while respecting a limited power envelope. Not a one-off submit-100000-items quest. It should require real factory stability across several production cycles.

## Balance targets (provisional)
- At least two viable factory layouts for every major process.
- No irreversible softlocks or free material duplication.
- Continued need for at least Florinol, Aura, Silicon, Nickel, Acid and existing energy.
- Tier 8 broadens automation capacity; Tier 9 tests autonomous control.
- Avoid raw numerical grind; rely on throughput stability, byproducts, energy and waste.

## What to avoid
- Inventing new ores merely to lengthen the chain.
- Artificial contracts or collectible counters as progression.
- Global, telepathic storage measurements.
- Calling a simulated local pixel-count a tank.
