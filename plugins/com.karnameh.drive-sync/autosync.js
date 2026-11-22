const Dt = "https://api.github.com", Bt = "paca.sync.github";
function P() {
  try {
    const e = localStorage.getItem(Bt), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function st(e, t, o = {}) {
  return await fetch(`${Dt}${t}`, {
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
function ot(e, t) {
  throw e.status === 401 ? new Error("توکن گیت‌هاب نامعتبر یا منقضی است") : e.status === 403 ? new Error("توکن اجازهٔ دسترسی ندارد (Contents: Read and write لازم است)") : e.status === 404 ? new Error("مخزن پیدا نشد یا توکن به آن دسترسی ندارد") : new Error(`${t}: GitHub ${e.status}`);
}
const $t = (e) => e.split("/").map(encodeURIComponent).join("/");
function Ct(e) {
  const t = new TextEncoder().encode(e);
  let o = "";
  for (let n = 0; n < t.length; n += 32768)
    o += String.fromCharCode(...t.subarray(n, n + 32768));
  return btoa(o);
}
function Rt(e) {
  const t = atob(e.replace(/\s/g, "")), o = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) o[n] = t.charCodeAt(n);
  return new TextDecoder().decode(o);
}
let U = null;
async function _t() {
  const e = P();
  if (!e) throw new Error("unlinked");
  const t = await st(
    e.token,
    `/repos/${e.repo}/contents/${$t(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return U = null, "";
  t.ok || ot(t, "read");
  const o = await t.json();
  if (U = o.sha, o.content && o.encoding === "base64") return Rt(o.content);
  const n = await st(e.token, `/repos/${e.repo}/git/blobs/${o.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || ot(n, "read"), await n.text();
}
async function Mt(e) {
  const t = P();
  if (!t) throw new Error("unlinked");
  const o = (r) => st(t.token, `/repos/${t.repo}/contents/${$t(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: Ct(e),
      branch: t.branch || "main",
      ...r ? { sha: r } : {}
    })
  });
  let n = await o(U);
  (n.status === 409 || n.status === 422) && (await _t(), n = await o(U)), n.ok || ot(n, "write"), U = (await n.json()).content?.sha ?? null;
}
function Jt() {
  return P() ? "github" : Nt() ? "drive" : null;
}
const N = "https://www.googleapis.com/drive/v3", Ft = "https://www.googleapis.com/upload/drive/v3", pt = "Paca", X = "paca-sync.json", yt = "application/vnd.google-apps.folder", B = "paca.sync.token", At = "paca.sync.link", Ut = "paca.sync.auto", Ht = "paca.sync.status";
function Y(e, t) {
  try {
    const o = e.getItem(t);
    return o ? JSON.parse(o) : null;
  } catch {
    return null;
  }
}
function G(e, t, o) {
  try {
    e.setItem(t, JSON.stringify(o));
  } catch {
  }
}
let _ = Y(sessionStorage, B) ?? Y(localStorage, B);
function rt() {
  return _ && _.value && _.exp - 6e4 > Date.now() ? _.value : null;
}
function bt() {
  return P() ? !0 : !!(_ && _.value && _.exp - 6e4 > Date.now()) || q();
}
const Kt = "paca.google.desktop", it = "paca.google.refresh", zt = "https://oauth2.googleapis.com/token";
function vt() {
  return window.pacaNative;
}
function Tt() {
  const e = Y(localStorage, Kt);
  return e && e.id && e.secret ? e : null;
}
function Yt() {
  return !!(localStorage.getItem(it) && Tt());
}
let Et = localStorage.getItem("paca.google.nativeSilent") === "1";
function q() {
  return Yt() || !!vt() && Et;
}
function gt(e, t) {
  _ = { value: e, exp: Date.now() + Math.max(60, Number(t) || 3600) * 1e3 }, G(sessionStorage, B, _), G(localStorage, B, _);
}
let R = null;
function lt() {
  return R || (R = (async () => {
    try {
      const e = localStorage.getItem(it), t = Tt();
      if (e && t) {
        const s = await (await fetch(zt, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ client_id: t.id, client_secret: t.secret, refresh_token: e, grant_type: "refresh_token" })
        })).json().catch(() => ({}));
        return s.access_token ? (gt(s.access_token, s.expires_in || 3600), !0) : ((s.error === "invalid_grant" || s.error === "invalid_client" || s.error === "unauthorized_client") && localStorage.removeItem(it), !1);
      }
      const o = vt();
      if (o) {
        const n = await o("googleToken", "0").catch(() => "");
        if (n)
          return gt(n, 3300), !0;
        Et = !1, localStorage.removeItem("paca.google.nativeSilent");
      }
      return !1;
    } catch {
      return !1;
    } finally {
      window.setTimeout(() => R = null, 0);
    }
  })(), R);
}
async function Gt() {
  const e = rt();
  return e || (q() && await lt() ? rt() : null);
}
window.setInterval(() => {
  q() && (!_ || _.exp - 5 * 6e4 < Date.now()) && lt();
}, 6e4);
q() && !rt() && lt();
async function Vt() {
  const e = await Gt();
  if (e) return e;
  throw new Error("auth");
}
function Q() {
  return P() ? { folderId: "", fileId: "github" } : Nt();
}
function Nt() {
  const e = Y(localStorage, At);
  return e && e.fileId ? e : null;
}
function Wt(e) {
  G(localStorage, At, e);
}
function qt() {
  try {
    return localStorage.getItem(Ut) !== "false";
  } catch {
    return !0;
  }
}
function Qt(e) {
  G(localStorage, Ht, e);
}
async function T(e, t = {}) {
  const o = await Vt(), n = await fetch(e, {
    ...t,
    cache: "no-store",
    headers: { ...t.headers ?? {}, Authorization: `Bearer ${o}` }
  });
  if (n.status === 401) {
    _ = null;
    try {
      sessionStorage.removeItem(B), localStorage.removeItem(B);
    } catch {
    }
    throw new Error("auth");
  }
  if (!n.ok) throw new Error(`drive ${n.status}`);
  return n;
}
const Zt = (e, t) => `${N}/files?${new URLSearchParams({
  q: e,
  fields: t,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function tt(e, t) {
  return (await (await T(Zt(e, t))).json()).files ?? [];
}
async function Xt() {
  const t = (await (await T(`${N}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await tt(
    `name = '${pt}' and mimeType = '${yt}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await T(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: pt, mimeType: yt })
  })).json()).id);
  let r = (await tt(
    `name = '${X}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!r) {
    const i = await tt(
      `name = '${X}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    i[0] && (await T(
      `${N}/files/${i[0].id}?addParents=${n}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), r = i[0].id);
  }
  r || (r = (await (await T(`${N}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: X,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const u = { folderId: n, fileId: r, email: t };
  return Wt(u), u;
}
async function te() {
  if (P()) return _t();
  const e = Q();
  if (!e) throw new Error("unlinked");
  try {
    return await (await T(`${N}/files/${e.fileId}?alt=media`)).text();
  } catch (t) {
    if (String(t?.message).includes("404")) {
      const o = await Xt();
      return await (await T(`${N}/files/${o.fileId}?alt=media`)).text();
    }
    throw t;
  }
}
async function ee(e) {
  if (P()) return Mt(e);
  const t = Q();
  if (!t) throw new Error("unlinked");
  await T(
    `${Ft}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
let H = null;
function ne() {
  if (H) return H;
  const e = [document.getElementById("root"), document.getElementById("app"), document.body.firstElementChild];
  for (const t of e) {
    if (!t) continue;
    const o = Object.keys(t).find((r) => r.startsWith("__reactContainer$"));
    if (!o) continue;
    let n = [t[o]], s = 0;
    for (; n.length && s < 2e4; ) {
      const r = n.pop();
      if (s += 1, !r) continue;
      const u = r.memoizedProps?.client;
      if (u && typeof u.invalidateQueries == "function")
        return H = u, H;
      r.sibling && n.push(r.sibling), r.child && n.push(r.child), n.length > 5e3 && (n = n.slice(-5e3));
    }
  }
  return null;
}
function se() {
  try {
    const e = ne();
    e && e.invalidateQueries();
  } catch {
  }
  try {
    document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new Event("focus"));
  } catch {
  }
}
const Pt = "pacaDriveFiles";
function oe(e) {
  const t = e?.[Pt];
  if (Array.isArray(t))
    return t.filter(
      (o) => !!o && typeof o == "object" && typeof o.id == "string"
    );
}
function z(e) {
  return Array.isArray(e.driveFiles) ? { [Pt]: e.driveFiles } : {};
}
const re = ["word_count", "price_per_word", "amount"];
function ie(e) {
  const t = {};
  for (const o of re) {
    const n = e?.[o], s = typeof n == "number" ? n : typeof n == "string" && n.trim() !== "" ? Number(n) : NaN;
    Number.isFinite(s) && (t[o] = s);
  }
  return Object.keys(t).length ? t : void 0;
}
function ae(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const mt = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, at = (e, t) => mt(e.updatedAt) >= mt(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function ce(e, t) {
  if (!e) return t;
  if (!t) return e;
  const o = /* @__PURE__ */ new Map();
  for (const s of t.projects) o.set(s.syncId, s);
  for (const s of e.projects) {
    const r = o.get(s.syncId);
    o.set(s.syncId, r ? at(s, r) : s);
  }
  const n = /* @__PURE__ */ new Map();
  for (const s of t.tasks) n.set(s.syncId, s);
  for (const s of e.tasks) {
    const r = n.get(s.syncId);
    n.set(s.syncId, r ? at(s, r) : s);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...de(e, t),
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
function de(e, t) {
  const o = {}, n = [
    ["timeEntries", "id"],
    ["timeLogs", "syncId"]
  ];
  for (const [s, r] of n) {
    const u = e[s], i = t[s];
    if (!Array.isArray(u) && !Array.isArray(i)) continue;
    const f = /* @__PURE__ */ new Map();
    for (const a of i ?? []) f.set(String(a[r]), a);
    for (const a of u ?? []) {
      const p = f.get(String(a[r]));
      f.set(String(a[r]), p ? at(a, p) : a);
    }
    o[s] = Array.from(f.values());
  }
  return o;
}
function F(e) {
  return JSON.stringify([e.name ?? "", e.description ?? ""]);
}
function ht(e) {
  return JSON.stringify([
    e.title ?? "",
    e.description ?? null,
    e.importance ?? 0,
    e.tags ?? [],
    e.statusName ?? null,
    V(e.startDate),
    V(e.dueDate),
    e.fields ?? null,
    e.driveFiles ? e.driveFiles.map((t) => t.id) : null
  ]);
}
function V(e) {
  if (!e) return null;
  const t = Date.parse(e);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}
function wt(e) {
  return JSON.stringify([
    e.taskSyncId ?? "",
    (e.date ?? "").slice(0, 10),
    Ot(e),
    e.note ?? ""
  ]);
}
function Ot(e) {
  const t = Number(e.minutes);
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  const o = Number(e.seconds);
  return Number.isFinite(o) && o > 0 ? Math.max(1, Math.round(o / 60)) : 0;
}
const ue = "/api/v1", k = "pacaSyncId", L = "pacaSyncSeen", x = "pacaSyncUpdatedAt", ct = "pacaSyncTimeLogs", W = "com.paca.time-logging";
class j extends Error {
}
async function S(e, t) {
  const o = await fetch(`${ue}${e}`, {
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
async function le() {
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
let et = !0;
async function fe(e) {
  try {
    return await St(e, et);
  } catch (t) {
    if (!et || t instanceof j) throw t;
    return et = !1, St(e, !1);
  }
}
async function St(e, t) {
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
async function pe(e) {
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
async function ye(e) {
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
const jt = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function ge(e, t) {
  const o = await me(e);
  if (o) return o;
  const n = [];
  for (const s of t)
    try {
      const r = await S(
        `/plugins/${W}/projects/${e}/tasks/${s}/time-logs`
      );
      n.push(...Array.isArray(r) ? r : r?.logs ?? []);
    } catch (r) {
      if (r instanceof j) throw r;
      return null;
    }
  return n;
}
async function me(e) {
  const t = [];
  for (let o = 1; o <= 200; o += 1) {
    let n;
    try {
      n = await S(
        `/plugins/${W}/projects/${e}/time-logs?page_size=100&page=${o}`
      );
    } catch (u) {
      if (u instanceof j) throw u;
      return null;
    }
    const s = Array.isArray(n) ? n : n?.logs ?? [];
    t.push(...s);
    const r = Array.isArray(n) ? t.length : n?.total ?? t.length;
    if (s.length === 0 || t.length >= r || Array.isArray(n)) break;
  }
  return t;
}
function D() {
  return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
async function he(e) {
  const t = await le(), o = [], n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  let r = [], u = !1;
  for (let d = 0; d < t.length; d += 1) {
    const l = t[d].id, y = await fe(l);
    if (o.push(...y), n.set(l, await pe(l)), r) {
      const w = y.length ? await ge(l, y.map((I) => I.id)) : [];
      w === null ? r = null : y.length && (u = !0, r.push(...w), w.length && s.set(l, await ye(l)));
    }
  }
  const i = [], f = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), p = (/* @__PURE__ */ new Date()).toISOString();
  for (const d of t) {
    const l = { ...d.settings ?? {} }, y = F({
      name: d.name,
      description: d.description ?? "",
      createdAt: d.created_at,
      updatedAt: d.created_at
    });
    let w = !1, I = typeof l[k] == "string" ? l[k] : "";
    I || (I = D(), l[k] = I, w = !0);
    const $ = typeof l[L] == "string" ? l[L] : null;
    let v;
    $ === null ? (l[L] = y, l[x] = d.created_at, v = d.created_at, w = !0) : $ !== y ? (l[L] = y, l[x] = p, v = p, w = !0) : v = typeof l[x] == "string" ? l[x] : d.created_at, w && (await S(`/projects/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: l })
    }), d.settings = l), a.set(d.id, I), f.set(I, d), i.push({
      syncId: I,
      name: d.name,
      description: d.description ?? "",
      createdAt: d.created_at,
      updatedAt: v
    });
  }
  const c = [], g = /* @__PURE__ */ new Map();
  for (const d of o) {
    const l = { ...d.custom_fields ?? {} };
    let y = typeof l[k] == "string" ? l[k] : "";
    if (!y) {
      y = D();
      const O = await S(
        `/projects/${d.project_id}/tasks/${d.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...l, [k]: y }
          })
        }
      );
      O?.updated_at && (d.updated_at = O.updated_at);
    }
    g.set(y, d);
    const w = (n.get(d.project_id) ?? []).find(
      (O) => O.id === d.status_id
    ), I = (d.assignees ?? []).map(jt).filter(Boolean), $ = {
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
    }, v = ie(d.custom_fields);
    v && ($.fields = v);
    const C = oe(d.custom_fields);
    C && ($.driveFiles = C), w && ($.statusName = w.name, $.statusCategory = w.category), d.assignees && ($.assignee = I[0] ?? null, $.assignees = I), c.push($);
  }
  const h = new Map(o.map((d) => [d.id, d])), A = new Map(t.map((d) => [d.id, d])), b = /* @__PURE__ */ new Map();
  let m = null;
  if (r && u) {
    m = [];
    for (const l of r) {
      const y = h.get(l.task_id);
      if (!y) continue;
      const I = A.get(y.project_id)?.settings?.[ct] ?? {}, $ = typeof I[l.id] == "string" ? I[l.id] : l.id;
      b.set($, l);
      const v = Number(l.minutes_spent) || 0, C = (s.get(y.project_id) ?? []).find(
        (O) => O.id === l.member_id
      );
      m.push({
        syncId: $,
        taskSyncId: String(y.custom_fields?.[k] ?? ""),
        projectSyncId: a.get(y.project_id) ?? "",
        date: String(l.spent_date ?? "").slice(0, 10),
        minutes: v,
        seconds: v * 60,
        note: l.note ?? "",
        ...C ? { member: jt(C) } : {},
        createdAt: l.created_at,
        updatedAt: l.updated_at || l.created_at
      });
    }
    const d = /* @__PURE__ */ new Map();
    for (const [l, y] of g) d.set(y.id, l);
    for (const l of m)
      if (!l.taskSyncId) {
        const y = b.get(l.syncId);
        l.taskSyncId = (y && d.get(y.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: o,
    projectRecords: i,
    taskRecords: c,
    projectBySync: f,
    taskBySync: g,
    statusesByProject: n,
    timeLogRecords: m,
    logBySync: b,
    localTimeLogs: r ?? []
  };
}
function we(e, t) {
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
const E = (e) => {
  const t = e?.message ?? String(e);
  return /Failed to fetch|NetworkError|Load failed/i.test(t) ? "ارتباط با سرور محلی پاکا برقرار نشد" : t;
};
async function Se(e, t, o) {
  const n = {
    title: t.title || "(بدون عنوان)",
    custom_fields: { ...z(t), [k]: t.syncId }
  };
  try {
    return await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        ...n,
        custom_fields: { ...t.fields ?? {}, ...z(t), [k]: t.syncId },
        description: ut(t) ?? void 0,
        importance: t.importance ?? 0,
        tags: t.tags ?? [],
        ...dt(t, null, o)
      })
    });
  } catch (s) {
    if (s instanceof j) throw s;
    const r = await S(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify(n)
    }).catch((i) => {
      throw i instanceof j ? i : new Error(`${E(s)} / ${E(i)}`);
    }), u = [
      { description: ut(t) ?? void 0 },
      { importance: t.importance ?? 0 },
      { tags: t.tags ?? [] },
      ...t.fields ? [{ custom_fields: { ...t.fields, ...z(t), [k]: t.syncId } }] : [],
      ...Object.entries(dt(t, null, o)).map(([i, f]) => ({ [i]: f }))
    ];
    for (const i of u)
      try {
        await S(`/projects/${e}/tasks/${r.id}`, {
          method: "PATCH",
          body: JSON.stringify(i)
        });
      } catch (f) {
        if (f instanceof j) throw f;
      }
    return r;
  }
}
async function je(e, t) {
  if (!t) return 0;
  const o = new Set(t.projects.map((r) => r.syncId)), n = (r) => (r || "").replace(/\s+/g, " ").trim();
  let s = 0;
  for (const r of t.projects) {
    if (r.deleted || e.projectBySync.has(r.syncId)) continue;
    const u = e.projectRecords.filter(
      (c) => !o.has(c.syncId) && n(c.name) === n(r.name)
    );
    if (u.length !== 1) continue;
    const i = u[0], f = e.projectBySync.get(i.syncId);
    if (!f) continue;
    const a = { ...f.settings ?? {}, [k]: r.syncId };
    await S(`/projects/${f.id}`, { method: "PATCH", body: JSON.stringify({ settings: a }) }), f.settings = a;
    const p = i.syncId;
    e.projectBySync.delete(p), e.projectBySync.set(r.syncId, f), i.syncId = r.syncId;
    for (const c of e.taskRecords) c.projectSyncId === p && (c.projectSyncId = r.syncId);
    for (const c of e.timeLogRecords ?? []) c.projectSyncId === p && (c.projectSyncId = r.syncId);
    s += 1;
  }
  return s;
}
async function Ie(e, t, o = /* @__PURE__ */ new Set()) {
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
  for (const i of t.projectRecords)
    s.set(i.syncId, i);
  const r = /* @__PURE__ */ new Map();
  for (const i of t.taskRecords)
    r.set(i.syncId, i);
  const u = /* @__PURE__ */ new Map();
  for (const i of e.projects) {
    const f = t.projectBySync.get(i.syncId);
    if (i.deleted) continue;
    if (!f) {
      let c;
      try {
        c = await S("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: i.name,
            description: i.description ?? "",
            task_id_prefix: _e(i.name, i.syncId),
            settings: {
              [k]: i.syncId,
              [L]: F(i),
              [x]: i.updatedAt
            }
          })
        });
      } catch (g) {
        if (g instanceof j) throw g;
        n.failures.push(`پروژهٔ «${i.name}» ساخته نشد: ${E(g)}`);
        continue;
      }
      u.set(i.syncId, c.id), n.presentProjects.push(i.syncId), n.createdProjects += 1;
      continue;
    }
    u.set(i.syncId, f.id), n.presentProjects.push(i.syncId);
    const a = s.get(i.syncId);
    if (!a || F(a) === F(i) || Date.parse(i.updatedAt) <= Date.parse(a.updatedAt)) continue;
    const p = { ...f.settings ?? {} };
    p[k] = i.syncId, p[L] = F(i), p[x] = i.updatedAt;
    try {
      await S(`/projects/${f.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: i.name,
          description: i.description ?? "",
          settings: p
        })
      }), n.updatedProjects += 1;
    } catch (c) {
      if (c instanceof j) throw c;
      n.failures.push(`پروژهٔ «${i.name}» به‌روز نشد: ${E(c)}`);
    }
  }
  for (const i of e.tasks) {
    const f = t.taskBySync.get(i.syncId);
    if (!f && i.deleted) continue;
    if (!f) {
      const g = u.get(i.projectSyncId);
      if (!g) {
        const h = e.projects.find((A) => A.syncId === i.projectSyncId);
        n.failures.push(
          h ? `کار «${i.title}» منتقل نشد: پروژهٔ «${h.name}» در این دستگاه ساخته نشد` : `کار «${i.title}» منتقل نشد: پروژهٔ آن در فایل همگام‌سازی نیست`
        );
        continue;
      }
      try {
        const h = await Se(
          g,
          i,
          t.statusesByProject.get(g) ?? []
        );
        h?.id && t.taskBySync.set(i.syncId, { ...h, project_id: g }), n.createdTasks += 1;
      } catch (h) {
        if (h instanceof j) throw h;
        n.failures.push(`کار «${i.title}» ساخته نشد: ${E(h)}`);
      }
      continue;
    }
    const a = r.get(i.syncId);
    if (!a || ht(a) === ht(i) || Date.parse(i.updatedAt) <= Date.parse(a.updatedAt)) continue;
    const p = { ...f.custom_fields ?? {} }, c = (g) => S(`/projects/${f.project_id}/tasks/${f.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: i.title,
        description: ut(i) ?? void 0,
        importance: i.importance ?? 0,
        tags: i.tags ?? [],
        custom_fields: { ...p, ...g ? i.fields ?? {} : {}, ...z(i), [k]: i.syncId },
        ...dt(i, f, t.statusesByProject.get(f.project_id) ?? [])
      })
    });
    try {
      try {
        await c(!0);
      } catch (g) {
        if (g instanceof j || !i.fields) throw g;
        await c(!1);
      }
      n.updatedTasks += 1;
    } catch (g) {
      if (g instanceof j) throw g;
      n.failures.push(`کار «${i.title}» به‌روز نشد: ${E(g)}`);
    }
  }
  if (t.timeLogRecords && Array.isArray(e.timeLogs))
    try {
      await $e(e, t, o, n);
    } catch (i) {
      if (i instanceof j) throw i;
      n.failures.push(`زمان‌های ثبت‌شده منتقل نشدند: ${E(i)}`);
    }
  return n;
}
function dt(e, t, o) {
  const n = {};
  if (e.statusName !== void 0 || e.statusCategory !== void 0) {
    const s = o.find((r) => r.name === e.statusName) ?? o.find((r) => r.category === e.statusCategory);
    s && s.id !== t?.status_id && (n.status_id = s.id);
  }
  for (const [s, r] of [
    ["startDate", "start_date"],
    ["dueDate", "due_date"]
  ]) {
    const u = e[s];
    u !== void 0 && V(u) !== V(t?.[r] ?? null) && (u === null ? n[r] = null : Number.isNaN(Date.parse(u)) || (n[r] = new Date(u).toISOString()));
  }
  return n;
}
function ut(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const o = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof o != "string" ? t ?? null : ke(o);
}
function ke(e) {
  const t = { textColor: "default", backgroundColor: "default", textAlignment: "right" }, o = (s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(
    (r) => r.startsWith("**") && r.endsWith("**") ? { type: "text", text: r.slice(2, -2), styles: { bold: !0 } } : { type: "text", text: r, styles: {} }
  ), n = [];
  for (const s of e.split(/\r?\n/)) {
    const r = s.trimEnd();
    if (!r.trim()) continue;
    const u = r.match(/^(#{1,3})\s+(.*)$/), i = r.match(/^\s*[-*•]\s+(.*)$/), f = r.match(/^\s*[0-9۰-۹]+[.)]\s+(.*)$/);
    u ? n.push({ id: D(), type: "heading", props: { ...t, level: u[1].length }, content: o(u[2]), children: [] }) : i ? n.push({ id: D(), type: "bulletListItem", props: t, content: o(i[1]), children: [] }) : f ? n.push({ id: D(), type: "numberedListItem", props: t, content: o(f[1]), children: [] }) : n.push({ id: D(), type: "paragraph", props: t, content: o(r), children: [] });
  }
  return n;
}
async function $e(e, t, o, n) {
  const s = /* @__PURE__ */ new Map();
  for (const a of t.timeLogRecords ?? []) s.set(a.syncId, a);
  const r = /* @__PURE__ */ new Map(), u = (a) => {
    let p = r.get(a.id);
    return p || (p = { ...a.settings ?? {} }, r.set(a.id, p)), p;
  }, i = async (a, p, c) => {
    const g = t.projects.find((b) => b.id === a);
    if (!g) return;
    const h = u(g), A = { ...h[ct] ?? {} };
    A[p] = c, h[ct] = A, await S(`/projects/${a}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: h })
    }), g.settings = h;
  }, f = /* @__PURE__ */ new Set();
  for (const a of e.timeLogs ?? []) {
    if (a.deleted) continue;
    const p = Ot(a), c = String(a.date ?? "").slice(0, 10);
    if (!p || !/^\d{4}-\d{2}-\d{2}$/.test(c)) continue;
    const g = t.logBySync.get(a.syncId);
    if (g) {
      const m = s.get(a.syncId);
      if (!m || wt(m) === wt(a) || Date.parse(a.updatedAt) <= Date.parse(m.updatedAt)) continue;
      const d = t.tasks.find((l) => l.id === g.task_id);
      if (!d) continue;
      try {
        await S(
          `/plugins/${W}/projects/${d.project_id}/tasks/${d.id}/time-logs/${g.id}`,
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
      await i(h.project_id, A.id, a.syncId), f.add(A.id);
      continue;
    }
    let b = null;
    try {
      b = await S(
        `/plugins/${W}/projects/${h.project_id}/tasks/${h.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: c, minutes_spent: p, note: a.note ?? "" })
        }
      );
    } catch (m) {
      if (m instanceof j) throw m;
      continue;
    }
    b?.id && await i(h.project_id, b.id, a.syncId), n.createdTimeLogs += 1;
  }
  f.size && (e.timeLogs = (e.timeLogs ?? []).filter((a) => !f.has(a.syncId)));
}
function _e(e, t) {
  const o = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((o.length >= 2 ? o.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
async function Ae(e, t) {
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
    const r = /* @__PURE__ */ new Set();
    for (const [u, i] of t.taskBySync)
      i.project_id === s.id && (r.add(i.id), t.taskBySync.delete(u));
    for (const [u, i] of t.logBySync)
      r.has(i.task_id) && t.logBySync.delete(u);
    o.push(n.name);
  }
  return o;
}
function It(e) {
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
    JSON.stringify(s.fields ?? null),
    JSON.stringify(s.driveFiles ? s.driveFiles.map((r) => r.id) : null)
  ]), n = [...e.timeLogs ?? []].sort((s, r) => s.syncId.localeCompare(r.syncId)).map((s) => [s.syncId, s.taskSyncId, s.date, s.minutes, s.note, s.updatedAt, !!s.deleted]);
  return JSON.stringify([t, o, n]);
}
function be(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return ae(t) ? t : null;
  } catch {
    return null;
  }
}
const Lt = "paca-sync.known-projects";
function ve() {
  try {
    const e = localStorage.getItem(Lt);
    if (!e) return null;
    const t = JSON.parse(e);
    return Array.isArray(t) ? new Set(t.map(String)) : null;
  } catch {
    return null;
  }
}
function Te(e) {
  try {
    localStorage.setItem(Lt, JSON.stringify(e));
  } catch {
  }
}
function Ee(e, t, o) {
  const n = (/* @__PURE__ */ new Date()).toISOString(), s = [], r = /* @__PURE__ */ new Set();
  o && ![...o].some((a) => t.has(a)) && (o = null);
  const u = e.projects.map((a) => a.deleted ? (r.add(a.syncId), a) : o && o.has(a.syncId) && !t.has(a.syncId) ? (r.add(a.syncId), s.push(a.name), { ...a, deleted: !0, updatedAt: n }) : a);
  if (!r.size) return { bundle: e, deletedHere: s };
  const i = e.tasks.map(
    (a) => r.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: n } : a
  ), f = e.timeLogs?.map(
    (a) => r.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: n } : a
  );
  return { bundle: { ...e, projects: u, tasks: i, ...f ? { timeLogs: f } : {} }, deletedHere: s };
}
let M = null;
function Ne(e = {}) {
  return M || (M = (async () => {
    const t = () => Date.now();
    try {
      if (!Q())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: t()
        };
      if (!bt())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: t()
        };
      e.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const o = await te(), n = be(o);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const s = await he();
      await je(s, n);
      const r = we(s, n?.sync?.rev ?? 0), u = ve(), { bundle: i, deletedHere: f } = Ee(
        ce(r, n) ?? r,
        new Set(s.projectBySync.keys()),
        u
      ), a = await Ae(i, s), p = new Set((n?.timeLogs ?? []).map((y) => y.syncId)), c = await Ie(i, s, p), g = It(n), h = It(i), A = c.createdProjects + c.createdTasks + c.updatedProjects + c.updatedTasks + c.createdTimeLogs + c.updatedTimeLogs + f.length + a.length;
      if (g !== h || !n) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const y = Math.max(n?.sync?.rev ?? 0, 0) + 1, w = {
          ...i,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: y,
            updatedBy: Jt() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await ee(JSON.stringify(w, null, 2));
      }
      Te(c.presentProjects);
      const b = i.tasks.filter(
        (y) => !y.deleted && !s.taskBySync.has(y.syncId)
      ), m = (y) => String(y).replace(/\d/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[Number(w)]), d = [];
      c.createdProjects && d.push(`${m(c.createdProjects)} پروژهٔ جدید`), c.createdTasks && d.push(`${m(c.createdTasks)} کار جدید`), c.updatedProjects && d.push(`${m(c.updatedProjects)} پروژهٔ به‌روزشده`), c.updatedTasks && d.push(`${m(c.updatedTasks)} کار به‌روزشده`), c.createdTimeLogs && d.push(`${m(c.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), c.updatedTimeLogs && d.push(`${m(c.updatedTimeLogs)} زمان به‌روزشده`), f.length && d.push(`حذف پروژهٔ ${f.map((y) => `«${y}»`).join("، ")} در فایل ثبت شد`), a.length && d.push(`پروژهٔ ${a.map((y) => `«${y}»`).join("، ")} که جای دیگر حذف شده بود این‌جا هم حذف شد`);
      const l = `در این دستگاه: ${m(s.projects.length + c.createdProjects)} پروژه و ${m(s.taskBySync.size)} کار (کارها در «بک‌لاگ محصول» هر پروژه).`;
      if (c.failures.length || b.length) {
        const y = c.failures.slice(0, 3).join("؛ "), w = c.failures.length > 3 ? ` و ${m(c.failures.length - 3)} مورد دیگر` : "";
        return {
          outcome: "PARTIAL",
          message: `همگام‌سازی ناقص ماند: ${m(Math.max(b.length, c.failures.length))} مورد از فایل به پاکا نیامد.` + (y ? ` ${y}${w}.` : "") + (d.length ? ` انجام‌شده: ${d.join("، ")}.` : "") + ` ${l}`,
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
  })(), M.finally(() => {
    M = null;
  }));
}
const Pe = "/api/v1", xt = "paca-agent-autojoin.done";
async function J(e, t, o) {
  try {
    const n = await fetch(Pe + t, {
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
function K(e) {
  if (Array.isArray(e)) return e;
  const t = e;
  return (t?.items ?? t?.projects ?? t?.agents ?? []) || [];
}
function Oe() {
  try {
    return new Set(JSON.parse(localStorage.getItem(xt) || "[]"));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
let nt = !1;
async function ft() {
  if (nt) return 0;
  try {
    if (localStorage.getItem("paca-agent-autojoin") === "off") return 0;
  } catch {
  }
  nt = !0;
  let e = 0;
  try {
    const t = K(await J("GET", "/agents/")).filter((s) => s.id);
    if (!t.length) return 0;
    const o = K(await J("GET", "/projects?page_size=100")).filter((s) => s.id), n = Oe();
    for (const s of o) {
      const r = String(s.id), u = t.filter((p) => !n.has(`${r}:${p.id}`));
      if (!u.length) continue;
      const i = K(await J("GET", `/projects/${r}/members?page_size=100`)), f = new Set(i.map((p) => String(p.agent_id ?? "")).filter(Boolean)), a = u.filter((p) => !f.has(String(p.id)));
      for (const p of u) f.has(String(p.id)) && n.add(`${r}:${p.id}`);
      if (a.length) {
        const p = K(await J("GET", `/projects/${r}/roles`)), c = p.find((g) => String(g.name).toLowerCase() === "editor") ?? p.find((g) => String(g.name).toLowerCase() === "admin") ?? p[0];
        if (!c) continue;
        for (const g of a)
          await J("POST", `/projects/${r}/members`, {
            agent_id: g.id,
            role_ids: [c.id]
          }) && (e++, n.add(`${r}:${g.id}`));
      }
    }
    try {
      localStorage.setItem(xt, JSON.stringify([...n]));
    } catch {
    }
  } finally {
    nt = !1;
  }
  return e;
}
setTimeout(() => void ft(), 8e3);
setInterval(() => void ft(), 6e4);
window.addEventListener("paca-sync-merged", () => void ft());
let kt = 0;
async function Z(e = !1) {
  if (!(!Q() || !qt() || !bt()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - kt < 2e4)) {
    kt = Date.now();
    try {
      const t = await Ne();
      Qt(t), (t.outcome === "MERGED" || t.outcome === "PARTIAL") && (se(), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
    } catch {
    }
  }
}
setTimeout(() => void Z(!0), 6e3);
setInterval(() => void Z(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && Z();
});
window.addEventListener("online", () => void Z(!0));
