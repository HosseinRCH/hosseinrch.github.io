INSERT INTO plugins (name, version, manifest, enabled)
VALUES ('com.karnameh.focus', '0.1.2', $kf${"id":"com.karnameh.focus","displayName":"تمرکز و زمان","description":"تایمر تمرکز آزاد و پومودورو با ثبت زمان روی کارهای پاکا.","version":"0.1.2","minCoreVersion":"0.21.0","frontend":{"remoteEntryUrl":"/plugins/com.karnameh.focus/assets/remoteEntry.js","extensionPoints":[{"point":"app.page","component":"FocusPage","label":"تمرکز و زمان","order":10},{"point":"sidebar.general.section","component":"FocusSidebarLink","label":"تمرکز و زمان","order":10},{"point":"task.detail.section","component":"TaskFocusLauncher","label":"تمرکز و زمان","order":15}],"navItems":[{"scope":"app","slug":"focus","label":"تمرکز و زمان","component":"FocusPage","order":10,"requiredPermission":"projects:read"}]}}$kf$, true)
ON CONFLICT (name) DO UPDATE
SET version = EXCLUDED.version,
    manifest = EXCLUDED.manifest,
    enabled = EXCLUDED.enabled,
    updated_at = now();

-- Article fields (Karnameh): every project gets «تعداد کلمات», «قیمت هر کلمه»
-- and «مبلغ» (number custom fields); «مبلغ» = words × price per word, kept
-- by a trigger whenever a task's fields change. Each project is given the
-- fields once, so a field the user deletes stays deleted.
CREATE TABLE IF NOT EXISTS karnameh_article_fields_done (project_id UUID PRIMARY KEY);

CREATE OR REPLACE FUNCTION karnameh_add_article_fields(p UUID) RETURNS void LANGUAGE plpgsql AS $kf$
BEGIN
  IF EXISTS (SELECT 1 FROM karnameh_article_fields_done WHERE project_id = p) THEN RETURN; END IF;
  INSERT INTO custom_field_definitions (project_id, field_key, display_name, field_type)
  VALUES (p, 'word_count', 'تعداد کلمات', 'number'),
         (p, 'price_per_word', 'قیمت هر کلمه', 'number'),
         (p, 'amount', 'مبلغ', 'number')
  ON CONFLICT (project_id, field_key) DO NOTHING;
  INSERT INTO karnameh_article_fields_done (project_id) VALUES (p) ON CONFLICT DO NOTHING;
END $kf$;

CREATE OR REPLACE FUNCTION karnameh_project_article_fields() RETURNS trigger LANGUAGE plpgsql AS $kf$
BEGIN
  PERFORM karnameh_add_article_fields(NEW.id);
  RETURN NEW;
END $kf$;
DROP TRIGGER IF EXISTS karnameh_project_article_fields ON projects;
CREATE TRIGGER karnameh_project_article_fields AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION karnameh_project_article_fields();

SELECT karnameh_add_article_fields(id) FROM projects;

