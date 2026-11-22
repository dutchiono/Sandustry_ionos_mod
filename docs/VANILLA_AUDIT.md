# Vanilla baseline / facts and gaps

| Mechanic | Present in vanilla (from official/community sources) | Our role |
|---|---|---|
| Florinol and Aura | Yes, existing advanced progression | Extend, don't replace |
| Silicon processing | Yes in Tier 7 | Build useful fabrication downstream |
| Nickel Power Cell | Yes | Measure/control real batteries, don't duplicate |
| Acid | Yes | Additional industrial etchant/recovery sink |
| Vanilla circuit sender/receiver | Boolean API documented | Add meaningful sensors/actuators |
| Signal-controlled doors | Supported by reported vanilla behavior | Maintain compatibility |
| Pumps, conveyors, dispenser control | **Unverified** | Test adapters and add only verified control |
| Physical quantities on wires | **Not documented** in Sandkit boolean signals | Add numeric wiring carefully |

## Useful primary references
- Sandkit: https://sandustry.com/sandkit.html
- Official API reference: https://wiki.hoodedhorse.com/Sandustry/API_Reference
- Community mods API: https://sandustry.dev/
- Structures: https://sandustry.dev/wiki/adding-a-new-structure
- Signal targets / senders: see official Sandkit sections

## Audit tasks still open
- Read the actual 0.6.1 game entity and recipe definitions, verify names and exact production amounts.
- Enumerate which vanilla machines obey signal toggling through the target registration hook.
- Confirm storage versus material collection behavior; test item conservation through every intake/output.
- Confirm exact silicon, acid, and Florinol recipes and their upgrade costs before adding balanced downstream recipes.
