import { importShared } from './__federation_fn_import-CnoyXxDr.js';
import { j as jsxRuntimeExports } from './jsx-runtime-XI9uIe3W.js';
import { c as createLucideIcon, T, $, u as useTimeLogViewer, a as useTimeLogViewerAll, P as PAGE_SIZES, b as PLUGIN_ID, C as Clock, p as presetLabel, f as formatMinutes, d as formatDate, e as Trash2, t as todayDateString, i as isoDaysAgo, g as isoFirstOfMonth, h as parseDurationToMinutes, j as canManageTimeLog } from './shared-CTpTqwss.js';

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$4 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
const Check = createLucideIcon("check", __iconNode$4);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$3 = [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]];
const ChevronLeft = createLucideIcon("chevron-left", __iconNode$3);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$2 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
const ChevronRight = createLucideIcon("chevron-right", __iconNode$2);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$1 = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
];
const Pencil = createLucideIcon("pencil", __iconNode$1);

/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
const X = createLucideIcon("x", __iconNode);

const {keepPreviousData,useMutation,useQueries,useQuery,useQueryClient} = await importShared('@tanstack/react-query');
const {useMemo,useState} = await importShared('react');
function TimeTrackingPage({ scope }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(T, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TimeTrackingPageInner, { scope }) });
}
function TimeTrackingPageInner({ scope }) {
  const isProject = scope.kind === "project";
  const projectId = scope.kind === "project" ? scope.projectId : void 0;
  const api = useMemo(
    () => new $({
      baseUrl: `${window.location.origin}/api/v1`,
      projectId: projectId ?? "",
      fetch: (url, init) => window.fetch(url, { ...init, credentials: "include" })
    }),
    [projectId]
  );
  const qc = useQueryClient();
  const projectViewer = useTimeLogViewer(api, projectId ?? "", isProject);
  const adminViewer = useTimeLogViewerAll(api, !isProject);
  const [memberFilter, setMemberFilterState] = useState("");
  const [projectFilter, setProjectFilterState] = useState("");
  const [userFilter, setUserFilterState] = useState("");
  const [dateFrom, setDateFromState] = useState("");
  const [dateTo, setDateToState] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const setMemberFilter = (id) => {
    setMemberFilterState(id);
    setPage(1);
  };
  const setProjectFilter = (id) => {
    setProjectFilterState(id);
    setPage(1);
  };
  const setUserFilter = (id) => {
    setUserFilterState(id);
    setPage(1);
  };
  const setDateFrom = (v) => {
    setDateFromState(v);
    setPage(1);
  };
  const setDateTo = (v) => {
    setDateToState(v);
    setPage(1);
  };
  const applyPreset = (preset) => {
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    if (preset === "today") {
      const t = todayDateString();
      setDateFrom(t);
      setDateTo(t);
      return;
    }
    if (preset === "week") {
      setDateFrom(isoDaysAgo(6));
      setDateTo(todayDateString());
      return;
    }
    setDateFrom(isoFirstOfMonth());
    setDateTo(todayDateString());
  };
  const clearFilters = () => {
    setMemberFilterState("");
    setProjectFilterState("");
    setUserFilterState("");
    setDateFromState("");
    setDateToState("");
    setPage(1);
  };
  const hasActiveFilters = isProject ? memberFilter !== "" || dateFrom !== "" || dateTo !== "" : projectFilter !== "" || userFilter !== "" || dateFrom !== "" || dateTo !== "";
  const summaryAllPath = useMemo(() => {
    const params = new URLSearchParams();
    if (userFilter) params.set("user_id", userFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return `/time-logs/summary-all${qs ? `?${qs}` : ""}`;
  }, [userFilter, dateFrom, dateTo]);
  const { data: totals = [] } = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "time-logs-summary-all", userFilter, dateFrom, dateTo],
    queryFn: () => api.pluginGet(PLUGIN_ID, summaryAllPath),
    placeholderData: keepPreviousData,
    enabled: !isProject
  });
  const usersAllPath = useMemo(() => {
    const params = new URLSearchParams();
    if (projectFilter) params.set("project_id", projectFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return `/time-logs/users-all${qs ? `?${qs}` : ""}`;
  }, [projectFilter, dateFrom, dateTo]);
  const { data: userTotals = [] } = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "time-logs-users-all", projectFilter, dateFrom, dateTo],
    queryFn: () => api.pluginGet(PLUGIN_ID, usersAllPath),
    placeholderData: keepPreviousData,
    enabled: !isProject
  });
  const [memberSearch, setMemberSearch] = useState("");
  const { data: memberOptionsPage } = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "core", "members", projectId ?? "", memberSearch],
    queryFn: () => api.listMembers({ search: memberSearch, pageSize: 50 }),
    enabled: isProject,
    placeholderData: keepPreviousData
  });
  const memberOptions = memberOptionsPage?.items ?? [];
  const logsPath = useMemo(() => {
    const params = new URLSearchParams();
    if (isProject) {
      if (memberFilter) params.set("member_id", memberFilter);
    } else {
      if (projectFilter) params.set("project_id", projectFilter);
      if (userFilter) params.set("user_id", userFilter);
    }
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    return isProject ? `/projects/${projectId}/time-logs?${params.toString()}` : `/time-logs/all?${params.toString()}`;
  }, [isProject, projectId, memberFilter, projectFilter, userFilter, dateFrom, dateTo, page, pageSize]);
  const { data: logPage, isLoading } = useQuery({
    queryKey: [
      "plugin",
      PLUGIN_ID,
      "time-logs-list",
      isProject ? projectId : "all",
      memberFilter,
      projectFilter,
      userFilter,
      dateFrom,
      dateTo,
      page,
      pageSize
    ],
    queryFn: () => api.pluginGet(PLUGIN_ID, logsPath),
    placeholderData: keepPreviousData
  });
  const logMemberIds = useMemo(
    () => isProject ? [...new Set((logPage?.logs ?? []).map((l) => l.member_id))].sort() : [],
    [isProject, logPage]
  );
  const { data: logMembersPage } = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "core", "members-by-id", projectId ?? "", logMemberIds.join(",")],
    queryFn: () => api.listMembers({ ids: logMemberIds, pageSize: 100 }),
    enabled: isProject && logMemberIds.length > 0,
    placeholderData: keepPreviousData
  });
  const memberNames = useMemo(
    () => new Map((logMembersPage?.items ?? []).map((m) => [m.id, m.full_name || m.username])),
    [logMembersPage]
  );
  const memberName = (memberId) => memberNames.get(memberId) ?? memberId;
  const logTaskIds = useMemo(
    () => isProject ? [...new Set((logPage?.logs ?? []).map((l) => l.task_id))].sort() : [],
    [isProject, logPage]
  );
  const taskQueries = useQueries({
    queries: logTaskIds.map((taskId) => ({
      queryKey: ["plugin", PLUGIN_ID, "core", "task", projectId ?? "", taskId],
      queryFn: () => api.getTask(taskId),
      staleTime: 6e4
    }))
  });
  const taskTitles = useMemo(
    () => new Map(logTaskIds.map((id, i) => [id, taskQueries[i]?.data?.title])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logTaskIds, taskQueries.map((q) => q.data?.title).join("\0")]
  );
  const taskTitle = (taskId) => taskTitles.get(taskId) ?? taskId;
  const rows = useMemo(() => {
    const logs = logPage?.logs ?? [];
    if (isProject) {
      return logs.map((l) => ({
        id: l.id,
        taskId: l.task_id,
        memberId: l.member_id,
        memberLabel: memberName(l.member_id),
        taskLabel: taskTitle(l.task_id),
        spentDate: l.spent_date,
        minutesSpent: l.minutes_spent,
        note: l.note
      }));
    }
    return logs.map((l) => ({
      id: l.id,
      taskId: l.task_id,
      memberId: l.member_id,
      memberLabel: l.member_name || l.member_id,
      taskLabel: l.task_title || l.task_id,
      projectLabel: l.project_name,
      spentDate: l.spent_date,
      minutesSpent: l.minutes_spent,
      note: l.note
    }));
  }, [logPage, isProject, memberNames, taskTitles]);
  const total = logPage?.total ?? 0;
  const totalMinutes = logPage?.total_minutes ?? 0;
  const currentPage = logPage?.page ?? page;
  const currentPageSize = logPage?.page_size ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));
  const pageStart = total === 0 ? 0 : (currentPage - 1) * currentPageSize;
  const goPrev = () => setPage(Math.max(1, currentPage - 1));
  const goNext = () => setPage(Math.min(totalPages, currentPage + 1));
  const handlePageSizeChange = (n) => {
    setPageSize(n);
    setPage(1);
  };
  const invalidateLogs = () => {
    qc.invalidateQueries({ queryKey: ["plugin", PLUGIN_ID, "time-logs-list", isProject ? projectId : "all"] });
    if (isProject) {
      qc.invalidateQueries({ queryKey: ["plugin", PLUGIN_ID, "time-logs-summary", projectId] });
    } else {
      qc.invalidateQueries({ queryKey: ["plugin", PLUGIN_ID, "time-logs-summary-all"] });
      qc.invalidateQueries({ queryKey: ["plugin", PLUGIN_ID, "time-logs-users-all"] });
    }
  };
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState(null);
  const mutationPath = (kind, taskId, logId) => isProject ? `/projects/${projectId}/tasks/${taskId}/time-logs/${logId}` : `/time-logs/all/${logId}`;
  const updateLog = useMutation({
    mutationFn: (vars) => api.pluginPatch(PLUGIN_ID, mutationPath("patch", vars.taskId, vars.logId), {
      spent_date: vars.spent_date,
      minutes_spent: vars.minutes_spent,
      note: vars.note
    }),
    onSuccess: () => {
      invalidateLogs();
      setEditingId(null);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(err instanceof Error ? err.message : "Failed to update time log.");
    }
  });
  const [deleteError, setDeleteError] = useState(null);
  const deleteLog = useMutation({
    mutationFn: (vars) => api.pluginDelete(PLUGIN_ID, mutationPath("delete", vars.taskId, vars.logId)),
    onSuccess: () => {
      invalidateLogs();
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete time log.");
    }
  });
  const canManageRow = (row) => isProject ? canManageTimeLog(projectViewer, row.memberId) : !!adminViewer?.can_manage_all;
  const startEdit = (row) => {
    setEditingId(row.id);
    setEditDate(row.spentDate.split("T")[0]);
    setEditDuration(formatMinutes(row.minutesSpent));
    setEditNote(row.note);
    setEditError(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };
  const saveEdit = (row) => {
    const minutes = parseDurationToMinutes(editDuration);
    if (!minutes || minutes <= 0) {
      setEditError('Enter a duration like "1h30m", "45m", or "90" (minutes).');
      return;
    }
    if (!editDate) {
      setEditError("Pick a date.");
      return;
    }
    updateLog.mutate({
      taskId: row.taskId,
      logId: row.id,
      spent_date: editDate,
      minutes_spent: minutes,
      note: editNote
    });
  };
  const title = isProject ? "Time Tracking" : "Time Tracking — All Projects";
  const description = isProject ? "Track, filter, and manage logged time for this project." : "Browse and filter logged time across every project.";
  const emptyText = isProject ? "No time logs recorded for this project yet" : "No time logged in any project yet";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 p-6 max-w-5xl w-full mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-5 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: title })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "All logged time entries" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-linear-to-r from-border/40 to-transparent" })
      ] }),
      (hasActiveFilters || total > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-3 rounded-xl border border-border/25 bg-card/30 p-3", children: [
        isProject ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "label",
            {
              htmlFor: "time-tracking-member-filter",
              className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground/60",
              children: "Member"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "search",
              value: memberSearch,
              onChange: (e) => setMemberSearch(e.target.value),
              placeholder: "Search members",
              "aria-label": "Search members",
              className: "min-w-36 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              id: "time-tracking-member-filter",
              value: memberFilter,
              onChange: (e) => setMemberFilter(e.target.value),
              className: "min-w-36 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All members" }),
                memberFilter && !memberOptions.some((m) => m.id === memberFilter) && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: memberFilter, children: memberName(memberFilter) }),
                memberOptions.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: m.id, children: m.full_name || m.username }, m.id))
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "label",
              {
                htmlFor: "time-tracking-project-filter",
                className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground/60",
                children: "Project"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                id: "time-tracking-project-filter",
                value: projectFilter,
                onChange: (e) => setProjectFilter(e.target.value),
                className: "min-w-36 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All projects" }),
                  totals.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t.project_id, children: t.project_name }, t.project_id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "label",
              {
                htmlFor: "time-tracking-user-filter",
                className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground/60",
                children: "User"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                id: "time-tracking-user-filter",
                value: userFilter,
                onChange: (e) => setUserFilter(e.target.value),
                className: "min-w-36 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All users" }),
                  userTotals.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: u.user_id, children: u.user_name || u.user_id }, u.user_id))
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "label",
            {
              htmlFor: "time-tracking-date-from",
              className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground/60",
              children: "From"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: "time-tracking-date-from",
              type: "date",
              value: dateFrom,
              onChange: (e) => setDateFrom(e.target.value),
              className: "rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "label",
            {
              htmlFor: "time-tracking-date-to",
              className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground/60",
              children: "To"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: "time-tracking-date-to",
              type: "date",
              value: dateTo,
              onChange: (e) => setDateTo(e.target.value),
              className: "rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-0.5", children: ["today", "week", "month", "all"].map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => applyPreset(preset),
            className: "rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-muted/40 hover:text-foreground",
            children: presetLabel(preset)
          },
          preset
        )) }),
        hasActiveFilters && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: clearFilters,
            className: "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground/60 transition-colors hover:text-destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3" }),
              "Clear filters"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto text-xs text-muted-foreground/60", children: [
          total,
          " ",
          total === 1 ? "entry" : "entries",
          " · ",
          formatMinutes(totalMinutes)
        ] })
      ] }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !hasActiveFilters && total === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyRow, { text: emptyText }) : total === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 px-1 py-8 text-center text-muted-foreground/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-5 opacity-60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm italic", children: "No entries match your filters." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: clearFilters,
            className: "text-xs font-semibold text-primary hover:underline",
            children: "Clear filters"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-card/40 text-muted-foreground/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-semibold", children: "Date" }),
            !isProject && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-semibold", children: "Project" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-semibold", children: isProject ? "Member" : "User" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-semibold", children: "Task" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-semibold", children: "Note" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-semibold", children: "Duration" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "w-16 px-3 py-2 text-right font-semibold", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Actions" }) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row) => {
            const isDeleting = deleteLog.isPending && deleteLog.variables?.logId === row.id;
            if (editingId === row.id) {
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/10 bg-muted/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "date",
                    value: editDate,
                    onChange: (e) => setEditDate(e.target.value),
                    className: "w-full rounded-md bg-muted/40 px-2 py-1 text-xs"
                  }
                ) }),
                !isProject && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-40 truncate px-3 py-2 text-muted-foreground/70", children: row.projectLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 truncate text-muted-foreground/70", children: row.memberLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-48 truncate px-3 py-2 text-muted-foreground/70", children: row.taskLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: editNote,
                    onChange: (e) => setEditNote(e.target.value),
                    onKeyDown: (e) => {
                      if (e.key === "Enter") saveEdit(row);
                      if (e.key === "Escape") cancelEdit();
                    },
                    placeholder: "Note",
                    className: "w-full rounded-md bg-muted/40 px-2 py-1 text-xs"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: editDuration,
                    onChange: (e) => setEditDuration(e.target.value),
                    onKeyDown: (e) => {
                      if (e.key === "Enter") saveEdit(row);
                      if (e.key === "Escape") cancelEdit();
                    },
                    placeholder: "1h30m",
                    className: "w-20 rounded-md bg-muted/40 px-2 py-1 text-right text-xs"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => saveEdit(row),
                      disabled: updateLog.isPending,
                      "aria-label": "Save",
                      className: "text-muted-foreground/60 hover:text-primary disabled:opacity-40",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: cancelEdit,
                      "aria-label": "Cancel",
                      className: "text-muted-foreground/60 hover:text-destructive",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
                    }
                  )
                ] }) })
              ] }, row.id);
            }
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 whitespace-nowrap", children: formatDate(row.spentDate) }),
              !isProject && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-40 truncate px-3 py-2", children: row.projectLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 truncate", children: row.memberLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-48 truncate px-3 py-2", children: row.taskLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "td",
                {
                  className: "max-w-64 truncate px-3 py-2 text-muted-foreground/70",
                  title: row.note || void 0,
                  children: row.note || "—"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right font-semibold whitespace-nowrap", children: formatMinutes(row.minutesSpent) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: canManageRow(row) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => startEdit(row),
                    "aria-label": "Edit time log",
                    className: "text-muted-foreground/50 hover:text-foreground",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => deleteLog.mutate({ taskId: row.taskId, logId: row.id }),
                    disabled: isDeleting,
                    "aria-label": "Delete time log",
                    className: "text-muted-foreground/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
                  }
                )
              ] }) })
            ] }, row.id);
          }) })
        ] }) }) }),
        editError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: editError }),
        deleteError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: deleteError }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground/70", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Rows per page" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: pageSize,
                onChange: (e) => handlePageSizeChange(Number(e.target.value)),
                className: "rounded-lg bg-muted/40 px-2 py-1 text-xs",
                children: PAGE_SIZES.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: n, children: n }, n))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              pageStart + 1,
              "–",
              Math.min(pageStart + currentPageSize, total),
              " of ",
              total
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: goPrev,
                  disabled: currentPage <= 1,
                  "aria-label": "Previous page",
                  className: "rounded-md p-1 hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-3.5" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-14 text-center", children: [
                "Page ",
                currentPage,
                " / ",
                totalPages
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: goNext,
                  disabled: currentPage >= totalPages,
                  "aria-label": "Next page",
                  className: "rounded-md p-1 hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3.5" })
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function EmptyRow({ text }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-1 py-3 text-muted-foreground/45", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-4 opacity-70" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm italic", children: text })
  ] });
}
function TableSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-pulse divide-y divide-border/10", children: Array.from({ length: 5 }).map((_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 bg-card/20" }, i)
  )) }) });
}

export { TimeTrackingPage as T };
