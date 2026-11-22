const jt = "https://api.github.com", kt = "paca.sync.github";
function P() {
  try {
    const e = localStorage.getItem(kt), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function q(e, t, o = {}) {
  return await fetch(`${jt}${t}`, {
    ...o,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${e}`,
      ...o.headers ?? {}
    }
  });
}
function Q(e, t) {
  throw e.status === 401 ? new Error("توکن گیت‌هاب نامعتبر یا منقضی است") : e.status === 403 ? new Error("توکن اجازهٔ دسترسی ندارد (Contents: Read and write لازم است)") : e.status === 404 ? new Error("مخزن پیدا نشد یا توکن به آن دسترسی ندارد") : new Error(`${t}: GitHub ${e.status}`);
}
const pt = (e) => e.split("/").map(encodeURIComponent).join("/");
function $t(e) {
  const t = new TextEncoder().encode(e);
  let o = "";
  for (let n = 0; n < t.length; n += 32768)
    o += String.fromCharCode(...t.subarray(n, n + 32768));
  return btoa(o);
}
function At(e) {
  const t = atob(e.replace(/\s/g, "")), o = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) o[n] = t.charCodeAt(n);
  return new TextDecoder().decode(o);
}
let R = null;
async function yt() {
  const e = P();
  if (!e) throw new Error("unlinked");
  const t = await q(
    e.token,
    `/repos/${e.repo}/contents/${pt(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return R = null, "";
  t.ok || Q(t, "read");
  const o = await t.json();
  if (R = o.sha, o.content && o.encoding === "base64") return At(o.content);
  const n = await q(e.token, `/repos/${e.repo}/git/blobs/${o.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || Q(n, "read"), await n.text();
}
async function bt(e) {
  const t = P();
  if (!t) throw new Error("unlinked");
  const o = (i) => q(t.token, `/repos/${t.repo}/contents/${pt(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: $t(e),
      branch: t.branch || "main",
      ...i ? { sha: i } : {}
    })
  });
  let n = await o(R);
  (n.status === 409 || n.status === 422) && (await yt(), n = await o(R)), n.ok || Q(n, "write"), R = (await n.json()).content?.sha ?? null;
}
function _t() {
  return P() ? "github" : ht() ? "drive" : null;
}
const N = "https://www.googleapis.com/drive/v3", Tt = "https://www.googleapis.com/upload/drive/v3", ot = "Paca", G = "paca-sync.json", it = "application/vnd.google-apps.folder", U = "paca.sync.token", mt = "paca.sync.link", vt = "paca.sync.auto", Nt = "paca.sync.status";
function Z(e, t) {
  try {
    const o = e.getItem(t);
    return o ? JSON.parse(o) : null;
  } catch {
    return null;
  }
}
function gt(e, t, o) {
  try {
    e.setItem(t, JSON.stringify(o));
  } catch {
  }
}
let D = Z(sessionStorage, U) ?? Z(localStorage, U);
function st() {
  return P() ? !0 : !!(D && D.value && D.exp - 6e4 > Date.now());
}
async function Pt() {
  if (st() && D) return D.value;
  throw new Error("auth");
}
function z() {
  return P() ? { folderId: "", fileId: "github" } : ht();
}
function ht() {
  const e = Z(localStorage, mt);
  return e && e.fileId ? e : null;
}
function Et(e) {
  gt(localStorage, mt, e);
}
function Lt() {
  try {
    return localStorage.getItem(vt) !== "false";
  } catch {
    return !0;
  }
}
function Ot(e) {
  gt(localStorage, Nt, e);
}
async function T(e, t = {}) {
  const o = await Pt(), n = await fetch(e, {
    ...t,
    cache: "no-store",
    headers: { ...t.headers ?? {}, Authorization: `Bearer ${o}` }
  });
  if (n.status === 401) {
    D = null;
    try {
      sessionStorage.removeItem(U), localStorage.removeItem(U);
    } catch {
    }
    throw new Error("auth");
  }
  if (!n.ok) throw new Error(`drive ${n.status}`);
  return n;
}
const xt = (e, t) => `${N}/files?${new URLSearchParams({
  q: e,
  fields: t,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function V(e, t) {
  return (await (await T(xt(e, t))).json()).files ?? [];
}
async function Dt() {
  const t = (await (await T(`${N}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await V(
    `name = '${ot}' and mimeType = '${it}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await T(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: ot, mimeType: it })
  })).json()).id);
  let i = (await V(
    `name = '${G}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!i) {
    const r = await V(
      `name = '${G}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    r[0] && (await T(
      `${N}/files/${r[0].id}?addParents=${n}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), i = r[0].id);
  }
  i || (i = (await (await T(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: G,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const l = { folderId: n, fileId: i, email: t };
  return Et(l), l;
}
async function Bt() {
  if (P()) return yt();
  const e = z();
  if (!e) throw new Error("unlinked");
  try {
    return await (await T(`${N}/files/${e.fileId}?alt=media`)).text();
  } catch (t) {
    if (String(t?.message).includes("404")) {
      const o = await Dt();
      return await (await T(`${N}/files/${o.fileId}?alt=media`)).text();
    }
    throw t;
  }
}
async function Ct(e) {
  if (P()) return bt(e);
  const t = z();
  if (!t) throw new Error("unlinked");
  await T(
    `${Tt}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
let J = null;
function Mt() {
  if (J) return J;
  const e = [document.getElementById("root"), document.getElementById("app"), document.body.firstElementChild];
  for (const t of e) {
    if (!t) continue;
    const o = Object.keys(t).find((i) => i.startsWith("__reactContainer$"));
    if (!o) continue;
    let n = [t[o]], s = 0;
    for (; n.length && s < 2e4; ) {
      const i = n.pop();
      if (s += 1, !i) continue;
      const l = i.memoizedProps?.client;
      if (l && typeof l.invalidateQueries == "function")
        return J = l, J;
      i.sibling && n.push(i.sibling), i.child && n.push(i.child), n.length > 5e3 && (n = n.slice(-5e3));
    }
  }
  return null;
}
function Rt() {
  try {
    const e = Mt();
    e && e.invalidateQueries();
  } catch {
  }
  try {
    document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new Event("focus"));
  } catch {
  }
}
const wt = "pacaDriveFiles";
function Jt(e) {
  const t = e?.[wt];
  if (Array.isArray(t))
    return t.filter(
      (o) => !!o && typeof o == "object" && typeof o.id == "string"
    );
}
function F(e) {
  return Array.isArray(e.driveFiles) ? { [wt]: e.driveFiles } : {};
}
const Ft = ["word_count", "price_per_word", "amount"];
function Ut(e) {
  const t = {};
  for (const o of Ft) {
    const n = e?.[o], s = typeof n == "number" ? n : typeof n == "string" && n.trim() !== "" ? Number(n) : NaN;
    Number.isFinite(s) && (t[o] = s);
  }
  return Object.keys(t).length ? t : void 0;
}
function Ht(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const rt = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, X = (e, t) => rt(e.updatedAt) >= rt(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function Kt(e, t) {
  if (!e) return t;
  if (!t) return e;
  const o = /* @__PURE__ */ new Map();
  for (const s of t.projects) o.set(s.syncId, s);
  for (const s of e.projects) {
    const i = o.get(s.syncId);
    o.set(s.syncId, i ? X(s, i) : s);
  }
  const n = /* @__PURE__ */ new Map();
  for (const s of t.tasks) n.set(s.syncId, s);
  for (const s of e.tasks) {
    const i = n.get(s.syncId);
    n.set(s.syncId, i ? X(s, i) : s);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...zt(e, t),
    format: "paca-sync",
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sync: {
      rev: Math.max(e.sync?.rev ?? 0, t.sync?.rev ?? 0),
      updatedBy: e.sync?.updatedBy ?? "paca",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    projects: Array.from(o.values()),
    tasks: Array.from(n.values())
  };
}
function zt(e, t) {
  const o = {}, n = [
    ["timeEntries", "id"],
    ["timeLogs", "syncId"]
  ];
  for (const [s, i] of n) {
    const l = e[s], r = t[s];
    if (!Array.isArray(l) && !Array.isArray(r)) continue;
    const f = /* @__PURE__ */ new Map();
    for (const a of r ?? []) f.set(String(a[i]), a);
    for (const a of l ?? []) {
      const m = f.get(String(a[i]));
      f.set(String(a[i]), m ? X(a, m) : a);
    }
    o[s] = Array.from(f.values());
  }
  return o;
}
function M(e) {
  return JSON.stringify([e.name ?? "", e.description ?? ""]);
}
function at(e) {
  return JSON.stringify([
    e.title ?? "",
    e.description ?? null,
    e.importance ?? 0,
    e.tags ?? [],
    e.statusName ?? null,
    H(e.startDate),
    H(e.dueDate),
    e.fields ?? null,
    e.driveFiles ? e.driveFiles.map((t) => t.id) : null
  ]);
}
function H(e) {
  if (!e) return null;
  const t = Date.parse(e);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}
function ct(e) {
  return JSON.stringify([
    e.taskSyncId ?? "",
    (e.date ?? "").slice(0, 10),
    St(e),
    e.note ?? ""
  ]);
}
function St(e) {
  const t = Number(e.minutes);
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  const o = Number(e.seconds);
  return Number.isFinite(o) && o > 0 ? Math.max(1, Math.round(o / 60)) : 0;
}
const Yt = "/api/v1", k = "pacaSyncId", L = "pacaSyncSeen", O = "pacaSyncUpdatedAt", tt = "pacaSyncTimeLogs", K = "com.paca.time-logging";
class I extends Error {
}
async function S(e, t) {
  const o = await fetch(`${Yt}${e}`, {
    ...t,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...t?.body ? { "Content-Type": "application/json" } : {},
      ...t?.headers ?? {}
    }
  });
  if (o.status === 401) throw new I("unauthorized");
  if (!o.ok) {
    let s = "";
    try {
      const i = await o.json();
      s = i?.error ? `: ${i.error}` : "";
    } catch {
    }
    throw new Error(`HTTP ${o.status}${s}`);
  }
  if (o.status === 204) return;
  const n = await o.json();
  return n?.data ?? n;
}
async function Gt() {
  const e = [];
  let t = 1;
  for (; ; ) {
    const o = await S(
      `/projects?page=${t}&page_size=100`
    ), n = o.items ?? [];
    e.push(...n);
    const s = typeof o.total == "number" ? o.total : e.length;
    if (n.length === 0 || e.length >= s || t > 50) break;
    t += 1;
  }
  return e;
}
let W = !0;
async function Vt(e) {
  try {
    return await dt(e, W);
  } catch (t) {
    if (!W || t instanceof I) throw t;
    return W = !1, dt(e, !1);
  }
}
async function dt(e, t) {
  const o = [];
  let n = null;
  for (; ; ) {
    const s = new URLSearchParams({ page_size: "200" });
    t && s.set("include", "assignees"), n && s.set("cursor", n);
    const i = await S(
      `/projects/${e}/tasks?${s.toString()}`
    );
    if (o.push(...i.items ?? []), n = i.next_cursor ?? null, !n) break;
  }
  return o;
}
async function Wt(e) {
  try {
    const t = await S(
      `/projects/${e}/task-statuses`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof I) throw t;
    return [];
  }
}
async function qt(e) {
  try {
    const t = await S(
      `/projects/${e}/members?page_size=100`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof I) throw t;
    return [];
  }
}
const ut = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function Qt(e, t) {
  const o = await Zt(e);
  if (o) return o;
  const n = [];
  for (const s of t)
    try {
      const i = await S(
        `/plugins/${K}/projects/${e}/tasks/${s}/time-logs`
      );
      n.push(...Array.isArray(i) ? i : i?.logs ?? []);
    } catch (i) {
      if (i instanceof I) throw i;
      return null;
    }
  return n;
}
async function Zt(e) {
  const t = [];
  for (let o = 1; o <= 200; o += 1) {
    let n;
    try {
      n = await S(
        `/plugins/${K}/projects/${e}/time-logs?page_size=100&page=${o}`
      );
    } catch (l) {
      if (l instanceof I) throw l;
      return null;
    }
    const s = Array.isArray(n) ? n : n?.logs ?? [];
    t.push(...s);
    const i = Array.isArray(n) ? t.length : n?.total ?? t.length;
    if (s.length === 0 || t.length >= i || Array.isArray(n)) break;
  }
  return t;
}
function x() {
  return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
async function Xt(e) {
  const t = await Gt(), o = [], n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  let i = [], l = !1;
  for (let c = 0; c < t.length; c += 1) {
    const u = t[c].id, p = await Vt(u);
    if (o.push(...p), n.set(u, await Wt(u)), i) {
      const w = p.length ? await Qt(u, p.map((j) => j.id)) : [];
      w === null ? i = null : p.length && (l = !0, i.push(...w), w.length && s.set(u, await qt(u)));
    }
  }
  const r = [], f = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), m = (/* @__PURE__ */ new Date()).toISOString();
  for (const c of t) {
    const u = { ...c.settings ?? {} }, p = M({
      name: c.name,
      description: c.description ?? "",
      createdAt: c.created_at,
      updatedAt: c.created_at
    });
    let w = !1, j = typeof u[k] == "string" ? u[k] : "";
    j || (j = x(), u[k] = j, w = !0);
    const $ = typeof u[L] == "string" ? u[L] : null;
    let _;
    $ === null ? (u[L] = p, u[O] = c.created_at, _ = c.created_at, w = !0) : $ !== p ? (u[L] = p, u[O] = m, _ = m, w = !0) : _ = typeof u[O] == "string" ? u[O] : c.created_at, w && (await S(`/projects/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: u })
    }), c.settings = u), a.set(c.id, j), f.set(j, c), r.push({
      syncId: j,
      name: c.name,
      description: c.description ?? "",
      createdAt: c.created_at,
      updatedAt: _
    });
  }
  const d = [], y = /* @__PURE__ */ new Map();
  for (const c of o) {
    const u = { ...c.custom_fields ?? {} };
    let p = typeof u[k] == "string" ? u[k] : "";
    if (!p) {
      p = x();
      const E = await S(
        `/projects/${c.project_id}/tasks/${c.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...u, [k]: p }
          })
        }
      );
      E?.updated_at && (c.updated_at = E.updated_at);
    }
    y.set(p, c);
    const w = (n.get(c.project_id) ?? []).find(
      (E) => E.id === c.status_id
    ), j = (c.assignees ?? []).map(ut).filter(Boolean), $ = {
      syncId: p,
      projectSyncId: a.get(c.project_id) ?? "",
      title: c.title,
      description: c.description ?? null,
      importance: c.importance ?? 0,
      tags: c.tags ?? [],
      createdAt: c.created_at,
      updatedAt: c.updated_at ?? c.created_at,
      startDate: c.start_date ?? null,
      dueDate: c.due_date ?? null
    }, _ = Ut(c.custom_fields);
    _ && ($.fields = _);
    const B = Jt(c.custom_fields);
    B && ($.driveFiles = B), w && ($.statusName = w.name, $.statusCategory = w.category), c.assignees && ($.assignee = j[0] ?? null, $.assignees = j), d.push($);
  }
  const h = new Map(o.map((c) => [c.id, c])), A = new Map(t.map((c) => [c.id, c])), b = /* @__PURE__ */ new Map();
  let g = null;
  if (i && l) {
    g = [];
    for (const u of i) {
      const p = h.get(u.task_id);
      if (!p) continue;
      const j = A.get(p.project_id)?.settings?.[tt] ?? {}, $ = typeof j[u.id] == "string" ? j[u.id] : u.id;
      b.set($, u);
      const _ = Number(u.minutes_spent) || 0, B = (s.get(p.project_id) ?? []).find(
        (E) => E.id === u.member_id
      );
      g.push({
        syncId: $,
        taskSyncId: String(p.custom_fields?.[k] ?? ""),
        projectSyncId: a.get(p.project_id) ?? "",
        date: String(u.spent_date ?? "").slice(0, 10),
        minutes: _,
        seconds: _ * 60,
        note: u.note ?? "",
        ...B ? { member: ut(B) } : {},
        createdAt: u.created_at,
        updatedAt: u.updated_at || u.created_at
      });
    }
    const c = /* @__PURE__ */ new Map();
    for (const [u, p] of y) c.set(p.id, u);
    for (const u of g)
      if (!u.taskSyncId) {
        const p = b.get(u.syncId);
        u.taskSyncId = (p && c.get(p.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: o,
    projectRecords: r,
    taskRecords: d,
    projectBySync: f,
    taskBySync: y,
    statusesByProject: n,
    timeLogRecords: g,
    logBySync: b,
    localTimeLogs: i ?? []
  };
}
function te(e, t) {
  return {
    format: "paca-sync",
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sync: {
      rev: t,
      updatedBy: "paca-web",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    projects: e.projectRecords,
    tasks: e.taskRecords,
    ...e.timeLogRecords ? { timeLogs: e.timeLogRecords } : {}
  };
}
const v = (e) => {
  const t = e?.message ?? String(e);
  return /Failed to fetch|NetworkError|Load failed/i.test(t) ? "ارتباط با سرور محلی پاکا برقرار نشد" : t;
};
async function ee(e, t, o) {
  const n = {
    title: t.title || "(بدون عنوان)",
    custom_fields: { ...F(t), [k]: t.syncId }
  };
  try {
    return await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        ...n,
        custom_fields: { ...t.fields ?? {}, ...F(t), [k]: t.syncId },
        description: nt(t) ?? void 0,
        importance: t.importance ?? 0,
        tags: t.tags ?? [],
        ...et(t, null, o)
      })
    });
  } catch (s) {
    if (s instanceof I) throw s;
    const i = await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify(n)
    }).catch((r) => {
      throw r instanceof I ? r : new Error(`${v(s)} / ${v(r)}`);
    }), l = [
      { description: nt(t) ?? void 0 },
      { importance: t.importance ?? 0 },
      { tags: t.tags ?? [] },
      ...t.fields ? [{ custom_fields: { ...t.fields, ...F(t), [k]: t.syncId } }] : [],
      ...Object.entries(et(t, null, o)).map(([r, f]) => ({ [r]: f }))
    ];
    for (const r of l)
      try {
        await S(`/projects/${e}/tasks/${i.id}`, {
          method: "PATCH",
          body: JSON.stringify(r)
        });
      } catch (f) {
        if (f instanceof I) throw f;
      }
    return i;
  }
}
async function ne(e, t) {
  if (!t) return 0;
  const o = new Set(t.projects.map((i) => i.syncId)), n = (i) => (i || "").replace(/\s+/g, " ").trim();
  let s = 0;
  for (const i of t.projects) {
    if (i.deleted || e.projectBySync.has(i.syncId)) continue;
    const l = e.projectRecords.filter(
      (d) => !o.has(d.syncId) && n(d.name) === n(i.name)
    );
    if (l.length !== 1) continue;
    const r = l[0], f = e.projectBySync.get(r.syncId);
    if (!f) continue;
    const a = { ...f.settings ?? {}, [k]: i.syncId };
    await S(`/projects/${f.id}`, { method: "PATCH", body: JSON.stringify({ settings: a }) }), f.settings = a;
    const m = r.syncId;
    e.projectBySync.delete(m), e.projectBySync.set(i.syncId, f), r.syncId = i.syncId;
    for (const d of e.taskRecords) d.projectSyncId === m && (d.projectSyncId = i.syncId);
    for (const d of e.timeLogRecords ?? []) d.projectSyncId === m && (d.projectSyncId = i.syncId);
    s += 1;
  }
  return s;
}
async function se(e, t, o = /* @__PURE__ */ new Set()) {
  const n = {
    createdProjects: 0,
    createdTasks: 0,
    updatedProjects: 0,
    updatedTasks: 0,
    createdTimeLogs: 0,
    updatedTimeLogs: 0,
    presentProjects: [],
    failures: []
  }, s = /* @__PURE__ */ new Map();
  for (const r of t.projectRecords)
    s.set(r.syncId, r);
  const i = /* @__PURE__ */ new Map();
  for (const r of t.taskRecords)
    i.set(r.syncId, r);
  const l = /* @__PURE__ */ new Map();
  for (const r of e.projects) {
    const f = t.projectBySync.get(r.syncId);
    if (r.deleted) continue;
    if (!f) {
      let d;
      try {
        d = await S("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: r.name,
            description: r.description ?? "",
            task_id_prefix: re(r.name, r.syncId),
            settings: {
              [k]: r.syncId,
              [L]: M(r),
              [O]: r.updatedAt
            }
          })
        });
      } catch (y) {
        if (y instanceof I) throw y;
        n.failures.push(`پروژهٔ «${r.name}» ساخته نشد: ${v(y)}`);
        continue;
      }
      l.set(r.syncId, d.id), n.presentProjects.push(r.syncId), n.createdProjects += 1;
      continue;
    }
    l.set(r.syncId, f.id), n.presentProjects.push(r.syncId);
    const a = s.get(r.syncId);
    if (!a || M(a) === M(r) || Date.parse(r.updatedAt) <= Date.parse(a.updatedAt)) continue;
    const m = { ...f.settings ?? {} };
    m[k] = r.syncId, m[L] = M(r), m[O] = r.updatedAt;
    try {
      await S(`/projects/${f.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: r.name,
          description: r.description ?? "",
          settings: m
        })
      }), n.updatedProjects += 1;
    } catch (d) {
      if (d instanceof I) throw d;
      n.failures.push(`پروژهٔ «${r.name}» به‌روز نشد: ${v(d)}`);
    }
  }
  for (const r of e.tasks) {
    const f = t.taskBySync.get(r.syncId);
    if (!f && r.deleted) continue;
    if (!f) {
      const y = l.get(r.projectSyncId);
      if (!y) {
        const h = e.projects.find((A) => A.syncId === r.projectSyncId);
        n.failures.push(
          h ? `کار «${r.title}» منتقل نشد: پروژهٔ «${h.name}» در این دستگاه ساخته نشد` : `کار «${r.title}» منتقل نشد: پروژهٔ آن در فایل همگام‌سازی نیست`
        );
        continue;
      }
      try {
        const h = await ee(
          y,
          r,
          t.statusesByProject.get(y) ?? []
        );
        h?.id && t.taskBySync.set(r.syncId, { ...h, project_id: y }), n.createdTasks += 1;
      } catch (h) {
        if (h instanceof I) throw h;
        n.failures.push(`کار «${r.title}» ساخته نشد: ${v(h)}`);
      }
      continue;
    }
    const a = i.get(r.syncId);
    if (!a || at(a) === at(r) || Date.parse(r.updatedAt) <= Date.parse(a.updatedAt)) continue;
    const m = { ...f.custom_fields ?? {} }, d = (y) => S(`/projects/${f.project_id}/tasks/${f.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: r.title,
        description: nt(r) ?? void 0,
        importance: r.importance ?? 0,
        tags: r.tags ?? [],
        custom_fields: { ...m, ...y ? r.fields ?? {} : {}, ...F(r), [k]: r.syncId },
        ...et(r, f, t.statusesByProject.get(f.project_id) ?? [])
      })
    });
    try {
      try {
        await d(!0);
      } catch (y) {
        if (y instanceof I || !r.fields) throw y;
        await d(!1);
      }
      n.updatedTasks += 1;
    } catch (y) {
      if (y instanceof I) throw y;
      n.failures.push(`کار «${r.title}» به‌روز نشد: ${v(y)}`);
    }
  }
  if (t.timeLogRecords && Array.isArray(e.timeLogs))
    try {
      await ie(e, t, o, n);
    } catch (r) {
      if (r instanceof I) throw r;
      n.failures.push(`زمان‌های ثبت‌شده منتقل نشدند: ${v(r)}`);
    }
  return n;
}
function et(e, t, o) {
  const n = {};
  if (e.statusName !== void 0 || e.statusCategory !== void 0) {
    const s = o.find((i) => i.name === e.statusName) ?? o.find((i) => i.category === e.statusCategory);
    s && s.id !== t?.status_id && (n.status_id = s.id);
  }
  for (const [s, i] of [
    ["startDate", "start_date"],
    ["dueDate", "due_date"]
  ]) {
    const l = e[s];
    l !== void 0 && H(l) !== H(t?.[i] ?? null) && (l === null ? n[i] = null : Number.isNaN(Date.parse(l)) || (n[i] = new Date(l).toISOString()));
  }
  return n;
}
function nt(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const o = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof o != "string" ? t ?? null : oe(o);
}
function oe(e) {
  const t = { textColor: "default", backgroundColor: "default", textAlignment: "right" }, o = (s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(
    (i) => i.startsWith("**") && i.endsWith("**") ? { type: "text", text: i.slice(2, -2), styles: { bold: !0 } } : { type: "text", text: i, styles: {} }
  ), n = [];
  for (const s of e.split(/\r?\n/)) {
    const i = s.trimEnd();
    if (!i.trim()) continue;
    const l = i.match(/^(#{1,3})\s+(.*)$/), r = i.match(/^\s*[-*•]\s+(.*)$/), f = i.match(/^\s*[0-9۰-۹]+[.)]\s+(.*)$/);
    l ? n.push({ id: x(), type: "heading", props: { ...t, level: l[1].length }, content: o(l[2]), children: [] }) : r ? n.push({ id: x(), type: "bulletListItem", props: t, content: o(r[1]), children: [] }) : f ? n.push({ id: x(), type: "numberedListItem", props: t, content: o(f[1]), children: [] }) : n.push({ id: x(), type: "paragraph", props: t, content: o(i), children: [] });
  }
  return n;
}
async function ie(e, t, o, n) {
  const s = /* @__PURE__ */ new Map();
  for (const a of t.timeLogRecords ?? []) s.set(a.syncId, a);
  const i = /* @__PURE__ */ new Map(), l = (a) => {
    let m = i.get(a.id);
    return m || (m = { ...a.settings ?? {} }, i.set(a.id, m)), m;
  }, r = async (a, m, d) => {
    const y = t.projects.find((b) => b.id === a);
    if (!y) return;
    const h = l(y), A = { ...h[tt] ?? {} };
    A[m] = d, h[tt] = A, await S(`/projects/${a}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: h })
    }), y.settings = h;
  }, f = /* @__PURE__ */ new Set();
  for (const a of e.timeLogs ?? []) {
    if (a.deleted) continue;
    const m = St(a), d = String(a.date ?? "").slice(0, 10);
    if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const y = t.logBySync.get(a.syncId);
    if (y) {
      const g = s.get(a.syncId);
      if (!g || ct(g) === ct(a) || Date.parse(a.updatedAt) <= Date.parse(g.updatedAt)) continue;
      const c = t.tasks.find((u) => u.id === y.task_id);
      if (!c) continue;
      try {
        await S(
          `/plugins/${K}/projects/${c.project_id}/tasks/${c.id}/time-logs/${y.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ spent_date: d, minutes_spent: m, note: a.note ?? "" })
          }
        ), n.updatedTimeLogs += 1;
      } catch (u) {
        if (u instanceof I) throw u;
      }
      continue;
    }
    const h = t.taskBySync.get(a.taskSyncId);
    if (!h) continue;
    const A = t.localTimeLogs.find((g) => {
      const c = (s.get(g.id) ? g.id : "") || "";
      return c && !o.has(c) && !f.has(c) && g.task_id === h.id && String(g.spent_date).slice(0, 10) === d && Number(g.minutes_spent) === m && (g.note ?? "") === (a.note ?? "");
    });
    if (A) {
      await r(h.project_id, A.id, a.syncId), f.add(A.id);
      continue;
    }
    let b = null;
    try {
      b = await S(
        `/plugins/${K}/projects/${h.project_id}/tasks/${h.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: d, minutes_spent: m, note: a.note ?? "" })
        }
      );
    } catch (g) {
      if (g instanceof I) throw g;
      continue;
    }
    b?.id && await r(h.project_id, b.id, a.syncId), n.createdTimeLogs += 1;
  }
  f.size && (e.timeLogs = (e.timeLogs ?? []).filter((a) => !f.has(a.syncId)));
}
function re(e, t) {
  const o = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((o.length >= 2 ? o.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
async function ae(e, t) {
  const o = [];
  for (const n of e.projects) {
    if (!n.deleted) continue;
    const s = t.projectBySync.get(n.syncId);
    if (!s) continue;
    try {
      await S(`/projects/${s.id}`, { method: "DELETE" });
    } catch (l) {
      if (l instanceof I) throw l;
      continue;
    }
    t.projectBySync.delete(n.syncId), t.projects = t.projects.filter((l) => l.id !== s.id);
    const i = /* @__PURE__ */ new Set();
    for (const [l, r] of t.taskBySync)
      r.project_id === s.id && (i.add(r.id), t.taskBySync.delete(l));
    for (const [l, r] of t.logBySync)
      i.has(r.task_id) && t.logBySync.delete(l);
    o.push(n.name);
  }
  return o;
}
function lt(e) {
  if (!e) return "";
  const t = [...e.projects].sort((s, i) => s.syncId.localeCompare(i.syncId)).map((s) => [s.syncId, s.name, s.description, s.updatedAt, !!s.deleted]), o = [...e.tasks].sort((s, i) => s.syncId.localeCompare(i.syncId)).map((s) => [
    s.syncId,
    s.projectSyncId,
    s.title,
    JSON.stringify(s.description ?? null),
    s.importance,
    JSON.stringify(s.tags ?? []),
    s.updatedAt,
    s.statusName ?? null,
    s.assignee ?? null,
    s.startDate ?? null,
    s.dueDate ?? null,
    !!s.deleted,
    JSON.stringify(s.fields ?? null),
    JSON.stringify(s.driveFiles ? s.driveFiles.map((i) => i.id) : null)
  ]), n = [...e.timeLogs ?? []].sort((s, i) => s.syncId.localeCompare(i.syncId)).map((s) => [s.syncId, s.taskSyncId, s.date, s.minutes, s.note, s.updatedAt, !!s.deleted]);
  return JSON.stringify([t, o, n]);
}
function ce(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return Ht(t) ? t : null;
  } catch {
    return null;
  }
}
const It = "paca-sync.known-projects";
function de() {
  try {
    const e = localStorage.getItem(It);
    if (!e) return null;
    const t = JSON.parse(e);
    return Array.isArray(t) ? new Set(t.map(String)) : null;
  } catch {
    return null;
  }
}
function ue(e) {
  try {
    localStorage.setItem(It, JSON.stringify(e));
  } catch {
  }
}
function le(e, t, o) {
  const n = (/* @__PURE__ */ new Date()).toISOString(), s = [], i = /* @__PURE__ */ new Set();
  o && ![...o].some((a) => t.has(a)) && (o = null);
  const l = e.projects.map((a) => a.deleted ? (i.add(a.syncId), a) : o && o.has(a.syncId) && !t.has(a.syncId) ? (i.add(a.syncId), s.push(a.name), { ...a, deleted: !0, updatedAt: n }) : a);
  if (!i.size) return { bundle: e, deletedHere: s };
  const r = e.tasks.map(
    (a) => i.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: n } : a
  ), f = e.timeLogs?.map(
    (a) => i.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: n } : a
  );
  return { bundle: { ...e, projects: l, tasks: r, ...f ? { timeLogs: f } : {} }, deletedHere: s };
}
let C = null;
function fe(e = {}) {
  return C || (C = (async () => {
    const t = () => Date.now();
    try {
      if (!z())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: t()
        };
      if (!st())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: t()
        };
      e.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const o = await Bt(), n = ce(o);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const s = await Xt();
      await ne(s, n);
      const i = te(s, n?.sync?.rev ?? 0), l = de(), { bundle: r, deletedHere: f } = le(
        Kt(i, n) ?? i,
        new Set(s.projectBySync.keys()),
        l
      ), a = await ae(r, s), m = new Set((n?.timeLogs ?? []).map((p) => p.syncId)), d = await se(r, s, m), y = lt(n), h = lt(r), A = d.createdProjects + d.createdTasks + d.updatedProjects + d.updatedTasks + d.createdTimeLogs + d.updatedTimeLogs + f.length + a.length;
      if (y !== h || !n) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const p = Math.max(n?.sync?.rev ?? 0, 0) + 1, w = {
          ...r,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: p,
            updatedBy: _t() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await Ct(JSON.stringify(w, null, 2));
      }
      ue(d.presentProjects);
      const b = r.tasks.filter(
        (p) => !p.deleted && !s.taskBySync.has(p.syncId)
      ), g = (p) => String(p).replace(/\d/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[Number(w)]), c = [];
      d.createdProjects && c.push(`${g(d.createdProjects)} پروژهٔ جدید`), d.createdTasks && c.push(`${g(d.createdTasks)} کار جدید`), d.updatedProjects && c.push(`${g(d.updatedProjects)} پروژهٔ به‌روزشده`), d.updatedTasks && c.push(`${g(d.updatedTasks)} کار به‌روزشده`), d.createdTimeLogs && c.push(`${g(d.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), d.updatedTimeLogs && c.push(`${g(d.updatedTimeLogs)} زمان به‌روزشده`), f.length && c.push(`حذف پروژهٔ ${f.map((p) => `«${p}»`).join("، ")} در فایل ثبت شد`), a.length && c.push(`پروژهٔ ${a.map((p) => `«${p}»`).join("، ")} که جای دیگر حذف شده بود این‌جا هم حذف شد`);
      const u = `در این دستگاه: ${g(s.projects.length + d.createdProjects)} پروژه و ${g(s.taskBySync.size)} کار (کارها در «بک‌لاگ محصول» هر پروژه).`;
      if (d.failures.length || b.length) {
        const p = d.failures.slice(0, 3).join("؛ "), w = d.failures.length > 3 ? ` و ${g(d.failures.length - 3)} مورد دیگر` : "";
        return {
          outcome: "PARTIAL",
          message: `همگام‌سازی ناقص ماند: ${g(Math.max(b.length, d.failures.length))} مورد از فایل به پاکا نیامد.` + (p ? ` ${p}${w}.` : "") + (c.length ? ` انجام‌شده: ${c.join("، ")}.` : "") + ` ${u}`,
          at: t(),
          created: d.createdProjects + d.createdTasks + d.createdTimeLogs,
          updated: d.updatedProjects + d.updatedTasks + d.updatedTimeLogs,
          failures: d.failures
        };
      }
      return A > 0 ? {
        outcome: "MERGED",
        message: `همگام‌سازی انجام شد؛ ${c.join("، ")}. ${u}`,
        at: t(),
        created: d.createdProjects + d.createdTasks + d.createdTimeLogs,
        updated: d.updatedProjects + d.updatedTasks + d.updatedTimeLogs
      } : n ? y !== h ? {
        outcome: "PUSHED",
        message: "تغییرات پاکا ذخیره شد.",
        at: t()
      } : { outcome: "UP_TO_DATE", message: `همه‌چیز به‌روز است. ${u}`, at: t() } : {
        outcome: "PUSHED",
        message: "فایل همگام‌سازی ساخته شد و داده‌های پاکا در آن ذخیره شد.",
        at: t()
      };
    } catch (o) {
      const n = o?.message ?? String(o);
      return n === "auth" ? {
        outcome: "NEEDS_PERMISSION",
        message: "دسترسی گوگل منقضی شده؛ دوباره وارد شوید.",
        at: t()
      } : n === "unlinked" ? {
        outcome: "NOT_LINKED",
        message: "اتصال همگام‌سازی قطع است.",
        at: t()
      } : {
        outcome: "FAILED",
        message: `خطا در همگام‌سازی: ${n}`,
        at: t()
      };
    }
  })(), C.finally(() => {
    C = null;
  }));
}
let ft = 0;
async function Y(e = !1) {
  if (!(!z() || !Lt() || !st()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - ft < 2e4)) {
    ft = Date.now();
    try {
      const t = await fe();
      Ot(t), (t.outcome === "MERGED" || t.outcome === "PARTIAL") && (Rt(), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
    } catch {
    }
  }
}
setTimeout(() => void Y(!0), 6e3);
setInterval(() => void Y(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && Y();
});
window.addEventListener("online", () => void Y(!0));
