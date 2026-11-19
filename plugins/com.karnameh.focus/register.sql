INSERT INTO plugins (name, version, manifest, enabled)
VALUES ('com.karnameh.focus', '0.1.0', $kf${"id":"com.karnameh.focus","displayName":"تمرکز و زمان","description":"تایمر تمرکز آزاد و پومودورو با ثبت زمان روی کارهای پاکا.","version":"0.1.0","minCoreVersion":"0.21.0","frontend":{"remoteEntryUrl":"/plugins/com.karnameh.focus/assets/remoteEntry.js","extensionPoints":[{"point":"app.page","component":"FocusPage","label":"تمرکز و زمان","order":10},{"point":"sidebar.general.section","component":"FocusSidebarLink","label":"تمرکز و زمان","order":10},{"point":"task.detail.section","component":"TaskFocusLauncher","label":"تمرکز و زمان","order":15}],"navItems":[{"scope":"app","slug":"focus","label":"تمرکز و زمان","component":"FocusPage","order":10,"requiredPermission":"projects:read"}]}}$kf$, true)
ON CONFLICT (name) DO UPDATE
SET version = EXCLUDED.version,
    manifest = EXCLUDED.manifest,
    enabled = EXCLUDED.enabled,
    updated_at = now();
