const q = "https://api.github.com", Z = "paca.sync.github";
function h() {
  try {
    const t = localStorage.getItem(Z), e = t ? JSON.parse(t) : null;
    return e && e.repo && e.token ? e : null;
  } catch {
    return null;
  }
}
async function _(t, e, s = {}) {
  return await fetch(`${q}${e}`, {
    ...s,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${t}`,
      ...s.headers ?? {}
    }
  });
}
function O(t, e) {
  throw t.status === 401 ? new Error("توکن گیت‌هاب نامعتبر یا منقضی است") : t.status === 403 ? new Error("توکن اجازهٔ دسترسی ندارد (Contents: Read and write لازم است)") : t.status === 404 ? new Error("مخزن پیدا نشد یا توکن به آن دسترسی ندارد") : new Error(`${e}: GitHub ${t.status}`);
}
const H = (t) => t.split("/").map(encodeURIComponent).join("/");
function Q(t) {
  const e = new TextEncoder().encode(t);
  let s = "";
  for (let n = 0; n < e.length; n += 32768)
    s += String.fromCharCode(...e.subarray(n, n + 32768));
  return btoa(s);
}
function X(t) {
  const e = atob(t.replace(/\s/g, "")), s = new Uint8Array(e.length);
  for (let n = 0; n < e.length; n++) s[n] = e.charCodeAt(n);
  return new TextDecoder().decode(s);
}
let b = null;
async function F() {
  const t = h();
  if (!t) throw new Error("unlinked");
  const e = await _(
    t.token,
    `/repos/${t.repo}/contents/${H(t.path)}?ref=${encodeURIComponent(t.branch || "main")}`
  );
  if (e.status === 404)
    return b = null, "";
  e.ok || O(e, "read");
  const s = await e.json();
  if (b = s.sha, s.content && s.encoding === "base64") return X(s.content);
  const n = await _(t.token, `/repos/${t.repo}/git/blobs/${s.sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  return n.ok || O(n, "read"), await n.text();
}
async function W(t) {
  const e = h();
  if (!e) throw new Error("unlinked");
  const s = (i) => _(e.token, `/repos/${e.repo}/contents/${H(e.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `paca sync ${(/* @__PURE__ */ new Date()).toISOString()}`,
      content: Q(t),
      branch: e.branch || "main",
      ...i ? { sha: i } : {}
    })
  });
  let n = await s(b);
  (n.status === 409 || n.status === 422) && (await F(), n = await s(b)), n.ok || O(n, "write"), b = (await n.json()).content?.sha ?? null;
}
function tt() {
  return h() ? "github" : V() ? "drive" : null;
}
const w = "https://www.googleapis.com/drive/v3", et = "https://www.googleapis.com/upload/drive/v3", C = "Paca", x = "paca-sync.json", R = "application/vnd.google-apps.folder", K = "paca.sync.token", Y = "paca.sync.link", nt = "paca.sync.auto", st = "paca.sync.status";
function z(t, e) {
  try {
    const s = t.getItem(e);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function G(t, e, s) {
  try {
    t.setItem(e, JSON.stringify(s));
  } catch {
  }
}
let k = z(sessionStorage, K);
function D() {
  return h() ? !0 : !!(k && k.value && k.exp - 6e4 > Date.now());
}
async function at() {
  if (D() && k) return k.value;
  throw new Error("auth");
}
function v() {
  return h() ? { folderId: "", fileId: "github" } : V();
}
function V() {
  const t = z(localStorage, Y);
  return t && t.fileId ? t : null;
}
function rt(t) {
  G(localStorage, Y, t);
}
function ot() {
  try {
    return localStorage.getItem(nt) !== "false";
  } catch {
    return !0;
  }
}
function ct(t) {
  G(localStorage, st, t);
}
async function m(t, e = {}) {
  const s = await at(), n = await fetch(t, {
    ...e,
    cache: "no-store",
    headers: { ...e.headers ?? {}, Authorization: `Bearer ${s}` }
  });
  if (n.status === 401) {
    k = null;
    try {
      sessionStorage.removeItem(K);
    } catch {
    }
    throw new Error("auth");
  }
  if (!n.ok) throw new Error(`drive ${n.status}`);
  return n;
}
const it = (t, e) => `${w}/files?${new URLSearchParams({
  q: t,
  fields: e,
  spaces: "drive",
  pageSize: "10"
}).toString()}`;
async function P(t, e) {
  return (await (await m(it(t, e))).json()).files ?? [];
}
async function dt() {
  const e = (await (await m(`${w}/about?fields=user(emailAddress)`)).json()).user?.emailAddress;
  let n = (await P(
    `name = '${C}' and mimeType = '${R}' and 'root' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  n || (n = (await (await m(`${w}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: C, mimeType: R })
  })).json()).id);
  let i = (await P(
    `name = '${x}' and '${n}' in parents and trashed = false`,
    "files(id)"
  ))[0]?.id;
  if (!i) {
    const c = await P(
      `name = '${x}' and 'root' in parents and trashed = false`,
      "files(id)"
    );
    c[0] && (await m(
      `${w}/files/${c[0].id}?addParents=${n}&removeParents=root&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    ), i = c[0].id);
  }
  i || (i = (await (await m(`${w}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: x,
      parents: [n],
      mimeType: "application/json"
    })
  })).json()).id);
  const a = { folderId: n, fileId: i, email: e };
  return rt(a), a;
}
async function ut() {
  if (h()) return F();
  const t = v();
  if (!t) throw new Error("unlinked");
  try {
    return await (await m(`${w}/files/${t.fileId}?alt=media`)).text();
  } catch (e) {
    if (String(e?.message).includes("404")) {
      const s = await dt();
      return await (await m(`${w}/files/${s.fileId}?alt=media`)).text();
    }
    throw e;
  }
}
async function pt(t) {
  if (h()) return W(t);
  const e = v();
  if (!e) throw new Error("unlinked");
  await m(
    `${et}/files/${e.fileId}?uploadType=media&fields=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: t
    }
  );
}
function lt(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return e.format === "paca-sync" && Array.isArray(e.projects) && Array.isArray(e.tasks);
}
const J = (t) => {
  const e = Date.parse(t ?? "");
  return Number.isNaN(e) ? 0 : e;
}, N = (t, e) => J(t.updatedAt) >= J(e.updatedAt) ? { ...e, ...t } : { ...t, ...e };
function ft(t, e) {
  if (!t) return e;
  if (!e) return t;
  const s = /* @__PURE__ */ new Map();
  for (const r of e.projects) s.set(r.syncId, r);
  for (const r of t.projects) {
    const i = s.get(r.syncId);
    s.set(r.syncId, i ? N(r, i) : r);
  }
  const n = /* @__PURE__ */ new Map();
  for (const r of e.tasks) n.set(r.syncId, r);
  for (const r of t.tasks) {
    const i = n.get(r.syncId);
    n.set(r.syncId, i ? N(r, i) : r);
  }
  return {
    // Keep top-level keys Paca does not use (e.g. timeEntries from the offline apps).
    ...e,
    ...t,
    ...yt(t, e),
    format: "paca-sync",
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sync: {
      rev: Math.max(t.sync?.rev ?? 0, e.sync?.rev ?? 0),
      updatedBy: t.sync?.updatedBy ?? "paca",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    projects: Array.from(s.values()),
    tasks: Array.from(n.values())
  };
}
function yt(t, e) {
  const s = t.timeEntries, n = e.timeEntries;
  if (!s && !n) return {};
  const r = /* @__PURE__ */ new Map();
  for (const i of n ?? []) r.set(i.id, i);
  for (const i of s ?? []) {
    const a = r.get(i.id);
    r.set(i.id, a ? N(i, a) : i);
  }
  return { timeEntries: Array.from(r.values()) };
}
function $(t) {
  return JSON.stringify([t.name ?? "", t.description ?? ""]);
}
function M(t) {
  return JSON.stringify([
    t.title ?? "",
    t.description ?? null,
    t.importance ?? 0,
    t.tags ?? []
  ]);
}
const mt = "/api/v1", y = "pacaSyncId", I = "pacaSyncSeen", j = "pacaSyncUpdatedAt";
class gt extends Error {
}
async function g(t, e) {
  const s = await fetch(`${mt}${t}`, {
    ...e,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...e?.body ? { "Content-Type": "application/json" } : {},
      ...e?.headers ?? {}
    }
  });
  if (s.status === 401) throw new gt("unauthorized");
  if (!s.ok) {
    let r = "";
    try {
      const i = await s.json();
      r = i?.error ? `: ${i.error}` : "";
    } catch {
    }
    throw new Error(`HTTP ${s.status}${r}`);
  }
  if (s.status === 204) return;
  const n = await s.json();
  return n?.data ?? n;
}
async function wt() {
  const t = [];
  let e = 1;
  for (; ; ) {
    const s = await g(
      `/projects?page=${e}&page_size=100`
    ), n = s.items ?? [];
    t.push(...n);
    const r = typeof s.total == "number" ? s.total : t.length;
    if (n.length === 0 || t.length >= r || e > 50) break;
    e += 1;
  }
  return t;
}
async function ht(t) {
  const e = [];
  let s = null;
  for (; ; ) {
    const n = new URLSearchParams({ page_size: "200" });
    s && n.set("cursor", s);
    const r = await g(
      `/projects/${t}/tasks?${n.toString()}`
    );
    if (e.push(...r.items ?? []), s = r.next_cursor ?? null, !s) break;
  }
  return e;
}
function U() {
  return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (t) => {
    const e = Math.random() * 16 | 0;
    return (t === "x" ? e : e & 3 | 8).toString(16);
  });
}
async function St(t) {
  const e = await wt(), s = [];
  for (let o = 0; o < e.length; o += 1)
    s.push(...await ht(e[o].id));
  const n = [], r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = (/* @__PURE__ */ new Date()).toISOString();
  for (const o of e) {
    const d = { ...o.settings ?? {} }, u = $({
      name: o.name,
      description: o.description ?? "",
      createdAt: o.created_at,
      updatedAt: o.created_at
    });
    let l = !1, f = typeof d[y] == "string" ? d[y] : "";
    f || (f = U(), d[y] = f, l = !0);
    const S = typeof d[I] == "string" ? d[I] : null;
    let E;
    S === null ? (d[I] = u, d[j] = o.created_at, E = o.created_at, l = !0) : S !== u ? (d[I] = u, d[j] = a, E = a, l = !0) : E = typeof d[j] == "string" ? d[j] : o.created_at, l && await g(`/projects/${o.id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings: d })
    }), i.set(o.id, f), r.set(f, o), n.push({
      syncId: f,
      name: o.name,
      description: o.description ?? "",
      createdAt: o.created_at,
      updatedAt: E
    });
  }
  const c = [], p = /* @__PURE__ */ new Map();
  for (const o of s) {
    const d = { ...o.custom_fields ?? {} };
    let u = typeof d[y] == "string" ? d[y] : "";
    if (!u) {
      u = U();
      const l = await g(
        `/projects/${o.project_id}/tasks/${o.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            custom_fields: { ...d, [y]: u }
          })
        }
      );
      l?.updated_at && (o.updated_at = l.updated_at);
    }
    p.set(u, o), c.push({
      syncId: u,
      projectSyncId: i.get(o.project_id) ?? "",
      title: o.title,
      description: o.description ?? null,
      importance: o.importance ?? 0,
      tags: o.tags ?? [],
      createdAt: o.created_at,
      updatedAt: o.updated_at ?? o.created_at
    });
  }
  return { projects: e, tasks: s, projectRecords: n, taskRecords: c, projectBySync: r, taskBySync: p };
}
function It(t, e) {
  return {
    format: "paca-sync",
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sync: {
      rev: e,
      updatedBy: "paca-web",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    projects: t.projectRecords,
    tasks: t.taskRecords
  };
}
async function jt(t, e) {
  const s = {
    createdProjects: 0,
    createdTasks: 0,
    updatedProjects: 0,
    updatedTasks: 0
  }, n = /* @__PURE__ */ new Map();
  for (const a of e.projectRecords)
    n.set(a.syncId, a);
  const r = /* @__PURE__ */ new Map();
  for (const a of e.taskRecords)
    r.set(a.syncId, a);
  const i = /* @__PURE__ */ new Map();
  for (const a of t.projects) {
    const c = e.projectBySync.get(a.syncId);
    if (!c && a.deleted) continue;
    if (!c) {
      const d = await g("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: a.name,
          description: a.description ?? "",
          task_id_prefix: kt(a.name, a.syncId),
          settings: {
            [y]: a.syncId,
            [I]: $(a),
            [j]: a.updatedAt
          }
        })
      });
      i.set(a.syncId, d.id), s.createdProjects += 1;
      continue;
    }
    i.set(a.syncId, c.id);
    const p = n.get(a.syncId);
    if (!p || $(p) === $(a) || Date.parse(a.updatedAt) <= Date.parse(p.updatedAt)) continue;
    const o = { ...c.settings ?? {} };
    o[y] = a.syncId, o[I] = $(a), o[j] = a.updatedAt, await g(`/projects/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: a.name,
        description: a.description ?? "",
        settings: o
      })
    }), s.updatedProjects += 1;
  }
  for (const a of t.tasks) {
    const c = e.taskBySync.get(a.syncId);
    if (!c && a.deleted) continue;
    if (!c) {
      const d = i.get(a.projectSyncId);
      if (!d) continue;
      await g(`/projects/${d}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: a.title,
          description: a.description ?? void 0,
          importance: a.importance ?? 0,
          tags: a.tags ?? [],
          custom_fields: { [y]: a.syncId }
        })
      }), s.createdTasks += 1;
      continue;
    }
    const p = r.get(a.syncId);
    if (!p || M(p) === M(a) || Date.parse(a.updatedAt) <= Date.parse(p.updatedAt)) continue;
    const o = { ...c.custom_fields ?? {} };
    await g(`/projects/${c.project_id}/tasks/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: a.title,
        description: a.description ?? void 0,
        importance: a.importance ?? 0,
        tags: a.tags ?? [],
        custom_fields: { ...o, [y]: a.syncId }
      })
    }), s.updatedTasks += 1;
  }
  return s;
}
function kt(t, e) {
  const s = (t || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), n = (e || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ((s.length >= 2 ? s.slice(0, 4) : "P") + n.slice(-4)).slice(0, 10) || "PACA";
}
function B(t) {
  if (!t) return "";
  const e = [...t.projects].sort((n, r) => n.syncId.localeCompare(r.syncId)).map((n) => [n.syncId, n.name, n.description, n.updatedAt]), s = [...t.tasks].sort((n, r) => n.syncId.localeCompare(r.syncId)).map((n) => [
    n.syncId,
    n.projectSyncId,
    n.title,
    JSON.stringify(n.description ?? null),
    n.importance,
    JSON.stringify(n.tags ?? []),
    n.updatedAt
  ]);
  return JSON.stringify([e, s]);
}
function At(t) {
  if (!t || !t.trim()) return null;
  try {
    const e = JSON.parse(t);
    return lt(e) ? e : null;
  } catch {
    return null;
  }
}
let A = null;
function $t(t = {}) {
  return A || (A = (async () => {
    const e = () => Date.now();
    try {
      if (!v())
        return {
          outcome: "NOT_LINKED",
          message: "هنوز به گوگل درایو یا گیت‌هاب وصل نشده.",
          at: e()
        };
      if (!D())
        return {
          outcome: "NEEDS_PERMISSION",
          message: "برای همگام‌سازی، دسترسی گوگل را دوباره تأیید کنید.",
          at: e()
        };
      t.onPhase?.("در حال خواندن فایل همگام‌سازی…");
      const s = await ut(), n = At(s);
      t.onPhase?.("در حال خواندن داده‌های پاکا…");
      const r = await St(), i = It(r, n?.sync?.rev ?? 0), a = ft(i, n) ?? i, c = await jt(a, r), p = B(n), o = B(a), d = c.createdProjects + c.createdTasks + c.updatedProjects + c.updatedTasks;
      if (p !== o || !n) {
        t.onPhase?.("در حال نوشتن فایل همگام‌سازی…");
        const f = Math.max(n?.sync?.rev ?? 0, 0) + 1, S = {
          ...a,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sync: {
            rev: f,
            updatedBy: tt() === "github" ? "paca-github" : "paca-web",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        await pt(JSON.stringify(S, null, 2));
      }
      const u = (f) => String(f).replace(/\d/g, (S) => "۰۱۲۳۴۵۶۷۸۹"[Number(S)]), l = [];
      return c.createdProjects && l.push(`${u(c.createdProjects)} پروژهٔ جدید`), c.createdTasks && l.push(`${u(c.createdTasks)} کار جدید`), c.updatedProjects && l.push(`${u(c.updatedProjects)} پروژهٔ به‌روزشده`), c.updatedTasks && l.push(`${u(c.updatedTasks)} کار به‌روزشده`), d > 0 ? {
        outcome: "MERGED",
        message: `همگام‌سازی انجام شد؛ ${l.join("، ")}.`,
        at: e(),
        created: c.createdProjects + c.createdTasks,
        updated: c.updatedProjects + c.updatedTasks
      } : n ? p !== o ? {
        outcome: "PUSHED",
        message: "تغییرات پاکا ذخیره شد.",
        at: e()
      } : { outcome: "UP_TO_DATE", message: "همه‌چیز به‌روز است.", at: e() } : {
        outcome: "PUSHED",
        message: "فایل همگام‌سازی ساخته شد و داده‌های پاکا در آن ذخیره شد.",
        at: e()
      };
    } catch (s) {
      const n = s?.message ?? String(s);
      return n === "auth" ? {
        outcome: "NEEDS_PERMISSION",
        message: "دسترسی گوگل منقضی شده؛ دوباره وارد شوید.",
        at: e()
      } : n === "unlinked" ? {
        outcome: "NOT_LINKED",
        message: "اتصال همگام‌سازی قطع است.",
        at: e()
      } : {
        outcome: "FAILED",
        message: `خطا در همگام‌سازی: ${n}`,
        at: e()
      };
    }
  })(), A.finally(() => {
    A = null;
  }));
}
let L = 0;
async function T(t = !1) {
  if (!(!v() || !ot() || !D()) && !location.pathname.includes("/plugin-pages/com.karnameh.drive-sync") && !(!t && Date.now() - L < 2e4)) {
    L = Date.now();
    try {
      const e = await $t();
      ct(e), e.outcome === "MERGED" && (document.dispatchEvent(new Event("visibilitychange")), window.dispatchEvent(new CustomEvent("paca-sync-merged", { detail: e })));
    } catch {
    }
  }
}
setTimeout(() => void T(!0), 6e3);
setInterval(() => void T(), 6e4);
document.addEventListener("visibilitychange", () => {
  document.visibilityState === "visible" && T();
});
window.addEventListener("online", () => void T(!0));
