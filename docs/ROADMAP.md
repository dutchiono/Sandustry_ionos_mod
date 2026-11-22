# Execution roadmap (acceptance criteria)

This is the backlog, not a declaration that items are already done.

## M0: Reference audit
- [x] Establish official Sandkit API sources.
- [x] Confirm support for structures, signal senders/targets, triggers, placement data and tech unlock API.
- [ ] Verify all vanilla 0.6.1 element/structure IDs from the actual runtime.
- [ ] Inventory every controllable vanilla receiver; record test results.
- [ ] Verify exact Florinol→Aura dependency and Tier 7 unlocks in game.

## M1: Signal foundations
- [x] Add initial probe and decider structures in source.
- [x] Bounded per-probe particle scan.
- [x] Unit test comparator.
- [ ] Load mod in game; verify sprite, placement, menu unlock, and saves.
- [ ] Validate Signal Linker works with probe and decider.
- [ ] Prove no broken vanilla machine state from target registration.
- [ ] Add debugging inspector for live numeric readings.

## M2: Physical instrumented storage (priority)
- [ ] Solid box: explicit accepted materials, real material conservation, capacity, overflow.
- [ ] Fluid/gas tank: pipe inputs/outputs and separate pressure/volume accounting.
- [ ] Energy/battery sensor: read native stored energy with no global magic.
- [ ] Dedicated wire port on structures.

## M3: Proper circuits
- [ ] Numeric signal transport through wired graph; stable IDs, persistence, deterministic ticks.
- [ ] Decider with signal selection, numeric comparator, output count.
- [ ] Arithmetic and memory combinators; copy/paste settings.
- [ ] Debug overlay showing wire values and network topology.
- [ ] Wire-to-vanilla binary adapter.
- [ ] Machine ON/OFF actuators and fail-safe behavior.

## M4: Tier 8
- [ ] Register semiconductor processing elements with appropriate physical behavior.
- [ ] Implement wafer furnace, lithography, acid recovery, process cooling and module assembler.
- [ ] Research chain and building unlocks.
- [ ] Mass/energy balance tests and throughput balancing.

## M5: Tier 9
- [ ] Industrial control cores, factory supervisor, advanced storage.
- [ ] Autonomous orbital supply megaproject with measured throughput and stability requirements.
- [ ] Regression testing and saved-game compatibility.
- [ ] Workshop release and tested screenshots.

## Testing gate
No item is marked *complete* solely from source code or a unit test. Real game integration requires manual/equivalent runtime verification with Sandustry 0.6.x.
