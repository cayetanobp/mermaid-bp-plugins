import type { Flow } from './flow';

/** Relates Mermaid SVG paths to their connection, including one or three loop paths. */
export function edgePathMap(flow: Flow): Map<string, number> {
  const paths = new Map<string, number>(), counts = new Map<string, number>();
  const ambiguous = new Set<string>();
  const add = (id: string, index: number) => { if (paths.has(id)) ambiguous.add(id); else paths.set(id, index); };
  flow.edges.forEach((edge, index) => {
    const pair = `${edge.from}_${edge.to}`, count = counts.get(pair) ?? 0;
    add(`L_${pair}_${count === 0 ? 0 : count + 1}`, index); counts.set(pair, count + 1);
    // Recent Mermaid versions use one loop path; keep the three-path IDs for older versions.
    if (edge.from === edge.to) {
      for (const suffix of ['1', 'mid', '2']) add(`${edge.from}-cyclic-special-${suffix}`, index);
    }
  });
  for (const id of ambiguous) paths.delete(id);
  return paths;
}
