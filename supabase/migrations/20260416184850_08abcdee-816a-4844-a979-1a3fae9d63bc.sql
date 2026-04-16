
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE public.priority_level AS ENUM ('low', 'normal', 'medium', 'high');
CREATE TYPE public.homework_state AS ENUM ('open', 'in_progress', 'done', 'submitted');
CREATE TYPE public.todo_state AS ENUM ('open', 'in_progress', 'done');
CREATE TYPE public.absence_type AS ENUM ('sick', 'excused', 'unexcused', 'late', 'other');
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group', 'course');
CREATE TYPE public.week_type AS ENUM ('all', 'a', 'b');
CREATE TYPE public.substitution_type AS ENUM ('cancelled', 'replacement', 'room_change', 'note');
CREATE TYPE public.event_scope AS ENUM ('school', 'grade', 'course', 'custom');
CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- ============================================================
-- TIMESTAMP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- SCHOOLS (tenant root)
-- ============================================================
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  avatar_url TEXT,
  color_hex TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profiles_school ON public.profiles(school_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);

-- ============================================================
-- SECURITY DEFINER HELPERS (avoid RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin');
$$;

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  color_hex TEXT NOT NULL DEFAULT '#6366f1',
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  grade_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_courses_school ON public.courses(school_id);

CREATE TABLE public.course_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_course_members_user ON public.course_members(user_id);

CREATE OR REPLACE FUNCTION public.is_course_member(_course_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.course_id = _course_id AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_course_teacher(_course_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = c.teacher_id
    WHERE c.id = _course_id AND p.user_id = auth.uid()
  );
$$;

-- ============================================================
-- TIMETABLE
-- ============================================================
CREATE TABLE public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  week_type public.week_type NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_timetable_school ON public.timetable_entries(school_id);
CREATE INDEX idx_timetable_course ON public.timetable_entries(course_id);

CREATE TABLE public.timetable_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id UUID NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type public.substitution_type NOT NULL,
  note TEXT,
  replacement_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  new_room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.timetable_substitutions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  priority public.priority_level NOT NULL DEFAULT 'normal',
  pinned BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_announcements_school ON public.announcements(school_id);
CREATE INDEX idx_announcements_course ON public.announcements(course_id);

-- ============================================================
-- HOMEWORK
-- ============================================================
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date DATE,
  priority public.priority_level NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_homework_course ON public.homework(course_id);

CREATE TABLE public.homework_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.homework_state NOT NULL DEFAULT 'open',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(homework_id, student_id)
);
ALTER TABLE public.homework_status ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRADES
-- ============================================================
CREATE TABLE public.grade_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grade_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  value NUMERIC NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_grades_student ON public.grades(student_id);
CREATE INDEX idx_grades_course ON public.grades(course_id);

-- ============================================================
-- ABSENCES
-- ============================================================
CREATE TABLE public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  periods INTEGER[] NOT NULL DEFAULT '{}',
  type public.absence_type NOT NULL DEFAULT 'sick',
  reason TEXT,
  excused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_absences_student ON public.absences(student_id);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  target_scope public.event_scope NOT NULL DEFAULT 'school',
  target_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TODOS
-- ============================================================
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority public.priority_level NOT NULL DEFAULT 'normal',
  status public.todo_state NOT NULL DEFAULT 'open',
  due_date DATE,
  linked_homework_id UUID REFERENCES public.homework(id) ON DELETE SET NULL,
  linked_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type public.conversation_type NOT NULL DEFAULT 'direct',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_conv_members_user ON public.conversation_members(user_id);

CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.conversation_id = _conv_id AND p.user_id = auth.uid()
  );
$$;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body_encrypted TEXT NOT NULL,
  iv TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_conv ON public.messages(conversation_id);

-- ============================================================
-- FILES
-- ============================================================
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  encrypted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLLS
-- ============================================================
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  anonymous BOOLEAN NOT NULL DEFAULT false,
  multi_choice BOOLEAN NOT NULL DEFAULT false,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REPORTS, AUDIT, PARENT-CHILD, NOTIFICATIONS
