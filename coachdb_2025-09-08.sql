--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: api_key_status; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.api_key_status AS ENUM (
    'active',
    'quota_exceeded',
    'error',
    'disabled'
);


ALTER TYPE public.api_key_status OWNER TO rahman;

--
-- Name: batch_status; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.batch_status AS ENUM (
    'active',
    'inactive',
    'completed'
);


ALTER TYPE public.batch_status OWNER TO rahman;

--
-- Name: class_level; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.class_level AS ENUM (
    '9-10',
    '11-12'
);


ALTER TYPE public.class_level OWNER TO rahman;

--
-- Name: note_type; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.note_type AS ENUM (
    'pdf',
    'google_drive',
    'link',
    'text'
);


ALTER TYPE public.note_type OWNER TO rahman;

--
-- Name: paper; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.paper AS ENUM (
    '১ম পত্র',
    '২য় পত্র'
);


ALTER TYPE public.paper OWNER TO rahman;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE public.payment_status OWNER TO rahman;

--
-- Name: question_bank_category; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.question_bank_category AS ENUM (
    'board_questions',
    'test_paper',
    'ndc_admission',
    'holy_cross_admission',
    'board_book_questions',
    'general_university',
    'engineering_university',
    'medical_university'
);


ALTER TYPE public.question_bank_category OWNER TO rahman;

--
-- Name: resource_type; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.resource_type AS ENUM (
    'pdf',
    'google_drive',
    'link',
    'text'
);


ALTER TYPE public.resource_type OWNER TO rahman;

--
-- Name: sms_type; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.sms_type AS ENUM (
    'attendance',
    'exam_result',
    'exam_notification',
    'notice',
    'reminder'
);


ALTER TYPE public.sms_type OWNER TO rahman;

--
-- Name: subject; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.subject AS ENUM (
    'chemistry',
    'ict'
);


ALTER TYPE public.subject OWNER TO rahman;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: rahman
--

CREATE TYPE public.user_role AS ENUM (
    'teacher',
    'student',
    'super_user'
);


