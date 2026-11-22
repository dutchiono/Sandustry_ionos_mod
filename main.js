// Iono's Industrial Expansion — Sandkit API v1.
// Entry is evaluated as an async function body with sandkit injected; do not import/export.
const api = sandkit.api;
const PREFIX = "iono";
const PROBE = PREFIX + "-material-probe";
const DECIDER = PREFIX + "-decider";
const BRIDGED = ["grower", "grinder", "smelter", "electrolyzer", "reactionChamber"];
const safe = (label, action) => {
  try { return action(); }
  catch (error) { console.warn("[IonoExpansion] " + label, error); return null; }
};
const int = (n, fallback) => Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : fallback;
const limit = (n, low, high) => Math.max(low, Math.min(high, n));
const compare = (a, op, b) => ({
  "<": a < b, "<=": a <= b, "=": a === b, ">=": a >= b, ">": a > b, "!=": a !== b
})[op] ?? false;

function registerStructure(id, name, description, order, defaultData) {
  safe("register " + id, () => api.structures.register({
    id, name, description, categoryKey: "logistics", order,
    buildModes: [{ type: "single" }],
    defaultData, copyData: true,
    render: { imageName: id, size: { width: 1, height: 1 } }
  }));
}

registerStructure(PROBE, "Material Probe",
  "Count selected particles in a bounded area around the probe and output a threshold signal.",
  90, { material: "florinol", radius: 5, threshold: 20, count: 0, active: false });
registerStructure(DECIDER, "Decider Combinator",
  "Compare a nearby probe count against a threshold, then output ON/OFF on a native signal link.",
  91, { operator: "<", threshold: 20, lastValue: 0, active: false });

safe("probe placement config", () => api.structures.registerPlacementConfig({
  structureId: PROBE, fields: [
    { type: "integer", id: "radius", label: "Sample radius (cells)", default: 5, min: 1, max: 12 },
    { type: "integer", id: "threshold", label: "ON at count >= ", default: 20, min: 0, max: 625 }
  ]
}));
safe("decider placement config", () => api.structures.registerPlacementConfig({
  structureId: DECIDER, fields: [
    { type: "choice", id: "operator", label: "Compare", default: "<",
      options: ["<", "<=", "=", ">=", ">", "!="].map(value => ({ label: value, value })) },
    { type: "integer", id: "threshold", label: "Threshold", default: 20, min: 0, max: 625 }
  ]
}));

function readMaterialCount(structure) {
  const radius = limit(int(structure.data?.radius, 5), 1, 12);
  const material = String(structure.data?.material || "florinol");
  let count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const x = structure.x + dx, y = structure.y + dy;
      try {
        const type = api.elements.getTypeAtCell(x, y);
        if (type !== null && type !== undefined &&
            String(api.elements.getIdByType(type)).toLowerCase() === material.toLowerCase()) count++;
      } catch (_) { /* outside world bounds: skip */ }
    }
  }
  return count;
}

function nearbyProbe(structure) {
  // Numeric readings are LOCAL adjacency only; standard signal links carry boolean values.
  const offsets = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dx, dy] of offsets) {
    const x = structure.x + dx, y = structure.y + dy;
    if (safe("probe adjacency", () => api.structures.isTypeAtCell(x, y, PROBE))) {
      return safe("read probe", () => api.structures.getAtCell(x, y));
    }
  }
  return null;
}

safe("register probe sender", () => api.signals.registerSenderType(PROBE, structure => !!structure.data?.active));
safe("register decider sender", () => api.signals.registerSenderType(DECIDER, structure => !!structure.data?.active));

safe("logic polling", () => api.triggers.register("iono:scan", {
  intervalMs: 500,
  callback() {
    safe("poll probes", () => api.structures.forEachOfType(PROBE, structure => {
      const count = readMaterialCount(structure);
      const active = count >= limit(int(structure.data?.threshold, 20), 0, 625);
      if (count !== structure.data?.count || active !== structure.data?.active)
        api.structures.updateData(structure, { count, active });
      safe("probe output", () => api.signals.setOutputAtCell(structure.x, structure.y, active));
    }));
    safe("poll deciders", () => api.structures.forEachOfType(DECIDER, structure => {
      const source = nearbyProbe(structure);
      const count = source ? int(source.data?.count, 0) : 0;
      const active = !!source && compare(count, structure.data?.operator || "<",
        int(structure.data?.threshold, 20));
      if (count !== structure.data?.lastValue || active !== structure.data?.active)
        api.structures.updateData(structure, { lastValue: count, active });
      safe("decider output", () => api.signals.setOutputAtCell(structure.x, structure.y, active));
    }));
  }
}));

// Register only on known vanilla types resolved by this version. This bridge
// toggles Sandkit *registered processors*, not necessarily every native machine action.
for (const id of BRIDGED) {
  safe("optional signal target " + id, () => {
    const type = api.structures.getTypeById(id);
    if (type === null || type === undefined) return;
    api.signals.targets.register(id, (structure, payload) => {
      safe("toggle " + id, () => api.structures.processing.setEnabledAtCell(
        structure.x, structure.y, !!payload.combined));
    });
  });
}

safe("unlock structures alongside Signal Devices", () => {
  if (sandkit.enums?.Tech?.SignalDevices !== undefined)
    api.tech.conservatory.appendUnlock(sandkit.enums.Tech.SignalDevices,
      { structures: [PROBE, DECIDER] });
});

safe("ready notification", () => api.events.on("game:ready", () =>
  api.ui.toast("Iono expansion: Material Probe + Decider registered (experimental).")
));