-- ============================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  diff_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.parent_child (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);
ALTER TABLE public.parent_child ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TIMESTAMP TRIGGERS
-- ============================================================
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_homework_updated BEFORE UPDATE ON public.homework FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_grades_updated BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_todos_updated BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (school by email domain)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _domain TEXT;
  _school_id UUID;
  _full_name TEXT;
BEGIN
  _domain := lower(split_part(NEW.email, '@', 2));
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  SELECT id INTO _school_id FROM public.schools WHERE domain = _domain LIMIT 1;
  IF _school_id IS NULL THEN
    SELECT id INTO _school_id FROM public.schools WHERE domain = 'demo.eduspace.app' LIMIT 1;
    IF _school_id IS NULL THEN
      INSERT INTO public.schools (name, domain) VALUES ('Demo School', 'demo.eduspace.app') RETURNING id INTO _school_id;
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, school_id, role, full_name, email, color_hex)
  VALUES (NEW.id, _school_id, 'student', _full_name, NEW.email,
    '#' || lpad(to_hex(((hashtext(NEW.id::text) & x'00FFFFFF'::int))), 6, '0'));

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- SCHOOLS
CREATE POLICY "members read own school" ON public.schools FOR SELECT USING (id = public.get_my_school_id());
CREATE POLICY "admin updates own school" ON public.schools FOR UPDATE USING (id = public.get_my_school_id() AND public.is_school_admin());

-- PROFILES
CREATE POLICY "read profiles in my school" ON public.profiles FOR SELECT USING (school_id = public.get_my_school_id());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "admin updates profiles in school" ON public.profiles FOR UPDATE USING (school_id = public.get_my_school_id() AND public.is_school_admin());
CREATE POLICY "admin inserts profiles" ON public.profiles FOR INSERT WITH CHECK (school_id = public.get_my_school_id() AND public.is_school_admin());

-- COURSES
CREATE POLICY "read courses in my school" ON public.courses FOR SELECT USING (school_id = public.get_my_school_id());
CREATE POLICY "teachers/admins manage courses" ON public.courses FOR ALL
  USING (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'))
  WITH CHECK (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'));

-- COURSE MEMBERS
CREATE POLICY "read course members in my school" ON public.course_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.school_id = public.get_my_school_id()));
CREATE POLICY "teachers/admins manage course members" ON public.course_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.school_id = public.get_my_school_id()) AND (public.is_school_admin() OR public.get_my_role() = 'teacher'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.school_id = public.get_my_school_id()) AND (public.is_school_admin() OR public.get_my_role() = 'teacher'));

-- TIMETABLE
CREATE POLICY "read timetable in my school" ON public.timetable_entries FOR SELECT USING (school_id = public.get_my_school_id());
CREATE POLICY "teachers/admins manage timetable" ON public.timetable_entries FOR ALL
  USING (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'))
  WITH CHECK (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'));

CREATE POLICY "read substitutions in my school" ON public.timetable_substitutions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.timetable_entries t WHERE t.id = timetable_entry_id AND t.school_id = public.get_my_school_id()));
CREATE POLICY "teachers/admins manage substitutions" ON public.timetable_substitutions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.timetable_entries t WHERE t.id = timetable_entry_id AND t.school_id = public.get_my_school_id()) AND (public.is_school_admin() OR public.get_my_role() = 'teacher'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.timetable_entries t WHERE t.id = timetable_entry_id AND t.school_id = public.get_my_school_id()) AND (public.is_school_admin() OR public.get_my_role() = 'teacher'));

