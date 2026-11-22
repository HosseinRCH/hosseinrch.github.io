INSERT INTO plugins (name, version, manifest, enabled)
VALUES ('com.karnameh.focus', '0.1.0', $kf${"id":"com.karnameh.focus","displayName":"تمرکز و زمان","description":"تایمر تمرکز آزاد و پومودورو با ثبت زمان روی کارهای پاکا.","version":"0.1.0","minCoreVersion":"0.21.0","frontend":{"remoteEntryUrl":"/plugins/com.karnameh.focus/assets/remoteEntry.js","extensionPoints":[{"point":"app.page","component":"FocusPage","label":"تمرکز و زمان","order":10},{"point":"sidebar.general.section","component":"FocusSidebarLink","label":"تمرکز و زمان","order":10},{"point":"task.detail.section","component":"TaskFocusLauncher","label":"تمرکز و زمان","order":15}],"navItems":[{"scope":"app","slug":"focus","label":"تمرکز و زمان","component":"FocusPage","order":10,"requiredPermission":"projects:read"}]}}$kf$, true)
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
