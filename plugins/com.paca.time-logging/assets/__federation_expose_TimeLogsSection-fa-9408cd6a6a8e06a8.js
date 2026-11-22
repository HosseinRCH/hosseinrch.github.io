import { importShared } from './__federation_fn_import-CnoyXxDr.js';
import { j as jsxRuntimeExports } from './jsx-runtime-XI9uIe3W.js';
import { c as createLucideIcon, T, $, u as useTimeLogViewer, t as todayDateString, b as PLUGIN_ID, f as formatMinutes, C as Clock, j as canManageTimeLog, e as Trash2, h as parseDurationToMinutes } from './shared-CTpTqwss.js';

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
const Plus = createLucideIcon("plus", __iconNode);

const {useMutation,useQuery,useQueryClient} = await importShared('@tanstack/react-query');
const {useMemo,useState} = await importShared('react');
function kfJalaliDate(v) {
  try {
    var s = String(v || "").slice(0, 10);
    var d = new Date(s + "T00:00:00");
    if (isNaN(d.getTime())) return String(v || "");
    return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(d);
  } catch (e) {
    return String(v || "");
  }
}

function kfDiv(a, b) { return ~~(a / b); }
function kfMod(a, b) { return a - ~~(a / b) * b; }
var kfBreaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
function kfJalCal(jy, withoutLeap) {
  var bl = kfBreaks.length, gy = jy + 621, leapJ = -14, jp = kfBreaks[0], jm, jump, leap, leapG, march, n, i;
  for (i = 1; i < bl; i += 1) {
    jm = kfBreaks[i]; jump = jm - jp; if (jy < jm) break;
    leapJ = leapJ + kfDiv(jump, 33) * 8 + kfDiv(kfMod(jump, 33), 4); jp = jm;
  }
  n = jy - jp;
  leapJ = leapJ + kfDiv(n, 33) * 8 + kfDiv(kfMod(n, 33) + 3, 4);
  if (kfMod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  leapG = kfDiv(gy, 4) - kfDiv((kfDiv(gy, 100) + 1) * 3, 4) - 150;
  march = 20 + leapJ - leapG;
  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + kfDiv(jump + 4, 33) * 33;
    leap = kfMod(kfMod(n + 1, 33) - 1, 4); if (leap === -1) leap = 4;
  }
  return { leap: leap, gy: gy, march: march };
}
function kfG2D(gy, gm, gd) {
  var d = kfDiv((gy + kfDiv(gm - 8, 6) + 100100) * 1461, 4) + kfDiv(153 * kfMod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - kfDiv(kfDiv(gy + 100100 + kfDiv(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function kfD2G(jdn) {
  var j = 4 * jdn + 139361631;
  j = j + kfDiv(kfDiv(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  var i = kfDiv(kfMod(j, 1461), 4) * 5 + 308;
  var gd = kfDiv(kfMod(i, 153), 5) + 1;
  var gm = kfMod(kfDiv(i, 153), 12) + 1;
  var gy = kfDiv(j, 1461) - 100100 + kfDiv(8 - gm, 6);
  return { gy: gy, gm: gm, gd: gd };
}
function kfJ2D(jy, jm, jd) {
  var r = kfJalCal(jy, true);
  return kfG2D(r.gy, 3, r.march) + (jm - 1) * 31 - kfDiv(jm, 7) * (jm - 7) + jd - 1;
}
function kfD2J(jdn) {
  var gy = kfD2G(jdn).gy, jy = gy - 621, r = kfJalCal(jy, false), jdn1f = kfG2D(gy, 3, r.march), jd, jm, k;
  k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) { jm = 1 + kfDiv(k, 31); jd = kfMod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd }; }
    k -= 186;
  } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
  jm = 7 + kfDiv(k, 30); jd = kfMod(k, 30) + 1;
  return { jy: jy, jm: jm, jd: jd };
}
function kfG2J(gy, gm, gd) { return kfD2J(kfG2D(gy, gm, gd)); }
function kfJ2G(jy, jm, jd) { return kfD2G(kfJ2D(jy, jm, jd)); }
function kfJalaliInput(g) {
  if (!g) return "";
  var p = String(g).slice(0, 10).split("-").map(Number);
  if (p.length !== 3 || p.some(isNaN)) return String(g);
  var j = kfG2J(p[0], p[1], p[2]);
  return j.jy + "/" + String(j.jm).padStart(2, "0") + "/" + String(j.jd).padStart(2, "0");
}
function kfJalaliToGregorian(s) {
  var m = String(s || "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!m) return null;
  var g = kfJ2G(Number(m[1]), Number(m[2]), Number(m[3]));
  return g.gy + "-" + String(g.gm).padStart(2, "0") + "-" + String(g.gd).padStart(2, "0");
}
function TimeLogsSection(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(T, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TimeLogsSectionInner, { ...props }) });
}
function TimeLogsSectionInner({ projectId, taskId }) {
  const api = useMemo(
    () => new $({
      baseUrl: `${window.location.origin}/api/v1`,
      projectId,
      fetch: (url, init) => window.fetch(url, { ...init, credentials: "include" })
    }),
    [projectId]
  );
  const qc = useQueryClient();
  const queryKey = ["plugin", PLUGIN_ID, "time-logs", projectId, taskId];
  const viewer = useTimeLogViewer(api, projectId);
  const [date, setDate] = useState(todayDateString());
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const { data: logs = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.pluginGet(PLUGIN_ID, `/projects/${projectId}/tasks/${taskId}/time-logs`)
  });
  const totalMinutes = logs.reduce((sum, l) => sum + l.minutes_spent, 0);
  const invalidate = () => qc.invalidateQueries({ queryKey });
  const createLog = useMutation({
    mutationFn: (payload) => api.pluginPost(
      PLUGIN_ID,
      `/projects/${projectId}/tasks/${taskId}/time-logs`,
      payload
    ),
    onSuccess: () => {
      invalidate();
      setDuration("");
      setNote("");
    }
  });
  const deleteLog = useMutation({
    mutationFn: (logId) => api.pluginDelete(PLUGIN_ID, `/projects/${projectId}/tasks/${taskId}/time-logs/${logId}`),
    onSuccess: () => {
      invalidate();
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(err instanceof Error ? err.message : "حذف ثبت زمان انجام نشد.");
    }
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    const minutes = parseDurationToMinutes(duration);
    if (!minutes || minutes <= 0) {
      setFormError('مدت را مانند 1h30m، 45m یا 90 (دقیقه) وارد کنید.');
      return;
    }
    if (!date) {
      setFormError("یک تاریخ انتخاب کنید.");
      return;
    }
    createLog.mutate({ spent_date: date, minutes_spent: minutes, note });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "زمان ثبت‌شده" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-linear-to-r from-border/40 to-transparent" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground/70", children: formatMinutes(totalMinutes) })
    ] }),
    !!viewer?.can_write_tasks && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "form",
      {
        onSubmit: handleSubmit,
        className: "flex flex-wrap items-center gap-2 rounded-xl border border-border/25 bg-card/50 p-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              defaultValue: kfJalaliInput(date),
              onChange: (e) => { const g = kfJalaliToGregorian(e.target.value); if (g) setDate(g); },
              placeholder: "۱۴۰۵/۰۸/۲۷",
              title: "تاریخ جلالی",
              inputMode: "numeric",
              className: "w-28 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "1h30m",
              value: duration,
              onChange: (e) => setDuration(e.target.value),
              className: "w-20 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "یادداشت (اختیاری)",
              value: note,
              onChange: (e) => setNote(e.target.value),
              className: "min-w-40 flex-1 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "submit",
              disabled: createLog.isPending,
              className: "flex items-center gap-1.5 rounded-lg bg-muted/40 text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground px-2.5 py-1.5 text-xs font-semibold transition-all duration-150",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3" }),
                "ثبت زمان"
              ]
            }
          ),
          formError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "w-full text-xs text-destructive", children: formError })
        ]
      }
    ),
    isLoading ? null : logs.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: logs.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 rounded-lg border border-border/20 bg-card/40 px-3 py-2",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-3.5 shrink-0 opacity-60" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold", children: formatMinutes(l.minutes_spent) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/70", children: kfJalaliDate(l.spent_date) }),
          l.note && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 truncate text-xs text-muted-foreground/60", children: l.note }),
          canManageTimeLog(viewer, l.member_id) && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => deleteLog.mutate(l.id),
              className: "ml-auto text-muted-foreground/50 hover:text-destructive",
              "aria-label": "حذف ثبت زمان",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
            }
          )
        ]
      },
      l.id
    )) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-1 py-3 text-muted-foreground/45", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-4 opacity-70" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm italic", children: "هنوز زمانی ثبت نشده است" })
    ] }),
    deleteError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: deleteError })
  ] });
}

export { TimeLogsSection as default };
