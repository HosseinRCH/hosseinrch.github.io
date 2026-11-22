const St = "https://api.github.com", jt = "paca.sync.github";
function v() {
  try {
    const e = localStorage.getItem(jt), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function G(e, t, o = {}) {
  return await fetch(`${St}${t}`, {
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
function W(e, t) {
  throw e.status === 401 ? new Error("توکن گیت‌هاب نامعتبر یا منقضی است") : e.status === 403 ? new Error("توکن اجازهٔ دسترسی ندارد (Contents: Read and write لازم است)") : e.status === 404 ? new Error("مخزن پیدا نشد یا توکن به آن دسترسی ندارد") : new Error(`${t}: GitHub ${e.status}`);
}
const dt = (e) => e.split("/").map(encodeURIComponent).join("/");
function It(e) {
  const t = new TextEncoder().encode(e);
  let o = "";
  for (let n = 0; n < t.length; n += 32768)
    o += String.fromCharCode(...t.subarray(n, n + 32768));
  return btoa(o);
}
function kt(e) {
  const t = atob(e.replace(/\s/g, "")), o = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) o[n] = t.charCodeAt(n);
  return new TextDecoder().decode(o);
}
let M = null;
async function ut() {
  const e = v();
  if (!e) throw new Error("unlinked");
  const t = await G(
    e.token,
    `/repos/${e.repo}/contents/${dt(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return M = null, "";
  t.ok || W(t, "read");
  const o = await t.json();
  if (M = o.sha, o.content && o.encoding === "base64") return kt(o.content);
  const n = await G(e.token, `/repos/${e.repo}/git/blobs/${o.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || W(n, "read"), await n.text();
}
async function $t(e) {
  const t = v();
  if (!t) throw new Error("unlinked");
  const o = (r) => G(t.token, `/repos/${t.repo}/contents/${dt(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: It(e),
      branch: t.branch || "main",
      ...r ? { sha: r } : {}
    })
  });
  let n = await o(M);
  (n.status === 409 || n.status === 422) && (await ut(), n = await o(M)), n.ok || W(n, "write"), M = (await n.json()).content?.sha ?? null;
}
function At() {
  return v() ? "github" : mt() ? "drive" : null;
}
const E = "https://www.googleapis.com/drive/v3", bt = "https://www.googleapis.com/upload/drive/v3", tt = "Paca", z = "paca-sync.json", et = "application/vnd.google-apps.folder", lt = "paca.sync.token", ft = "paca.sync.link", _t = "paca.sync.auto", Tt = "paca.sync.status";
function pt(e, t) {
  try {
    const o = e.getItem(t);
    return o ? JSON.parse(o) : null;
  } catch {
    return null;
  }
}
function yt(e, t, o) {
  try {
    e.setItem(t, JSON.stringify(o));
  } catch {
  }
}
let D = pt(sessionStorage, lt);
function X() {
  return v() ? !0 : !!(D && D.value && D.exp - 6e4 > Date.now());
}
async function Nt() {
  if (X() && D) return D.value;
  throw new Error("auth");
}
function H() {
  return v() ? { folderId: "", fileId: "github" } : mt();
}
function mt() {
  const e = pt(localStorage, ft);
  return e && e.fileId ? e : null;
}
function Pt(e) {
  yt(localStorage, ft, e);
}
function Et() {
  try {
    return localStorage.getItem(_t) !== "false";
  } catch {
    return !0;
  }
}
function vt(e) {
  yt(localStorage, Tt, e);
}
async function T(e, t = {}) {
  const o = await Nt(), n = await fetch(e, {
    ...t,
    cache: "no-store",
    headers: { ...t.headers ?? {}, Authorization: `Bearer ${o}` }
  });
  if (n.status === 401) {
    D = null;
    try {
      sessionStorage.removeItem(lt);
    } catch {
    }
    throw new Error("auth");
  }
  if (!n.ok) throw new Error(`drive ${n.status}`);
  return n;
}
const Lt = (e, t) => `${E}/files?${new URLSearchParams({
  q: e,
  fields: t,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function K(e, t) {
  return (await (await T(Lt(e, t))).json()).files ?? [];
}
async function Ot() {
  const t = (await (await T(`${E}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await K(
    `name = '${tt}' and mimeType = '${et}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await T(`${E}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: tt, mimeType: et })
  })).json()).id);
  let r = (await K(
    `name = '${z}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!r) {
    const a = await K(
      `name = '${z}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    a[0] && (await T(
      `${E}/files/${a[0].id}?addParents=${n}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), r = a[0].id);
  }
  r || (r = (await (await T(`${E}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: z,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const l = { folderId: n, fileId: r, email: t };
  return Pt(l), l;
}
async function xt() {
  if (v()) return ut();
  const e = H();
  if (!e) throw new Error("unlinked");
  try {
    return await (await T(`${E}/files/${e.fileId}?alt=media`)).text();
  } catch (t) {
    if (String(t?.message).includes("404")) {
      const o = await Ot();
      return await (await T(`${E}/files/${o.fileId}?alt=media`)).text();
    }
    throw t;
  }
}
async function Dt(e) {
  if (v()) return $t(e);
  const t = H();
  if (!t) throw new Error("unlinked");
  await T(
    `${bt}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
let R = null;
function Bt() {
  if (R) return R;
  const e = [document.getElementById("root"), document.getElementById("app"), document.body.firstElementChild];
  for (const t of e) {
    if (!t) continue;
    const o = Object.keys(t).find((r) => r.startsWith("__reactContainer$"));
    if (!o) continue;
    let n = [t[o]], s = 0;
    for (; n.length && s < 2e4; ) {
      const r = n.pop();
      if (s += 1, !r) continue;
      const l = r.memoizedProps?.client;
      if (l && typeof l.invalidateQueries == "function")
        return R = l, R;
      r.sibling && n.push(r.sibling), r.child && n.push(r.child), n.length > 5e3 && (n = n.slice(-5e3));
    }
  }
  return null;
}
function Ct() {
  try {
    const e = Bt();
    e && e.invalidateQueries();
  } catch {
  }
  try {
    document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new Event("focus"));
  } catch {
  }
}
const Mt = ["word_count", "price_per_word", "amount"];
function Rt(e) {
  const t = {};
  for (const o of Mt) {
    const n = e?.[o], s = typeof n == "number" ? n : typeof n == "string" && n.trim() !== "" ? Number(n) : NaN;
    Number.isFinite(s) && (t[o] = s);
  }
  return Object.keys(t).length ? t : void 0;
}
function Jt(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const nt = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, V = (e, t) => nt(e.updatedAt) >= nt(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function Ut(e, t) {
  if (!e) return t;
  if (!t) return e;
  const o = /* @__PURE__ */ new Map();
  for (const s of t.projects) o.set(s.syncId, s);
  for (const s of e.projects) {
    const r = o.get(s.syncId);
    o.set(s.syncId, r ? V(s, r) : s);
  }
  const n = /* @__PURE__ */ new Map();
  for (const s of t.tasks) n.set(s.syncId, s);
  for (const s of e.tasks) {
    const r = n.get(s.syncId);
    n.set(s.syncId, r ? V(s, r) : s);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...Ht(e, t),
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
function Ht(e, t) {
  const o = {}, n = [
    ["timeEntries", "id"],
    ["timeLogs", "syncId"]
  ];
  for (const [s, r] of n) {
    const l = e[s], a = t[s];
    if (!Array.isArray(l) && !Array.isArray(a)) continue;
    const f = /* @__PURE__ */ new Map();
    for (const i of a ?? []) f.set(String(i[r]), i);
    for (const i of l ?? []) {
      const m = f.get(String(i[r]));
      f.set(String(i[r]), m ? V(i, m) : i);
    }
    o[s] = Array.from(f.values());
  }
  return o;
}
function C(e) {
  return JSON.stringify([e.name ?? "", e.description ?? ""]);
}
function st(e) {
  return JSON.stringify([
    e.title ?? "",
    e.description ?? null,
    e.importance ?? 0,
    e.tags ?? [],
    e.statusName ?? null,
    J(e.startDate),
    J(e.dueDate),
    e.fields ?? null
  ]);
}
function J(e) {
  if (!e) return null;
  const t = Date.parse(e);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}
function ot(e) {
  return JSON.stringify([
    e.taskSyncId ?? "",
    (e.date ?? "").slice(0, 10),
    gt(e),
    e.note ?? ""
  ]);
}
function gt(e) {
  const t = Number(e.minutes);
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  const o = Number(e.seconds);
  return Number.isFinite(o) && o > 0 ? Math.max(1, Math.round(o / 60)) : 0;
}
const Ft = "/api/v1", k = "pacaSyncId", L = "pacaSyncSeen", O = "pacaSyncUpdatedAt", q = "pacaSyncTimeLogs", U = "com.paca.time-logging";
class j extends Error {
}
async function S(e, t) {
  const o = await fetch(`${Ft}${e}`, {
    ...t,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...t?.body ? { "Content-Type": "application/json" } : {},
      ...t?.headers ?? {}
    }
  });
  if (o.status === 401) throw new j("unauthorized");
  if (!o.ok) {
    let s = "";
    try {
      const r = await o.json();
      s = r?.error ? `: ${r.error}` : "";
    } catch {
    }
    throw new Error(`HTTP ${o.status}${s}`);
  }
  if (o.status === 204) return;
  const n = await o.json();
  return n?.data ?? n;
}
async function zt() {
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
let Y = !0;
async function Kt(e) {
  try {
    return await rt(e, Y);
  } catch (t) {
    if (!Y || t instanceof j) throw t;
    return Y = !1, rt(e, !1);
  }
}
async function rt(e, t) {
  const o = [];
  let n = null;
  for (; ; ) {
    const s = new URLSearchParams({ page_size: "200" });
    t && s.set("include", "assignees"), n && s.set("cursor", n);
    const r = await S(
      `/projects/${e}/tasks?${s.toString()}`
    );
    if (o.push(...r.items ?? []), n = r.next_cursor ?? null, !n) break;
  }
  return o;
}
async function Yt(e) {
  try {
    const t = await S(
      `/projects/${e}/task-statuses`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof j) throw t;
    return [];
  }
}
async function Gt(e) {
  try {
    const t = await S(
      `/projects/${e}/members?page_size=100`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof j) throw t;
    return [];
  }
}
const at = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function Wt(e, t) {
  const o = await Vt(e);
  if (o) return o;
  const n = [];
  for (const s of t)
    try {
      const r = await S(
        `/plugins/${U}/projects/${e}/tasks/${s}/time-logs`
      );
      n.push(...Array.isArray(r) ? r : r?.logs ?? []);
    } catch (r) {
      if (r instanceof j) throw r;
      return null;
    }
  return n;
}
async function Vt(e) {
  const t = [];
  for (let o = 1; o <= 200; o += 1) {
    let n;
    try {
      n = await S(
        `/plugins/${U}/projects/${e}/time-logs?page_size=100&page=${o}`
      );
    } catch (l) {
      if (l instanceof j) throw l;
      return null;
    }
    const s = Array.isArray(n) ? n : n?.logs ?? [];
    t.push(...s);
    const r = Array.isArray(n) ? t.length : n?.total ?? t.length;
    if (s.length === 0 || t.length >= r || Array.isArray(n)) break;
  }
  return t;
}
function x() {
  return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
async function qt(e) {
  const t = await zt(), o = [], n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  let r = [], l = !1;
  for (let c = 0; c < t.length; c += 1) {
    const u = t[c].id, p = await Kt(u);
    if (o.push(...p), n.set(u, await Yt(u)), r) {
      const w = p.length ? await Wt(u, p.map((I) => I.id)) : [];
      w === null ? r = null : p.length && (l = !0, r.push(...w), w.length && s.set(u, await Gt(u)));
    }
  }
  const a = [], f = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), m = (/* @__PURE__ */ new Date()).toISOString();
  for (const c of t) {
    const u = { ...c.settings ?? {} }, p = C({
      name: c.name,
      description: c.description ?? "",
      createdAt: c.created_at,
      updatedAt: c.created_at
    });
    let w = !1, I = typeof u[k] == "string" ? u[k] : "";
    I || (I = x(), u[k] = I, w = !0);
    const b = typeof u[L] == "string" ? u[L] : null;
    let _;
    b === null ? (u[L] = p, u[O] = c.created_at, _ = c.created_at, w = !0) : b !== p ? (u[L] = p, u[O] = m, _ = m, w = !0) : _ = typeof u[O] == "string" ? u[O] : c.created_at, w && (await S(`/projects/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: u })
    }), c.settings = u), i.set(c.id, I), f.set(I, c), a.push({
      syncId: I,
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
      const N = await S(
        `/projects/${c.project_id}/tasks/${c.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...u, [k]: p }
          })
        }
      );
      N?.updated_at && (c.updated_at = N.updated_at);
    }
    y.set(p, c);
    const w = (n.get(c.project_id) ?? []).find(
      (N) => N.id === c.status_id
    ), I = (c.assignees ?? []).map(at).filter(Boolean), b = {
      syncId: p,
      projectSyncId: i.get(c.project_id) ?? "",
      title: c.title,
      description: c.description ?? null,
      importance: c.importance ?? 0,
      tags: c.tags ?? [],
      createdAt: c.created_at,
      updatedAt: c.updated_at ?? c.created_at,
      startDate: c.start_date ?? null,
      dueDate: c.due_date ?? null
    }, _ = Rt(c.custom_fields);
    _ && (b.fields = _), w && (b.statusName = w.name, b.statusCategory = w.category), c.assignees && (b.assignee = I[0] ?? null, b.assignees = I), d.push(b);
  }
  const h = new Map(o.map((c) => [c.id, c])), $ = new Map(t.map((c) => [c.id, c])), A = /* @__PURE__ */ new Map();
  let g = null;
  if (r && l) {
    g = [];
    for (const u of r) {
      const p = h.get(u.task_id);
      if (!p) continue;
      const I = $.get(p.project_id)?.settings?.[q] ?? {}, b = typeof I[u.id] == "string" ? I[u.id] : u.id;
      A.set(b, u);
      const _ = Number(u.minutes_spent) || 0, N = (s.get(p.project_id) ?? []).find(
        (wt) => wt.id === u.member_id
      );
      g.push({
        syncId: b,
        taskSyncId: String(p.custom_fields?.[k] ?? ""),
        projectSyncId: i.get(p.project_id) ?? "",
        date: String(u.spent_date ?? "").slice(0, 10),
        minutes: _,
        seconds: _ * 60,
        note: u.note ?? "",
        ...N ? { member: at(N) } : {},
        createdAt: u.created_at,
        updatedAt: u.updated_at || u.created_at
      });
    }
    const c = /* @__PURE__ */ new Map();
    for (const [u, p] of y) c.set(p.id, u);
    for (const u of g)
      if (!u.taskSyncId) {
        const p = A.get(u.syncId);
        u.taskSyncId = (p && c.get(p.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: o,
    projectRecords: a,
    taskRecords: d,
    projectBySync: f,
    taskBySync: y,
    statusesByProject: n,
    timeLogRecords: g,
    logBySync: A,
    localTimeLogs: r ?? []
  };
}
function Qt(e, t) {
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
const P = (e) => {
  const t = e?.message ?? String(e);
  return /Failed to fetch|NetworkError|Load failed/i.test(t) ? "ارتباط با سرور محلی پاکا برقرار نشد" : t;
};
async function Zt(e, t, o) {
  const n = {
    title: t.title || "(بدون عنوان)",
    custom_fields: { [k]: t.syncId }
  };
  try {
    return await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        ...n,
        custom_fields: { ...t.fields ?? {}, [k]: t.syncId },
        description: Z(t) ?? void 0,
        importance: t.importance ?? 0,
        tags: t.tags ?? [],
        ...Q(t, null, o)
      })
    });
  } catch (s) {
    if (s instanceof j) throw s;
    const r = await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify(n)
    }).catch((a) => {
      throw a instanceof j ? a : new Error(`${P(s)} / ${P(a)}`);
    }), l = [
      { description: Z(t) ?? void 0 },
      { importance: t.importance ?? 0 },
      { tags: t.tags ?? [] },
      ...t.fields ? [{ custom_fields: { ...t.fields, [k]: t.syncId } }] : [],
      ...Object.entries(Q(t, null, o)).map(([a, f]) => ({ [a]: f }))
    ];
    for (const a of l)
      try {
        await S(`/projects/${e}/tasks/${r.id}`, {
          method: "PATCH",
          body: JSON.stringify(a)
        });
      } catch (f) {
        if (f instanceof j) throw f;
      }
    return r;
  }
}
async function Xt(e, t) {
  if (!t) return 0;
  const o = new Set(t.projects.map((r) => r.syncId)), n = (r) => (r || "").replace(/\s+/g, " ").trim();
  let s = 0;
  for (const r of t.projects) {
    if (r.deleted || e.projectBySync.has(r.syncId)) continue;
    const l = e.projectRecords.filter(
      (d) => !o.has(d.syncId) && n(d.name) === n(r.name)
    );
    if (l.length !== 1) continue;
    const a = l[0], f = e.projectBySync.get(a.syncId);
    if (!f) continue;
    const i = { ...f.settings ?? {}, [k]: r.syncId };
    await S(`/projects/${f.id}`, { method: "PATCH", body: JSON.stringify({ settings: i }) }), f.settings = i;
    const m = a.syncId;
    e.projectBySync.delete(m), e.projectBySync.set(r.syncId, f), a.syncId = r.syncId;
    for (const d of e.taskRecords) d.projectSyncId === m && (d.projectSyncId = r.syncId);
    for (const d of e.timeLogRecords ?? []) d.projectSyncId === m && (d.projectSyncId = r.syncId);
    s += 1;
  }
  return s;
}
async function te(e, t, o = /* @__PURE__ */ new Set()) {
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
  for (const a of t.projectRecords)
    s.set(a.syncId, a);
  const r = /* @__PURE__ */ new Map();
  for (const a of t.taskRecords)
    r.set(a.syncId, a);
  const l = /* @__PURE__ */ new Map();
  for (const a of e.projects) {
    const f = t.projectBySync.get(a.syncId);
    if (a.deleted) continue;
    if (!f) {
      let d;
      try {
        d = await S("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: a.name,
            description: a.description ?? "",
            task_id_prefix: se(a.name, a.syncId),
            settings: {
              [k]: a.syncId,
              [L]: C(a),
              [O]: a.updatedAt
            }
          })
        });
      } catch (y) {
        if (y instanceof j) throw y;
        n.failures.push(`پروژهٔ «${a.name}» ساخته نشد: ${P(y)}`);
        continue;
      }
      l.set(a.syncId, d.id), n.presentProjects.push(a.syncId), n.createdProjects += 1;
      continue;
    }
    l.set(a.syncId, f.id), n.presentProjects.push(a.syncId);
    const i = s.get(a.syncId);
    if (!i || C(i) === C(a) || Date.parse(a.updatedAt) <= Date.parse(i.updatedAt)) continue;
    const m = { ...f.settings ?? {} };
    m[k] = a.syncId, m[L] = C(a), m[O] = a.updatedAt;
    try {
      await S(`/projects/${f.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: a.name,
          description: a.description ?? "",
          settings: m
        })
      }), n.updatedProjects += 1;
    } catch (d) {
      if (d instanceof j) throw d;
      n.failures.push(`پروژهٔ «${a.name}» به‌روز نشد: ${P(d)}`);
    }
  }
  for (const a of e.tasks) {
    const f = t.taskBySync.get(a.syncId);
    if (!f && a.deleted) continue;
    if (!f) {
      const y = l.get(a.projectSyncId);
      if (!y) {
        const h = e.projects.find(($) => $.syncId === a.projectSyncId);
        n.failures.push(
          h ? `کار «${a.title}» منتقل نشد: پروژهٔ «${h.name}» در این دستگاه ساخته نشد` : `کار «${a.title}» منتقل نشد: پروژهٔ آن در فایل همگام‌سازی نیست`
        );
        continue;
      }
      try {
        const h = await Zt(
          y,
          a,
          t.statusesByProject.get(y) ?? []
        );
        h?.id && t.taskBySync.set(a.syncId, { ...h, project_id: y }), n.createdTasks += 1;
      } catch (h) {
        if (h instanceof j) throw h;
        n.failures.push(`کار «${a.title}» ساخته نشد: ${P(h)}`);
      }
      continue;
    }
    const i = r.get(a.syncId);
    if (!i || st(i) === st(a) || Date.parse(a.updatedAt) <= Date.parse(i.updatedAt)) continue;
    const m = { ...f.custom_fields ?? {} }, d = (y) => S(`/projects/${f.project_id}/tasks/${f.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: a.title,
        description: Z(a) ?? void 0,
        importance: a.importance ?? 0,
        tags: a.tags ?? [],
        custom_fields: { ...m, ...y ? a.fields ?? {} : {}, [k]: a.syncId },
        ...Q(a, f, t.statusesByProject.get(f.project_id) ?? [])
      })
    });
    try {
      try {
        await d(!0);
      } catch (y) {
        if (y instanceof j || !a.fields) throw y;
        await d(!1);
      }
      n.updatedTasks += 1;
    } catch (y) {
      if (y instanceof j) throw y;
      n.failures.push(`کار «${a.title}» به‌روز نشد: ${P(y)}`);
    }
  }
  if (t.timeLogRecords && Array.isArray(e.timeLogs))
    try {
      await ne(e, t, o, n);
    } catch (a) {
      if (a instanceof j) throw a;
      n.failures.push(`زمان‌های ثبت‌شده منتقل نشدند: ${P(a)}`);
    }
  return n;
}
function Q(e, t, o) {
  const n = {};
  if (e.statusName !== void 0 || e.statusCategory !== void 0) {
    const s = o.find((r) => r.name === e.statusName) ?? o.find((r) => r.category === e.statusCategory);
    s && s.id !== t?.status_id && (n.status_id = s.id);
  }
  for (const [s, r] of [
    ["startDate", "start_date"],
    ["dueDate", "due_date"]
  ]) {
    const l = e[s];
    l !== void 0 && J(l) !== J(t?.[r] ?? null) && (l === null ? n[r] = null : Number.isNaN(Date.parse(l)) || (n[r] = new Date(l).toISOString()));
  }
  return n;
}
function Z(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const o = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof o != "string" ? t ?? null : ee(o);
}
function ee(e) {
  const t = { textColor: "default", backgroundColor: "default", textAlignment: "right" }, o = (s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(
    (r) => r.startsWith("**") && r.endsWith("**") ? { type: "text", text: r.slice(2, -2), styles: { bold: !0 } } : { type: "text", text: r, styles: {} }
  ), n = [];
  for (const s of e.split(/\r?\n/)) {
    const r = s.trimEnd();
    if (!r.trim()) continue;
    const l = r.match(/^(#{1,3})\s+(.*)$/), a = r.match(/^\s*[-*•]\s+(.*)$/), f = r.match(/^\s*[0-9۰-۹]+[.)]\s+(.*)$/);
    l ? n.push({ id: x(), type: "heading", props: { ...t, level: l[1].length }, content: o(l[2]), children: [] }) : a ? n.push({ id: x(), type: "bulletListItem", props: t, content: o(a[1]), children: [] }) : f ? n.push({ id: x(), type: "numberedListItem", props: t, content: o(f[1]), children: [] }) : n.push({ id: x(), type: "paragraph", props: t, content: o(r), children: [] });
  }
  return n;
}
async function ne(e, t, o, n) {
  const s = /* @__PURE__ */ new Map();
  for (const i of t.timeLogRecords ?? []) s.set(i.syncId, i);
  const r = /* @__PURE__ */ new Map(), l = (i) => {
    let m = r.get(i.id);
    return m || (m = { ...i.settings ?? {} }, r.set(i.id, m)), m;
  }, a = async (i, m, d) => {
    const y = t.projects.find((A) => A.id === i);
    if (!y) return;
    const h = l(y), $ = { ...h[q] ?? {} };
    $[m] = d, h[q] = $, await S(`/projects/${i}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: h })
    }), y.settings = h;
  }, f = /* @__PURE__ */ new Set();
  for (const i of e.timeLogs ?? []) {
    if (i.deleted) continue;
    const m = gt(i), d = String(i.date ?? "").slice(0, 10);
    if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const y = t.logBySync.get(i.syncId);
    if (y) {
      const g = s.get(i.syncId);
      if (!g || ot(g) === ot(i) || Date.parse(i.updatedAt) <= Date.parse(g.updatedAt)) continue;
      const c = t.tasks.find((u) => u.id === y.task_id);
      if (!c) continue;
      try {
        await S(
          `/plugins/${U}/projects/${c.project_id}/tasks/${c.id}/time-logs/${y.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ spent_date: d, minutes_spent: m, note: i.note ?? "" })
          }
        ), n.updatedTimeLogs += 1;
      } catch (u) {
        if (u instanceof j) throw u;
      }
      continue;
    }
    const h = t.taskBySync.get(i.taskSyncId);
    if (!h) continue;
    const $ = t.localTimeLogs.find((g) => {
      const c = (s.get(g.id) ? g.id : "") || "";
      return c && !o.has(c) && !f.has(c) && g.task_id === h.id && String(g.spent_date).slice(0, 10) === d && Number(g.minutes_spent) === m && (g.note ?? "") === (i.note ?? "");
    });
    if ($) {
      await a(h.project_id, $.id, i.syncId), f.add($.id);
      continue;
    }
    let A = null;
    try {
      A = await S(
        `/plugins/${U}/projects/${h.project_id}/tasks/${h.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: d, minutes_spent: m, note: i.note ?? "" })
        }
      );
    } catch (g) {
      if (g instanceof j) throw g;
      continue;
    }
    A?.id && await a(h.project_id, A.id, i.syncId), n.createdTimeLogs += 1;
  }
  f.size && (e.timeLogs = (e.timeLogs ?? []).filter((i) => !f.has(i.syncId)));
}
function se(e, t) {
  const o = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((o.length >= 2 ? o.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
async function oe(e, t) {
  const o = [];
  for (const n of e.projects) {
    if (!n.deleted) continue;
    const s = t.projectBySync.get(n.syncId);
    if (!s) continue;
    try {
      await S(`/projects/${s.id}`, { method: "DELETE" });
    } catch (l) {
      if (l instanceof j) throw l;
      continue;
    }
    t.projectBySync.delete(n.syncId), t.projects = t.projects.filter((l) => l.id !== s.id);
    const r = /* @__PURE__ */ new Set();
    for (const [l, a] of t.taskBySync)
      a.project_id === s.id && (r.add(a.id), t.taskBySync.delete(l));
    for (const [l, a] of t.logBySync)
      r.has(a.task_id) && t.logBySync.delete(l);
    o.push(n.name);
  }
  return o;
}
function it(e) {
  if (!e) return "";
  const t = [...e.projects].sort((s, r) => s.syncId.localeCompare(r.syncId)).map((s) => [s.syncId, s.name, s.description, s.updatedAt, !!s.deleted]), o = [...e.tasks].sort((s, r) => s.syncId.localeCompare(r.syncId)).map((s) => [
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
    JSON.stringify(s.fields ?? null)
  ]), n = [...e.timeLogs ?? []].sort((s, r) => s.syncId.localeCompare(r.syncId)).map((s) => [s.syncId, s.taskSyncId, s.date, s.minutes, s.note, s.updatedAt, !!s.deleted]);
  return JSON.stringify([t, o, n]);
}
function re(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return Jt(t) ? t : null;
  } catch {
    return null;
  }
}
const ht = "paca-sync.known-projects";
function ae() {
  try {
    const e = localStorage.getItem(ht);
    if (!e) return null;
    const t = JSON.parse(e);
    return Array.isArray(t) ? new Set(t.map(String)) : null;
  } catch {
    return null;
  }
}
function ie(e) {
  try {
    localStorage.setItem(ht, JSON.stringify(e));
  } catch {
  }
}
function ce(e, t, o) {
  const n = (/* @__PURE__ */ new Date()).toISOString(), s = [], r = /* @__PURE__ */ new Set();
  o && ![...o].some((i) => t.has(i)) && (o = null);
  const l = e.projects.map((i) => i.deleted ? (r.add(i.syncId), i) : o && o.has(i.syncId) && !t.has(i.syncId) ? (r.add(i.syncId), s.push(i.name), { ...i, deleted: !0, updatedAt: n }) : i);
  if (!r.size) return { bundle: e, deletedHere: s };
  const a = e.tasks.map(
    (i) => r.has(i.projectSyncId) && !i.deleted ? { ...i, deleted: !0, updatedAt: n } : i
  ), f = e.timeLogs?.map(
    (i) => r.has(i.projectSyncId) && !i.deleted ? { ...i, deleted: !0, updatedAt: n } : i
  );
  return { bundle: { ...e, projects: l, tasks: a, ...f ? { timeLogs: f } : {} }, deletedHere: s };
}
let B = null;
function de(e = {}) {
  return B || (B = (async () => {
    const t = () => Date.now();
    try {
      if (!H())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: t()
        };
      if (!X())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: t()
        };
      e.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const o = await xt(), n = re(o);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const s = await qt();
      await Xt(s, n);
      const r = Qt(s, n?.sync?.rev ?? 0), l = ae(), { bundle: a, deletedHere: f } = ce(
        Ut(r, n) ?? r,
        new Set(s.projectBySync.keys()),
        l
      ), i = await oe(a, s), m = new Set((n?.timeLogs ?? []).map((p) => p.syncId)), d = await te(a, s, m), y = it(n), h = it(a), $ = d.createdProjects + d.createdTasks + d.updatedProjects + d.updatedTasks + d.createdTimeLogs + d.updatedTimeLogs + f.length + i.length;
      if (y !== h || !n) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const p = Math.max(n?.sync?.rev ?? 0, 0) + 1, w = {
          ...a,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: p,
            updatedBy: At() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await Dt(JSON.stringify(w, null, 2));
      }
      ie(d.presentProjects);
      const A = a.tasks.filter(
        (p) => !p.deleted && !s.taskBySync.has(p.syncId)
      ), g = (p) => String(p).replace(/\d/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[Number(w)]), c = [];
      d.createdProjects && c.push(`${g(d.createdProjects)} پروژهٔ جدید`), d.createdTasks && c.push(`${g(d.createdTasks)} کار جدید`), d.updatedProjects && c.push(`${g(d.updatedProjects)} پروژهٔ به‌روزشده`), d.updatedTasks && c.push(`${g(d.updatedTasks)} کار به‌روزشده`), d.createdTimeLogs && c.push(`${g(d.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), d.updatedTimeLogs && c.push(`${g(d.updatedTimeLogs)} زمان به‌روزشده`), f.length && c.push(`حذف پروژهٔ ${f.map((p) => `«${p}»`).join("، ")} در فایل ثبت شد`), i.length && c.push(`پروژهٔ ${i.map((p) => `«${p}»`).join("، ")} که جای دیگر حذف شده بود این‌جا هم حذف شد`);
      const u = `در این دستگاه: ${g(s.projects.length + d.createdProjects)} پروژه و ${g(s.taskBySync.size)} کار (کارها در «بک‌لاگ محصول» هر پروژه).`;
      if (d.failures.length || A.length) {
        const p = d.failures.slice(0, 3).join("؛ "), w = d.failures.length > 3 ? ` و ${g(d.failures.length - 3)} مورد دیگر` : "";
        return {
          outcome: "PARTIAL",
          message: `همگام‌سازی ناقص ماند: ${g(Math.max(A.length, d.failures.length))} مورد از فایل به پاکا نیامد.` + (p ? ` ${p}${w}.` : "") + (c.length ? ` انجام‌شده: ${c.join("، ")}.` : "") + ` ${u}`,
          at: t(),
          created: d.createdProjects + d.createdTasks + d.createdTimeLogs,
          updated: d.updatedProjects + d.updatedTasks + d.updatedTimeLogs,
          failures: d.failures
        };
      }
      return $ > 0 ? {
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
  })(), B.finally(() => {
    B = null;
  }));
}
let ct = 0;
async function F(e = !1) {
  if (!(!H() || !Et() || !X()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - ct < 2e4)) {
    ct = Date.now();
    try {
      const t = await de();
      vt(t), (t.outcome === "MERGED" || t.outcome === "PARTIAL") && (Ct(), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
    } catch {
    }
  }
}
setTimeout(() => void F(!0), 6e3);
setInterval(() => void F(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && F();
});
window.addEventListener("online", () => void F(!0));
