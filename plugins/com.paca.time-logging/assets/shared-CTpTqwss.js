import { importShared } from './__federation_fn_import-CnoyXxDr.js';
import { j as jsxRuntimeExports } from './jsx-runtime-XI9uIe3W.js';

const {createContext:o,useContext:c,useMemo:_} = await importShared('react');

const {QueryClient:d,QueryClientProvider:p,useQuery:P} = await importShared('@tanstack/react-query');

class $ {
  constructor(e) {
    this.baseUrl = e.baseUrl.replace(/\/$/, ""), this.projectId = e.projectId ?? "", this._fetch = e.fetch;
  }
  // ── Core read-only helpers ──────────────────────────────────────────────
  /**
   * The first page of the current project's tasks (up to 200 by default).
   * A project with more matching tasks is truncated: use `listTasksPage` and
   * follow `next_cursor` when every task matters.
   */
  async listTasks(e = {}) {
    return (await this.listTasksPage(e)).items;
  }
  /**
   * One page of the current project's tasks with optional filters. Pass the
   * previous page's `next_cursor` as `filters.cursor` for the next page.
   * Defaults to the host's max page size (200) when the caller doesn't
   * specify one, since the host otherwise defaults to only 20.
   */
  async listTasksPage(e = {}) {
    var i, a;
    const t = new URLSearchParams();
    e.cursor && t.set("cursor", e.cursor), (i = e.status_ids) != null && i.length && t.set("status_ids", e.status_ids.join(",")), (a = e.assignee_ids) != null && a.length && t.set("assignee_ids", e.assignee_ids.join(",")), e.sprint_id && t.set("sprint_id", e.sprint_id), e.parent_task_id && t.set("parent_task_id", e.parent_task_id), t.set("page_size", String(e.page_size ?? 200));
    const s = t.toString(), n = `${this.baseUrl}/projects/${this.projectId}/tasks${s ? `?${s}` : ""}`;
    return this._get(n);
  }
  /** Get a single task by ID. */
  async getTask(e) {
    return this._get(
      `${this.baseUrl}/projects/${this.projectId}/tasks/${e}`
    );
  }
  /** Get the current project summary. */
  async getProject() {
    return this._get(
      `${this.baseUrl}/projects/${this.projectId}`
    );
  }
  /**
   * One page of the current project's members (cursor-paginated). Pass
   * `ids` to look up specific members, `search` to filter by name; follow
   * `next_cursor` for further pages.
   */
  async listMembers(e = {}) {
    var n;
    const t = new URLSearchParams();
    e.search && t.set("search", e.search), (n = e.ids) != null && n.length && t.set("ids", e.ids.join(",")), e.cursor && t.set("cursor", e.cursor), e.pageSize && t.set("page_size", String(e.pageSize));
    const s = t.toString();
    return this._get(
      `${this.baseUrl}/projects/${this.projectId}/members${s ? `?${s}` : ""}`
    );
  }
  // ── Plugin route helpers ────────────────────────────────────────────────
  /**
   * Call a GET route registered by this plugin.
   * The URL is built as `{baseUrl}/plugins/{pluginId}{path}`.
   * For project-scoped routes, include the project prefix in `path`:
   *   `pluginGet(id, \`/projects/${api.projectId}/resource\`)`
   */
  async pluginGet(e, t) {
    return this._get(this._pluginUrl(e, t));
  }
  /**
   * Call a POST route registered by this plugin.
   */
  async pluginPost(e, t, s) {
    return this._request("POST", this._pluginUrl(e, t), s);
  }
  /**
   * Call a PATCH route registered by this plugin.
   */
  async pluginPatch(e, t, s) {
    return this._request("PATCH", this._pluginUrl(e, t), s);
  }
  /**
   * Call a DELETE route registered by this plugin.
   */
  async pluginDelete(e, t) {
    await this._request(
      "DELETE",
      this._pluginUrl(e, t),
      void 0
    );
  }
  // ── Internals ───────────────────────────────────────────────────────────
  _pluginUrl(e, t) {
    const s = t.startsWith("/") ? t : `/${t}`;
    return `${this.baseUrl}/plugins/${e}${s}`;
  }
  async _get(e) {
    return this._request("GET", e, void 0);
  }
  async _request(e, t, s) {
    const n = {
      method: e,
      headers: { "Content-Type": "application/json" }
    };
    s !== void 0 && (n.body = JSON.stringify(s));
    const i = await this._fetch(t, n);
    if (!i.ok) {
      const h = await i.text().catch(() => i.statusText);
      throw new Error(
        `[PluginApiClient] ${e} ${t} → ${i.status}: ${h}`
      );
    }
    return i.status === 204 ? void 0 : (await i.json()).data;
  }
}
o(null);
const g = o(null);
function T({
  children: r,
  queryClient: e
}) {
  const t = _(
    () => new d({
      defaultOptions: {
        queries: { retry: 1, staleTime: 3e4 }
      }
    }),
    []
  ), s = e ?? t;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(g.Provider, { value: s, children: /* @__PURE__ */ jsxRuntimeExports.jsx(p, { client: s, children: r }) });
}

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);
const toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
const mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
};

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