CREATE OR REPLACE FUNCTION karnameh_num(v JSONB) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $kf$
BEGIN
  IF v IS NULL THEN RETURN NULL; END IF;
  IF jsonb_typeof(v) = 'number' THEN RETURN (v #>> '{}')::numeric; END IF;
  IF jsonb_typeof(v) = 'string' AND (v #>> '{}') ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$' THEN RETURN trim(v #>> '{}')::numeric; END IF;
  RETURN NULL;
END $kf$;

CREATE OR REPLACE FUNCTION karnameh_task_amount() RETURNS trigger LANGUAGE plpgsql AS $kf$
DECLARE w NUMERIC; r NUMERIC;
BEGIN
  w := karnameh_num(NEW.custom_fields -> 'word_count');
  r := karnameh_num(NEW.custom_fields -> 'price_per_word');
  IF w IS NOT NULL AND r IS NOT NULL THEN
    NEW.custom_fields := COALESCE(NEW.custom_fields, '{}'::jsonb) || jsonb_build_object('amount', round(w * r));
  END IF;
  RETURN NEW;
END $kf$;
DROP TRIGGER IF EXISTS karnameh_task_amount ON tasks;
CREATE TRIGGER karnameh_task_amount BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION karnameh_task_amount();

-- Total logged time (Karnameh): every project gets a number field
-- «زمان ثبت‌شده (دقیقه)» (key total_minutes) that always equals the sum of the
-- task's time logs (Time Logging plugin). Kept by a trigger on task_time_logs;
-- the table only exists once that plugin's migrations ran, so it is guarded.
CREATE TABLE IF NOT EXISTS karnameh_time_field_done (project_id UUID PRIMARY KEY);

CREATE OR REPLACE FUNCTION karnameh_add_time_field(p UUID) RETURNS void LANGUAGE plpgsql AS $kf$
BEGIN
  IF EXISTS (SELECT 1 FROM karnameh_time_field_done WHERE project_id = p) THEN RETURN; END IF;
  INSERT INTO custom_field_definitions (project_id, field_key, display_name, field_type)
  VALUES (p, 'total_minutes', 'زمان ثبت‌شده (دقیقه)', 'number')
  ON CONFLICT (project_id, field_key) DO NOTHING;
  INSERT INTO karnameh_time_field_done (project_id) VALUES (p) ON CONFLICT DO NOTHING;
END $kf$;

CREATE OR REPLACE FUNCTION karnameh_project_time_field() RETURNS trigger LANGUAGE plpgsql AS $kf$
BEGIN
  PERFORM karnameh_add_time_field(NEW.id);
  RETURN NEW;
END $kf$;
DROP TRIGGER IF EXISTS karnameh_project_time_field ON projects;
CREATE TRIGGER karnameh_project_time_field AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION karnameh_project_time_field();

SELECT karnameh_add_time_field(id) FROM projects;

CREATE OR REPLACE FUNCTION karnameh_set_task_total(t UUID) RETURNS void LANGUAGE plpgsql AS $kf$
DECLARE total NUMERIC;
BEGIN
  SELECT COALESCE(sum(minutes_spent), 0) INTO total FROM task_time_logs WHERE task_id = t;
  UPDATE tasks
     SET custom_fields = COALESCE(custom_fields, '{}'::jsonb) || jsonb_build_object('total_minutes', total)
   WHERE id = t
     AND karnameh_num(custom_fields -> 'total_minutes') IS DISTINCT FROM total;
END $kf$;

CREATE OR REPLACE FUNCTION karnameh_time_log_total() RETURNS trigger LANGUAGE plpgsql AS $kf$
BEGIN
  IF TG_OP <> 'INSERT' THEN PERFORM karnameh_set_task_total(OLD.task_id); END IF;
  IF TG_OP <> 'DELETE' AND (TG_OP = 'INSERT' OR NEW.task_id IS DISTINCT FROM OLD.task_id OR NEW.minutes_spent IS DISTINCT FROM OLD.minutes_spent) THEN
    PERFORM karnameh_set_task_total(NEW.task_id);
  END IF;
  RETURN NULL;
END $kf$;

CREATE OR REPLACE FUNCTION karnameh_install_time_total() RETURNS void LANGUAGE plpgsql AS $kf$
BEGIN
  IF to_regclass('task_time_logs') IS NULL THEN RETURN; END IF;
  DROP TRIGGER IF EXISTS karnameh_time_log_total ON task_time_logs;
  CREATE TRIGGER karnameh_time_log_total AFTER INSERT OR UPDATE OR DELETE ON task_time_logs
    FOR EACH ROW EXECUTE FUNCTION karnameh_time_log_total();
  PERFORM karnameh_set_task_total(id) FROM tasks
   WHERE id IN (SELECT DISTINCT task_id FROM task_time_logs)
      OR custom_fields ? 'total_minutes';
END $kf$;

-- The Time Logging plugin may create task_time_logs after this file ran
-- (first boot); install the trigger the moment that table appears.
CREATE OR REPLACE FUNCTION karnameh_on_ddl() RETURNS event_trigger LANGUAGE plpgsql AS $kf$
BEGIN
  IF to_regclass('task_time_logs') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'karnameh_time_log_total'
  ) THEN
    PERFORM karnameh_install_time_total();
  END IF;
END $kf$;
DO $kf$
BEGIN
  DROP EVENT TRIGGER IF EXISTS karnameh_on_ddl;
  CREATE EVENT TRIGGER karnameh_on_ddl ON ddl_command_end WHEN TAG IN ('CREATE TABLE')
    EXECUTE FUNCTION karnameh_on_ddl();
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'karnameh: event trigger unavailable: %', SQLERRM;
END $kf$;

SELECT karnameh_install_time_total();
