import {
  ACTION_LABELS,
  ACTORS,
  ACTOR_LABELS,
  type Actor,
  type Cell,
  type Matrix,
  type Severity,
  type Verdict,
} from "@/lib/auditor/types";
import { compareCellsWorstFirst } from "@/lib/auditor/evaluate";

const VERDICT_LABEL: Record<Verdict, string> = {
  alone: "Alone",
  cooperation: "Cooperation",
  cannot: "Cannot",
  unknown: "Unknown",
};

function sevStyle(sev: Severity): React.CSSProperties {
  const map: Record<Severity, [string, string]> = {
    critical: ["var(--critical-bg)", "var(--critical-fg)"],
    high: ["var(--high-bg)", "var(--high-fg)"],
    medium: ["var(--medium-bg)", "var(--medium-fg)"],
    info: ["var(--info-bg)", "var(--info-fg)"],
  };
  const [bg, fg] = map[sev];
  return { background: bg, color: fg };
}

function verifiedBadge(v: Cell["verified"]) {
  if (v === "not-verified")
    return <span className="small muted" title="The config does not determine this."> · not verified</span>;
  if (v === "doc-only")
    return <span className="small muted" title="Inferred from documentation / config, not exercised by a test."> · doc-only</span>;
  return <span className="small"> · {v}</span>;
}

function CellBox({ cell }: { cell: Cell }) {
  const showSev = cell.verdict !== "cannot";
  // fixed table layout means unbroken tokens (rule ids) must be allowed to
  // break, or they overflow their now-fixed column — hence overflowWrap.
  return (
    <td style={{ ...sevStyle(cell.severity), padding: "8px 10px", border: "1px solid var(--border)", verticalAlign: "top", overflowWrap: "anywhere" }}>
      <div style={{ fontWeight: 600 }}>
        {VERDICT_LABEL[cell.verdict]}
        {showSev ? <span className="small" style={{ opacity: 0.8 }}> ({cell.severity})</span> : null}
        {verifiedBadge(cell.verified)}
      </div>
      {cell.note ? <div className="small" style={{ marginTop: 4, opacity: 0.9 }}>{cell.note}</div> : null}
      <div className="small" style={{ marginTop: 4, opacity: 0.6 }}>
        rule: {cell.ruleId}
        {cell.evidence ? (
          <> · <a href={cell.evidence} target="_blank" rel="noreferrer">evidence</a></>
        ) : null}
      </div>
    </td>
  );
}

/** Order rows (actions) worst-first: by the worst cell in each row. */
function orderedActions(matrix: Matrix) {
  const byAction = new Map<string, Cell[]>();
  for (const c of matrix.cells) {
    const arr = byAction.get(c.action) ?? [];
    arr.push(c);
    byAction.set(c.action, arr);
  }
  return [...byAction.entries()]
    .map(([action, cells]) => ({
      action: action as Cell["action"],
      cells,
      worst: [...cells].sort(compareCellsWorstFirst)[0],
    }))
    .sort((a, b) => compareCellsWorstFirst(a.worst, b.worst));
}

function cellFor(cells: Cell[], actor: Actor): Cell {
  return cells.find((c) => c.actor === actor)!;
}

export function MatrixTable({ matrix }: { matrix: Matrix }) {
  const rows = orderedActions(matrix);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720, tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 10px", border: "1px solid var(--border)", background: "var(--panel)" }}>
              Action \ Actor
            </th>
            {ACTORS.map((actor) => (
              <th key={actor} style={{ textAlign: "left", padding: "8px 10px", border: "1px solid var(--border)", background: "var(--panel)" }}>
                {ACTOR_LABELS[actor]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ action, cells }) => (
            <tr key={action}>
              <th style={{ textAlign: "left", padding: "8px 10px", border: "1px solid var(--border)", background: "var(--panel)" }}>
                {ACTION_LABELS[action]}
              </th>
              {ACTORS.map((actor) => (
                <CellBox key={actor} cell={cellFor(cells, actor)} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
