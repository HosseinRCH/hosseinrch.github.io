const Kt = "https://api.github.com", zt = "paca.sync.github";
function L() {
  try {
    const e = localStorage.getItem(zt), t = e ? JSON.parse(e) : null;
    return t && t.repo && t.token ? t : null;
  } catch {
    return null;
  }
}
async function dt(e, t, i = {}) {
  return await fetch(`${Kt}${t}`, {
    ...i,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${e}`,
      ...i.headers ?? {}
    }
  });
}
function lt(e, t) {
  throw e.status === 401 ? new Error("توکن گیت‌هاب نامعتبر یا منقضی است") : e.status === 403 ? new Error("توکن اجازهٔ دسترسی ندارد (Contents: Read and write لازم است)") : e.status === 404 ? new Error("مخزن پیدا نشد یا توکن به آن دسترسی ندارد") : new Error(`${t}: GitHub ${e.status}`);
}
const Et = (e) => e.split("/").map(encodeURIComponent).join("/");
function Yt(e) {
  const t = new TextEncoder().encode(e);
  let i = "";
  for (let s = 0; s < t.length; s += 32768)
    i += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(i);
}
function Gt(e) {
  const t = atob(e.replace(/\s/g, "")), i = new Uint8Array(t.length);
  for (let s = 0; s < t.length; s++) i[s] = t.charCodeAt(s);
  return new TextDecoder().decode(i);
}
let G = null;
async function Ot() {
  const e = L();
  if (!e) throw new Error("unlinked");
  const t = await dt(
    e.token,
    `/repos/${e.repo}/contents/${Et(e.path)}?ref=${encodeURIComponent(e.branch || "main")}`
  );
  if (t.status === 404)
    return G = null, "";
  t.ok || lt(t, "read");
  const i = await t.json();
  if (G = i.sha, i.content && i.encoding === "base64") return Gt(i.content);
  const s = await dt(e.token, `/repos/${e.repo}/git/blobs/${i.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return s.ok || lt(s, "read"), await s.text();
}
async function Vt(e) {
  const t = L();
  if (!t) throw new Error("unlinked");
  const i = (n) => dt(t.token, `/repos/${t.repo}/contents/${Et(t.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: Yt(e),
      branch: t.branch || "main",
      ...n ? { sha: n } : {}
    })
  });
  let s = await i(G);
  (s.status === 409 || s.status === 422) && (await Ot(), s = await i(G)), s.ok || lt(s, "write"), G = (await s.json()).content?.sha ?? null;
}
function Wt() {
  return L() ? "github" : Rt() ? "drive" : null;
}
const B = "https://www.googleapis.com/drive/v3", qt = "https://www.googleapis.com/upload/drive/v3", jt = "Paca", it = "paca-sync.json", It = "application/vnd.google-apps.folder", J = "paca.sync.token", Dt = "paca.sync.link", Qt = "paca.sync.auto", Zt = "paca.sync.status";
function X(e, t) {
  try {
    const i = e.getItem(t);
    return i ? JSON.parse(i) : null;
  } catch {
    return null;
  }
}
function tt(e, t, i) {
  try {
    e.setItem(t, JSON.stringify(i));
  } catch {
  }
}
let T = X(sessionStorage, J) ?? X(localStorage, J);
function ut() {
  return T && T.value && T.exp - 6e4 > Date.now() ? T.value : null;
}
function Bt() {
  return L() ? !0 : !!(T && T.value && T.exp - 6e4 > Date.now()) || nt();
}
const Xt = "paca.google.desktop", ft = "paca.google.refresh", te = "https://oauth2.googleapis.com/token";
function Lt() {
  return window.pacaNative;
}
function xt() {
  const e = X(localStorage, Xt);
  return e && e.id && e.secret ? e : null;
}
function ee() {
  return !!(localStorage.getItem(ft) && xt());
}
let Ct = localStorage.getItem("paca.google.nativeSilent") === "1";
function nt() {
  return ee() || !!Lt() && Ct;
}
function _t(e, t) {
  T = { value: e, exp: Date.now() + Math.max(60, Number(t) || 3600) * 1e3 }, tt(sessionStorage, J, T), tt(localStorage, J, T);
}
let U = null;
function wt() {
  return U || (U = (async () => {
    try {
      const e = localStorage.getItem(ft), t = xt();
      if (e && t) {
        const o = await (await fetch(te, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ client_id: t.id, client_secret: t.secret, refresh_token: e, grant_type: "refresh_token" })
        })).json().catch(() => ({}));
        return o.access_token ? (_t(o.access_token, o.expires_in || 3600), !0) : ((o.error === "invalid_grant" || o.error === "invalid_client" || o.error === "unauthorized_client") && localStorage.removeItem(ft), !1);
      }
      const i = Lt();
      if (i) {
        const s = await i("googleToken", "0").catch(() => "");
        if (s)
          return _t(s, 3300), !0;
        Ct = !1, localStorage.removeItem("paca.google.nativeSilent");
      }
      return !1;
    } catch {
      return !1;
    } finally {
      window.setTimeout(() => U = null, 0);
    }
  })(), U);
}
async function ne() {
  const e = ut();
  return e || (nt() && await wt() ? ut() : null);
}
window.setInterval(() => {
  nt() && (!T || T.exp - 5 * 6e4 < Date.now()) && wt();
}, 6e4);
nt() && !ut() && wt();
async function se() {
  const e = await ne();
  if (e) return e;
  throw new Error("auth");
}
function st() {
  return L() ? { folderId: "", fileId: "github" } : Rt();
}
function Rt() {
  const e = X(localStorage, Dt);
  return e && e.fileId ? e : null;
}
function oe(e) {
  tt(localStorage, Dt, e);
}
function ie() {
  try {
    return localStorage.getItem(Qt) !== "false";
  } catch {
    return !0;
  }
}
function re(e) {
  tt(localStorage, Zt, e);
}
async function D(e, t = {}) {
  const i = await se(), s = await fetch(e, {
    ...t,
    cache: "no-store",
    headers: { ...t.headers ?? {}, Authorization: `Bearer ${i}` }
  });
  if (s.status === 401) {
    T = null;
    try {
      sessionStorage.removeItem(J), localStorage.removeItem(J);
    } catch {
    }
    throw new Error("auth");
  }
  if (!s.ok) throw new Error(`drive ${s.status}`);
  return s;
}
const ae = (e, t) => `${B}/files?${new URLSearchParams({
  q: e,
  fields: t,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function rt(e, t) {
  return (await (await D(ae(e, t))).json()).files ?? [];
}
async function ce() {
  const t = (await (await D(`${B}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let s = (await rt(
    `name = '${jt}' and mimeType = '${It}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  s || (s = (await (await D(`${B}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: jt, mimeType: It })
  })).json()).id);
  let n = (await rt(
    `name = '${it}' and '${s}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!n) {
    const d = await rt(
      `name = '${it}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    d[0] && (await D(
      `${B}/files/${d[0].id}?addParents=${s}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), n = d[0].id);
  }
  n || (n = (await (await D(`${B}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: it,
      parents: [s],
      mimeType: "application/json"
    })
  })).json()).id);
  const c = { folderId: s, fileId: n, email: t };
  return oe(c), c;
}
async function de() {
  if (L()) return Ot();
  const e = st();
  if (!e) throw new Error("unlinked");
  try {
    return await (await D(`${B}/files/${e.fileId}?alt=media`)).text();
  } catch (t) {
    if (String(t?.message).includes("404")) {
      const i = await ce();
      return await (await D(`${B}/files/${i.fileId}?alt=media`)).text();
    }
    throw t;
  }
}
async function le(e) {
  if (L()) return Vt(e);
  const t = st();
  if (!t) throw new Error("unlinked");
  await D(
    `${qt}/files/${t.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: e
    }
  );
}
let q = null;
function ue() {
  if (q) return q;
  const e = [document.getElementById("root"), document.getElementById("app"), document.body.firstElementChild];
  for (const t of e) {
    if (!t) continue;
    const i = Object.keys(t).find((n) => n.startsWith("__reactContainer$"));
    if (!i) continue;
    let s = [t[i]], o = 0;
    for (; s.length && o < 2e4; ) {
      const n = s.pop();
      if (o += 1, !n) continue;
      const c = n.memoizedProps?.client;
      if (c && typeof c.invalidateQueries == "function")
        return q = c, q;
      n.sibling && s.push(n.sibling), n.child && s.push(n.child), s.length > 5e3 && (s = s.slice(-5e3));
    }
  }
  return null;
}
function fe() {
  try {
    const e = ue();
    e && e.invalidateQueries();
  } catch {
  }
  try {
    document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new Event("focus"));
  } catch {
  }
}
const Mt = "pacaDriveFiles";
function pe(e) {
  const t = e?.[Mt];
  if (Array.isArray(t))
    return t.filter(
      (i) => !!i && typeof i == "object" && typeof i.id == "string"
    );
}
function Z(e) {
  return Array.isArray(e.driveFiles) ? { [Mt]: e.driveFiles } : {};
}
const ye = ["word_count", "price_per_word", "amount"];
function ge(e) {
  const t = {};
  for (const i of ye) {
    const s = e?.[i], o = typeof s == "number" ? s : typeof s == "string" && s.trim() !== "" ? Number(s) : NaN;
    Number.isFinite(o) && (t[i] = o);
  }
  return Object.keys(t).length ? t : void 0;
}
function kt(e) {
  return JSON.stringify([e.name ?? "", e.goal ?? null, F(e.startDate), F(e.endDate), e.status ?? "planned"]);
}
function me(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return t.format === "paca-sync" && Array.isArray(t.projects) && Array.isArray(t.tasks);
}
const $t = (e) => {
  const t = Date.parse(e ?? "");
  return Number.isNaN(t) ? 0 : t;
}, pt = (e, t) => $t(e.updatedAt) >= $t(t.updatedAt) ? { ...t, ...e } : { ...e, ...t };
function he(e, t) {
  if (!e) return t;
  if (!t) return e;
  const i = /* @__PURE__ */ new Map();
  for (const o of t.projects) i.set(o.syncId, o);
  for (const o of e.projects) {
    const n = i.get(o.syncId);
    i.set(o.syncId, n ? pt(o, n) : o);
  }
  const s = /* @__PURE__ */ new Map();
  for (const o of t.tasks) s.set(o.syncId, o);
  for (const o of e.tasks) {
    const n = s.get(o.syncId);
    s.set(o.syncId, n ? pt(o, n) : o);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...t,
    ...e,
    ...we(e, t),
    format: "paca-sync",
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sync: {
      rev: Math.max(e.sync?.rev ?? 0, t.sync?.rev ?? 0),
      updatedBy: e.sync?.updatedBy ?? "paca",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    projects: Array.from(i.values()),
    tasks: Array.from(s.values())
  };
}
function we(e, t) {
  const i = {}, s = [
    ["timeEntries", "id"],
    ["timeLogs", "syncId"],
    ["sprints", "syncId"]
  ];
  for (const [o, n] of s) {
    const c = e[o], d = t[o];
    if (!Array.isArray(c) && !Array.isArray(d)) continue;
    const r = /* @__PURE__ */ new Map();
    for (const a of d ?? []) r.set(String(a[n]), a);
    for (const a of c ?? []) {
      const f = r.get(String(a[n]));
      r.set(String(a[n]), f ? pt(a, f) : a);
    }
    i[o] = Array.from(r.values());
  }
  return i;
}
function Y(e) {
  return JSON.stringify([e.name ?? "", e.description ?? ""]);
}
function At(e) {
  return JSON.stringify([
    e.title ?? "",
    e.description ?? null,
    e.importance ?? 0,
    e.tags ?? [],
    e.statusName ?? null,
    F(e.startDate),
    F(e.dueDate),
    e.fields ?? null,
    e.driveFiles ? e.driveFiles.map((t) => t.id) : null,
    ...e.typeName !== void 0 ? [e.typeName] : [],
    ...e.parentSyncId !== void 0 ? [e.parentSyncId] : [],
    ...e.storyPoints !== void 0 ? [e.storyPoints] : [],
    ...e.sprintSyncId !== void 0 ? ["s:" + (e.sprintSyncId ?? "")] : []
  ]);
}
function F(e) {
  if (!e) return null;
  const t = Date.parse(e);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}
function bt(e) {
  return JSON.stringify([
    e.taskSyncId ?? "",
    (e.date ?? "").slice(0, 10),
    Jt(e),
    e.note ?? ""
  ]);
}
function Jt(e) {
  const t = Number(e.minutes);
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  const i = Number(e.seconds);
  return Number.isFinite(i) && i > 0 ? Math.max(1, Math.round(i / 60)) : 0;
}
const Se = "/api/v1", b = "pacaSyncId", C = "pacaSyncSeen", R = "pacaSyncUpdatedAt", yt = "pacaSyncTimeLogs", gt = "pacaSyncSprints", et = "com.paca.time-logging";
class j extends Error {
}
async function Ft(e) {
  try {
    const t = await w(`/projects/${e}/task-types`);
    return Array.isArray(t) ? t : t.items ?? [];
  } catch (t) {
    if (t instanceof j) throw t;
    return [];
  }
}
async function je(e) {
  const t = [];
  let i = null;
  try {
    for (let s = 0; s < 20; s += 1) {
      const o = new URLSearchParams({ page_size: "100" });
      i && o.set("cursor", i);
      const n = await w(`/projects/${e}/sprints?${o.toString()}`);
      if (Array.isArray(n)) return n;
      if (t.push(...n.items ?? []), i = n.next_cursor ?? null, !i) break;
    }
  } catch (s) {
    if (s instanceof j) throw s;
  }
  return t;
}
async function w(e, t) {
  const i = await fetch(`${Se}${e}`, {
    ...t,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...t?.body ? { "Content-Type": "application/json" } : {},
      ...t?.headers ?? {}
    }
  });
  if (i.status === 401) throw new j("unauthorized");
  if (!i.ok) {
    let o = "";
    try {
      const n = await i.json();
      o = n?.error ? `: ${n.error}` : "";
    } catch {
    }
    throw new Error(`HTTP ${i.status}${o}`);
  }
  if (i.status === 204) return;
  const s = await i.json();
  return s?.data ?? s;
}
async function Ie() {
  const e = [];
  let t = 1;
  for (; ; ) {
    const i = await w(
      `/projects?page=${t}&page_size=100`
    ), s = i.items ?? [];
    e.push(...s);
    const o = typeof i.total == "number" ? i.total : e.length;
    if (s.length === 0 || e.length >= o || t > 50) break;
    t += 1;
  }
  return e;
}
let at = !0;
async function _e(e) {
  try {
    return await vt(e, at);
  } catch (t) {
    if (!at || t instanceof j) throw t;
    return at = !1, vt(e, !1);
  }
}
async function vt(e, t) {
  const i = [];
  let s = null;
  for (; ; ) {
    const o = new URLSearchParams({ page_size: "200" });
    t && o.set("include", "assignees"), s && o.set("cursor", s);
    const n = await w(
      `/projects/${e}/tasks?${o.toString()}`
    );
    if (i.push(...n.items ?? []), s = n.next_cursor ?? null, !s) break;
  }
  return i;
}
async function ke(e) {
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
async function $e(e) {
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
const Tt = (e) => e && (e.full_name || e.agent_name || e.username) || "";
async function Ae(e, t) {
  const i = await be(e);
  if (i) return i;
  const s = [];
  for (const o of t)
    try {
      const n = await w(
        `/plugins/${et}/projects/${e}/tasks/${o}/time-logs`
      );
      s.push(...Array.isArray(n) ? n : n?.logs ?? []);
    } catch (n) {
      if (n instanceof j) throw n;
      return null;
    }
  return s;
}
async function be(e) {
  const t = [];
  for (let i = 1; i <= 200; i += 1) {
    let s;
    try {
      s = await w(
        `/plugins/${et}/projects/${e}/time-logs?page_size=100&page=${i}`
      );
    } catch (c) {
      if (c instanceof j) throw c;
      return null;
    }
    const o = Array.isArray(s) ? s : s?.logs ?? [];
    t.push(...o);
    const n = Array.isArray(s) ? t.length : s?.total ?? t.length;
    if (o.length === 0 || t.length >= n || Array.isArray(s)) break;
  }
  return t;
}
function M() {
  return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
async function ve(e) {
  const t = await Ie(), i = [], s = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
  let d = [], r = !1;
  for (let u = 0; u < t.length; u += 1) {
    const p = t[u].id, y = await _e(p);
    if (i.push(...y), s.set(p, await ke(p)), o.set(p, await Ft(p)), n.set(p, await je(p)), d) {
      const _ = y.length ? await Ae(p, y.map((A) => A.id)) : [];
      _ === null ? d = null : y.length && (r = !0, d.push(..._), _.length && c.set(p, await $e(p)));
    }
  }
  const a = [], f = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), m = (/* @__PURE__ */ new Date()).toISOString();
  for (const u of t) {
    const p = { ...u.settings ?? {} }, y = Y({
      name: u.name,
      description: u.description ?? "",
      createdAt: u.created_at,
      updatedAt: u.created_at
    });
    let _ = !1, A = typeof p[b] == "string" ? p[b] : "";
    A || (A = M(), p[b] = A, _ = !0);
    const $ = typeof p[C] == "string" ? p[C] : null;
    let P;
    $ === null ? (p[C] = y, p[R] = u.created_at, P = u.created_at, _ = !0) : $ !== y ? (p[C] = y, p[R] = m, P = m, _ = !0) : P = typeof p[R] == "string" ? p[R] : u.created_at, _ && (await w(`/projects/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: p })
    }), u.settings = p), l.set(u.id, A), f.set(A, u), a.push({
      syncId: A,
      name: u.name,
      description: u.description ?? "",
      createdAt: u.created_at,
      updatedAt: P
    });
  }
  const g = [], I = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map();
  for (const u of t) {
    const p = u.settings?.[gt] ?? {};
    for (const y of n.get(u.id) ?? []) {
      const _ = typeof p[y.id] == "string" ? p[y.id] : y.id;
      v.set(y.id, _), I.set(_, y), g.push({
        syncId: _,
        projectSyncId: l.get(u.id) ?? "",
        name: y.name,
        goal: y.goal ?? null,
        startDate: y.start_date ?? null,
        endDate: y.end_date ?? null,
        status: y.status || "planned",
        createdAt: y.created_at,
        updatedAt: y.updated_at || y.created_at
      });
    }
  }
  const h = [], S = /* @__PURE__ */ new Map();
  for (const u of i) {
    const p = { ...u.custom_fields ?? {} };
    let y = typeof p[b] == "string" ? p[b] : "";
    if (!y) {
      y = M();
      const x = await w(
        `/projects/${u.project_id}/tasks/${u.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...p, [b]: y }
          })
        }
      );
      x?.updated_at && (u.updated_at = x.updated_at);
    }
    S.set(y, u);
    const _ = (s.get(u.project_id) ?? []).find(
      (x) => x.id === u.status_id
    ), A = (u.assignees ?? []).map(Tt).filter(Boolean), $ = {
      syncId: y,
      projectSyncId: l.get(u.project_id) ?? "",
      title: u.title,
      description: u.description ?? null,
      importance: u.importance ?? 0,
      tags: u.tags ?? [],
      createdAt: u.created_at,
      updatedAt: u.updated_at ?? u.created_at,
      startDate: u.start_date ?? null,
      dueDate: u.due_date ?? null
    }, P = ge(u.custom_fields);
    P && ($.fields = P);
    const H = pe(u.custom_fields);
    H && ($.driveFiles = H), _ && ($.statusName = _.name, $.statusCategory = _.category), u.assignees && ($.assignee = A[0] ?? null, $.assignees = A);
    const W = (o.get(u.project_id) ?? []).find((x) => x.id === u.task_type_id);
    $.typeName = W ? W.name : null, $.storyPoints = typeof u.story_points == "number" ? u.story_points : null, $.sprintSyncId = u.sprint_id ? v.get(u.sprint_id) ?? null : null, h.push($);
  }
  {
    const u = /* @__PURE__ */ new Map();
    for (const [p, y] of S) u.set(y.id, p);
    i.forEach((p, y) => {
      const _ = h[y];
      _.parentSyncId = p.parent_task_id ? u.get(p.parent_task_id) ?? null : null;
    });
  }
  const N = new Map(i.map((u) => [u.id, u])), k = new Map(t.map((u) => [u.id, u])), E = /* @__PURE__ */ new Map();
  let V = null;
  if (d && r) {
    V = [];
    for (const p of d) {
      const y = N.get(p.task_id);
      if (!y) continue;
      const A = k.get(y.project_id)?.settings?.[yt] ?? {}, $ = typeof A[p.id] == "string" ? A[p.id] : p.id;
      E.set($, p);
      const P = Number(p.minutes_spent) || 0, H = (c.get(y.project_id) ?? []).find(
        (W) => W.id === p.member_id
      );
      V.push({
        syncId: $,
        taskSyncId: String(y.custom_fields?.[b] ?? ""),
        projectSyncId: l.get(y.project_id) ?? "",
        date: String(p.spent_date ?? "").slice(0, 10),
        minutes: P,
        seconds: P * 60,
        note: p.note ?? "",
        ...H ? { member: Tt(H) } : {},
        createdAt: p.created_at,
        updatedAt: p.updated_at || p.created_at
      });
    }
    const u = /* @__PURE__ */ new Map();
    for (const [p, y] of S) u.set(y.id, p);
    for (const p of V)
      if (!p.taskSyncId) {
        const y = E.get(p.syncId);
        p.taskSyncId = (y && u.get(y.task_id)) ?? "";
      }
  }
  return {
    projects: t,
    tasks: i,
    projectRecords: a,
    taskRecords: h,
    projectBySync: f,
    taskBySync: S,
    statusesByProject: s,
    typesByProject: o,
    sprintRecords: g,
    sprintBySync: I,
    timeLogRecords: V,
    logBySync: E,
    localTimeLogs: d ?? []
  };
}
function Te(e, t) {
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
    ...e.timeLogRecords ? { timeLogs: e.timeLogRecords } : {},
    sprints: e.sprintRecords
  };
}
const O = (e) => {
  const t = e?.message ?? String(e);
  return /Failed to fetch|NetworkError|Load failed/i.test(t) ? "ارتباط با سرور محلی پاکا برقرار نشد" : t;
};
async function Ne(e, t, i) {
  const s = {
    title: t.title || "(بدون عنوان)",
    custom_fields: { ...Z(t), [b]: t.syncId }
  };
  try {
    return await w(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        ...s,
        custom_fields: { ...t.fields ?? {}, ...Z(t), [b]: t.syncId },
        description: ht(t) ?? void 0,
        importance: t.importance ?? 0,
        tags: t.tags ?? [],
        ...mt(t, null, i)
      })
    });
  } catch (o) {
    if (o instanceof j) throw o;
    const n = await w(`/projects/${e}/tasks`, {
      method: "POST",
      body: JSON.stringify(s)
    }).catch((d) => {
      throw d instanceof j ? d : new Error(`${O(o)} / ${O(d)}`);
    }), c = [
      { description: ht(t) ?? void 0 },
      { importance: t.importance ?? 0 },
      { tags: t.tags ?? [] },
      ...t.fields ? [{ custom_fields: { ...t.fields, ...Z(t), [b]: t.syncId } }] : [],
      ...Object.entries(mt(t, null, i)).map(([d, r]) => ({ [d]: r }))
    ];
    for (const d of c)
      try {
        await w(`/projects/${e}/tasks/${n.id}`, {
          method: "PATCH",
          body: JSON.stringify(d)
        });
      } catch (r) {
        if (r instanceof j) throw r;
      }
    return n;
  }
}
async function Pe(e, t) {
  if (!t) return 0;
  const i = new Set(t.projects.map((n) => n.syncId)), s = (n) => (n || "").replace(/\s+/g, " ").trim();
  let o = 0;
  for (const n of t.projects) {
    if (n.deleted || e.projectBySync.has(n.syncId)) continue;
    const c = e.projectRecords.filter(
      (l) => !i.has(l.syncId) && s(l.name) === s(n.name)
    );
    if (c.length !== 1) continue;
    const d = c[0], r = e.projectBySync.get(d.syncId);
    if (!r) continue;
    const a = { ...r.settings ?? {}, [b]: n.syncId };
    await w(`/projects/${r.id}`, { method: "PATCH", body: JSON.stringify({ settings: a }) }), r.settings = a;
    const f = d.syncId;
    e.projectBySync.delete(f), e.projectBySync.set(n.syncId, r), d.syncId = n.syncId;
    for (const l of e.taskRecords) l.projectSyncId === f && (l.projectSyncId = n.syncId);
    for (const l of e.timeLogRecords ?? []) l.projectSyncId === f && (l.projectSyncId = n.syncId);
    o += 1;
  }
  return o;
}
async function Ee(e, t, i = /* @__PURE__ */ new Set()) {
  const s = {
    createdProjects: 0,
    createdTasks: 0,
    updatedProjects: 0,
    updatedTasks: 0,
    createdTimeLogs: 0,
    updatedTimeLogs: 0,
    sprints: 0,
    presentProjects: [],
    failures: []
  }, o = /* @__PURE__ */ new Map();
  for (const r of t.projectRecords)
    o.set(r.syncId, r);
  const n = /* @__PURE__ */ new Map();
  for (const r of t.taskRecords)
    n.set(r.syncId, r);
  const c = /* @__PURE__ */ new Map();
  for (const r of e.projects) {
    const a = t.projectBySync.get(r.syncId);
    if (r.deleted) continue;
    if (!a) {
      let m;
      try {
        m = await w("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: r.name,
            description: r.description ?? "",
            task_id_prefix: xe(r.name, r.syncId),
            settings: {
              [b]: r.syncId,
              [C]: Y(r),
              [R]: r.updatedAt
            }
          })
        });
      } catch (g) {
        if (g instanceof j) throw g;
        s.failures.push(`پروژهٔ «${r.name}» ساخته نشد: ${O(g)}`);
        continue;
      }
      c.set(r.syncId, m.id), t.projectBySync.has(r.syncId) || t.projectBySync.set(r.syncId, m), s.presentProjects.push(r.syncId), s.createdProjects += 1;
      continue;
    }
    c.set(r.syncId, a.id), s.presentProjects.push(r.syncId);
    const f = o.get(r.syncId);
    if (!f || Y(f) === Y(r) || Date.parse(r.updatedAt) <= Date.parse(f.updatedAt)) continue;
    const l = { ...a.settings ?? {} };
    l[b] = r.syncId, l[C] = Y(r), l[R] = r.updatedAt;
    try {
      await w(`/projects/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: r.name,
          description: r.description ?? "",
          settings: l
        })
      }), s.updatedProjects += 1;
    } catch (m) {
      if (m instanceof j) throw m;
      s.failures.push(`پروژهٔ «${r.name}» به‌روز نشد: ${O(m)}`);
    }
  }
  const d = [];
  for (const r of e.tasks) {
    const a = t.taskBySync.get(r.syncId);
    if (!a && r.deleted) continue;
    if (!a) {
      const g = c.get(r.projectSyncId);
      if (!g) {
        const I = e.projects.find((v) => v.syncId === r.projectSyncId);
        s.failures.push(
          I ? `کار «${r.title}» منتقل نشد: پروژهٔ «${I.name}» در این دستگاه ساخته نشد` : `کار «${r.title}» منتقل نشد: پروژهٔ آن در فایل همگام‌سازی نیست`
        );
        continue;
      }
      try {
        const I = await Ne(
          g,
          r,
          t.statusesByProject.get(g) ?? []
        );
        I?.id && (t.taskBySync.set(r.syncId, { ...I, project_id: g }), d.push(r)), s.createdTasks += 1;
      } catch (I) {
        if (I instanceof j) throw I;
        s.failures.push(`کار «${r.title}» ساخته نشد: ${O(I)}`);
      }
      continue;
    }
    const f = n.get(r.syncId);
    if (!f || At(f) === At(r) || Date.parse(r.updatedAt) <= Date.parse(f.updatedAt)) continue;
    d.push(r);
    const l = { ...a.custom_fields ?? {} }, m = (g) => w(`/projects/${a.project_id}/tasks/${a.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: r.title,
        description: ht(r) ?? void 0,
        importance: r.importance ?? 0,
        tags: r.tags ?? [],
        custom_fields: { ...l, ...g ? r.fields ?? {} : {}, ...Z(r), [b]: r.syncId },
        ...mt(r, a, t.statusesByProject.get(a.project_id) ?? [])
      })
    });
    try {
      try {
        await m(!0);
      } catch (g) {
        if (g instanceof j || !r.fields) throw g;
        await m(!1);
      }
      s.updatedTasks += 1;
    } catch (g) {
      if (g instanceof j) throw g;
      s.failures.push(`کار «${r.title}» به‌روز نشد: ${O(g)}`);
    }
  }
  if (await Oe(e, t, s), await De(d, t, s), t.timeLogRecords && Array.isArray(e.timeLogs))
    try {
      await Le(e, t, i, s);
    } catch (r) {
      if (r instanceof j) throw r;
      s.failures.push(`زمان‌های ثبت‌شده منتقل نشدند: ${O(r)}`);
    }
  return s;
}
async function Oe(e, t, i) {
  if (!Array.isArray(e.sprints)) return;
  const s = new Map(t.sprintRecords.map((n) => [n.syncId, n])), o = (n) => n && !Number.isNaN(Date.parse(n)) ? new Date(n).toISOString() : null;
  for (const n of e.sprints) {
    if (n.deleted) continue;
    const c = t.projectBySync.get(n.projectSyncId);
    if (!c) continue;
    const d = t.sprintBySync.get(n.syncId), r = {
      name: n.name || "اسپرینت",
      goal: n.goal ?? null,
      start_date: o(n.startDate),
      end_date: o(n.endDate)
    };
    try {
      if (!d) {
        let f = null;
        for (const m of [n.status, "planned"])
          try {
            f = await w(`/projects/${c.id}/sprints`, {
              method: "POST",
              body: JSON.stringify({ ...r, status: m })
            });
            break;
          } catch (g) {
            if (g instanceof j || m === "planned") throw g;
          }
        if (!f?.id) continue;
        t.sprintBySync.set(n.syncId, f);
        const l = { ...c.settings ?? {} };
        l[gt] = { ...l[gt] ?? {}, [f.id]: n.syncId }, await w(`/projects/${c.id}`, { method: "PATCH", body: JSON.stringify({ settings: l }) }), c.settings = l, i.sprints += 1;
        continue;
      }
      const a = s.get(n.syncId);
      if (!a || kt(a) === kt(n) || Date.parse(n.updatedAt) <= Date.parse(a.updatedAt)) continue;
      try {
        await w(`/projects/${c.id}/sprints/${d.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...r, status: n.status })
        });
      } catch (f) {
        if (f instanceof j || n.status !== "completed") throw f;
        await w(`/projects/${c.id}/sprints/${d.id}`, { method: "PATCH", body: JSON.stringify(r) }), await w(`/projects/${c.id}/sprints/${d.id}/complete`, { method: "POST", body: "{}" });
      }
      i.sprints += 1;
    } catch (a) {
      if (a instanceof j) throw a;
      i.failures.push(`اسپرینت «${n.name}» منتقل نشد: ${O(a)}`);
    }
  }
}
async function De(e, t, i) {
  const s = [...e].sort((o, n) => +(n.typeName === "Epic") - +(o.typeName === "Epic"));
  for (const o of s) {
    if (o.typeName === void 0 && o.parentSyncId === void 0 && o.storyPoints === void 0) continue;
    const n = t.taskBySync.get(o.syncId);
    if (!n) continue;
    const c = {};
    if (o.typeName !== void 0) {
      t.typesByProject.has(n.project_id) || t.typesByProject.set(n.project_id, await Ft(n.project_id));
      let d = t.typesByProject.get(n.project_id) ?? [], r = o.typeName ? d.find((f) => f.name === o.typeName) : void 0;
      if (o.typeName && !r)
        try {
          const f = await w(`/projects/${n.project_id}/task-types`, {
            method: "POST",
            body: JSON.stringify({ name: o.typeName })
          });
          f?.id && (r = f, d = [...d, f], t.typesByProject.set(n.project_id, d));
        } catch (f) {
          if (f instanceof j) throw f;
        }
      const a = r ? r.id : null;
      (r || o.typeName === null) && (n.task_type_id ?? null) !== a && (c.task_type_id = a);
    }
    if (o.parentSyncId !== void 0) {
      const d = o.parentSyncId ? t.taskBySync.get(o.parentSyncId) : void 0, r = d && d.project_id === n.project_id ? d.id : null;
      o.parentSyncId && !d || (n.parent_task_id ?? null) !== r && (c.parent_task_id = r);
    }
    if (o.sprintSyncId !== void 0) {
      const d = o.sprintSyncId ? t.sprintBySync.get(o.sprintSyncId) : void 0, r = d && d.project_id === n.project_id ? d.id : null;
      o.sprintSyncId && !r || (n.sprint_id ?? null) !== r && (c.sprint_id = r);
    }
    if (o.storyPoints !== void 0 && (n.story_points ?? null) !== o.storyPoints && (c.story_points = o.storyPoints), !!Object.keys(c).length)
      try {
        const d = await w(`/projects/${n.project_id}/tasks/${n.id}`, {
          method: "PATCH",
          body: JSON.stringify(c)
        });
        t.taskBySync.set(o.syncId, { ...n, ...c, ...d?.id ? d : {}, project_id: n.project_id });
      } catch (d) {
        if (d instanceof j) throw d;
        i.failures.push(`نوع یا والد کار «${o.title}» تنظیم نشد: ${O(d)}`);
      }
  }
}
function mt(e, t, i) {
  const s = {};
  if (e.statusName !== void 0 || e.statusCategory !== void 0) {
    const o = i.find((n) => n.name === e.statusName) ?? i.find((n) => n.category === e.statusCategory);
    o && o.id !== t?.status_id && (s.status_id = o.id);
  }
  for (const [o, n] of [
    ["startDate", "start_date"],
    ["dueDate", "due_date"]
  ]) {
    const c = e[o];
    c !== void 0 && F(c) !== F(t?.[n] ?? null) && (c === null ? s[n] = null : Number.isNaN(Date.parse(c)) || (s[n] = new Date(c).toISOString()));
  }
  return s;
}
function ht(e) {
  const t = e.description;
  if (Array.isArray(t)) return t;
  const i = typeof t == "string" ? t : e.descriptionMarkdown ?? null;
  return typeof i != "string" ? t ?? null : Be(i);
}
function Be(e) {
  const t = { textColor: "default", backgroundColor: "default", textAlignment: "right" }, i = (o) => o.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(
    (n) => n.startsWith("**") && n.endsWith("**") ? { type: "text", text: n.slice(2, -2), styles: { bold: !0 } } : { type: "text", text: n, styles: {} }
  ), s = [];
  for (const o of e.split(/\r?\n/)) {
    const n = o.trimEnd();
    if (!n.trim()) continue;
    const c = n.match(/^(#{1,3})\s+(.*)$/), d = n.match(/^\s*[-*•]\s+(.*)$/), r = n.match(/^\s*[0-9۰-۹]+[.)]\s+(.*)$/);
    c ? s.push({ id: M(), type: "heading", props: { ...t, level: c[1].length }, content: i(c[2]), children: [] }) : d ? s.push({ id: M(), type: "bulletListItem", props: t, content: i(d[1]), children: [] }) : r ? s.push({ id: M(), type: "numberedListItem", props: t, content: i(r[1]), children: [] }) : s.push({ id: M(), type: "paragraph", props: t, content: i(n), children: [] });
  }
  return s;
}
async function Le(e, t, i, s) {
  const o = /* @__PURE__ */ new Map();
  for (const a of t.timeLogRecords ?? []) o.set(a.syncId, a);
  const n = /* @__PURE__ */ new Map(), c = (a) => {
    let f = n.get(a.id);
    return f || (f = { ...a.settings ?? {} }, n.set(a.id, f)), f;
  }, d = async (a, f, l) => {
    const m = t.projects.find((v) => v.id === a);
    if (!m) return;
    const g = c(m), I = { ...g[yt] ?? {} };
    I[f] = l, g[yt] = I, await w(`/projects/${a}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: g })
    }), m.settings = g;
  }, r = /* @__PURE__ */ new Set();
  for (const a of e.timeLogs ?? []) {
    if (a.deleted) continue;
    const f = Jt(a), l = String(a.date ?? "").slice(0, 10);
    if (!f || !/^\d{4}-\d{2}-\d{2}$/.test(l)) continue;
    const m = t.logBySync.get(a.syncId);
    if (m) {
      const h = o.get(a.syncId);
      if (!h || bt(h) === bt(a) || Date.parse(a.updatedAt) <= Date.parse(h.updatedAt)) continue;
      const S = t.tasks.find((N) => N.id === m.task_id);
      if (!S) continue;
      try {
        await w(
          `/plugins/${et}/projects/${S.project_id}/tasks/${S.id}/time-logs/${m.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ spent_date: l, minutes_spent: f, note: a.note ?? "" })
          }
        ), s.updatedTimeLogs += 1;
      } catch (N) {
        if (N instanceof j) throw N;
      }
      continue;
    }
    const g = t.taskBySync.get(a.taskSyncId);
    if (!g) continue;
    const I = t.localTimeLogs.find((h) => {
      const S = (o.get(h.id) ? h.id : "") || "";
      return S && !i.has(S) && !r.has(S) && h.task_id === g.id && String(h.spent_date).slice(0, 10) === l && Number(h.minutes_spent) === f && (h.note ?? "") === (a.note ?? "");
    });
    if (I) {
      await d(g.project_id, I.id, a.syncId), r.add(I.id);
      continue;
    }
    let v = null;
    try {
      v = await w(
        `/plugins/${et}/projects/${g.project_id}/tasks/${g.id}/time-logs`,
        {
          method: "POST",
          body: JSON.stringify({ spent_date: l, minutes_spent: f, note: a.note ?? "" })
        }
      );
    } catch (h) {
      if (h instanceof j) throw h;
      continue;
    }
    v?.id && await d(g.project_id, v.id, a.syncId), s.createdTimeLogs += 1;
  }
  r.size && (e.timeLogs = (e.timeLogs ?? []).filter((a) => !r.has(a.syncId)));
}
function xe(e, t) {
  const i = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), s = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((i.length >= 2 ? i.slice(0, 4) : "P") + s.slice(-4)).slice(0, 10) || "PACA";
}
async function Ce(e, t) {
  const i = [];
  for (const s of e.projects) {
    if (!s.deleted) continue;
    const o = t.projectBySync.get(s.syncId);
    if (!o) continue;
    try {
      await w(`/projects/${o.id}`, { method: "DELETE" });
    } catch (c) {
      if (c instanceof j) throw c;
      continue;
    }
    t.projectBySync.delete(s.syncId), t.projects = t.projects.filter((c) => c.id !== o.id);
    const n = /* @__PURE__ */ new Set();
    for (const [c, d] of t.taskBySync)
      d.project_id === o.id && (n.add(d.id), t.taskBySync.delete(c));
    for (const [c, d] of t.logBySync)
      n.has(d.task_id) && t.logBySync.delete(c);
    i.push(s.name);
  }
  return i;
}
function Nt(e) {
  if (!e) return "";
  const t = [...e.projects].sort((n, c) => n.syncId.localeCompare(c.syncId)).map((n) => [n.syncId, n.name, n.description, n.updatedAt, !!n.deleted]), i = [...e.tasks].sort((n, c) => n.syncId.localeCompare(c.syncId)).map((n) => [
    n.syncId,
    n.projectSyncId,
    n.title,
    JSON.stringify(n.description ?? null),
    n.importance,
    JSON.stringify(n.tags ?? []),
    n.updatedAt,
    n.statusName ?? null,
    n.assignee ?? null,
    n.startDate ?? null,
    n.dueDate ?? null,
    !!n.deleted,
    JSON.stringify(n.fields ?? null),
    JSON.stringify(n.driveFiles ? n.driveFiles.map((c) => c.id) : null),
    n.typeName ?? null,
    n.parentSyncId ?? null,
    n.storyPoints ?? null,
    n.sprintSyncId ?? null
  ]), s = [...e.timeLogs ?? []].sort((n, c) => n.syncId.localeCompare(c.syncId)).map((n) => [n.syncId, n.taskSyncId, n.date, n.minutes, n.note, n.updatedAt, !!n.deleted]), o = [...e.sprints ?? []].sort((n, c) => n.syncId.localeCompare(c.syncId)).map((n) => [n.syncId, n.projectSyncId, n.name, n.goal, n.startDate, n.endDate, n.status, n.updatedAt, !!n.deleted]);
  return JSON.stringify([t, i, s, o]);
}
function Re(e) {
  if (!e || !e.trim()) return null;
  try {
    const t = JSON.parse(e);
    return me(t) ? t : null;
  } catch {
    return null;
  }
}
const Ht = "paca-sync.known-projects";
function Me() {
  try {
    const e = localStorage.getItem(Ht);
    if (!e) return null;
    const t = JSON.parse(e);
    return Array.isArray(t) ? new Set(t.map(String)) : null;
  } catch {
    return null;
  }
}
function Je(e) {
  try {
    localStorage.setItem(Ht, JSON.stringify(e));
  } catch {
  }
}
function Fe(e, t, i) {
  const s = (/* @__PURE__ */ new Date()).toISOString(), o = [], n = /* @__PURE__ */ new Set();
  i && ![...i].some((a) => t.has(a)) && (i = null);
  const c = e.projects.map((a) => a.deleted ? (n.add(a.syncId), a) : i && i.has(a.syncId) && !t.has(a.syncId) ? (n.add(a.syncId), o.push(a.name), { ...a, deleted: !0, updatedAt: s }) : a);
  if (!n.size) return { bundle: e, deletedHere: o };
  const d = e.tasks.map(
    (a) => n.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: s } : a
  ), r = e.timeLogs?.map(
    (a) => n.has(a.projectSyncId) && !a.deleted ? { ...a, deleted: !0, updatedAt: s } : a
  );
  return { bundle: { ...e, projects: c, tasks: d, ...r ? { timeLogs: r } : {} }, deletedHere: o };
}
let K = null;
function He(e = {}) {
  return K || (K = (async () => {
    const t = () => Date.now();
    try {
      if (!st())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: t()
        };
      if (!Bt())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: t()
        };
      e.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const i = await de(), s = Re(i);
      e.onPhase?.("در حال خواندن داده‌های پاکا…");
      const o = await ve();
      await Pe(o, s);
      const n = Te(o, s?.sync?.rev ?? 0), c = Me(), { bundle: d, deletedHere: r } = Fe(
        he(n, s) ?? n,
        new Set(o.projectBySync.keys()),
        c
      ), a = await Ce(d, o), f = new Set((s?.timeLogs ?? []).map((k) => k.syncId)), l = await Ee(d, o, f), m = Nt(s), g = Nt(d), I = l.createdProjects + l.createdTasks + l.updatedProjects + l.updatedTasks + l.createdTimeLogs + l.updatedTimeLogs + l.sprints + r.length + a.length;
      if (m !== g || !s) {
        e.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const k = Math.max(s?.sync?.rev ?? 0, 0) + 1, E = {
          ...d,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: k,
            updatedBy: Wt() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await le(JSON.stringify(E, null, 2));
      }
      Je(l.presentProjects);
      const v = d.tasks.filter(
        (k) => !k.deleted && !o.taskBySync.has(k.syncId)
      ), h = (k) => String(k).replace(/\d/g, (E) => "۰۱۲۳۴۵۶۷۸۹"[Number(E)]), S = [];
      l.createdProjects && S.push(`${h(l.createdProjects)} پروژهٔ جدید`), l.createdTasks && S.push(`${h(l.createdTasks)} کار جدید`), l.updatedProjects && S.push(`${h(l.updatedProjects)} پروژهٔ به‌روزشده`), l.updatedTasks && S.push(`${h(l.updatedTasks)} کار به‌روزشده`), l.createdTimeLogs && S.push(`${h(l.createdTimeLogs)} زمان ثبت‌شدهٔ جدید`), l.sprints && S.push(`${h(l.sprints)} اسپرینت جدید یا به‌روزشده`), l.updatedTimeLogs && S.push(`${h(l.updatedTimeLogs)} زمان به‌روزشده`), r.length && S.push(`حذف پروژهٔ ${r.map((k) => `«${k}»`).join("، ")} در فایل ثبت شد`), a.length && S.push(`پروژهٔ ${a.map((k) => `«${k}»`).join("، ")} که جای دیگر حذف شده بود این‌جا هم حذف شد`);
      const N = `در این دستگاه: ${h(o.projects.length + l.createdProjects)} پروژه و ${h(o.taskBySync.size)} کار (کارها در «بک‌لاگ محصول» هر پروژه).`;
      if (l.failures.length || v.length) {
        const k = l.failures.slice(0, 3).join("؛ "), E = l.failures.length > 3 ? ` و ${h(l.failures.length - 3)} مورد دیگر` : "";
        return {
          outcome: "PARTIAL",
          message: `همگام‌سازی ناقص ماند: ${h(Math.max(v.length, l.failures.length))} مورد از فایل به پاکا نیامد.` + (k ? ` ${k}${E}.` : "") + (S.length ? ` انجام‌شده: ${S.join("، ")}.` : "") + ` ${N}`,
          at: t(),
          created: l.createdProjects + l.createdTasks + l.createdTimeLogs,
          updated: l.updatedProjects + l.updatedTasks + l.updatedTimeLogs,
          failures: l.failures
        };
      }
      return I > 0 ? {
        outcome: "MERGED",
        message: `همگام‌سازی انجام شد؛ ${S.join("، ")}. ${N}`,
        at: t(),
        created: l.createdProjects + l.createdTasks + l.createdTimeLogs,
        updated: l.updatedProjects + l.updatedTasks + l.updatedTimeLogs
      } : s ? m !== g ? {
        outcome: "PUSHED",
        message: "تغییرات پاکا ذخیره شد.",
        at: t()
      } : { outcome: "UP_TO_DATE", message: `همه‌چیز به‌روز است. ${N}`, at: t() } : {
        outcome: "PUSHED",
        message: "فایل همگام‌سازی ساخته شد و داده‌های پاکا در آن ذخیره شد.",
        at: t()
      };
    } catch (i) {
      const s = i?.message ?? String(i);
      return s === "auth" ? {
        outcome: "NEEDS_PERMISSION",
        message: "دسترسی گوگل منقضی شده؛ دوباره وارد شوید.",
        at: t()
      } : s === "unlinked" ? {
        outcome: "NOT_LINKED",
        message: "اتصال همگام‌سازی قطع است.",
        at: t()
      } : {
        outcome: "FAILED",
        message: `خطا در همگام‌سازی: ${s}`,
        at: t()
      };
    }
  })(), K.finally(() => {
    K = null;
  }));
}
const Ue = "/api/v1", Ut = "paca-agent-autojoin.done";
async function z(e, t, i) {
  try {
    const s = await fetch(Ue + t, {
      method: e,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...i ? { "Content-Type": "application/json" } : {} },
      body: i ? JSON.stringify(i) : void 0
    });
    if (!s.ok) return null;
    const o = await s.json().catch(() => null);
    return o?.data ?? o;
  } catch {
    return null;
  }
}
function Q(e) {
  if (Array.isArray(e)) return e;
  const t = e;
  return (t?.items ?? t?.projects ?? t?.agents ?? []) || [];
}
function Ke() {
  try {
    return new Set(JSON.parse(localStorage.getItem(Ut) || "[]"));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
let ct = !1;
async function St() {
  if (ct) return 0;
  try {
    if (localStorage.getItem("paca-agent-autojoin") === "off") return 0;
  } catch {
  }
  ct = !0;
  let e = 0;
  try {
    const t = Q(await z("GET", "/agents/")).filter((o) => o.id);
    if (!t.length) return 0;
    const i = Q(await z("GET", "/projects?page_size=100")).filter((o) => o.id), s = Ke();
    for (const o of i) {
      const n = String(o.id), c = t.filter((f) => !s.has(`${n}:${f.id}`));
      if (!c.length) continue;
      const d = Q(await z("GET", `/projects/${n}/members?page_size=100`)), r = new Set(d.map((f) => String(f.agent_id ?? "")).filter(Boolean)), a = c.filter((f) => !r.has(String(f.id)));
      for (const f of c) r.has(String(f.id)) && s.add(`${n}:${f.id}`);
      if (a.length) {
        const f = Q(await z("GET", `/projects/${n}/roles`)), l = f.find((m) => String(m.name).toLowerCase() === "editor") ?? f.find((m) => String(m.name).toLowerCase() === "admin") ?? f[0];
        if (!l) continue;
        for (const m of a)
          await z("POST", `/projects/${n}/members`, {
            agent_id: m.id,
            role_ids: [l.id]
          }) && (e++, s.add(`${n}:${m.id}`));
      }
    }
    try {
      localStorage.setItem(Ut, JSON.stringify([...s]));
    } catch {
    }
  } finally {
    ct = !1;
  }
  return e;
}
setTimeout(() => void St(), 8e3);
setInterval(() => void St(), 6e4);
window.addEventListener("paca-sync-merged", () => void St());
let Pt = 0;
async function ot(e = !1) {
  if (!(!st() || !ie() || !Bt()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!e && Date.now() - Pt < 2e4)) {
    Pt = Date.now();
    try {
      const t = await He();
      re(t), (t.outcome === "MERGED" || t.outcome === "PARTIAL") && (fe(), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: t })));
    } catch {
    }
  }
}
setTimeout(() => void ot(!0), 6e3);
setInterval(() => void ot(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && ot();
});
window.addEventListener("online", () => void ot(!0));