const {forwardRef: forwardRef$1,createElement: createElement$1} = await importShared('react');

const Icon = forwardRef$1(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => createElement$1(
    "svg",
    {
      ref,
      ...defaultAttributes,
      width: size,
      height: size,
      stroke: color,
      strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
      className: mergeClasses("lucide", className),
      ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
      ...rest
    },
    [
      ...iconNode.map(([tag, attrs]) => createElement$1(tag, attrs)),
      ...Array.isArray(children) ? children : [children]
    ]
  )
);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

const {forwardRef,createElement} = await importShared('react');

const createLucideIcon = (iconName, iconNode) => {
  const Component = forwardRef(
    ({ className, ...props }, ref) => createElement(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
};

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
];
const Clock = createLucideIcon("clock", __iconNode$1);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode);

const PLUGIN_ID = "com.paca.time-logging";

const {useQuery} = await importShared('@tanstack/react-query');
function formatMinutes(minutes) {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function parseDurationToMinutes(input) {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "") return null;
  const hm = trimmed.match(/^(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+)m)?$/);
  if (hm && (hm[1] || hm[2])) {
    const hours = hm[1] ? parseFloat(hm[1]) : 0;
    const mins = hm[2] ? parseInt(hm[2], 10) : 0;
    return Math.round(hours * 60 + mins);
  }
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    return Math.round(asNumber);
  }
  return null;
}
function todayDateString() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function formatDate(spentDate) {
  const [y, m, d] = spentDate.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return spentDate;
  return new Date(y, m - 1, d).toLocaleDateString(void 0, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function isoDaysAgo(n) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function isoFirstOfMonth() {
  const d = /* @__PURE__ */ new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
function presetLabel(preset) {
  switch (preset) {
    case "today":
      return "Today";
    case "week":
      return "7 days";
    case "month":
      return "This month";
    case "all":
      return "All time";
  }
}
const PAGE_SIZES = [10, 25, 50];
function useTimeLogViewer(api, projectId, enabled = true) {
  const { data } = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "viewer", projectId],
    queryFn: () => api.pluginGet(PLUGIN_ID, `/projects/${projectId}/time-logs/me`),
    staleTime: 5 * 60 * 1e3,
    enabled
  });
  return data;
}
function useTimeLogViewerAll(api, enabled = true) {
  const { data } = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "viewer-all"],
    queryFn: () => api.pluginGet(PLUGIN_ID, "/time-logs/viewer-all"),
    staleTime: 5 * 60 * 1e3,
    enabled
  });
  return data;
}
function canManageTimeLog(viewer, memberId) {
  if (!viewer || !viewer.can_write_tasks) return false;
  return viewer.can_manage_all || viewer.member_id === memberId;
}

export { $, Clock as C, PAGE_SIZES as P, T, useTimeLogViewerAll as a, PLUGIN_ID as b, createLucideIcon as c, formatDate as d, Trash2 as e, formatMinutes as f, isoFirstOfMonth as g, parseDurationToMinutes as h, isoDaysAgo as i, canManageTimeLog as j, presetLabel as p, todayDateString as t, useTimeLogViewer as u };
