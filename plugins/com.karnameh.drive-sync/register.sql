INSERT INTO plugins (name, version, manifest, enabled)
VALUES ('com.karnameh.drive-sync', '0.1.0', $kf${"id":"com.karnameh.drive-sync","displayName":"همگام‌سازی با گوگل درایو","description":"همگام‌سازی پروژه‌ها و کارهای پاکا با فایل Paca/paca-sync.json در گوگل درایو تا چند نسخهٔ پاکا داده‌ها را بین هم جابجا کنند.","version":"0.1.0","minCoreVersion":"0.21.0","frontend":{"remoteEntryUrl":"/plugins/com.karnameh.drive-sync/assets/remoteEntry.js","extensionPoints":[{"point":"app.page","component":"DriveSyncPage","label":"همگام‌سازی با گوگل درایو","order":20},{"point":"sidebar.general.section","component":"DriveSyncSidebarLink","label":"همگام‌سازی با گوگل درایو","order":20}],"navItems":[{"scope":"app","slug":"sync","label":"همگام‌سازی با گوگل درایو","component":"DriveSyncPage","order":20,"requiredPermission":"projects:read"}]}}$kf$, true)
ON CONFLICT (name) DO UPDATE
SET version = EXCLUDED.version,
    manifest = EXCLUDED.manifest,
    enabled = EXCLUDED.enabled,
    updated_at = now();