-- ANNOUNCEMENTS
CREATE POLICY "read announcements in my school" ON public.announcements FOR SELECT USING (school_id = public.get_my_school_id());
CREATE POLICY "teachers/admins create announcements" ON public.announcements FOR INSERT
  WITH CHECK (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher') AND author_id = public.get_my_profile_id());
CREATE POLICY "authors update announcements" ON public.announcements FOR UPDATE USING (author_id = public.get_my_profile_id() OR public.is_school_admin());
CREATE POLICY "authors delete announcements" ON public.announcements FOR DELETE USING (author_id = public.get_my_profile_id() OR public.is_school_admin());

-- HOMEWORK
CREATE POLICY "read homework in my school" ON public.homework FOR SELECT USING (school_id = public.get_my_school_id());
CREATE POLICY "teachers create homework" ON public.homework FOR INSERT
  WITH CHECK (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher') AND author_id = public.get_my_profile_id());
CREATE POLICY "teachers update homework" ON public.homework FOR UPDATE USING (author_id = public.get_my_profile_id() OR public.is_school_admin());
CREATE POLICY "teachers delete homework" ON public.homework FOR DELETE USING (author_id = public.get_my_profile_id() OR public.is_school_admin());

-- HOMEWORK STATUS
CREATE POLICY "read own homework status" ON public.homework_status FOR SELECT
  USING (student_id = public.get_my_profile_id() OR EXISTS (SELECT 1 FROM public.homework h WHERE h.id = homework_id AND public.is_course_teacher(h.course_id)));
CREATE POLICY "students upsert own status" ON public.homework_status FOR INSERT WITH CHECK (student_id = public.get_my_profile_id());
CREATE POLICY "students update own status" ON public.homework_status FOR UPDATE USING (student_id = public.get_my_profile_id());

-- GRADES
CREATE POLICY "read grades scoped" ON public.grades FOR SELECT
  USING (
    student_id = public.get_my_profile_id()
    OR public.is_school_admin()
    OR public.is_course_teacher(course_id)
    OR EXISTS (SELECT 1 FROM public.parent_child pc WHERE pc.student_id = grades.student_id AND pc.parent_id = public.get_my_profile_id() AND pc.approved)
  );
CREATE POLICY "teachers manage grades" ON public.grades FOR ALL
  USING (public.is_course_teacher(course_id) OR public.is_school_admin())
  WITH CHECK (public.is_course_teacher(course_id) OR public.is_school_admin());

CREATE POLICY "read grade categories" ON public.grade_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.school_id = public.get_my_school_id()));
CREATE POLICY "teachers manage grade categories" ON public.grade_categories FOR ALL
  USING (public.is_course_teacher(course_id) OR public.is_school_admin())
  WITH CHECK (public.is_course_teacher(course_id) OR public.is_school_admin());

-- ABSENCES
CREATE POLICY "read absences scoped" ON public.absences FOR SELECT
  USING (
    student_id = public.get_my_profile_id()
    OR public.is_school_admin()
    OR public.get_my_role() = 'teacher'
    OR EXISTS (SELECT 1 FROM public.parent_child pc WHERE pc.student_id = absences.student_id AND pc.parent_id = public.get_my_profile_id() AND pc.approved)
  );
