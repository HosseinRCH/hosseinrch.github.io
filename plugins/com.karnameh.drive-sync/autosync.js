const gt = "https://api.github.com", ht = "paca.sync.github";
function x() {
  try {
    const e = localStorage.getItem(ht), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function K(e, t, s = {}) {
  return await fetch(`${gt}${t}`, {
    ...s,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${e}`,
      ...s.headers ?? {}
    }
  });
}
function z(e, t) {
  throw e.status === 401 ? new Error("توکن گیت‌هاب نامعتبر یا منقضی است") : e.status === 403 ? new Error("توکن اجازهٔ دسترسی ندارد (Contents: Read and write لازم است)") : e.status === 404 ? new Error("مخزن پیدا نشد یا توکن به آن دسترسی ندارد") : new Error(`${t}: GitHub ${e.status}`);
}
const it = (e) => e.split("/").map(encodeURIComponent).join("/");
function wt(e) {
  const t = new TextEncoder().encode(e);
  let s = "";
  for (let n = 0; n < t.length; n += 32768)
    s += String.fromCharCode(...t.subarray(n, n + 32768));
  return btoa(s);
}
function St(e) {
  const t = atob(e.replace(/\s/g, "")), s = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) s[n] = t.charCodeAt(n);
  return new TextDecoder().decode(s);
}
let C = null;
async function ct() {
  const e = x();
  if (!e) throw new Error("unlinked");
  const t = await K(
    e.token,
    `/repos/${e.repo}/contents/${it(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return C = null, "";
  t.ok || z(t, "read");
  const s = await t.json();
  if (C = s.sha, s.content && s.encoding === "base64") return St(s.content);
  const n = await K(e.token, `/repos/${e.repo}/git/blobs/${s.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || z(n, "read"), await n.text();
}
async function It(e) {
  const t = x();
  if (!t) throw new Error("unlinked");
  const s = (o) => K(t.token, `/repos/${t.repo}/contents/${it(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: wt(e),
      branch: t.branch || "main",
      ...o ? { sha: o } : {}
    })
  });
  let n = await s(C);
  (n.status === 409 || n.status === 422) && (await ct(), n = await s(C)), n.ok || z(n, "write"), C = (await n.json()).content?.sha ?? null;
}
function kt() {
  return x() ? "github" : pt() ? "drive" : null;
}
const N = "https://www.googleapis.com/drive/v3", jt = "https://www.googleapis.com/upload/drive/v3", W = "Paca", U = "paca-sync.json", Z = "application/vnd.google-apps.folder", dt = "paca.sync.token", ut = "paca.sync.link", At = "paca.sync.auto", _t = "paca.sync.status";
function lt(e, t) {
  try {
    const s = e.getItem(t);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function ft(e, t, s) {
  try {
    e.setItem(t, JSON.stringify(s));
  } catch {
  }
}
let L = lt(sessionStorage, dt);
function V() {
  return x() ? !0 : !!(L && L.value && L.exp - 6e4 > Date.now());
}
async function bt() {
  if (V() && L) return L.value;
  throw new Error("auth");
}
function R() {
  return x() ? { folderId: "", fileId: "github" } : pt();
}
function pt() {
  const e = lt(localStorage, ut);
  return e && e.fileId ? e : null;
}
function $t(e) {
  ft(localStorage, ut, e);
}
function Tt() {
  try {
    return localStorage.getItem(At) !== "false";
  } catch {
    return !0;
  }
}
function Nt(e) {
  ft(localStorage, _t, e);
}
async function $(e, t = {}) {
  const s = await bt(), n = await fetch(e, {
    ...t,
    cache: "no-store",
    headers: { ...t.headers ?? {}, Authorization: `Bearer ${s}` }
  });
  if (n.status === 401) {
    L = null;
    try {
      sessionStorage.removeItem(dt);
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
async function H(e, t) {
  return (await (await $(xt(e, t))).json()).files ?? [];
}
async function Pt() {
  const t = (await (await $(`${N}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await H(
    `name = '${W}' and mimeType = '${Z}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await $(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: W, mimeType: Z })
  })).json()).id);
  let o = (await H(
    `name = '${U}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!o) {
    const r = await H(
      `name = '${U}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    r[0] && (await $(
      `${N}/files/${r[0].id}?addParents=${n}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), o = r[0].id);
  }
  o || (o = (await (await $(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: U,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const l = { folderId: n, fileId: o, email: t };
  return $t(l), l;
}
async function vt() {
  if (x()) return ct();
  const e = R();
  if (!e) throw new Error("unlinked");
  try {
    return await (await $(`${N}/files/${e.fileId}?alt=media`)).text();
  } catch (t) {
    if (String(t?.message).includes("404")) {
      const s = await Pt();
      return await (await $(`${N}/files/${s.fileId}?alt=media`)).text();
    }
    throw t;
  }
}
async function Et(e) {
  if (x()) return It(e);
  const t = R();
  if (!t) throw new Error("unlinked");
  await $(
    `${jt}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
function Lt(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const Q = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, Y = (e, t) => Q(e.updatedAt) >= Q(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function Ot(e, t) {
  if (!e) return t;
  if (!t) return e;
  const s = /* @__PURE__ */ new Map();
  for (const a of t.projects) s.set(a.syncId, a);
  for (const a of e.projects) {
    const o = s.get(a.syncId);
    s.set(a.syncId, o ? Y(a, o) : a);
  }
  const n = /* @__PURE__ */ new Map();
  for (const a of t.tasks) n.set(a.syncId, a);
  for (const a of e.tasks) {
    const o = n.get(a.syncId);
    n.set(a.syncId, o ? Y(a, o) : a);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...Dt(e, t),
    format: "paca-sync",
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sync: {
      rev: Math.max(e.sync?.rev ?? 0, t.sync?.rev ?? 0),
      updatedBy: e.sync?.updatedBy ?? "paca",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    projects: Array.from(s.values()),
    tasks: Array.from(n.values())
  };
}
function Dt(e, t) {
  const s = {}, n = [
    ["timeEntries", "id"],
    ["timeLogs", "syncId"]
  ];
  for (const [a, o] of n) {
    const l = e[a], r = t[a];
    if (!Array.isArray(l) && !Array.isArray(r)) continue;
    const c = /* @__PURE__ */ new Map();
    for (const d of r ?? []) c.set(String(d[o]), d);
    for (const d of l ?? []) {
      const f = c.get(String(d[o]));
      c.set(String(d[o]), f ? Y(d, f) : d);
    }
    s[a] = Array.from(c.values());
  }
  return s;
}
function D(e) {
  return JSON.stringify([e.name ?? "", e.description ?? ""]);
}
function X(e) {
  return JSON.stringify([
    e.title ?? "",
    e.description ?? null,
    e.importance ?? 0,
    e.tags ?? [],
    e.statusName ?? null,
    M(e.startDate),
    M(e.dueDate)
  ]);
}
function M(e) {
  if (!e) return null;
  const t = Date.parse(e);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}
function tt(e) {
  return JSON.stringify([
    e.taskSyncId ?? "",
    (e.date ?? "").slice(0, 10),
    yt(e),
    e.note ?? ""
  ]);
}
function yt(e) {
  const t = Number(e.minutes);
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  const s = Number(e.seconds);
  return Number.isFinite(s) && s > 0 ? Math.max(1, Math.round(s / 60)) : 0;
}
const Ct = "/api/v1", b = "pacaSyncId", P = "pacaSyncSeen", v = "pacaSyncUpdatedAt", G = "pacaSyncTimeLogs", B = "com.paca.time-logging";
class T extends Error {
}
async function w(e, t) {
  const s = await fetch(`${Ct}${e}`, {
    ...t,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...t?.body ? { "Content-Type": "application/json" } : {},
      ...t?.headers ?? {}
    }
  });
  if (s.status === 401) throw new T("unauthorized");
  if (!s.ok) {
    let a = "";
    try {
      const o = await s.json();
      a = o?.error ? `: ${o.error}` : "";
    } catch {
    }
    throw new Error(`HTTP ${s.status}${a}`);
  }
  if (s.status === 204) return;
  const n = await s.json();
  return n?.data ?? n;
}
async function Mt() {
  const e = [];
  let t = 1;
  for (; ; ) {
    const s = await w(
      `/projects?page=${t}&page_size=100`
    ), n = s.items ?? [];
    e.push(...n);
    const a = typeof s.total == "number" ? s.total : e.length;
    if (n.length === 0 || e.length >= a || t > 50) break;
    t += 1;
  }
  return e;
}
let F = !0;
async function Bt(e) {
  try {
    return await et(e, F);
  } catch (t) {
    if (!F || t instanceof T) throw t;
    return F = !1, et(e, !1);
  }
}
async function et(e, t) {
  const s = [];
  let n = null;
  for (; ; ) {
    const a = new URLSearchParams({ page_size: "200" });
    t && a.set("include", "assignees"), n && a.set("cursor", n);
    const o = await w(
      `/projects/${e}/tasks?${a.toString()}`
    );
    if (s.push(...o.items ?? []), n = o.next_cursor ?? null, !n) break;
  }
  return s;
}
async function Rt(e) {
  try {
    const t = await w(
      `/projects/${e}/task-statuses`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof T) throw t;
    return [];
  }
}
async function Jt(e) {
  try {
    const t = await w(
      `/projects/${e}/members?page_size=100`
    );
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof T) throw t;
    return [];
  }
}
const nt = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function Ut(e, t) {
  const s = await Ht(e);
  if (s) return s;
  const n = [];
  for (const a of t)
    try {
      const o = await w(
        `/plugins/${B}/projects/${e}/tasks/${a}/time-logs`
      );
      n.push(...Array.isArray(o) ? o : o?.logs ?? []);
    } catch (o) {
      if (o instanceof T) throw o;
      return null;
    }
  return n;
}
async function Ht(e) {
  const t = [];
  for (let s = 1; s <= 200; s += 1) {
    let n;
    try {
      n = await w(
        `/plugins/${B}/projects/${e}/time-logs?page_size=100&page=${s}`
      );
    } catch (l) {
      if (l instanceof T) throw l;
      return null;
    }
    const a = Array.isArray(n) ? n : n?.logs ?? [];
    t.push(...a);
    const o = Array.isArray(n) ? t.length : n?.total ?? t.length;
    if (a.length === 0 || t.length >= o || Array.isArray(n)) break;
  }
  return t;
}
function E() {
  return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
async function Ft(e) {
  const t = await Mt(), s = [], n = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  let o = [], l = !1;
  for (let i = 0; i < t.length; i += 1) {
    const u = t[i].id, p = await Bt(u);
    if (s.push(...p), n.set(u, await Rt(u)), o) {
      const j = p.length ? await Ut(u, p.map((I) => I.id)) : [];
      j === null ? o = null : p.length && (l = !0, o.push(...j), j.length && a.set(u, await Jt(u)));
    }
  }
  const r = [], c = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), f = (/* @__PURE__ */ new Date()).toISOString();
  for (const i of t) {
    const u = { ...i.settings ?? {} }, p = D({
      name: i.name,
      description: i.description ?? "",
      createdAt: i.created_at,
      updatedAt: i.created_at
    });
    let j = !1, I = typeof u[b] == "string" ? u[b] : "";
    I || (I = E(), u[b] = I, j = !0);
    const _ = typeof u[P] == "string" ? u[P] : null;
    let A;
    _ === null ? (u[P] = p, u[v] = i.created_at, A = i.created_at, j = !0) : _ !== p ? (u[P] = p, u[v] = f, A = f, j = !0) : A = typeof u[v] == "string" ? u[v] : i.created_at, j && (await w(`/projects/${i.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: u })
    }), i.settings = u), d.set(i.id, I), c.set(I, i), r.push({
      syncId: I,
      name: i.name,
      description: i.description ?? "",
      createdAt: i.created_at,
      updatedAt: A
    });
  }
  const g = [], y = /* @__PURE__ */ new Map();
  for (const i of s) {
    const u = { ...i.custom_fields ?? {} };
    let p = typeof u[b] == "string" ? u[b] : "";
    if (!p) {
      p = E();
      const A = await w(
        `/projects/${i.project_id}/tasks/${i.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...u, [b]: p }
          })
        }
      );
      A?.updated_at && (i.updated_at = A.updated_at);
    }
    y.set(p, i);
    const j = (n.get(i.project_id) ?? []).find(
      (A) => A.id === i.status_id
    ), I = (i.assignees ?? []).map(nt).filter(Boolean), _ = {
      syncId: p,
      projectSyncId: d.get(i.project_id) ?? "",
      title: i.title,
      description: i.description ?? null,
      importance: i.importance ?? 0,
      tags: i.tags ?? [],
      createdAt: i.created_at,
      updatedAt: i.updated_at ?? i.created_at,
      startDate: i.start_date ?? null,
      dueDate: i.due_date ?? null
    };
    j && (_.statusName = j.name, _.statusCategory = j.category), i.assignees && (_.assignee = I[0] ?? null, _.assignees = I), g.push(_);
  }
  const m = new Map(s.map((i) => [i.id, i])), S = new Map(t.map((i) => [i.id, i])), k = /* @__PURE__ */ new Map();
  let h = null;
  if (o && l) {
    h = [];
    for (const u of o) {
      const p = m.get(u.task_id);
      if (!p) continue;
      const I = S.get(p.project_id)?.settings?.[G] ?? {}, _ = typeof I[u.id] == "string" ? I[u.id] : u.id;
      k.set(_, u);
      const A = Number(u.minutes_spent) || 0, q = (a.get(p.project_id) ?? []).find(
        (mt) => mt.id === u.member_id
      );
      h.push({
        syncId: _,
        taskSyncId: String(p.custom_fields?.[b] ?? ""),
        projectSyncId: d.get(p.project_id) ?? "",
        date: String(u.spent_date ?? "").slice(0, 10),
        minutes: A,
        seconds: A * 60,
        note: u.note ?? "",
        ...q ? { member: nt(q) } : {},
        createdAt: u.created_at,
        updatedAt: u.updated_at || u.created_at
      });
    }
    const i = /* @__PURE__ */ new Map();
    for (const [u, p] of y) i.set(p.id, u);
    for (const u of h)
      if (!u.taskSyncId) {
        const p = k.get(u.syncId);
        u.taskSyncId = (p && i.get(p.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: s,
    projectRecords: r,
    taskRecords: g,
    projectBySync: c,
    taskBySync: y,
    statusesByProject: n,
    timeLogRecords: h,
    logBySync: k,
    localTimeLogs: o ?? []
  };
}
function Kt(e, t) {
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
async function zt(e, t, s = /* @__PURE__ */ new Set()) {
  const n = {
    createdProjects: 0,
    createdTasks: 0,
    updatedProjects: 0,
    updatedTasks: 0,
    createdTimeLogs: 0,
    updatedTimeLogs: 0
  }, a = /* @__PURE__ */ new Map();
  for (const r of t.projectRecords)
    a.set(r.syncId, r);
  const o = /* @__PURE__ */ new Map();
  for (const r of t.taskRecords)
    o.set(r.syncId, r);
  const l = /* @__PURE__ */ new Map();
  for (const r of e.projects) {
    const c = t.projectBySync.get(r.syncId);
    if (!c && r.deleted) continue;
    if (!c) {
      const g = await w("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: r.name,
          description: r.description ?? "",
          task_id_prefix: Vt(r.name, r.syncId),
          settings: {
            [b]: r.syncId,
            [P]: D(r),
            [v]: r.updatedAt
          }
        })
      });
      l.set(r.syncId, g.id), n.createdProjects += 1;
      continue;
    }
    l.set(r.syncId, c.id);
    const d = a.get(r.syncId);
    if (!d || D(d) === D(r) || Date.parse(r.updatedAt) <= Date.parse(d.updatedAt)) continue;
    const f = { ...c.settings ?? {} };
    f[b] = r.syncId, f[P] = D(r), f[v] = r.updatedAt, await w(`/projects/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: r.name,
        description: r.description ?? "",
        settings: f
      })
    }), n.updatedProjects += 1;
  }
  for (const r of e.tasks) {
    const c = t.taskBySync.get(r.syncId);
    if (!c && r.deleted) continue;
    if (!c) {
      const g = l.get(r.projectSyncId);
      if (!g) continue;
      const y = await w(`/projects/${g}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: r.title,
          description: at(r) ?? void 0,
          importance: r.importance ?? 0,
          tags: r.tags ?? [],
          custom_fields: { [b]: r.syncId },
          ...st(r, null, t.statusesByProject.get(g) ?? [])
        })
      });
      y?.id && t.taskBySync.set(r.syncId, { ...y, project_id: g }), n.createdTasks += 1;
      continue;
    }
    const d = o.get(r.syncId);
    if (!d || X(d) === X(r) || Date.parse(r.updatedAt) <= Date.parse(d.updatedAt)) continue;
    const f = { ...c.custom_fields ?? {} };
    await w(`/projects/${c.project_id}/tasks/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: r.title,
        description: at(r) ?? void 0,
        importance: r.importance ?? 0,
        tags: r.tags ?? [],
        custom_fields: { ...f, [b]: r.syncId },
        ...st(r, c, t.statusesByProject.get(c.project_id) ?? [])
      })
    }), n.updatedTasks += 1;
  }
  return t.timeLogRecords && Array.isArray(e.timeLogs) && await Gt(e, t, s, n), n;
}
function st(e, t, s) {
  const n = {};
  if (e.statusName !== void 0 || e.statusCategory !== void 0) {
    const a = s.find((o) => o.name === e.statusName) ?? s.find((o) => o.category === e.statusCategory);
    a && a.id !== t?.status_id && (n.status_id = a.id);
  }
  for (const [a, o] of [
    ["startDate", "start_date"],
    ["dueDate", "due_date"]
  ]) {
    const l = e[a];
    l !== void 0 && M(l) !== M(t?.[o] ?? null) && (l === null ? n[o] = null : Number.isNaN(Date.parse(l)) || (n[o] = new Date(l).toISOString()));
  }
  return n;
}
function at(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const s = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof s != "string" ? t ?? null : Yt(s);
}
function Yt(e) {
  const t = { textColor: "default", backgroundColor: "default", textAlignment: "right" }, s = (a) => a.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(
    (o) => o.startsWith("**") && o.endsWith("**") ? { type: "text", text: o.slice(2, -2), styles: { bold: !0 } } : { type: "text", text: o, styles: {} }
  ), n = [];
  for (const a of e.split(/\r?\n/)) {
    const o = a.trimEnd();
    if (!o.trim()) continue;
    const l = o.match(/^(#{1,3})\s+(.*)$/), r = o.match(/^\s*[-*•]\s+(.*)$/), c = o.match(/^\s*[0-9۰-۹]+[.)]\s+(.*)$/);
    l ? n.push({ id: E(), type: "heading", props: { ...t, level: l[1].length }, content: s(l[2]), children: [] }) : r ? n.push({ id: E(), type: "bulletListItem", props: t, content: s(r[1]), children: [] }) : c ? n.push({ id: E(), type: "numberedListItem", props: t, content: s(c[1]), children: [] }) : n.push({ id: E(), type: "paragraph", props: t, content: s(o), children: [] });
  }
  return n;
}
async function Gt(e, t, s, n) {
  const a = /* @__PURE__ */ new Map();
  for (const d of t.timeLogRecords ?? []) a.set(d.syncId, d);
  const o = /* @__PURE__ */ new Map(), l = (d) => {
    let f = o.get(d.id);
    return f || (f = { ...d.settings ?? {} }, o.set(d.id, f)), f;
  }, r = async (d, f, g) => {
    const y = t.projects.find((k) => k.id === d);
    if (!y) return;
    const m = l(y), S = { ...m[G] ?? {} };
    S[f] = g, m[G] = S, await w(`/projects/${d}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: m })
    }), y.settings = m;
  }, c = /* @__PURE__ */ new Set();
  for (const d of e.timeLogs ?? []) {
    if (d.deleted) continue;
    const f = yt(d), g = String(d.date ?? "").slice(0, 10);
    if (!f || !/^\d{4}-\d{2}-\d{2}$/.test(g)) continue;
    const y = t.logBySync.get(d.syncId);
    if (y) {
      const h = a.get(d.syncId);
      if (!h || tt(h) === tt(d) || Date.parse(d.updatedAt) <= Date.parse(h.updatedAt)) continue;
      const i = t.tasks.find((u) => u.id === y.task_id);
      if (!i) continue;
      try {
        await w(
          `/plugins/${B}/projects/${i.project_id}/tasks/${i.id}/time-logs/${y.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ spent_date: g, minutes_spent: f, note: d.note ?? "" })
          }
        ), n.updatedTimeLogs += 1;
      } catch (u) {
        if (u instanceof T) throw u;
      }
      continue;
    }
    const m = t.taskBySync.get(d.taskSyncId);
    if (!m) continue;
    const S = t.localTimeLogs.find((h) => {
      const i = (a.get(h.id) ? h.id : "") || "";
      return i && !s.has(i) && !c.has(i) && h.task_id === m.id && String(h.spent_date).slice(0, 10) === g && Number(h.minutes_spent) === f && (h.note ?? "") === (d.note ?? "");
    });
    if (S) {
      await r(m.project_id, S.id, d.syncId), c.add(S.id);
      continue;
    }
    let k = null;
    try {
      k = await w(
        `/plugins/${B}/projects/${m.project_id}/tasks/${m.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: g, minutes_spent: f, note: d.note ?? "" })
        }
      );
    } catch (h) {
      if (h instanceof T) throw h;
      continue;
    }
    k?.id && await r(m.project_id, k.id, d.syncId), n.createdTimeLogs += 1;
  }
  c.size && (e.timeLogs = (e.timeLogs ?? []).filter((d) => !c.has(d.syncId)));
}
function Vt(e, t) {
  const s = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((s.length >= 2 ? s.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
function ot(e) {
  if (!e) return "";
  const t = [...e.projects].sort((a, o) => a.syncId.localeCompare(o.syncId)).map((a) => [a.syncId, a.name, a.description, a.updatedAt]), s = [...e.tasks].sort((a, o) => a.syncId.localeCompare(o.syncId)).map((a) => [
    a.syncId,
    a.projectSyncId,
    a.title,
    JSON.stringify(a.description ?? null),
    a.importance,
    JSON.stringify(a.tags ?? []),
    a.updatedAt,
    a.statusName ?? null,
    a.assignee ?? null,
    a.startDate ?? null,
    a.dueDate ?? null
  ]), n = [...e.timeLogs ?? []].sort((a, o) => a.syncId.localeCompare(o.syncId)).map((a) => [a.syncId, a.taskSyncId, a.date, a.minutes, a.note, a.updatedAt]);
  return JSON.stringify([t, s, n]);
}
function qt(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return Lt(t) ? t : null;
  } catch {
    return null;
  }
}
let O = null;
function Wt(e = {}) {
  return O || (O = (async () => {
    const t = () => Date.now();
    try {
      if (!R())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: t()
        };
      if (!V())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: t()
        };
      e.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const s = await vt(), n = qt(s);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const a = await Ft(), o = Kt(a, n?.sync?.rev ?? 0), l = Ot(o, n) ?? o, r = new Set((n?.timeLogs ?? []).map((S) => S.syncId)), c = await zt(l, a, r), d = ot(n), f = ot(l), g = c.createdProjects + c.createdTasks + c.updatedProjects + c.updatedTasks + c.createdTimeLogs + c.updatedTimeLogs;
      if (d !== f || !n) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const S = Math.max(n?.sync?.rev ?? 0, 0) + 1, k = {
          ...l,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: S,
            updatedBy: kt() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await Et(JSON.stringify(k, null, 2));
      }
      const y = (S) => String(S).replace(/\d/g, (k) => "۰۱۲۳۴۵۶۷۸۹"[Number(k)]), m = [];
      return c.createdProjects && m.push(`${y(c.createdProjects)} پروژهٔ جدید`), c.createdTasks && m.push(`${y(c.createdTasks)} کار جدید`), c.updatedProjects && m.push(`${y(c.updatedProjects)} پروژهٔ به‌روزشده`), c.updatedTasks && m.push(`${y(c.updatedTasks)} کار به‌روزشده`), c.createdTimeLogs && m.push(`${y(c.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), c.updatedTimeLogs && m.push(`${y(c.updatedTimeLogs)} زمان به‌روزشده`), g > 0 ? {
        outcome: "MERGED",
        message: `همگام‌سازی انجام شد؛ ${m.join("، ")}.`,
        at: t(),
        created: c.createdProjects + c.createdTasks + c.createdTimeLogs,
        updated: c.updatedProjects + c.updatedTasks + c.updatedTimeLogs
      } : n ? d !== f ? {
        outcome: "PUSHED",
        message: "تغییرات پاکا ذخیره شد.",
        at: t()
      } : { outcome: "UP_TO_DATE", message: "همه‌چیز به‌روز است.", at: t() } : {
        outcome: "PUSHED",
        message: "فایل همگام‌سازی ساخته شد و داده‌های پاکا در آن ذخیره شد.",
        at: t()
      };
    } catch (s) {
      const n = s?.message ?? String(s);
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
  })(), O.finally(() => {
    O = null;
  }));
}
let rt = 0;
async function J(e = !1) {
  if (!(!R() || !Tt() || !V()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - rt < 2e4)) {
    rt = Date.now();
    try {
      const t = await Wt();
      Nt(t), t.outcome === "MERGED" && (document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
    } catch {
    }
  }
}
setTimeout(() => void J(!0), 6e3);
setInterval(() => void J(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && J();
});
window.addEventListener("online", () => void J(!0));
