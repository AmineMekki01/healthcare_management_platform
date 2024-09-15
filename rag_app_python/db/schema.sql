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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    appointment_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    appointment_start timestamp without time zone NOT NULL,
    appointment_end timestamp without time zone NOT NULL,
    title character varying(50) NOT NULL,
    doctor_id uuid,
    patient_id uuid
);


--
-- Name: availabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availabilities (
    availability_id integer NOT NULL,
    availability_start timestamp without time zone NOT NULL,
    availability_end timestamp without time zone NOT NULL,
    doctor_id uuid
);


--
-- Name: availabilities_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.availabilities_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: availabilities_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.availabilities_availability_id_seq OWNED BY public.availabilities.availability_id;


--
-- Name: chatbot_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_chats (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    agent_role character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chatbot_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_files (
    id uuid NOT NULL,
    chat_id uuid NOT NULL,
    user_id uuid NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size character varying(255) NOT NULL,
    file_type character varying(255) NOT NULL,
);


--
-- Name: chatbot_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_messages (
    id uuid NOT NULL,
    chat_id uuid NOT NULL,
    user_id character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    agent_role character varying(255) NOT NULL,
    user_message text NOT NULL,
    answer text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: doctor_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_info (
    doctor_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    age integer NOT NULL,
    sex character varying(50) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    salt character varying(50) NOT NULL,
    specialty character varying(50) NOT NULL,
    experience character varying(50) NOT NULL,
    rating_score numeric,
    rating_count integer NOT NULL,
    create_at timestamp without time zone DEFAULT now() NOT NULL,
    update_at timestamp without time zone DEFAULT now() NOT NULL,
    medical_license character varying(50) NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    doctor_bio character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(255) NOT NULL,
    street_address character varying(255) NOT NULL,
    city_name character varying(255) NOT NULL,
    state_name character varying(255) NOT NULL,
    zip_code character varying(255) NOT NULL,
    country_name character varying(255) NOT NULL,
    birth_date date NOT NULL,
    location character varying(255) NOT NULL
);


--
-- Name: folder_file_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.folder_file_info (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    type character varying(50) NOT NULL,
    size integer NOT NULL,
    extension character varying(50),
    path character varying(255),
    user_id uuid NOT NULL,
    user_type character varying(50) NOT NULL,
    parent_id uuid
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chat_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chat_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: patient_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_info (
    patient_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    age integer NOT NULL,
    sex character varying(50) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    salt character varying(50) NOT NULL,
    create_at timestamp without time zone DEFAULT now() NOT NULL,
    update_at timestamp without time zone DEFAULT now() NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    patient_bio text NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(50) NOT NULL,
    street_address character varying(255) NOT NULL,
    city_name character varying(255) NOT NULL,
    state_name character varying(255) NOT NULL,
    zip_code character varying(255) NOT NULL,
    country_name character varying(255) NOT NULL,
    birth_date date NOT NULL,
    location character varying(255) NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: shared_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_items (
    folder_id integer NOT NULL,
    shared_by_id character varying(255) NOT NULL,
    shared_with_id character varying(255) NOT NULL,
    shared_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    item_id uuid
);


--
-- Name: shared_items_folder_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shared_items_folder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shared_items_folder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shared_items_folder_id_seq OWNED BY public.shared_items.folder_id;


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    type character varying(255) NOT NULL
);


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_tokens_id_seq OWNED BY public.verification_tokens.id;


--
-- Name: availabilities availability_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availabilities ALTER COLUMN availability_id SET DEFAULT nextval('public.availabilities_availability_id_seq'::regclass);


--
-- Name: shared_items folder_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_items ALTER COLUMN folder_id SET DEFAULT nextval('public.shared_items_folder_id_seq'::regclass);


--
-- Name: verification_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.verification_tokens_id_seq'::regclass);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- Name: availabilities availabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT availabilities_pkey PRIMARY KEY (availability_id);


--
-- Name: chatbot_chats chatbot_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_chats
    ADD CONSTRAINT chatbot_chats_pkey PRIMARY KEY (id);


--
-- Name: chatbot_files chatbot_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_files
    ADD CONSTRAINT chatbot_files_pkey PRIMARY KEY (id);


--
-- Name: chatbot_messages chatbot_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_messages
    ADD CONSTRAINT chatbot_messages_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: doctor_info doctor_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_info
    ADD CONSTRAINT doctor_info_pkey PRIMARY KEY (doctor_id);


--
-- Name: folder_file_info folder_file_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folder_file_info
    ADD CONSTRAINT folder_file_info_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: patient_info patient_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_info
    ADD CONSTRAINT patient_info_pkey PRIMARY KEY (patient_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: shared_items shared_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_items
    ADD CONSTRAINT shared_items_pkey PRIMARY KEY (folder_id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: chatbot_files chatbot_files_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_files
    ADD CONSTRAINT chatbot_files_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: chatbot_files chatbot_files_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_files
    ADD CONSTRAINT chatbot_files_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: folder_file_info folder_file_info_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folder_file_info
    ADD CONSTRAINT folder_file_info_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folder_file_info(id);


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20231102175542');
