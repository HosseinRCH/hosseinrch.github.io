const St = "https://api.github.com", jt = "paca.sync.github";
function E() {
  try {
    const e = localStorage.getItem(jt), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function Y(e, t, o = {}) {
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
function kt(e) {
  const t = atob(e.replace(/\s/g, "")), o = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) o[n] = t.charCodeAt(n);
  return new TextDecoder().decode(o);
}
let C = null;
async function ut() {
  const e = E();
  if (!e) throw new Error("unlinked");
  const t = await Y(
    e.token,
    `/repos/${e.repo}/contents/${dt(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return C = null, "";
  t.ok || G(t, "read");
  const o = await t.json();
  if (C = o.sha, o.content && o.encoding === "base64") return kt(o.content);
  const n = await Y(e.token, `/repos/${e.repo}/git/blobs/${o.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || G(n, "read"), await n.text();
}
async function $t(e) {
  const t = E();
  if (!t) throw new Error("unlinked");
  const o = (r) => Y(t.token, `/repos/${t.repo}/contents/${dt(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: It(e),
      branch: t.branch || "main",
      ...r ? { sha: r } : {}
    })
  });
  let n = await o(C);
  (n.status === 409 || n.status === 422) && (await ut(), n = await o(C)), n.ok || G(n, "write"), C = (await n.json()).content?.sha ?? null;
}
function At() {
  return E() ? "github" : mt() ? "drive" : null;
}
const N = "https://www.googleapis.com/drive/v3", bt = "https://www.googleapis.com/upload/drive/v3", tt = "Paca", z = "paca-sync.json", et = "application/vnd.google-apps.folder", lt = "paca.sync.token", ft = "paca.sync.link", Tt = "paca.sync.auto", _t = "paca.sync.status";
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
async function Pt() {
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
function Nt(e) {
  yt(localStorage, ft, e);
}
function Et() {
  try {
    return localStorage.getItem(Tt) !== "false";
  } catch {
    return !0;
  }
}
function vt(e) {
  yt(localStorage, _t, e);
}
async function _(e, t = {}) {
  const o = await Pt(), n = await fetch(e, {
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
const Lt = (e, t) => `${N}/files?${new URLSearchParams({
  q: e,
  fields: t,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function F(e, t) {
  return (await (await _(Lt(e, t))).json()).files ?? [];
}
async function xt() {
  const t = (await (await _(`${N}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await F(
    `name = '${tt}' and mimeType = '${et}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await _(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: tt, mimeType: et })
  })).json()).id);
  let r = (await F(
    `name = '${z}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!r) {
    const a = await F(
      `name = '${z}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    a[0] && (await _(
      `${N}/files/${a[0].id}?addParents=${n}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), r = a[0].id);
  }
  r || (r = (await (await _(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: z,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const l = { folderId: n, fileId: r, email: t };
  return Nt(l), l;
}
async function Ot() {
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
async function Dt(e) {
  if (E()) return $t(e);
  const t = U();
  if (!t) throw new Error("unlinked");
  await _(
    `${bt}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
let M = null;
function Bt() {
  if (M) return M;
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
        return M = l, M;
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
function Mt(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const nt = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, W = (e, t) => nt(e.updatedAt) >= nt(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function Rt(e, t) {
  if (!e) return t;
  if (!t) return e;
  const o = /* @__PURE__ */ new Map();
  for (const s of t.projects) o.set(s.syncId, s);
  for (const s of e.projects) {
    const r = o.get(s.syncId);
    o.set(s.syncId, r ? W(s, r) : s);
  }
  const n = /* @__PURE__ */ new Map();
  for (const s of t.tasks) n.set(s.syncId, s);
  for (const s of e.tasks) {
    const r = n.get(s.syncId);
    n.set(s.syncId, r ? W(s, r) : s);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...Jt(e, t),
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
function Jt(e, t) {
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
      const y = f.get(String(i[r]));
      f.set(String(i[r]), y ? W(i, y) : i);
    }
    o[s] = Array.from(f.values());
  }
  return o;
}
function B(e) {
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
const Ut = "/api/v1", A = "pacaSyncId", v = "pacaSyncSeen", L = "pacaSyncUpdatedAt", V = "pacaSyncTimeLogs", J = "com.paca.time-logging";
class j extends Error {
}
async function w(e, t) {
  const o = await fetch(`${Ut}${e}`, {
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
async function Ht() {
  const e = [];
  let t = 1;
  for (; ; ) {
    const o = await w(
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
async function zt(e) {
  try {
    return await rt(e, K);
  } catch (t) {
    if (!K || t instanceof j) throw t;
    return K = !1, rt(e, !1);
  }
}
async function rt(e, t) {
  const o = [];
  let n = null;
  for (; ; ) {
    const s = new URLSearchParams({ page_size: "200" });
    t && s.set("include", "assignees"), n && s.set("cursor", n);
    const r = await w(
      `/projects/${e}/tasks?${s.toString()}`
    );
    if (o.push(...r.items ?? []), n = r.next_cursor ?? null, !n) break;
  }
  return o;
}
async function Ft(e) {
  try {
    const t = await w(
      `/projects/${e}/task-statuses`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof j) throw t;
    return [];
  }
}
async function Kt(e) {
  try {
    const t = await w(
      `/projects/${e}/members?page_size=100`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof j) throw t;
    return [];
  }
}
const at = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function Yt(e, t) {
  const o = await Gt(e);
  if (o) return o;
  const n = [];
  for (const s of t)
    try {
      const r = await w(
        `/plugins/${J}/projects/${e}/tasks/${s}/time-logs`
      );
      n.push(...Array.isArray(r) ? r : r?.logs ?? []);
    } catch (r) {
      if (r instanceof j) throw r;
      return null;
    }
  return n;
}
async function Gt(e) {
  const t = [];
  for (let o = 1; o <= 200; o += 1) {
    let n;
    try {
      n = await w(
        `/plugins/${J}/projects/${e}/time-logs?page_size=100&page=${o}`
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
async function Wt(e) {
  const t = await Ht(), o = [], n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  let r = [], l = !1;
  for (let d = 0; d < t.length; d += 1) {
    const u = t[d].id, p = await zt(u);
    if (o.push(...p), n.set(u, await Ft(u)), r) {
      const h = p.length ? await Yt(u, p.map((I) => I.id)) : [];
      h === null ? r = null : p.length && (l = !0, r.push(...h), h.length && s.set(u, await Kt(u)));
    }
  }
  const a = [], f = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), y = (/* @__PURE__ */ new Date()).toISOString();
  for (const d of t) {
    const u = { ...d.settings ?? {} }, p = B({
      name: d.name,
      description: d.description ?? "",
      createdAt: d.created_at,
      updatedAt: d.created_at
    });
    let h = !1, I = typeof u[A] == "string" ? u[A] : "";
    I || (I = x(), u[A] = I, h = !0);
    const b = typeof u[v] == "string" ? u[v] : null;
    let $;
    b === null ? (u[v] = p, u[L] = d.created_at, $ = d.created_at, h = !0) : b !== p ? (u[v] = p, u[L] = y, $ = y, h = !0) : $ = typeof u[L] == "string" ? u[L] : d.created_at, h && (await w(`/projects/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: u })
    }), d.settings = u), i.set(d.id, I), f.set(I, d), a.push({
      syncId: I,
      name: d.name,
      description: d.description ?? "",
      createdAt: d.created_at,
      updatedAt: $
    });
  }
  const c = [], g = /* @__PURE__ */ new Map();
  for (const d of o) {
    const u = { ...d.custom_fields ?? {} };
    let p = typeof u[A] == "string" ? u[A] : "";
    if (!p) {
      p = x();
      const $ = await w(
        `/projects/${d.project_id}/tasks/${d.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...u, [A]: p }
          })
        }
      );
      $?.updated_at && (d.updated_at = $.updated_at);
    }
    g.set(p, d);
    const h = (n.get(d.project_id) ?? []).find(
      ($) => $.id === d.status_id
    ), I = (d.assignees ?? []).map(at).filter(Boolean), b = {
      syncId: p,
      projectSyncId: i.get(d.project_id) ?? "",
      title: d.title,
      description: d.description ?? null,
      importance: d.importance ?? 0,
      tags: d.tags ?? [],
      createdAt: d.created_at,
      updatedAt: d.updated_at ?? d.created_at,
      startDate: d.start_date ?? null,
      dueDate: d.due_date ?? null
    };
    h && (b.statusName = h.name, b.statusCategory = h.category), d.assignees && (b.assignee = I[0] ?? null, b.assignees = I), c.push(b);
  }
  const S = new Map(o.map((d) => [d.id, d])), T = new Map(t.map((d) => [d.id, d])), k = /* @__PURE__ */ new Map();
  let m = null;
  if (r && l) {
    m = [];
    for (const u of r) {
      const p = S.get(u.task_id);
      if (!p) continue;
      const I = T.get(p.project_id)?.settings?.[V] ?? {}, b = typeof I[u.id] == "string" ? I[u.id] : u.id;
      k.set(b, u);
      const $ = Number(u.minutes_spent) || 0, X = (s.get(p.project_id) ?? []).find(
        (wt) => wt.id === u.member_id
      );
      m.push({
        syncId: b,
        taskSyncId: String(p.custom_fields?.[A] ?? ""),
        projectSyncId: i.get(p.project_id) ?? "",
        date: String(u.spent_date ?? "").slice(0, 10),
        minutes: $,
        seconds: $ * 60,
        note: u.note ?? "",
        ...X ? { member: at(X) } : {},
        createdAt: u.created_at,
        updatedAt: u.updated_at || u.created_at
      });
    }
    const d = /* @__PURE__ */ new Map();
    for (const [u, p] of g) d.set(p.id, u);
    for (const u of m)
      if (!u.taskSyncId) {
        const p = k.get(u.syncId);
        u.taskSyncId = (p && d.get(p.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: o,
    projectRecords: a,
    taskRecords: c,
    projectBySync: f,
    taskBySync: g,
    statusesByProject: n,
    timeLogRecords: m,
    logBySync: k,
    localTimeLogs: r ?? []
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
async function qt(e, t, o) {
  const n = {
    title: t.title || "(بدون عنوان)",
    custom_fields: { [A]: t.syncId }
  };
  try {
    return await w(`/projects/${e}/tasks`, {
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
    if (s instanceof j) throw s;
    const r = await w(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify(n)
    }).catch((a) => {
      throw a instanceof j ? a : new Error(`${P(s)} / ${P(a)}`);
    }), l = [
      { description: Q(t) ?? void 0 },
      { importance: t.importance ?? 0 },
      { tags: t.tags ?? [] },
      ...Object.entries(q(t, null, o)).map(([a, f]) => ({ [a]: f }))
    ];
    for (const a of l)
      try {
        await w(`/projects/${e}/tasks/${r.id}`, {
          method: "PATCH",
          body: JSON.stringify(a)
        });
      } catch (f) {
        if (f instanceof j) throw f;
      }
    return r;
  }
}
async function Qt(e, t) {
  if (!t) return 0;
  const o = new Set(t.projects.map((r) => r.syncId)), n = (r) => (r || "").replace(/\s+/g, " ").trim();
  let s = 0;
  for (const r of t.projects) {
    if (r.deleted || e.projectBySync.has(r.syncId)) continue;
    const l = e.projectRecords.filter(
      (c) => !o.has(c.syncId) && n(c.name) === n(r.name)
    );
    if (l.length !== 1) continue;
    const a = l[0], f = e.projectBySync.get(a.syncId);
    if (!f) continue;
    const i = { ...f.settings ?? {}, [A]: r.syncId };
    await w(`/projects/${f.id}`, { method: "PATCH", body: JSON.stringify({ settings: i }) }), f.settings = i;
    const y = a.syncId;
    e.projectBySync.delete(y), e.projectBySync.set(r.syncId, f), a.syncId = r.syncId;
    for (const c of e.taskRecords) c.projectSyncId === y && (c.projectSyncId = r.syncId);
    for (const c of e.timeLogRecords ?? []) c.projectSyncId === y && (c.projectSyncId = r.syncId);
    s += 1;
  }
  return s;
}
async function Zt(e, t, o = /* @__PURE__ */ new Set()) {
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
      let c;
      try {
        c = await w("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: a.name,
            description: a.description ?? "",
            task_id_prefix: ee(a.name, a.syncId),
            settings: {
              [A]: a.syncId,
              [v]: B(a),
              [L]: a.updatedAt
            }
          })
        });
      } catch (g) {
        if (g instanceof j) throw g;
        n.failures.push(`پروژهٔ «${a.name}» ساخته نشد: ${P(g)}`);
        continue;
      }
      l.set(a.syncId, c.id), n.presentProjects.push(a.syncId), n.createdProjects += 1;
      continue;
    }
    l.set(a.syncId, f.id), n.presentProjects.push(a.syncId);
    const i = s.get(a.syncId);
    if (!i || B(i) === B(a) || Date.parse(a.updatedAt) <= Date.parse(i.updatedAt)) continue;
    const y = { ...f.settings ?? {} };
    y[A] = a.syncId, y[v] = B(a), y[L] = a.updatedAt;
    try {
      await w(`/projects/${f.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: a.name,
          description: a.description ?? "",
          settings: y
        })
      }), n.updatedProjects += 1;
    } catch (c) {
      if (c instanceof j) throw c;
      n.failures.push(`پروژهٔ «${a.name}» به‌روز نشد: ${P(c)}`);
    }
  }
  for (const a of e.tasks) {
    const f = t.taskBySync.get(a.syncId);
    if (!f && a.deleted) continue;
    if (!f) {
      const c = l.get(a.projectSyncId);
      if (!c) {
        const g = e.projects.find((S) => S.syncId === a.projectSyncId);
        n.failures.push(
          g ? `کار «${a.title}» منتقل نشد: پروژهٔ «${g.name}» در این دستگاه ساخته نشد` : `کار «${a.title}» منتقل نشد: پروژهٔ آن در فایل همگام‌سازی نیست`
        );
        continue;
      }
      try {
        const g = await qt(
          c,
          a,
          t.statusesByProject.get(c) ?? []
        );
        g?.id && t.taskBySync.set(a.syncId, { ...g, project_id: c }), n.createdTasks += 1;
      } catch (g) {
        if (g instanceof j) throw g;
        n.failures.push(`کار «${a.title}» ساخته نشد: ${P(g)}`);
      }
      continue;
    }
    const i = r.get(a.syncId);
    if (!i || st(i) === st(a) || Date.parse(a.updatedAt) <= Date.parse(i.updatedAt)) continue;
    const y = { ...f.custom_fields ?? {} };
    try {
      await w(`/projects/${f.project_id}/tasks/${f.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: a.title,
          description: Q(a) ?? void 0,
          importance: a.importance ?? 0,
          tags: a.tags ?? [],
          custom_fields: { ...y, [A]: a.syncId },
          ...q(a, f, t.statusesByProject.get(f.project_id) ?? [])
        })
      }), n.updatedTasks += 1;
    } catch (c) {
      if (c instanceof j) throw c;
      n.failures.push(`کار «${a.title}» به‌روز نشد: ${P(c)}`);
    }
  }
  if (t.timeLogRecords && Array.isArray(e.timeLogs))
    try {
      await te(e, t, o, n);
    } catch (a) {
      if (a instanceof j) throw a;
      n.failures.push(`زمان‌های ثبت‌شده منتقل نشدند: ${P(a)}`);
    }
  return n;
}
function q(e, t, o) {
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
    l !== void 0 && R(l) !== R(t?.[r] ?? null) && (l === null ? n[r] = null : Number.isNaN(Date.parse(l)) || (n[r] = new Date(l).toISOString()));
  }
  return n;
}
function Q(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const o = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof o != "string" ? t ?? null : Xt(o);
}
function Xt(e) {
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
async function te(e, t, o, n) {
  const s = /* @__PURE__ */ new Map();
  for (const i of t.timeLogRecords ?? []) s.set(i.syncId, i);
  const r = /* @__PURE__ */ new Map(), l = (i) => {
    let y = r.get(i.id);
    return y || (y = { ...i.settings ?? {} }, r.set(i.id, y)), y;
  }, a = async (i, y, c) => {
    const g = t.projects.find((k) => k.id === i);
    if (!g) return;
    const S = l(g), T = { ...S[V] ?? {} };
    T[y] = c, S[V] = T, await w(`/projects/${i}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: S })
    }), g.settings = S;
  }, f = /* @__PURE__ */ new Set();
  for (const i of e.timeLogs ?? []) {
    if (i.deleted) continue;
    const y = gt(i), c = String(i.date ?? "").slice(0, 10);
    if (!y || !/^\d{4}-\d{2}-\d{2}$/.test(c)) continue;
    const g = t.logBySync.get(i.syncId);
    if (g) {
      const m = s.get(i.syncId);
      if (!m || ot(m) === ot(i) || Date.parse(i.updatedAt) <= Date.parse(m.updatedAt)) continue;
      const d = t.tasks.find((u) => u.id === g.task_id);
      if (!d) continue;
      try {
        await w(
          `/plugins/${J}/projects/${d.project_id}/tasks/${d.id}/time-logs/${g.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ spent_date: c, minutes_spent: y, note: i.note ?? "" })
          }
        ), n.updatedTimeLogs += 1;
      } catch (u) {
        if (u instanceof j) throw u;
      }
      continue;
    }
    const S = t.taskBySync.get(i.taskSyncId);
    if (!S) continue;
    const T = t.localTimeLogs.find((m) => {
      const d = (s.get(m.id) ? m.id : "") || "";
      return d && !o.has(d) && !f.has(d) && m.task_id === S.id && String(m.spent_date).slice(0, 10) === c && Number(m.minutes_spent) === y && (m.note ?? "") === (i.note ?? "");
    });
    if (T) {
      await a(S.project_id, T.id, i.syncId), f.add(T.id);
      continue;
    }
    let k = null;
    try {
      k = await w(
        `/plugins/${J}/projects/${S.project_id}/tasks/${S.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: c, minutes_spent: y, note: i.note ?? "" })
        }
      );
    } catch (m) {
      if (m instanceof j) throw m;
      continue;
    }
    k?.id && await a(S.project_id, k.id, i.syncId), n.createdTimeLogs += 1;
  }
  f.size && (e.timeLogs = (e.timeLogs ?? []).filter((i) => !f.has(i.syncId)));
}
function ee(e, t) {
  const o = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((o.length >= 2 ? o.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
async function ne(e, t) {
  const o = [];
  for (const n of e.projects) {
    if (!n.deleted) continue;
    const s = t.projectBySync.get(n.syncId);
    if (!s) continue;
    try {
      await w(`/projects/${s.id}`, { method: "DELETE" });
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
    !!s.deleted
  ]), n = [...e.timeLogs ?? []].sort((s, r) => s.syncId.localeCompare(r.syncId)).map((s) => [s.syncId, s.taskSyncId, s.date, s.minutes, s.note, s.updatedAt, !!s.deleted]);
  return JSON.stringify([t, o, n]);
}
function se(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return Mt(t) ? t : null;
  } catch {
    return null;
  }
}
const ht = "paca-sync.known-projects";
function oe() {
  try {
    const e = localStorage.getItem(ht);
    if (!e) return null;
    const t = JSON.parse(e);
    return Array.isArray(t) ? new Set(t.map(String)) : null;
  } catch {
    return null;
  }
}
function re(e) {
  try {
    localStorage.setItem(ht, JSON.stringify(e));
  } catch {
  }
}
function ae(e, t, o) {
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
let D = null;
function ie(e = {}) {
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
      const o = await Ot(), n = se(o);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const s = await Wt();
      await Qt(s, n);
      const r = Vt(s, n?.sync?.rev ?? 0), l = oe(), { bundle: a, deletedHere: f } = ae(
        Rt(r, n) ?? r,
        new Set(s.projectBySync.keys()),
        l
      ), i = await ne(a, s), y = new Set((n?.timeLogs ?? []).map((p) => p.syncId)), c = await Zt(a, s, y), g = it(n), S = it(a), T = c.createdProjects + c.createdTasks + c.updatedProjects + c.updatedTasks + c.createdTimeLogs + c.updatedTimeLogs + f.length + i.length;
      if (g !== S || !n) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const p = Math.max(n?.sync?.rev ?? 0, 0) + 1, h = {
          ...a,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: p,
            updatedBy: At() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await Dt(JSON.stringify(h, null, 2));
      }
      re(c.presentProjects);
      const k = a.tasks.filter(
        (p) => !p.deleted && !s.taskBySync.has(p.syncId)
      ), m = (p) => String(p).replace(/\d/g, (h) => "۰۱۲۳۴۵۶۷۸۹"[Number(h)]), d = [];
      c.createdProjects && d.push(`${m(c.createdProjects)} پروژهٔ جدید`), c.createdTasks && d.push(`${m(c.createdTasks)} کار جدید`), c.updatedProjects && d.push(`${m(c.updatedProjects)} پروژهٔ به‌روزشده`), c.updatedTasks && d.push(`${m(c.updatedTasks)} کار به‌روزشده`), c.createdTimeLogs && d.push(`${m(c.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), c.updatedTimeLogs && d.push(`${m(c.updatedTimeLogs)} زمان به‌روزشده`), f.length && d.push(`حذف پروژهٔ ${f.map((p) => `«${p}»`).join("، ")} در فایل ثبت شد`), i.length && d.push(`پروژهٔ ${i.map((p) => `«${p}»`).join("، ")} که جای دیگر حذف شده بود این‌جا هم حذف شد`);
      const u = `در این دستگاه: ${m(s.projects.length + c.createdProjects)} پروژه و ${m(s.taskBySync.size)} کار (کارها در «بک‌لاگ محصول» هر پروژه).`;
      if (c.failures.length || k.length) {
        const p = c.failures.slice(0, 3).join("؛ "), h = c.failures.length > 3 ? ` و ${m(c.failures.length - 3)} مورد دیگر` : "";
        return {
          outcome: "PARTIAL",
          message: `همگام‌سازی ناقص ماند: ${m(Math.max(k.length, c.failures.length))} مورد از فایل به پاکا نیامد.` + (p ? ` ${p}${h}.` : "") + (d.length ? ` انجام‌شده: ${d.join("، ")}.` : "") + ` ${u}`,
          at: t(),
          created: c.createdProjects + c.createdTasks + c.createdTimeLogs,
          updated: c.updatedProjects + c.updatedTasks + c.updatedTimeLogs,
          failures: c.failures
        };
      }
      return T > 0 ? {
        outcome: "MERGED",
        message: `همگام‌سازی انجام شد؛ ${d.join("، ")}. ${u}`,
        at: t(),
        created: c.createdProjects + c.createdTasks + c.createdTimeLogs,
        updated: c.updatedProjects + c.updatedTasks + c.updatedTimeLogs
      } : n ? g !== S ? {
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
  })(), D.finally(() => {
    D = null;
  }));
}
let ct = 0;
async function H(e = !1) {
  if (!(!U() || !Et() || !Z()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - ct < 2e4)) {
    ct = Date.now();
    try {
      const t = await ie();
      vt(t), (t.outcome === "MERGED" || t.outcome === "PARTIAL") && (Ct(), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
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