CREATE POLICY "teachers manage absences" ON public.absences FOR ALL
  USING (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'))
  WITH CHECK (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'));

-- EVENTS
CREATE POLICY "read events in school" ON public.events FOR SELECT USING (school_id = public.get_my_school_id());
CREATE POLICY "teachers/admins manage events" ON public.events FOR ALL
  USING (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'))
  WITH CHECK (school_id = public.get_my_school_id() AND (public.is_school_admin() OR public.get_my_role() = 'teacher'));

-- TODOS
CREATE POLICY "manage own todos" ON public.todos FOR ALL USING (user_id = public.get_my_profile_id()) WITH CHECK (user_id = public.get_my_profile_id());

-- CONVERSATIONS / MESSAGES
CREATE POLICY "read conversations I belong to" ON public.conversations FOR SELECT
  USING (school_id = public.get_my_school_id() AND public.is_conversation_member(id));
CREATE POLICY "create conversation in school" ON public.conversations FOR INSERT WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "read members of my conversations" ON public.conversation_members FOR SELECT USING (public.is_conversation_member(conversation_id));
CREATE POLICY "join conversation" ON public.conversation_members FOR INSERT WITH CHECK (user_id = public.get_my_profile_id() OR public.is_conversation_member(conversation_id));
CREATE POLICY "leave conversation" ON public.conversation_members FOR DELETE USING (user_id = public.get_my_profile_id());

CREATE POLICY "read messages in my conversations" ON public.messages FOR SELECT USING (public.is_conversation_member(conversation_id));
CREATE POLICY "send messages as member" ON public.messages FOR INSERT WITH CHECK (public.is_conversation_member(conversation_id) AND sender_id = public.get_my_profile_id());

-- FILES
CREATE POLICY "read files in school" ON public.files FOR SELECT USING (school_id = public.get_my_school_id());
CREATE POLICY "upload files in school" ON public.files FOR INSERT WITH CHECK (school_id = public.get_my_school_id() AND uploader_id = public.get_my_profile_id());
CREATE POLICY "delete own files" ON public.files FOR DELETE USING (uploader_id = public.get_my_profile_id() OR public.is_school_admin());

-- POLLS
CREATE POLICY "read polls in school" ON public.polls FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.school_id = public.get_my_school_id()));
CREATE POLICY "teachers manage polls" ON public.polls FOR ALL
  USING (public.is_course_teacher(course_id) OR public.is_school_admin())
  WITH CHECK (public.is_course_teacher(course_id) OR public.is_school_admin());

CREATE POLICY "read poll votes" ON public.poll_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.polls p JOIN public.courses c ON c.id = p.course_id WHERE p.id = poll_id AND c.school_id = public.get_my_school_id()));
CREATE POLICY "vote in polls" ON public.poll_votes FOR INSERT WITH CHECK (user_id = public.get_my_profile_id());
CREATE POLICY "update own vote" ON public.poll_votes FOR UPDATE USING (user_id = public.get_my_profile_id());

-- REPORTS / AUDIT
CREATE POLICY "create reports in school" ON public.reports FOR INSERT WITH CHECK (school_id = public.get_my_school_id() AND reporter_id = public.get_my_profile_id());
CREATE POLICY "admin reads reports" ON public.reports FOR SELECT USING (school_id = public.get_my_school_id() AND public.is_school_admin());
CREATE POLICY "admin updates reports" ON public.reports FOR UPDATE USING (school_id = public.get_my_school_id() AND public.is_school_admin());

CREATE POLICY "admin reads audit" ON public.audit_log FOR SELECT USING (school_id = public.get_my_school_id() AND public.is_school_admin());

-- PARENT-CHILD
CREATE POLICY "read parent-child links" ON public.parent_child FOR SELECT
  USING (parent_id = public.get_my_profile_id() OR student_id = public.get_my_profile_id() OR public.is_school_admin());
CREATE POLICY "parents request link" ON public.parent_child FOR INSERT WITH CHECK (parent_id = public.get_my_profile_id());
CREATE POLICY "admin approves links" ON public.parent_child FOR UPDATE USING (public.is_school_admin());

-- NOTIFICATIONS
CREATE POLICY "read own notifications" ON public.notifications FOR SELECT USING (user_id = public.get_my_profile_id());
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE USING (user_id = public.get_my_profile_id());

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('eduspace-files', 'eduspace-files', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "School members read files bucket" ON storage.objects FOR SELECT
  USING (bucket_id = 'eduspace-files' AND (storage.foldername(name))[1] = public.get_my_school_id()::text);
CREATE POLICY "School members upload files bucket" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'eduspace-files' AND (storage.foldername(name))[1] = public.get_my_school_id()::text);
CREATE POLICY "Uploaders delete own files in bucket" ON storage.objects FOR DELETE
  USING (bucket_id = 'eduspace-files' AND (storage.foldername(name))[1] = public.get_my_school_id()::text AND owner = auth.uid());