ALTER TYPE public.user_role OWNER TO rahman;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.activity_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type character varying NOT NULL,
    message text NOT NULL,
    icon character varying,
    user_id character varying,
    related_user_id character varying,
    related_entity_id character varying,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO rahman;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.attendance (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    student_id character varying NOT NULL,
    batch_id character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    is_present boolean NOT NULL,
    subject public.subject NOT NULL,
    notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.attendance OWNER TO rahman;

--
-- Name: batches; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.batches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    subject public.subject NOT NULL,
    batch_code character varying NOT NULL,
    password character varying NOT NULL,
    max_students integer DEFAULT 50,
    current_students integer DEFAULT 0,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    class_time character varying,
    class_days text,
    schedule text,
    status public.batch_status DEFAULT 'active'::public.batch_status NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.batches OWNER TO rahman;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.courses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    title_bangla character varying NOT NULL,
    description text NOT NULL,
    subject public.subject NOT NULL,
    target_class character varying NOT NULL,
    icon_name character varying DEFAULT 'FlaskConical'::character varying NOT NULL,
    color_scheme character varying NOT NULL,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.courses OWNER TO rahman;

--
-- Name: exam_submissions; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.exam_submissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    exam_id character varying NOT NULL,
    student_id character varying NOT NULL,
    answers jsonb,
    score integer,
    manual_marks integer,
    total_marks integer,
    is_submitted boolean DEFAULT false,
    submitted_at timestamp without time zone,
    time_spent integer,
    feedback text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.exam_submissions OWNER TO rahman;

--
-- Name: exams; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.exams (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    subject public.subject NOT NULL,
    description text,
    instructions text,
    exam_date timestamp without time zone NOT NULL,
    duration integer NOT NULL,
    exam_type character varying NOT NULL,
    exam_mode character varying NOT NULL,
    batch_id character varying,
    target_students jsonb,
    question_source character varying NOT NULL,
    question_content text,
    total_marks integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.exams OWNER TO rahman;

--
-- Name: grading_schemes; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.grading_schemes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    grade_ranges jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.grading_schemes OWNER TO rahman;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    from_user_id character varying NOT NULL,
    to_user_id character varying NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO rahman;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    description text,
    note_type public.note_type NOT NULL,
    file_url text,
    subject public.subject NOT NULL,
    tags text,
    student_id character varying NOT NULL,
    batch_id character varying NOT NULL,
    is_public boolean DEFAULT true,
    view_count integer DEFAULT 0,
    likes integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notes OWNER TO rahman;

--
-- Name: notices; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.notices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    content text NOT NULL,
    created_by character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notices OWNER TO rahman;

--
-- Name: praggo_ai_keys; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.praggo_ai_keys (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key_name character varying NOT NULL,
    key_value text NOT NULL,
    key_index integer NOT NULL,
    status public.api_key_status DEFAULT 'active'::public.api_key_status NOT NULL,
    daily_usage_count integer DEFAULT 0,
    last_used timestamp without time zone,
    last_error text,
    quota_reset_date timestamp without time zone,
    is_enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.praggo_ai_keys OWNER TO rahman;

--
-- Name: praggo_ai_usage; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.praggo_ai_usage (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    user_role public.user_role NOT NULL,
    request_type character varying NOT NULL,
    key_used character varying NOT NULL,
    subject public.subject NOT NULL,
    prompt_length integer,
    response_length integer,
    success boolean DEFAULT false NOT NULL,
    error_message text,
    processing_time integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.praggo_ai_usage OWNER TO rahman;

--
-- Name: question_bank; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.question_bank (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    teacher_id character varying NOT NULL,
    subject character varying NOT NULL,
    category character varying NOT NULL,
    sub_category character varying NOT NULL,
    chapter character varying NOT NULL,
    question_text text NOT NULL,
    question_type character varying NOT NULL,
    options jsonb,
    correct_answer character varying,
    question_image text,
    drive_link text,
    difficulty character varying DEFAULT 'medium'::character varying NOT NULL,
    marks integer DEFAULT 1 NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.question_bank OWNER TO rahman;

--
-- Name: question_bank_categories; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.question_bank_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    class_level public.class_level NOT NULL,
    subject public.subject NOT NULL,
    paper public.paper,
    category public.question_bank_category NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.question_bank_categories OWNER TO rahman;

--
-- Name: question_bank_items; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.question_bank_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    category_id character varying NOT NULL,
    title character varying NOT NULL,
    chapter character varying NOT NULL,
    description text,
    resource_type public.resource_type NOT NULL,
    resource_url text,
    content text,
    file_size character varying,
    download_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    "order" integer DEFAULT 0,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.question_bank_items OWNER TO rahman;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.questions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    exam_id character varying NOT NULL,
    question_text text NOT NULL,
    question_type character varying NOT NULL,
    options jsonb,
    correct_answer character varying,
    question_image text,
    drive_link text,
    marks integer DEFAULT 1 NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.questions OWNER TO rahman;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO rahman;

--
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.sms_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    recipient_type character varying NOT NULL,
    recipient_phone character varying NOT NULL,
    recipient_name character varying,
    student_id character varying,
    sms_type public.sms_type NOT NULL,
    subject character varying,
    message text NOT NULL,
    status character varying DEFAULT 'sent'::character varying NOT NULL,
    credits integer DEFAULT 1,
    cost_paisa integer DEFAULT 39,
    sent_by character varying NOT NULL,
    sent_at timestamp without time zone DEFAULT now(),
    delivered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sms_logs OWNER TO rahman;

--
-- Name: sms_transactions; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.sms_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    package_name character varying NOT NULL,
    sms_count integer NOT NULL,
    price integer NOT NULL,
    payment_method character varying NOT NULL,
    transaction_id character varying,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    phone_number character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sms_transactions OWNER TO rahman;

--
-- Name: teacher_profiles; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.teacher_profiles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    display_name character varying NOT NULL,
    education text,
    current_position text,
    specialization text,
    motto text,
    bio text,
    avatar_url text,
    contact_email character varying,
    contact_phone character varying,
    social_links jsonb,
    years_of_experience integer,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teacher_profiles OWNER TO rahman;

--
-- Name: users; Type: TABLE; Schema: public; Owner: rahman
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username character varying,
    password character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    email character varying,
    sms_credits integer DEFAULT 0,
    student_id character varying,
    phone_number character varying,
    parent_phone_number character varying,
    student_password character varying,
    address text,
    date_of_birth timestamp without time zone,
    gender character varying,
    institution character varying,
    class_level character varying,
    batch_id character varying,
    admission_date timestamp without time zone,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO rahman;

--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.activity_logs (id, type, message, icon, user_id, related_user_id, related_entity_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.attendance (id, student_id, batch_id, date, is_present, subject, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.batches (id, name, subject, batch_code, password, max_students, current_students, start_date, end_date, class_time, class_days, schedule, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.courses (id, title, title_bangla, description, subject, target_class, icon_name, color_scheme, is_active, display_order, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: exam_submissions; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.exam_submissions (id, exam_id, student_id, answers, score, manual_marks, total_marks, is_submitted, submitted_at, time_spent, feedback, created_at) FROM stdin;
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.exams (id, title, subject, description, instructions, exam_date, duration, exam_type, exam_mode, batch_id, target_students, question_source, question_content, total_marks, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: grading_schemes; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.grading_schemes (id, name, description, grade_ranges, is_active, is_default, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.messages (id, from_user_id, to_user_id, content, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.notes (id, title, description, note_type, file_url, subject, tags, student_id, batch_id, is_public, view_count, likes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.notices (id, title, content, created_by, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: praggo_ai_keys; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.praggo_ai_keys (id, key_name, key_value, key_index, status, daily_usage_count, last_used, last_error, quota_reset_date, is_enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: praggo_ai_usage; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.praggo_ai_usage (id, user_id, user_role, request_type, key_used, subject, prompt_length, response_length, success, error_message, processing_time, created_at) FROM stdin;
\.


--
-- Data for Name: question_bank; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.question_bank (id, teacher_id, subject, category, sub_category, chapter, question_text, question_type, options, correct_answer, question_image, drive_link, difficulty, marks, is_public, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: question_bank_categories; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.question_bank_categories (id, name, class_level, subject, paper, category, description, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: question_bank_items; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.question_bank_items (id, category_id, title, chapter, description, resource_type, resource_url, content, file_size, download_count, is_active, "order", created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.questions (id, exam_id, question_text, question_type, options, correct_answer, question_image, drive_link, marks, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: sms_logs; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.sms_logs (id, recipient_type, recipient_phone, recipient_name, student_id, sms_type, subject, message, status, credits, cost_paisa, sent_by, sent_at, delivered_at, created_at) FROM stdin;
\.


--
-- Data for Name: sms_transactions; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.sms_transactions (id, user_id, package_name, sms_count, price, payment_method, transaction_id, payment_status, phone_number, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teacher_profiles; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.teacher_profiles (id, user_id, display_name, education, current_position, specialization, motto, bio, avatar_url, contact_email, contact_phone, social_links, years_of_experience, is_public, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: rahman
--

COPY public.users (id, username, password, first_name, last_name, profile_image_url, role, email, sms_credits, student_id, phone_number, parent_phone_number, student_password, address, date_of_birth, gender, institution, class_level, batch_id, admission_date, is_active, last_login, created_at, updated_at) FROM stdin;
\.


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: batches batches_batch_code_unique; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_batch_code_unique UNIQUE (batch_code);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: exam_submissions exam_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: grading_schemes grading_schemes_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.grading_schemes
    ADD CONSTRAINT grading_schemes_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: praggo_ai_keys praggo_ai_keys_key_index_unique; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.praggo_ai_keys
    ADD CONSTRAINT praggo_ai_keys_key_index_unique UNIQUE (key_index);


--
-- Name: praggo_ai_keys praggo_ai_keys_key_name_unique; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.praggo_ai_keys
    ADD CONSTRAINT praggo_ai_keys_key_name_unique UNIQUE (key_name);


--
-- Name: praggo_ai_keys praggo_ai_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.praggo_ai_keys
    ADD CONSTRAINT praggo_ai_keys_pkey PRIMARY KEY (id);


--
-- Name: praggo_ai_usage praggo_ai_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.praggo_ai_usage
    ADD CONSTRAINT praggo_ai_usage_pkey PRIMARY KEY (id);


--
-- Name: question_bank_categories question_bank_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.question_bank_categories
    ADD CONSTRAINT question_bank_categories_pkey PRIMARY KEY (id);


--
-- Name: question_bank_items question_bank_items_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.question_bank_items
    ADD CONSTRAINT question_bank_items_pkey PRIMARY KEY (id);


--
-- Name: question_bank question_bank_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: sms_logs sms_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_pkey PRIMARY KEY (id);


--
-- Name: sms_transactions sms_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.sms_transactions
    ADD CONSTRAINT sms_transactions_pkey PRIMARY KEY (id);


--
-- Name: teacher_profiles teacher_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_pkey PRIMARY KEY (id);


--
-- Name: teacher_profiles teacher_profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_user_id_unique UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: rahman
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: activity_logs activity_logs_related_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_related_user_id_users_id_fk FOREIGN KEY (related_user_id) REFERENCES public.users(id);


--
-- Name: activity_logs activity_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: attendance attendance_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: attendance attendance_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: attendance attendance_student_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_users_id_fk FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: courses courses_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: exam_submissions exam_submissions_exam_id_exams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_exam_id_exams_id_fk FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: exam_submissions exam_submissions_student_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_student_id_users_id_fk FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: exams exams_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: exams exams_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: messages messages_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: messages messages_to_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_to_user_id_users_id_fk FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: notes notes_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: notes notes_student_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_student_id_users_id_fk FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: notices notices_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: praggo_ai_usage praggo_ai_usage_key_used_praggo_ai_keys_key_name_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.praggo_ai_usage
    ADD CONSTRAINT praggo_ai_usage_key_used_praggo_ai_keys_key_name_fk FOREIGN KEY (key_used) REFERENCES public.praggo_ai_keys(key_name);


--
-- Name: praggo_ai_usage praggo_ai_usage_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.praggo_ai_usage
    ADD CONSTRAINT praggo_ai_usage_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: question_bank_items question_bank_items_category_id_question_bank_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.question_bank_items
    ADD CONSTRAINT question_bank_items_category_id_question_bank_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.question_bank_categories(id) ON DELETE CASCADE;


--
-- Name: question_bank question_bank_teacher_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_teacher_id_users_id_fk FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_exam_id_exams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_exam_id_exams_id_fk FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: sms_logs sms_logs_sent_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_sent_by_users_id_fk FOREIGN KEY (sent_by) REFERENCES public.users(id);


--
-- Name: sms_logs sms_logs_student_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_student_id_users_id_fk FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: sms_transactions sms_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.sms_transactions
    ADD CONSTRAINT sms_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: teacher_profiles teacher_profiles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: rahman
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

