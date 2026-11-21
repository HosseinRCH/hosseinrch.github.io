const wt = "https://api.github.com", St = "paca.sync.github";
function E() {
  try {
    const e = localStorage.getItem(St), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function Y(e, t, o = {}) {
  return await fetch(`${wt}${t}`, {
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
function G(e, t) {
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
function jt(e) {
  const t = atob(e.replace(/\s/g, "")), o = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) o[n] = t.charCodeAt(n);
  return new TextDecoder().decode(o);
}
let B = null;
async function ut() {
  const e = E();
  if (!e) throw new Error("unlinked");
  const t = await Y(
    e.token,
    `/repos/${e.repo}/contents/${dt(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return B = null, "";
  t.ok || G(t, "read");
  const o = await t.json();
  if (B = o.sha, o.content && o.encoding === "base64") return jt(o.content);
  const n = await Y(e.token, `/repos/${e.repo}/git/blobs/${o.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || G(n, "read"), await n.text();
}
async function kt(e) {
  const t = E();
  if (!t) throw new Error("unlinked");
  const o = (a) => Y(t.token, `/repos/${t.repo}/contents/${dt(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: It(e),
      branch: t.branch || "main",
      ...a ? { sha: a } : {}
    })
  });
  let n = await o(B);
  (n.status === 409 || n.status === 422) && (await ut(), n = await o(B)), n.ok || G(n, "write"), B = (await n.json()).content?.sha ?? null;
}
function $t() {
  return E() ? "github" : mt() ? "drive" : null;
}
const N = "https://www.googleapis.com/drive/v3", At = "https://www.googleapis.com/upload/drive/v3", tt = "Paca", F = "paca-sync.json", et = "application/vnd.google-apps.folder", lt = "paca.sync.token", ft = "paca.sync.link", bt = "paca.sync.auto", Tt = "paca.sync.status";
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
let O = pt(sessionStorage, lt);
function Z() {
  return E() ? !0 : !!(O && O.value && O.exp - 6e4 > Date.now());
}
async function _t() {
  if (Z() && O) return O.value;
  throw new Error("auth");
}
function U() {
  return E() ? { folderId: "", fileId: "github" } : mt();
}
function mt() {
  const e = pt(localStorage, ft);
  return e && e.fileId ? e : null;
}
function Pt(e) {
  yt(localStorage, ft, e);
}
function Nt() {
  try {
    return localStorage.getItem(bt) !== "false";
  } catch {
    return !0;
  }
}
function Et(e) {
  yt(localStorage, Tt, e);
}
async function _(e, t = {}) {
  const o = await _t(), n = await fetch(e, {
    ...t,
    cache: "no-store",
    headers: { ...t.headers ?? {}, Authorization: `Bearer ${o}` }
  });
  if (n.status === 401) {
    O = null;
    try {
      sessionStorage.removeItem(lt);
    } catch {
    }
    throw new Error("auth");
  }
  if (!n.ok) throw new Error(`drive ${n.status}`);
  return n;
}
const vt = (e, t) => `${N}/files?${new URLSearchParams({
  q: e,
  fields: t,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function z(e, t) {
  return (await (await _(vt(e, t))).json()).files ?? [];
}
async function xt() {
  const t = (await (await _(`${N}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await z(
    `name = '${tt}' and mimeType = '${et}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await _(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: tt, mimeType: et })
  })).json()).id);
  let a = (await z(
    `name = '${F}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!a) {
    const r = await z(
      `name = '${F}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    r[0] && (await _(
      `${N}/files/${r[0].id}?addParents=${n}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), a = r[0].id);
  }
  a || (a = (await (await _(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: F,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const l = { folderId: n, fileId: a, email: t };
  return Pt(l), l;
}
async function Lt() {
  if (E()) return ut();
  const e = U();
  if (!e) throw new Error("unlinked");
  try {
    return await (await _(`${N}/files/${e.fileId}?alt=media`)).text();
  } catch (t) {
    if (String(t?.message).includes("404")) {
      const o = await xt();
      return await (await _(`${N}/files/${o.fileId}?alt=media`)).text();
    }
    throw t;
  }
}
async function Ot(e) {
  if (E()) return kt(e);
  const t = U();
  if (!t) throw new Error("unlinked");
  await _(
    `${At}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
let M = null;
function Dt() {
  if (M) return M;
  const e = [document.getElementById("root"), document.getElementById("app"), document.body.firstElementChild];
  for (const t of e) {
    if (!t) continue;
    const o = Object.keys(t).find((a) => a.startsWith("__reactContainer$"));
    if (!o) continue;
    let n = [t[o]], s = 0;
    for (; n.length && s < 2e4; ) {
      const a = n.pop();
      if (s += 1, !a) continue;
      const l = a.memoizedProps?.client;
      if (l && typeof l.invalidateQueries == "function")
        return M = l, M;
      a.sibling && n.push(a.sibling), a.child && n.push(a.child), n.length > 5e3 && (n = n.slice(-5e3));
    }
  }
  return null;
}
function Ct() {
  try {
    const e = Dt();
    e && e.invalidateQueries();
  } catch {
  }
  try {
    document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new Event("focus"));
  } catch {
  }
}
function Bt(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const nt = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, V = (e, t) => nt(e.updatedAt) >= nt(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function Mt(e, t) {
  if (!e) return t;
  if (!t) return e;
  const o = /* @__PURE__ */ new Map();
  for (const s of t.projects) o.set(s.syncId, s);
  for (const s of e.projects) {
    const a = o.get(s.syncId);
    o.set(s.syncId, a ? V(s, a) : s);
  }
  const n = /* @__PURE__ */ new Map();
  for (const s of t.tasks) n.set(s.syncId, s);
  for (const s of e.tasks) {
    const a = n.get(s.syncId);
    n.set(s.syncId, a ? V(s, a) : s);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...Rt(e, t),
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
function Rt(e, t) {
  const o = {}, n = [
    ["timeEntries", "id"],
    ["timeLogs", "syncId"]
  ];
  for (const [s, a] of n) {
    const l = e[s], r = t[s];
    if (!Array.isArray(l) && !Array.isArray(r)) continue;
    const i = /* @__PURE__ */ new Map();
    for (const d of r ?? []) i.set(String(d[a]), d);
    for (const d of l ?? []) {
      const p = i.get(String(d[a]));
      i.set(String(d[a]), p ? V(d, p) : d);
    }
    o[s] = Array.from(i.values());
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
    R(e.startDate),
    R(e.dueDate)
  ]);
}
function R(e) {
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
const Jt = "/api/v1", b = "pacaSyncId", v = "pacaSyncSeen", x = "pacaSyncUpdatedAt", W = "pacaSyncTimeLogs", J = "com.paca.time-logging";
class I extends Error {
}
async function S(e, t) {
  const o = await fetch(`${Jt}${e}`, {
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
      const a = await o.json();
      s = a?.error ? `: ${a.error}` : "";
    } catch {
    }
    throw new Error(`HTTP ${o.status}${s}`);
  }
  if (o.status === 204) return;
  const n = await o.json();
  return n?.data ?? n;
}
async function Ut() {
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
let K = !0;
async function Ht(e) {
  try {
    return await at(e, K);
  } catch (t) {
    if (!K || t instanceof I) throw t;
    return K = !1, at(e, !1);
  }
}
async function at(e, t) {
  const o = [];
  let n = null;
  for (; ; ) {
    const s = new URLSearchParams({ page_size: "200" });
    t && s.set("include", "assignees"), n && s.set("cursor", n);
    const a = await S(
      `/projects/${e}/tasks?${s.toString()}`
    );
    if (o.push(...a.items ?? []), n = a.next_cursor ?? null, !n) break;
  }
  return o;
}
async function Ft(e) {
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
async function zt(e) {
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
const rt = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function Kt(e, t) {
  const o = await Yt(e);
  if (o) return o;
  const n = [];
  for (const s of t)
    try {
      const a = await S(
        `/plugins/${J}/projects/${e}/tasks/${s}/time-logs`
      );
      n.push(...Array.isArray(a) ? a : a?.logs ?? []);
    } catch (a) {
      if (a instanceof I) throw a;
      return null;
    }
  return n;
}
async function Yt(e) {
  const t = [];
  for (let o = 1; o <= 200; o += 1) {
    let n;
    try {
      n = await S(
        `/plugins/${J}/projects/${e}/time-logs?page_size=100&page=${o}`
      );
    } catch (l) {
      if (l instanceof I) throw l;
      return null;
    }
    const s = Array.isArray(n) ? n : n?.logs ?? [];
    t.push(...s);
    const a = Array.isArray(n) ? t.length : n?.total ?? t.length;
    if (s.length === 0 || t.length >= a || Array.isArray(n)) break;
  }
  return t;
}
function L() {
  return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
async function Gt(e) {
  const t = await Ut(), o = [], n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  let a = [], l = !1;
  for (let c = 0; c < t.length; c += 1) {
    const u = t[c].id, h = await Ht(u);
    if (o.push(...h), n.set(u, await Ft(u)), a) {
      const $ = h.length ? await Kt(u, h.map((j) => j.id)) : [];
      $ === null ? a = null : h.length && (l = !0, a.push(...$), $.length && s.set(u, await zt(u)));
    }
  }
  const r = [], i = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), p = (/* @__PURE__ */ new Date()).toISOString();
  for (const c of t) {
    const u = { ...c.settings ?? {} }, h = C({
      name: c.name,
      description: c.description ?? "",
      createdAt: c.created_at,
      updatedAt: c.created_at
    });
    let $ = !1, j = typeof u[b] == "string" ? u[b] : "";
    j || (j = L(), u[b] = j, $ = !0);
    const T = typeof u[v] == "string" ? u[v] : null;
    let A;
    T === null ? (u[v] = h, u[x] = c.created_at, A = c.created_at, $ = !0) : T !== h ? (u[v] = h, u[x] = p, A = p, $ = !0) : A = typeof u[x] == "string" ? u[x] : c.created_at, $ && (await S(`/projects/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: u })
    }), c.settings = u), d.set(c.id, j), i.set(j, c), r.push({
      syncId: j,
      name: c.name,
      description: c.description ?? "",
      createdAt: c.created_at,
      updatedAt: A
    });
  }
  const f = [], m = /* @__PURE__ */ new Map();
  for (const c of o) {
    const u = { ...c.custom_fields ?? {} };
    let h = typeof u[b] == "string" ? u[b] : "";
    if (!h) {
      h = L();
      const A = await S(
        `/projects/${c.project_id}/tasks/${c.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...u, [b]: h }
          })
        }
      );
      A?.updated_at && (c.updated_at = A.updated_at);
    }
    m.set(h, c);
    const $ = (n.get(c.project_id) ?? []).find(
      (A) => A.id === c.status_id
    ), j = (c.assignees ?? []).map(rt).filter(Boolean), T = {
      syncId: h,
      projectSyncId: d.get(c.project_id) ?? "",
      title: c.title,
      description: c.description ?? null,
      importance: c.importance ?? 0,
      tags: c.tags ?? [],
      createdAt: c.created_at,
      updatedAt: c.updated_at ?? c.created_at,
      startDate: c.start_date ?? null,
      dueDate: c.due_date ?? null
    };
    $ && (T.statusName = $.name, T.statusCategory = $.category), c.assignees && (T.assignee = j[0] ?? null, T.assignees = j), f.push(T);
  }
  const g = new Map(o.map((c) => [c.id, c])), w = new Map(t.map((c) => [c.id, c])), k = /* @__PURE__ */ new Map();
  let y = null;
  if (a && l) {
    y = [];
    for (const u of a) {
      const h = g.get(u.task_id);
      if (!h) continue;
      const j = w.get(h.project_id)?.settings?.[W] ?? {}, T = typeof j[u.id] == "string" ? j[u.id] : u.id;
      k.set(T, u);
      const A = Number(u.minutes_spent) || 0, X = (s.get(h.project_id) ?? []).find(
        (ht) => ht.id === u.member_id
      );
      y.push({
        syncId: T,
        taskSyncId: String(h.custom_fields?.[b] ?? ""),
        projectSyncId: d.get(h.project_id) ?? "",
        date: String(u.spent_date ?? "").slice(0, 10),
        minutes: A,
        seconds: A * 60,
        note: u.note ?? "",
        ...X ? { member: rt(X) } : {},
        createdAt: u.created_at,
        updatedAt: u.updated_at || u.created_at
      });
    }
    const c = /* @__PURE__ */ new Map();
    for (const [u, h] of m) c.set(h.id, u);
    for (const u of y)
      if (!u.taskSyncId) {
        const h = k.get(u.syncId);
        u.taskSyncId = (h && c.get(h.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: o,
    projectRecords: r,
    taskRecords: f,
    projectBySync: i,
    taskBySync: m,
    statusesByProject: n,
    timeLogRecords: y,
    logBySync: k,
    localTimeLogs: a ?? []
  };
}
function Vt(e, t) {
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
async function Wt(e, t, o) {
  const n = {
    title: t.title || "(بدون عنوان)",
    custom_fields: { [b]: t.syncId }
  };
  try {
    return await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        ...n,
        description: Q(t) ?? void 0,
        importance: t.importance ?? 0,
        tags: t.tags ?? [],
        ...q(t, null, o)
      })
    });
  } catch (s) {
    if (s instanceof I) throw s;
    const a = await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify(n)
    }).catch((r) => {
      throw r instanceof I ? r : new Error(`${P(s)} / ${P(r)}`);
    }), l = [
      { description: Q(t) ?? void 0 },
      { importance: t.importance ?? 0 },
      { tags: t.tags ?? [] },
      ...Object.entries(q(t, null, o)).map(([r, i]) => ({ [r]: i }))
    ];
    for (const r of l)
      try {
        await S(`/projects/${e}/tasks/${a.id}`, {
          method: "PATCH",
          body: JSON.stringify(r)
        });
      } catch (i) {
        if (i instanceof I) throw i;
      }
    return a;
  }
}
async function qt(e, t) {
  if (!t) return 0;
  const o = new Set(t.projects.map((a) => a.syncId)), n = (a) => (a || "").replace(/\s+/g, " ").trim();
  let s = 0;
  for (const a of t.projects) {
    if (a.deleted || e.projectBySync.has(a.syncId)) continue;
    const l = e.projectRecords.filter(
      (f) => !o.has(f.syncId) && n(f.name) === n(a.name)
    );
    if (l.length !== 1) continue;
    const r = l[0], i = e.projectBySync.get(r.syncId);
    if (!i) continue;
    const d = { ...i.settings ?? {}, [b]: a.syncId };
    await S(`/projects/${i.id}`, { method: "PATCH", body: JSON.stringify({ settings: d }) }), i.settings = d;
    const p = r.syncId;
    e.projectBySync.delete(p), e.projectBySync.set(a.syncId, i), r.syncId = a.syncId;
    for (const f of e.taskRecords) f.projectSyncId === p && (f.projectSyncId = a.syncId);
    for (const f of e.timeLogRecords ?? []) f.projectSyncId === p && (f.projectSyncId = a.syncId);
    s += 1;
  }
  return s;
}
async function Qt(e, t, o = /* @__PURE__ */ new Set()) {
  const n = {
    createdProjects: 0,
    createdTasks: 0,
    updatedProjects: 0,
    updatedTasks: 0,
    createdTimeLogs: 0,
    updatedTimeLogs: 0,
    failures: []
  }, s = /* @__PURE__ */ new Map();
  for (const r of t.projectRecords)
    s.set(r.syncId, r);
  const a = /* @__PURE__ */ new Map();
  for (const r of t.taskRecords)
    a.set(r.syncId, r);
  const l = /* @__PURE__ */ new Map();
  for (const r of e.projects) {
    const i = t.projectBySync.get(r.syncId);
    if (!i && r.deleted) continue;
    if (!i) {
      let f;
      try {
        f = await S("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: r.name,
            description: r.description ?? "",
            task_id_prefix: te(r.name, r.syncId),
            settings: {
              [b]: r.syncId,
              [v]: C(r),
              [x]: r.updatedAt
            }
          })
        });
      } catch (m) {
        if (m instanceof I) throw m;
        n.failures.push(`پروژهٔ «${r.name}» ساخته نشد: ${P(m)}`);
        continue;
      }
      l.set(r.syncId, f.id), n.createdProjects += 1;
      continue;
    }
    l.set(r.syncId, i.id);
    const d = s.get(r.syncId);
    if (!d || C(d) === C(r) || Date.parse(r.updatedAt) <= Date.parse(d.updatedAt)) continue;
    const p = { ...i.settings ?? {} };
    p[b] = r.syncId, p[v] = C(r), p[x] = r.updatedAt;
    try {
      await S(`/projects/${i.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: r.name,
          description: r.description ?? "",
          settings: p
        })
      }), n.updatedProjects += 1;
    } catch (f) {
      if (f instanceof I) throw f;
      n.failures.push(`پروژهٔ «${r.name}» به‌روز نشد: ${P(f)}`);
    }
  }
  for (const r of e.tasks) {
    const i = t.taskBySync.get(r.syncId);
    if (!i && r.deleted) continue;
    if (!i) {
      const f = l.get(r.projectSyncId);
      if (!f) {
        const m = e.projects.find((g) => g.syncId === r.projectSyncId);
        n.failures.push(
          m ? `کار «${r.title}» منتقل نشد: پروژهٔ «${m.name}» در این دستگاه ساخته نشد` : `کار «${r.title}» منتقل نشد: پروژهٔ آن در فایل همگام‌سازی نیست`
        );
        continue;
      }
      try {
        const m = await Wt(
          f,
          r,
          t.statusesByProject.get(f) ?? []
        );
        m?.id && t.taskBySync.set(r.syncId, { ...m, project_id: f }), n.createdTasks += 1;
      } catch (m) {
        if (m instanceof I) throw m;
        n.failures.push(`کار «${r.title}» ساخته نشد: ${P(m)}`);
      }
      continue;
    }
    const d = a.get(r.syncId);
    if (!d || st(d) === st(r) || Date.parse(r.updatedAt) <= Date.parse(d.updatedAt)) continue;
    const p = { ...i.custom_fields ?? {} };
    try {
      await S(`/projects/${i.project_id}/tasks/${i.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: r.title,
          description: Q(r) ?? void 0,
          importance: r.importance ?? 0,
          tags: r.tags ?? [],
          custom_fields: { ...p, [b]: r.syncId },
          ...q(r, i, t.statusesByProject.get(i.project_id) ?? [])
        })
      }), n.updatedTasks += 1;
    } catch (f) {
      if (f instanceof I) throw f;
      n.failures.push(`کار «${r.title}» به‌روز نشد: ${P(f)}`);
    }
  }
  if (t.timeLogRecords && Array.isArray(e.timeLogs))
    try {
      await Xt(e, t, o, n);
    } catch (r) {
      if (r instanceof I) throw r;
      n.failures.push(`زمان‌های ثبت‌شده منتقل نشدند: ${P(r)}`);
    }
  return n;
}
function q(e, t, o) {
  const n = {};
  if (e.statusName !== void 0 || e.statusCategory !== void 0) {
    const s = o.find((a) => a.name === e.statusName) ?? o.find((a) => a.category === e.statusCategory);
    s && s.id !== t?.status_id && (n.status_id = s.id);
  }
  for (const [s, a] of [
    ["startDate", "start_date"],
    ["dueDate", "due_date"]
  ]) {
    const l = e[s];
    l !== void 0 && R(l) !== R(t?.[a] ?? null) && (l === null ? n[a] = null : Number.isNaN(Date.parse(l)) || (n[a] = new Date(l).toISOString()));
  }
  return n;
}
function Q(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const o = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof o != "string" ? t ?? null : Zt(o);
}
function Zt(e) {
  const t = { textColor: "default", backgroundColor: "default", textAlignment: "right" }, o = (s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(
    (a) => a.startsWith("**") && a.endsWith("**") ? { type: "text", text: a.slice(2, -2), styles: { bold: !0 } } : { type: "text", text: a, styles: {} }
  ), n = [];
  for (const s of e.split(/\r?\n/)) {
    const a = s.trimEnd();
    if (!a.trim()) continue;
    const l = a.match(/^(#{1,3})\s+(.*)$/), r = a.match(/^\s*[-*•]\s+(.*)$/), i = a.match(/^\s*[0-9۰-۹]+[.)]\s+(.*)$/);
    l ? n.push({ id: L(), type: "heading", props: { ...t, level: l[1].length }, content: o(l[2]), children: [] }) : r ? n.push({ id: L(), type: "bulletListItem", props: t, content: o(r[1]), children: [] }) : i ? n.push({ id: L(), type: "numberedListItem", props: t, content: o(i[1]), children: [] }) : n.push({ id: L(), type: "paragraph", props: t, content: o(a), children: [] });
  }
  return n;
}
async function Xt(e, t, o, n) {
  const s = /* @__PURE__ */ new Map();
  for (const d of t.timeLogRecords ?? []) s.set(d.syncId, d);
  const a = /* @__PURE__ */ new Map(), l = (d) => {
    let p = a.get(d.id);
    return p || (p = { ...d.settings ?? {} }, a.set(d.id, p)), p;
  }, r = async (d, p, f) => {
    const m = t.projects.find((k) => k.id === d);
    if (!m) return;
    const g = l(m), w = { ...g[W] ?? {} };
    w[p] = f, g[W] = w, await S(`/projects/${d}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: g })
    }), m.settings = g;
  }, i = /* @__PURE__ */ new Set();
  for (const d of e.timeLogs ?? []) {
    if (d.deleted) continue;
    const p = gt(d), f = String(d.date ?? "").slice(0, 10);
    if (!p || !/^\d{4}-\d{2}-\d{2}$/.test(f)) continue;
    const m = t.logBySync.get(d.syncId);
    if (m) {
      const y = s.get(d.syncId);
      if (!y || ot(y) === ot(d) || Date.parse(d.updatedAt) <= Date.parse(y.updatedAt)) continue;
      const c = t.tasks.find((u) => u.id === m.task_id);
      if (!c) continue;
      try {
        await S(
          `/plugins/${J}/projects/${c.project_id}/tasks/${c.id}/time-logs/${m.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ spent_date: f, minutes_spent: p, note: d.note ?? "" })
          }
        ), n.updatedTimeLogs += 1;
      } catch (u) {
        if (u instanceof I) throw u;
      }
      continue;
    }
    const g = t.taskBySync.get(d.taskSyncId);
    if (!g) continue;
    const w = t.localTimeLogs.find((y) => {
      const c = (s.get(y.id) ? y.id : "") || "";
      return c && !o.has(c) && !i.has(c) && y.task_id === g.id && String(y.spent_date).slice(0, 10) === f && Number(y.minutes_spent) === p && (y.note ?? "") === (d.note ?? "");
    });
    if (w) {
      await r(g.project_id, w.id, d.syncId), i.add(w.id);
      continue;
    }
    let k = null;
    try {
      k = await S(
        `/plugins/${J}/projects/${g.project_id}/tasks/${g.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: f, minutes_spent: p, note: d.note ?? "" })
        }
      );
    } catch (y) {
      if (y instanceof I) throw y;
      continue;
    }
    k?.id && await r(g.project_id, k.id, d.syncId), n.createdTimeLogs += 1;
  }
  i.size && (e.timeLogs = (e.timeLogs ?? []).filter((d) => !i.has(d.syncId)));
}
function te(e, t) {
  const o = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((o.length >= 2 ? o.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
function it(e) {
  if (!e) return "";
  const t = [...e.projects].sort((s, a) => s.syncId.localeCompare(a.syncId)).map((s) => [s.syncId, s.name, s.description, s.updatedAt]), o = [...e.tasks].sort((s, a) => s.syncId.localeCompare(a.syncId)).map((s) => [
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
    s.dueDate ?? null
  ]), n = [...e.timeLogs ?? []].sort((s, a) => s.syncId.localeCompare(a.syncId)).map((s) => [s.syncId, s.taskSyncId, s.date, s.minutes, s.note, s.updatedAt]);
  return JSON.stringify([t, o, n]);
}
function ee(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return Bt(t) ? t : null;
  } catch {
    return null;
  }
}
let D = null;
function ne(e = {}) {
  return D || (D = (async () => {
    const t = () => Date.now();
    try {
      if (!U())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: t()
        };
      if (!Z())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: t()
        };
      e.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const o = await Lt(), n = ee(o);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const s = await Gt();
      await qt(s, n);
      const a = Vt(s, n?.sync?.rev ?? 0), l = Mt(a, n) ?? a, r = new Set((n?.timeLogs ?? []).map((y) => y.syncId)), i = await Qt(l, s, r), d = it(n), p = it(l), f = i.createdProjects + i.createdTasks + i.updatedProjects + i.updatedTasks + i.createdTimeLogs + i.updatedTimeLogs;
      if (d !== p || !n) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const y = Math.max(n?.sync?.rev ?? 0, 0) + 1, c = {
          ...l,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: y,
            updatedBy: $t() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await Ot(JSON.stringify(c, null, 2));
      }
      const m = l.tasks.filter(
        (y) => !y.deleted && !s.taskBySync.has(y.syncId)
      ), g = (y) => String(y).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)]), w = [];
      i.createdProjects && w.push(`${g(i.createdProjects)} پروژهٔ جدید`), i.createdTasks && w.push(`${g(i.createdTasks)} کار جدید`), i.updatedProjects && w.push(`${g(i.updatedProjects)} پروژهٔ به‌روزشده`), i.updatedTasks && w.push(`${g(i.updatedTasks)} کار به‌روزشده`), i.createdTimeLogs && w.push(`${g(i.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), i.updatedTimeLogs && w.push(`${g(i.updatedTimeLogs)} زمان به‌روزشده`);
      const k = `در این دستگاه: ${g(s.projects.length + i.createdProjects)} پروژه و ${g(s.taskBySync.size)} کار (کارها در «بک‌لاگ محصول» هر پروژه).`;
      if (i.failures.length || m.length) {
        const y = i.failures.slice(0, 3).join("؛ "), c = i.failures.length > 3 ? ` و ${g(i.failures.length - 3)} مورد دیگر` : "";
        return {
          outcome: "PARTIAL",
          message: `همگام‌سازی ناقص ماند: ${g(Math.max(m.length, i.failures.length))} مورد از فایل به پاکا نیامد.` + (y ? ` ${y}${c}.` : "") + (w.length ? ` انجام‌شده: ${w.join("، ")}.` : "") + ` ${k}`,
          at: t(),
          created: i.createdProjects + i.createdTasks + i.createdTimeLogs,
          updated: i.updatedProjects + i.updatedTasks + i.updatedTimeLogs,
          failures: i.failures
        };
      }
      return f > 0 ? {
        outcome: "MERGED",
        message: `همگام‌سازی انجام شد؛ ${w.join("، ")}. ${k}`,
        at: t(),
        created: i.createdProjects + i.createdTasks + i.createdTimeLogs,
        updated: i.updatedProjects + i.updatedTasks + i.updatedTimeLogs
      } : n ? d !== p ? {
        outcome: "PUSHED",
        message: "تغییرات پاکا ذخیره شد.",
        at: t()
      } : { outcome: "UP_TO_DATE", message: `همه‌چیز به‌روز است. ${k}`, at: t() } : {
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
  })(), D.finally(() => {
    D = null;
  }));
}
let ct = 0;
async function H(e = !1) {
  if (!(!U() || !Nt() || !Z()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - ct < 2e4)) {
    ct = Date.now();
    try {
      const t = await ne();
      Et(t), (t.outcome === "MERGED" || t.outcome === "PARTIAL") && (Ct(), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
    } catch {
    }
  }
}
setTimeout(() => void H(!0), 6e3);
setInterval(() => void H(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && H();
});
window.addEventListener("online", () => void H(!0));
