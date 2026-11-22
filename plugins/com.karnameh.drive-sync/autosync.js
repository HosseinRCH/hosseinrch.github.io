const bt = "https://api.github.com", Tt = "paca.sync.github";
function E() {
  try {
    const e = localStorage.getItem(Tt), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function X(e, t, o = {}) {
  return await fetch(`${bt}${t}`, {
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
function tt(e, t) {
  throw e.status === 401 ? new Error("توکن گیت‌هاب نامعتبر یا منقضی است") : e.status === 403 ? new Error("توکن اجازهٔ دسترسی ندارد (Contents: Read and write لازم است)") : e.status === 404 ? new Error("مخزن پیدا نشد یا توکن به آن دسترسی ندارد") : new Error(`${t}: GitHub ${e.status}`);
}
const ht = (e) => e.split("/").map(encodeURIComponent).join("/");
function vt(e) {
  const t = new TextEncoder().encode(e);
  let o = "";
  for (let n = 0; n < t.length; n += 32768)
    o += String.fromCharCode(...t.subarray(n, n + 32768));
  return btoa(o);
}
function Nt(e) {
  const t = atob(e.replace(/\s/g, "")), o = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) o[n] = t.charCodeAt(n);
  return new TextDecoder().decode(o);
}
let R = null;
async function wt() {
  const e = E();
  if (!e) throw new Error("unlinked");
  const t = await X(
    e.token,
    `/repos/${e.repo}/contents/${ht(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return R = null, "";
  t.ok || tt(t, "read");
  const o = await t.json();
  if (R = o.sha, o.content && o.encoding === "base64") return Nt(o.content);
  const n = await X(e.token, `/repos/${e.repo}/git/blobs/${o.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || tt(n, "read"), await n.text();
}
async function Et(e) {
  const t = E();
  if (!t) throw new Error("unlinked");
  const o = (i) => X(t.token, `/repos/${t.repo}/contents/${ht(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: vt(e),
      branch: t.branch || "main",
      ...i ? { sha: i } : {}
    })
  });
  let n = await o(R);
  (n.status === 409 || n.status === 422) && (await wt(), n = await o(R)), n.ok || tt(n, "write"), R = (await n.json()).content?.sha ?? null;
}
function Pt() {
  return E() ? "github" : It() ? "drive" : null;
}
const N = "https://www.googleapis.com/drive/v3", Lt = "https://www.googleapis.com/upload/drive/v3", ct = "Paca", W = "paca-sync.json", dt = "application/vnd.google-apps.folder", z = "paca.sync.token", St = "paca.sync.link", Ot = "paca.sync.auto", xt = "paca.sync.status";
function et(e, t) {
  try {
    const o = e.getItem(t);
    return o ? JSON.parse(o) : null;
  } catch {
    return null;
  }
}
function jt(e, t, o) {
  try {
    e.setItem(t, JSON.stringify(o));
  } catch {
  }
}
let D = et(sessionStorage, z) ?? et(localStorage, z);
function rt() {
  return E() ? !0 : !!(D && D.value && D.exp - 6e4 > Date.now());
}
async function Dt() {
  if (rt() && D) return D.value;
  throw new Error("auth");
}
function G() {
  return E() ? { folderId: "", fileId: "github" } : It();
}
function It() {
  const e = et(localStorage, St);
  return e && e.fileId ? e : null;
}
function Bt(e) {
  jt(localStorage, St, e);
}
function Ct() {
  try {
    return localStorage.getItem(Ot) !== "false";
  } catch {
    return !0;
  }
}
function Mt(e) {
  jt(localStorage, xt, e);
}
async function T(e, t = {}) {
  const o = await Dt(), n = await fetch(e, {
    ...t,
    cache: "no-store",
    headers: { ...t.headers ?? {}, Authorization: `Bearer ${o}` }
  });
  if (n.status === 401) {
    D = null;
    try {
      sessionStorage.removeItem(z), localStorage.removeItem(z);
    } catch {
    }
    throw new Error("auth");
  }
  if (!n.ok) throw new Error(`drive ${n.status}`);
  return n;
}
const Jt = (e, t) => `${N}/files?${new URLSearchParams({
  q: e,
  fields: t,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function q(e, t) {
  return (await (await T(Jt(e, t))).json()).files ?? [];
}
async function Rt() {
  const t = (await (await T(`${N}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await q(
    `name = '${ct}' and mimeType = '${dt}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await T(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: ct, mimeType: dt })
  })).json()).id);
  let i = (await q(
    `name = '${W}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!i) {
    const r = await q(
      `name = '${W}' and 'root' in parents and trashed = false`,
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
      name: W,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const u = { folderId: n, fileId: i, email: t };
  return Bt(u), u;
}
async function Ft() {
  if (E()) return wt();
  const e = G();
  if (!e) throw new Error("unlinked");
  try {
    return await (await T(`${N}/files/${e.fileId}?alt=media`)).text();
  } catch (t) {
    if (String(t?.message).includes("404")) {
      const o = await Rt();
      return await (await T(`${N}/files/${o.fileId}?alt=media`)).text();
    }
    throw t;
  }
}
async function Ut(e) {
  if (E()) return Et(e);
  const t = G();
  if (!t) throw new Error("unlinked");
  await T(
    `${Lt}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
let F = null;
function Ht() {
  if (F) return F;
  const e = [document.getElementById("root"), document.getElementById("app"), document.body.firstElementChild];
  for (const t of e) {
    if (!t) continue;
    const o = Object.keys(t).find((i) => i.startsWith("__reactContainer$"));
    if (!o) continue;
    let n = [t[o]], s = 0;
    for (; n.length && s < 2e4; ) {
      const i = n.pop();
      if (s += 1, !i) continue;
      const u = i.memoizedProps?.client;
      if (u && typeof u.invalidateQueries == "function")
        return F = u, F;
      i.sibling && n.push(i.sibling), i.child && n.push(i.child), n.length > 5e3 && (n = n.slice(-5e3));
    }
  }
  return null;
}
function zt() {
  try {
    const e = Ht();
    e && e.invalidateQueries();
  } catch {
  }
  try {
    document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new Event("focus"));
  } catch {
  }
}
const kt = "pacaDriveFiles";
function Kt(e) {
  const t = e?.[kt];
  if (Array.isArray(t))
    return t.filter(
      (o) => !!o && typeof o == "object" && typeof o.id == "string"
    );
}
function H(e) {
  return Array.isArray(e.driveFiles) ? { [kt]: e.driveFiles } : {};
}
const Yt = ["word_count", "price_per_word", "amount"];
function Gt(e) {
  const t = {};
  for (const o of Yt) {
    const n = e?.[o], s = typeof n == "number" ? n : typeof n == "string" && n.trim() !== "" ? Number(n) : NaN;
    Number.isFinite(s) && (t[o] = s);
  }
  return Object.keys(t).length ? t : void 0;
}
function Vt(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const ut = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, nt = (e, t) => ut(e.updatedAt) >= ut(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function Wt(e, t) {
  if (!e) return t;
  if (!t) return e;
  const o = /* @__PURE__ */ new Map();
  for (const s of t.projects) o.set(s.syncId, s);
  for (const s of e.projects) {
    const i = o.get(s.syncId);
    o.set(s.syncId, i ? nt(s, i) : s);
  }
  const n = /* @__PURE__ */ new Map();
  for (const s of t.tasks) n.set(s.syncId, s);
  for (const s of e.tasks) {
    const i = n.get(s.syncId);
    n.set(s.syncId, i ? nt(s, i) : s);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...qt(e, t),
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
function qt(e, t) {
  const o = {}, n = [
    ["timeEntries", "id"],
    ["timeLogs", "syncId"]
  ];
  for (const [s, i] of n) {
    const u = e[s], r = t[s];
    if (!Array.isArray(u) && !Array.isArray(r)) continue;
    const f = /* @__PURE__ */ new Map();
    for (const a of r ?? []) f.set(String(a[i]), a);
    for (const a of u ?? []) {
      const p = f.get(String(a[i]));
      f.set(String(a[i]), p ? nt(a, p) : a);
    }
    o[s] = Array.from(f.values());
  }
  return o;
}
function J(e) {
  return JSON.stringify([e.name ?? "", e.description ?? ""]);
}
function lt(e) {
  return JSON.stringify([
    e.title ?? "",
    e.description ?? null,
    e.importance ?? 0,
    e.tags ?? [],
    e.statusName ?? null,
    K(e.startDate),
    K(e.dueDate),
    e.fields ?? null,
    e.driveFiles ? e.driveFiles.map((t) => t.id) : null
  ]);
}
function K(e) {
  if (!e) return null;
  const t = Date.parse(e);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}
function ft(e) {
  return JSON.stringify([
    e.taskSyncId ?? "",
    (e.date ?? "").slice(0, 10),
    $t(e),
    e.note ?? ""
  ]);
}
function $t(e) {
  const t = Number(e.minutes);
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  const o = Number(e.seconds);
  return Number.isFinite(o) && o > 0 ? Math.max(1, Math.round(o / 60)) : 0;
}
const Qt = "/api/v1", k = "pacaSyncId", L = "pacaSyncSeen", O = "pacaSyncUpdatedAt", st = "pacaSyncTimeLogs", Y = "com.paca.time-logging";
class j extends Error {
}
async function S(e, t) {
  const o = await fetch(`${Qt}${e}`, {
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
async function Zt() {
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
let Q = !0;
async function Xt(e) {
  try {
    return await pt(e, Q);
  } catch (t) {
    if (!Q || t instanceof j) throw t;
    return Q = !1, pt(e, !1);
  }
}
async function pt(e, t) {
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
async function te(e) {
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
async function ee(e) {
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
const yt = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function ne(e, t) {
  const o = await se(e);
  if (o) return o;
  const n = [];
  for (const s of t)
    try {
      const i = await S(
        `/plugins/${Y}/projects/${e}/tasks/${s}/time-logs`
      );
      n.push(...Array.isArray(i) ? i : i?.logs ?? []);
    } catch (i) {
      if (i instanceof j) throw i;
      return null;
    }
  return n;
}
async function se(e) {
  const t = [];
  for (let o = 1; o <= 200; o += 1) {
    let n;
    try {
      n = await S(
        `/plugins/${Y}/projects/${e}/time-logs?page_size=100&page=${o}`
      );
    } catch (u) {
      if (u instanceof j) throw u;
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
async function oe(e) {
  const t = await Zt(), o = [], n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  let i = [], u = !1;
  for (let d = 0; d < t.length; d += 1) {
    const l = t[d].id, y = await Xt(l);
    if (o.push(...y), n.set(l, await te(l)), i) {
      const w = y.length ? await ne(l, y.map((I) => I.id)) : [];
      w === null ? i = null : y.length && (u = !0, i.push(...w), w.length && s.set(l, await ee(l)));
    }
  }
  const r = [], f = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), p = (/* @__PURE__ */ new Date()).toISOString();
  for (const d of t) {
    const l = { ...d.settings ?? {} }, y = J({
      name: d.name,
      description: d.description ?? "",
      createdAt: d.created_at,
      updatedAt: d.created_at
    });
    let w = !1, I = typeof l[k] == "string" ? l[k] : "";
    I || (I = x(), l[k] = I, w = !0);
    const $ = typeof l[L] == "string" ? l[L] : null;
    let b;
    $ === null ? (l[L] = y, l[O] = d.created_at, b = d.created_at, w = !0) : $ !== y ? (l[L] = y, l[O] = p, b = p, w = !0) : b = typeof l[O] == "string" ? l[O] : d.created_at, w && (await S(`/projects/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: l })
    }), d.settings = l), a.set(d.id, I), f.set(I, d), r.push({
      syncId: I,
      name: d.name,
      description: d.description ?? "",
      createdAt: d.created_at,
      updatedAt: b
    });
  }
  const c = [], g = /* @__PURE__ */ new Map();
  for (const d of o) {
    const l = { ...d.custom_fields ?? {} };
    let y = typeof l[k] == "string" ? l[k] : "";
    if (!y) {
      y = x();
      const P = await S(
        `/projects/${d.project_id}/tasks/${d.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...l, [k]: y }
          })
        }
      );
      P?.updated_at && (d.updated_at = P.updated_at);
    }
    g.set(y, d);
    const w = (n.get(d.project_id) ?? []).find(
      (P) => P.id === d.status_id
    ), I = (d.assignees ?? []).map(yt).filter(Boolean), $ = {
      syncId: y,
      projectSyncId: a.get(d.project_id) ?? "",
      title: d.title,
      description: d.description ?? null,
      importance: d.importance ?? 0,
      tags: d.tags ?? [],
      createdAt: d.created_at,
      updatedAt: d.updated_at ?? d.created_at,
      startDate: d.start_date ?? null,
      dueDate: d.due_date ?? null
    }, b = Gt(d.custom_fields);
    b && ($.fields = b);
    const B = Kt(d.custom_fields);
    B && ($.driveFiles = B), w && ($.statusName = w.name, $.statusCategory = w.category), d.assignees && ($.assignee = I[0] ?? null, $.assignees = I), c.push($);
  }
  const h = new Map(o.map((d) => [d.id, d])), A = new Map(t.map((d) => [d.id, d])), _ = /* @__PURE__ */ new Map();
  let m = null;
  if (i && u) {
    m = [];
    for (const l of i) {
      const y = h.get(l.task_id);
      if (!y) continue;
      const I = A.get(y.project_id)?.settings?.[st] ?? {}, $ = typeof I[l.id] == "string" ? I[l.id] : l.id;
      _.set($, l);
      const b = Number(l.minutes_spent) || 0, B = (s.get(y.project_id) ?? []).find(
        (P) => P.id === l.member_id
      );
      m.push({
        syncId: $,
        taskSyncId: String(y.custom_fields?.[k] ?? ""),
        projectSyncId: a.get(y.project_id) ?? "",
        date: String(l.spent_date ?? "").slice(0, 10),
        minutes: b,
        seconds: b * 60,
        note: l.note ?? "",
        ...B ? { member: yt(B) } : {},
        createdAt: l.created_at,
        updatedAt: l.updated_at || l.created_at
      });
    }
    const d = /* @__PURE__ */ new Map();
    for (const [l, y] of g) d.set(y.id, l);
    for (const l of m)
      if (!l.taskSyncId) {
        const y = _.get(l.syncId);
        l.taskSyncId = (y && d.get(y.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: o,
    projectRecords: r,
    taskRecords: c,
    projectBySync: f,
    taskBySync: g,
    statusesByProject: n,
    timeLogRecords: m,
    logBySync: _,
    localTimeLogs: i ?? []
  };
}
function ie(e, t) {
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
async function re(e, t, o) {
  const n = {
    title: t.title || "(بدون عنوان)",
    custom_fields: { ...H(t), [k]: t.syncId }
  };
  try {
    return await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        ...n,
        custom_fields: { ...t.fields ?? {}, ...H(t), [k]: t.syncId },
        description: it(t) ?? void 0,
        importance: t.importance ?? 0,
        tags: t.tags ?? [],
        ...ot(t, null, o)
      })
    });
  } catch (s) {
    if (s instanceof j) throw s;
    const i = await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify(n)
    }).catch((r) => {
      throw r instanceof j ? r : new Error(`${v(s)} / ${v(r)}`);
    }), u = [
      { description: it(t) ?? void 0 },
      { importance: t.importance ?? 0 },
      { tags: t.tags ?? [] },
      ...t.fields ? [{ custom_fields: { ...t.fields, ...H(t), [k]: t.syncId } }] : [],
      ...Object.entries(ot(t, null, o)).map(([r, f]) => ({ [r]: f }))
    ];
    for (const r of u)
      try {
        await S(`/projects/${e}/tasks/${i.id}`, {
          method: "PATCH",
          body: JSON.stringify(r)
        });
      } catch (f) {
        if (f instanceof j) throw f;
      }
    return i;
  }
}
async function ae(e, t) {
  if (!t) return 0;
  const o = new Set(t.projects.map((i) => i.syncId)), n = (i) => (i || "").replace(/\s+/g, " ").trim();
  let s = 0;
  for (const i of t.projects) {
    if (i.deleted || e.projectBySync.has(i.syncId)) continue;
    const u = e.projectRecords.filter(
      (c) => !o.has(c.syncId) && n(c.name) === n(i.name)
    );
    if (u.length !== 1) continue;
    const r = u[0], f = e.projectBySync.get(r.syncId);
    if (!f) continue;
    const a = { ...f.settings ?? {}, [k]: i.syncId };
    await S(`/projects/${f.id}`, { method: "PATCH", body: JSON.stringify({ settings: a }) }), f.settings = a;
    const p = r.syncId;
    e.projectBySync.delete(p), e.projectBySync.set(i.syncId, f), r.syncId = i.syncId;
    for (const c of e.taskRecords) c.projectSyncId === p && (c.projectSyncId = i.syncId);
    for (const c of e.timeLogRecords ?? []) c.projectSyncId === p && (c.projectSyncId = i.syncId);
    s += 1;
  }
  return s;
}
async function ce(e, t, o = /* @__PURE__ */ new Set()) {
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
  const u = /* @__PURE__ */ new Map();
  for (const r of e.projects) {
    const f = t.projectBySync.get(r.syncId);
    if (r.deleted) continue;
    if (!f) {
      let c;
      try {
        c = await S("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: r.name,
            description: r.description ?? "",
            task_id_prefix: le(r.name, r.syncId),
            settings: {
              [k]: r.syncId,
              [L]: J(r),
              [O]: r.updatedAt
            }
          })
        });
      } catch (g) {
        if (g instanceof j) throw g;
        n.failures.push(`پروژهٔ «${r.name}» ساخته نشد: ${v(g)}`);
        continue;
      }
      u.set(r.syncId, c.id), n.presentProjects.push(r.syncId), n.createdProjects += 1;
      continue;
    }
    u.set(r.syncId, f.id), n.presentProjects.push(r.syncId);
    const a = s.get(r.syncId);
    if (!a || J(a) === J(r) || Date.parse(r.updatedAt) <= Date.parse(a.updatedAt)) continue;
    const p = { ...f.settings ?? {} };
    p[k] = r.syncId, p[L] = J(r), p[O] = r.updatedAt;
    try {
      await S(`/projects/${f.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: r.name,
          description: r.description ?? "",
          settings: p
        })
      }), n.updatedProjects += 1;
    } catch (c) {
      if (c instanceof j) throw c;
      n.failures.push(`پروژهٔ «${r.name}» به‌روز نشد: ${v(c)}`);
    }
  }
  for (const r of e.tasks) {
    const f = t.taskBySync.get(r.syncId);
    if (!f && r.deleted) continue;
    if (!f) {
      const g = u.get(r.projectSyncId);
      if (!g) {
        const h = e.projects.find((A) => A.syncId === r.projectSyncId);
        n.failures.push(
          h ? `کار «${r.title}» منتقل نشد: پروژهٔ «${h.name}» در این دستگاه ساخته نشد` : `کار «${r.title}» منتقل نشد: پروژهٔ آن در فایل همگام‌سازی نیست`
        );
        continue;
      }
      try {
        const h = await re(
          g,
          r,
          t.statusesByProject.get(g) ?? []
        );
        h?.id && t.taskBySync.set(r.syncId, { ...h, project_id: g }), n.createdTasks += 1;
      } catch (h) {
        if (h instanceof j) throw h;
        n.failures.push(`کار «${r.title}» ساخته نشد: ${v(h)}`);
      }
      continue;
    }
    const a = i.get(r.syncId);
    if (!a || lt(a) === lt(r) || Date.parse(r.updatedAt) <= Date.parse(a.updatedAt)) continue;
    const p = { ...f.custom_fields ?? {} }, c = (g) => S(`/projects/${f.project_id}/tasks/${f.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: r.title,
        description: it(r) ?? void 0,
        importance: r.importance ?? 0,
        tags: r.tags ?? [],
        custom_fields: { ...p, ...g ? r.fields ?? {} : {}, ...H(r), [k]: r.syncId },
        ...ot(r, f, t.statusesByProject.get(f.project_id) ?? [])
      })
    });
    try {
      try {
        await c(!0);
      } catch (g) {
        if (g instanceof j || !r.fields) throw g;
        await c(!1);
      }
      n.updatedTasks += 1;
    } catch (g) {
      if (g instanceof j) throw g;
      n.failures.push(`کار «${r.title}» به‌روز نشد: ${v(g)}`);
    }
  }
  if (t.timeLogRecords && Array.isArray(e.timeLogs))
    try {
      await ue(e, t, o, n);
    } catch (r) {
      if (r instanceof j) throw r;
      n.failures.push(`زمان‌های ثبت‌شده منتقل نشدند: ${v(r)}`);
    }
  return n;
}
function ot(e, t, o) {
  const n = {};
  if (e.statusName !== void 0 || e.statusCategory !== void 0) {
    const s = o.find((i) => i.name === e.statusName) ?? o.find((i) => i.category === e.statusCategory);
    s && s.id !== t?.status_id && (n.status_id = s.id);
  }
  for (const [s, i] of [
    ["startDate", "start_date"],
    ["dueDate", "due_date"]
  ]) {
    const u = e[s];
    u !== void 0 && K(u) !== K(t?.[i] ?? null) && (u === null ? n[i] = null : Number.isNaN(Date.parse(u)) || (n[i] = new Date(u).toISOString()));
  }
  return n;
}
function it(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const o = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof o != "string" ? t ?? null : de(o);
}
function de(e) {
  const t = { textColor: "default", backgroundColor: "default", textAlignment: "right" }, o = (s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(
    (i) => i.startsWith("**") && i.endsWith("**") ? { type: "text", text: i.slice(2, -2), styles: { bold: !0 } } : { type: "text", text: i, styles: {} }
  ), n = [];
  for (const s of e.split(/\r?\n/)) {
    const i = s.trimEnd();
    if (!i.trim()) continue;
    const u = i.match(/^(#{1,3})\s+(.*)$/), r = i.match(/^\s*[-*•]\s+(.*)$/), f = i.match(/^\s*[0-9۰-۹]+[.)]\s+(.*)$/);
    u ? n.push({ id: x(), type: "heading", props: { ...t, level: u[1].length }, content: o(u[2]), children: [] }) : r ? n.push({ id: x(), type: "bulletListItem", props: t, content: o(r[1]), children: [] }) : f ? n.push({ id: x(), type: "numberedListItem", props: t, content: o(f[1]), children: [] }) : n.push({ id: x(), type: "paragraph", props: t, content: o(i), children: [] });
  }
  return n;
}
async function ue(e, t, o, n) {
  const s = /* @__PURE__ */ new Map();
  for (const a of t.timeLogRecords ?? []) s.set(a.syncId, a);
  const i = /* @__PURE__ */ new Map(), u = (a) => {
    let p = i.get(a.id);
    return p || (p = { ...a.settings ?? {} }, i.set(a.id, p)), p;
  }, r = async (a, p, c) => {
    const g = t.projects.find((_) => _.id === a);
    if (!g) return;
    const h = u(g), A = { ...h[st] ?? {} };
    A[p] = c, h[st] = A, await S(`/projects/${a}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: h })
    }), g.settings = h;
  }, f = /* @__PURE__ */ new Set();
  for (const a of e.timeLogs ?? []) {
    if (a.deleted) continue;
    const p = $t(a), c = String(a.date ?? "").slice(0, 10);
    if (!p || !/^\d{4}-\d{2}-\d{2}$/.test(c)) continue;
    const g = t.logBySync.get(a.syncId);
    if (g) {
      const m = s.get(a.syncId);
      if (!m || ft(m) === ft(a) || Date.parse(a.updatedAt) <= Date.parse(m.updatedAt)) continue;
      const d = t.tasks.find((l) => l.id === g.task_id);
      if (!d) continue;
      try {
        await S(
          `/plugins/${Y}/projects/${d.project_id}/tasks/${d.id}/time-logs/${g.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ spent_date: c, minutes_spent: p, note: a.note ?? "" })
          }
        ), n.updatedTimeLogs += 1;
      } catch (l) {
        if (l instanceof j) throw l;
      }
      continue;
    }
    const h = t.taskBySync.get(a.taskSyncId);
    if (!h) continue;
    const A = t.localTimeLogs.find((m) => {
      const d = (s.get(m.id) ? m.id : "") || "";
      return d && !o.has(d) && !f.has(d) && m.task_id === h.id && String(m.spent_date).slice(0, 10) === c && Number(m.minutes_spent) === p && (m.note ?? "") === (a.note ?? "");
    });
    if (A) {
      await r(h.project_id, A.id, a.syncId), f.add(A.id);
      continue;
    }
    let _ = null;
    try {
      _ = await S(
        `/plugins/${Y}/projects/${h.project_id}/tasks/${h.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: c, minutes_spent: p, note: a.note ?? "" })
        }
      );
    } catch (m) {
      if (m instanceof j) throw m;
      continue;
    }
    _?.id && await r(h.project_id, _.id, a.syncId), n.createdTimeLogs += 1;
  }
  f.size && (e.timeLogs = (e.timeLogs ?? []).filter((a) => !f.has(a.syncId)));
}
function le(e, t) {
  const o = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((o.length >= 2 ? o.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
async function fe(e, t) {
  const o = [];
  for (const n of e.projects) {
    if (!n.deleted) continue;
    const s = t.projectBySync.get(n.syncId);
    if (!s) continue;
    try {
      await S(`/projects/${s.id}`, { method: "DELETE" });
    } catch (u) {
      if (u instanceof j) throw u;
      continue;
    }
    t.projectBySync.delete(n.syncId), t.projects = t.projects.filter((u) => u.id !== s.id);
    const i = /* @__PURE__ */ new Set();
    for (const [u, r] of t.taskBySync)
      r.project_id === s.id && (i.add(r.id), t.taskBySync.delete(u));
    for (const [u, r] of t.logBySync)
      i.has(r.task_id) && t.logBySync.delete(u);
    o.push(n.name);
  }
  return o;
}
function gt(e) {
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
function pe(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return Vt(t) ? t : null;
  } catch {
    return null;
  }
}
const At = "paca-sync.known-projects";
function ye() {
  try {
    const e = localStorage.getItem(At);
    if (!e) return null;
    const t = JSON.parse(e);
    return Array.isArray(t) ? new Set(t.map(String)) : null;
  } catch {
    return null;
  }
}
function ge(e) {
  try {
    localStorage.setItem(At, JSON.stringify(e));
  } catch {
  }
}
function me(e, t, o) {
  const n = (/* @__PURE__ */ new Date()).toISOString(), s = [], i = /* @__PURE__ */ new Set();
  o && ![...o].some((a) => t.has(a)) && (o = null);
  const u = e.projects.map((a) => a.deleted ? (i.add(a.syncId), a) : o && o.has(a.syncId) && !t.has(a.syncId) ? (i.add(a.syncId), s.push(a.name), { ...a, deleted: !0, updatedAt: n }) : a);
  if (!i.size) return { bundle: e, deletedHere: s };
  const r = e.tasks.map(
    (a) => i.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: n } : a
  ), f = e.timeLogs?.map(
    (a) => i.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: n } : a
  );
  return { bundle: { ...e, projects: u, tasks: r, ...f ? { timeLogs: f } : {} }, deletedHere: s };
}
let C = null;
function he(e = {}) {
  return C || (C = (async () => {
    const t = () => Date.now();
    try {
      if (!G())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: t()
        };
      if (!rt())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: t()
        };
      e.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const o = await Ft(), n = pe(o);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const s = await oe();
      await ae(s, n);
      const i = ie(s, n?.sync?.rev ?? 0), u = ye(), { bundle: r, deletedHere: f } = me(
        Wt(i, n) ?? i,
        new Set(s.projectBySync.keys()),
        u
      ), a = await fe(r, s), p = new Set((n?.timeLogs ?? []).map((y) => y.syncId)), c = await ce(r, s, p), g = gt(n), h = gt(r), A = c.createdProjects + c.createdTasks + c.updatedProjects + c.updatedTasks + c.createdTimeLogs + c.updatedTimeLogs + f.length + a.length;
      if (g !== h || !n) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const y = Math.max(n?.sync?.rev ?? 0, 0) + 1, w = {
          ...r,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: y,
            updatedBy: Pt() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await Ut(JSON.stringify(w, null, 2));
      }
      ge(c.presentProjects);
      const _ = r.tasks.filter(
        (y) => !y.deleted && !s.taskBySync.has(y.syncId)
      ), m = (y) => String(y).replace(/\d/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[Number(w)]), d = [];
      c.createdProjects && d.push(`${m(c.createdProjects)} پروژهٔ جدید`), c.createdTasks && d.push(`${m(c.createdTasks)} کار جدید`), c.updatedProjects && d.push(`${m(c.updatedProjects)} پروژهٔ به‌روزشده`), c.updatedTasks && d.push(`${m(c.updatedTasks)} کار به‌روزشده`), c.createdTimeLogs && d.push(`${m(c.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), c.updatedTimeLogs && d.push(`${m(c.updatedTimeLogs)} زمان به‌روزشده`), f.length && d.push(`حذف پروژهٔ ${f.map((y) => `«${y}»`).join("، ")} در فایل ثبت شد`), a.length && d.push(`پروژهٔ ${a.map((y) => `«${y}»`).join("، ")} که جای دیگر حذف شده بود این‌جا هم حذف شد`);
      const l = `در این دستگاه: ${m(s.projects.length + c.createdProjects)} پروژه و ${m(s.taskBySync.size)} کار (کارها در «بک‌لاگ محصول» هر پروژه).`;
      if (c.failures.length || _.length) {
        const y = c.failures.slice(0, 3).join("؛ "), w = c.failures.length > 3 ? ` و ${m(c.failures.length - 3)} مورد دیگر` : "";
        return {
          outcome: "PARTIAL",
          message: `همگام‌سازی ناقص ماند: ${m(Math.max(_.length, c.failures.length))} مورد از فایل به پاکا نیامد.` + (y ? ` ${y}${w}.` : "") + (d.length ? ` انجام‌شده: ${d.join("، ")}.` : "") + ` ${l}`,
          at: t(),
          created: c.createdProjects + c.createdTasks + c.createdTimeLogs,
          updated: c.updatedProjects + c.updatedTasks + c.updatedTimeLogs,
          failures: c.failures
        };
      }
      return A > 0 ? {
        outcome: "MERGED",
        message: `همگام‌سازی انجام شد؛ ${d.join("، ")}. ${l}`,
        at: t(),
        created: c.createdProjects + c.createdTasks + c.createdTimeLogs,
        updated: c.updatedProjects + c.updatedTasks + c.updatedTimeLogs
      } : n ? g !== h ? {
        outcome: "PUSHED",
        message: "تغییرات پاکا ذخیره شد.",
        at: t()
      } : { outcome: "UP_TO_DATE", message: `همه‌چیز به‌روز است. ${l}`, at: t() } : {
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
const we = "/api/v1", _t = "paca-agent-autojoin.done";
async function M(e, t, o) {
  try {
    const n = await fetch(we + t, {
      method: e,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...o ? { "Content-Type": "application/json" } : {} },
      body: o ? JSON.stringify(o) : void 0
    });
    if (!n.ok) return null;
    const s = await n.json().catch(() => null);
    return s?.data ?? s;
  } catch {
    return null;
  }
}
function U(e) {
  if (Array.isArray(e)) return e;
  const t = e;
  return (t?.items ?? t?.projects ?? t?.agents ?? []) || [];
}
function Se() {
  try {
    return new Set(JSON.parse(localStorage.getItem(_t) || "[]"));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
let Z = !1;
async function at() {
  if (Z) return 0;
  try {
    if (localStorage.getItem("paca-agent-autojoin") === "off") return 0;
  } catch {
  }
  Z = !0;
  let e = 0;
  try {
    const t = U(await M("GET", "/agents/")).filter((s) => s.id);
    if (!t.length) return 0;
    const o = U(await M("GET", "/projects?page_size=100")).filter((s) => s.id), n = Se();
    for (const s of o) {
      const i = String(s.id), u = t.filter((p) => !n.has(`${i}:${p.id}`));
      if (!u.length) continue;
      const r = U(await M("GET", `/projects/${i}/members?page_size=100`)), f = new Set(r.map((p) => String(p.agent_id ?? "")).filter(Boolean)), a = u.filter((p) => !f.has(String(p.id)));
      for (const p of u) f.has(String(p.id)) && n.add(`${i}:${p.id}`);
      if (a.length) {
        const p = U(await M("GET", `/projects/${i}/roles`)), c = p.find((g) => String(g.name).toLowerCase() === "editor") ?? p.find((g) => String(g.name).toLowerCase() === "admin") ?? p[0];
        if (!c) continue;
        for (const g of a)
          await M("POST", `/projects/${i}/members`, {
            agent_id: g.id,
            role_ids: [c.id]
          }) && (e++, n.add(`${i}:${g.id}`));
      }
    }
    try {
      localStorage.setItem(_t, JSON.stringify([...n]));
    } catch {
    }
  } finally {
    Z = !1;
  }
  return e;
}
setTimeout(() => void at(), 8e3);
setInterval(() => void at(), 6e4);
window.addEventListener("paca-sync-merged", () => void at());
let mt = 0;
async function V(e = !1) {
  if (!(!G() || !Ct() || !rt()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - mt < 2e4)) {
    mt = Date.now();
    try {
      const t = await he();
      Mt(t), (t.outcome === "MERGED" || t.outcome === "PARTIAL") && (zt(), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
    } catch {
    }
  }
}
setTimeout(() => void V(!0), 6e3);
setInterval(() => void V(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && V();
});
window.addEventListener("online", () => void V(!0));
