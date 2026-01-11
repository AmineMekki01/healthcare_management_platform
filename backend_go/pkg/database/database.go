package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"healthcare_backend/pkg/config"

	"github.com/jackc/pgx/v4/pgxpool"
)

func Initialize(cfg *config.Config) (*pgxpool.Pool, error) {
	sslMode := cfg.DatabaseSSLMode
	if sslMode == "" {
		if cfg.AppEnv == "production" {
			sslMode = "require"
		} else {
			sslMode = "disable"
		}
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s connect_timeout=5",
		cfg.DatabaseHost, cfg.DatabasePort, cfg.DatabaseUser, cfg.DatabasePassword, cfg.DatabaseName, sslMode)

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse config: %v", err)
	}

	if config.ConnConfig.RuntimeParams == nil {
		config.ConnConfig.RuntimeParams = map[string]string{}
	}
	config.ConnConfig.RuntimeParams["TimeZone"] = "Africa/Casablanca"

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	conn, err := pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := conn.Ping(ctx); err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	if cfg.DatabaseAutoMigrate {
		if err := createTables(conn); err != nil {
			conn.Close()
			return nil, fmt.Errorf("failed to create tables: %v", err)
		}
	}

	log.Println("Database initialized successfully")
	return conn, nil
}

func createTables(conn *pgxpool.Pool) error {
	sqlQueries := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

		`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

		`CREATE TABLE IF NOT EXISTS doctor_info (
			doctor_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			username VARCHAR(50) UNIQUE NOT NULL,
			first_name VARCHAR(50) NOT NULL,	
			first_name_ar VARCHAR(100),
			last_name VARCHAR(50) NOT NULL,
			last_name_ar VARCHAR(100),
			age INTEGER NOT NULL,
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt VARCHAR(50) NOT NULL,
			specialty_code VARCHAR(100) NOT NULL,
			experience VARCHAR(50) NOT NULL,
			rating_score NUMERIC ,
			rating_count INTEGER NOT NULL,
			medical_license VARCHAR(50) NOT NULL,
			is_verified BOOLEAN NOT NULL DEFAULT FALSE,
			bio TEXT,
			bio_ar TEXT,
			bio_fr TEXT,
			email VARCHAR(255) UNIQUE NOT NULL,
			phone_number VARCHAR(255) NOT NULL,
			clinic_phone_number VARCHAR(255) NOT NULL,
			show_clinic_phone BOOLEAN NOT NULL DEFAULT TRUE,
			street_address VARCHAR(255) NOT NULL,
			street_address_ar VARCHAR(255),
			street_address_fr VARCHAR(255),
			city_name VARCHAR(255) NOT NULL,
			city_name_ar VARCHAR(255),
			city_name_fr VARCHAR(255),
			state_name VARCHAR(255) NOT NULL,
			state_name_ar VARCHAR(255),
			state_name_fr VARCHAR(255),
			zip_code VARCHAR(255) NOT NULL,
			country_name VARCHAR(255) NOT NULL,
			country_name_ar VARCHAR(255),
			country_name_fr VARCHAR(255),
			latitude DOUBLE PRECISION,
			longitude DOUBLE PRECISION,
			birth_date DATE NOT NULL,
			location VARCHAR(255) NOT NULL,
			location_ar VARCHAR(255),
			location_fr VARCHAR(255),
			profile_photo_url VARCHAR(255) NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			deleted_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_hospitals (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			hospital_name TEXT NOT NULL,
			hospital_name_ar TEXT,
			hospital_name_fr TEXT,
			position TEXT,
			position_ar TEXT,
			position_fr TEXT,
			start_date DATE,
			end_date DATE,
			description TEXT,
			description_ar TEXT,
			description_fr TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_organizations (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			organization_name TEXT NOT NULL,
			organization_name_ar TEXT,
			organization_name_fr TEXT,
			role TEXT,
			role_ar TEXT,
			role_fr TEXT,
			start_date DATE,
			end_date DATE,
			description TEXT,
			description_ar TEXT,
			description_fr TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_awards (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			award_name TEXT NOT NULL,
			award_name_ar TEXT,
			award_name_fr TEXT,
			date_awarded DATE,
			issuing_organization TEXT,
			issuing_organization_ar TEXT,
			issuing_organization_fr TEXT,
			description TEXT,
			description_ar TEXT,
			description_fr TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_certifications (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			certification_name TEXT NOT NULL,
			certification_name_ar TEXT,
			certification_name_fr TEXT,
			issued_by TEXT,
			issued_by_ar TEXT,
			issued_by_fr TEXT,
			issue_date DATE,
			expiration_date DATE,
			description TEXT,
			description_ar TEXT,
			description_fr TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_languages (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			language_name TEXT NOT NULL,
			language_name_ar TEXT,
			language_name_fr TEXT,
			proficiency_level TEXT,
			proficiency_level_ar TEXT,
			proficiency_level_fr TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS patient_info (
			patient_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			username VARCHAR(50) UNIQUE NOT NULL,
			first_name VARCHAR(50) NOT NULL,
			first_name_ar VARCHAR(50),
			last_name VARCHAR(50) NOT NULL,
			last_name_ar VARCHAR(50),
			age INTEGER NOT NULL,
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt VARCHAR(50) NOT NULL,
			is_verified BOOLEAN NOT NULL DEFAULT FALSE,
			bio TEXT,
			bio_ar TEXT,
			email VARCHAR(255) UNIQUE NOT NULL,
			phone_number VARCHAR(50) NOT NULL,
			street_address VARCHAR(255) NOT NULL,
			street_address_ar VARCHAR(255),
			street_address_fr VARCHAR(255),
			city_name VARCHAR(255) NOT NULL,
			city_name_ar VARCHAR(255),
			city_name_fr VARCHAR(255),
			state_name VARCHAR(255) NOT NULL,
			state_name_ar VARCHAR(255),
			state_name_fr VARCHAR(255),
			zip_code VARCHAR(255) NOT NULL,
			country_name VARCHAR(255) NOT NULL,
			country_name_ar VARCHAR(255),
			country_name_fr VARCHAR(255),
			birth_date DATE NOT NULL,
			location VARCHAR(255) NOT NULL,
			location_ar VARCHAR(255),
			location_fr VARCHAR(255),
			profile_photo_url VARCHAR(255) NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			deleted_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS first_name_ar VARCHAR(50)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS last_name_ar VARCHAR(50)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS bio_ar TEXT`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS street_address_ar VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS street_address_fr VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS city_name_ar VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS city_name_fr VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS state_name_ar VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS state_name_fr VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS country_name_ar VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS country_name_fr VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS location_ar VARCHAR(255)`,
		`ALTER TABLE patient_info ADD COLUMN IF NOT EXISTS location_fr VARCHAR(255)`,

		`CREATE TABLE IF NOT EXISTS availabilities (
			availability_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id uuid NOT NULL REFERENCES doctor_info(doctor_id),
			weekday VARCHAR(10),
			availability_start TIMESTAMP WITH TIME ZONE NOT NULL,
			availability_end TIMESTAMP WITH TIME ZONE NOT NULL,
			slot_duration INTEGER
		)`,

		`CREATE TABLE IF NOT EXISTS receptionists (
			receptionist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			username VARCHAR(50) UNIQUE NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			first_name_ar VARCHAR(100),
			last_name VARCHAR(100) NOT NULL,
			last_name_ar VARCHAR(100),
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt TEXT NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			phone_number VARCHAR(20) NOT NULL,
			street_address TEXT,
			street_address_ar TEXT,
			street_address_fr TEXT,
			city_name VARCHAR(100) NOT NULL,
			city_name_ar VARCHAR(100),
			city_name_fr VARCHAR(100),
			state_name VARCHAR(100) NOT NULL,
			state_name_ar VARCHAR(100),
			state_name_fr VARCHAR(100),
			zip_code VARCHAR(20),
			country_name VARCHAR(100) NOT NULL,
			country_name_ar VARCHAR(100),
			country_name_fr VARCHAR(100),
			location TEXT,
			location_ar TEXT,
			location_fr TEXT,
			birth_date DATE,
			bio TEXT,
			bio_ar TEXT,
			profile_photo_url TEXT,
			assigned_doctor_id UUID REFERENCES doctor_info(doctor_id),
			is_active BOOLEAN NOT NULL DEFAULT true,
			deleted_at TIMESTAMP WITH TIME ZONE,
			email_verified BOOLEAN DEFAULT false,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS first_name_ar VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS last_name_ar VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS bio_ar TEXT`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS street_address_ar TEXT`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS street_address_fr TEXT`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS city_name_ar VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS city_name_fr VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS state_name_ar VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS state_name_fr VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS country_name_ar VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS country_name_fr VARCHAR(100)`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS location TEXT`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS location_ar TEXT`,
		`ALTER TABLE receptionists ADD COLUMN IF NOT EXISTS location_fr TEXT`,

		`CREATE TABLE IF NOT EXISTS appointments (
			appointment_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			appointment_start TIMESTAMP WITH TIME ZONE NOT NULL,
			appointment_end TIMESTAMP WITH TIME ZONE NOT NULL,
			title VARCHAR(50) NOT NULL,
			doctor_id uuid NOT NULL REFERENCES doctor_info(doctor_id),
			patient_id uuid REFERENCES patient_info(patient_id),
			is_doctor_patient BOOLEAN NOT NULL DEFAULT FALSE,
			canceled BOOLEAN DEFAULT FALSE,
			canceled_by VARCHAR(255),
			cancellation_reason TEXT,
			cancellation_timestamp TIMESTAMP WITH TIME ZONE,
			receptionist_id uuid REFERENCES receptionists(receptionist_id),
			appointment_type VARCHAR(50) NOT NULL DEFAULT 'consultation',
			notes TEXT,
			status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
			created_by_type VARCHAR(50) NOT NULL DEFAULT 'patient',
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			CONSTRAINT appointments_created_by_type_check CHECK (
				(
					(created_by_type)::text = ANY (
						(ARRAY['patient'::character varying, 'receptionist'::character varying, 'doctor'::character varying]
						)::text[]
					)
				)
			),
			CONSTRAINT check_appointment_times CHECK ((appointment_end > appointment_start))
		)`,

		`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)`,
		`CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_appointments_receptionist_id ON appointments(receptionist_id)`,

		`CREATE TABLE IF NOT EXISTS folder_file_info (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL,
			size INTEGER NOT NULL,
			extension VARCHAR(50),
			path VARCHAR(255),
			user_id uuid NOT NULL,
			user_type VARCHAR(50) NOT NULL,
			parent_id uuid REFERENCES folder_file_info(id),
			shared_by_id uuid,
			folder_type VARCHAR(20) DEFAULT 'PERSONAL' CHECK (folder_type IN ('PERSONAL', 'CLINICAL')),
			category VARCHAR(50) CHECK (category IN ('LAB_RESULTS', 'IMAGING_CT', 'IMAGING_XRAY', 'IMAGING_US', 'IMAGING_MAMMO', 'IMAGING_MRI', 'IMAGING_PET', 'CLINICAL_REPORT', 'DISCHARGE', 'OTHER')),
			body_part VARCHAR(50) CHECK (body_part IN ('HEAD', 'NECK', 'CHEST', 'ABDOMEN', 'PELVIS', 'SPINE', 'ARM', 'HAND', 'LEG', 'FOOT', 'BRAIN', 'HEART', 'LUNGS', 'KIDNEY', 'LIVER', 'KNEE', 'SHOULDER', 'HIP', 'ANKLE', 'WRIST', 'FULL_BODY', 'OTHER')),
			study_date TIMESTAMP WITH TIME ZONE,
			doctor_name VARCHAR(255),
			owner_user_id uuid,
			patient_id uuid REFERENCES patient_info(patient_id),
			uploaded_by_user_id uuid,
			uploaded_by_role VARCHAR(50),
			included_in_rag BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_folder_file_info_patient_id ON folder_file_info(patient_id)`,

		`CREATE TABLE IF NOT EXISTS shared_items (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			shared_by_id VARCHAR(255) NOT NULL, 
			shared_with_id VARCHAR(255) NOT NULL, 
			shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
			item_id uuid REFERENCES folder_file_info(id)
		)`,

		`CREATE TABLE IF NOT EXISTS chats (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS participants (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			chat_id uuid NOT NULL REFERENCES chats(id),
			user_id uuid NOT NULL,
			joined_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);`,

		`CREATE INDEX IF NOT EXISTS idx_participants_chat_id ON participants(chat_id)`,

		`CREATE TABLE IF NOT EXISTS messages (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			chat_id uuid NOT NULL REFERENCES chats(id),
			sender_id uuid NOT NULL,
			content TEXT,
			key TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);`,

		`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`,

		`CREATE TABLE IF NOT EXISTS verification_tokens (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			email VARCHAR(255) NOT NULL,
			token VARCHAR(255) NOT NULL,
			type VARCHAR(255) NOT NULL
		)`,

		`CREATE TABLE IF NOT EXISTS auth_sessions (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id uuid NOT NULL,
			user_type VARCHAR(50) NOT NULL,
			token_hash VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			last_used_at TIMESTAMP WITH TIME ZONE,
			expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
			revoked_at TIMESTAMP WITH TIME ZONE,
			ip_address VARCHAR(64),
			user_agent TEXT,
			CONSTRAINT auth_sessions_token_hash_unique UNIQUE (token_hash)
		)`,

		`CREATE TABLE IF NOT EXISTS followers (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			follower_id UUID NOT NULL,
			follower_type VARCHAR(50) NOT NULL CHECK (follower_type IN ('patient' , 'doctor')),
			followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			UNIQUE (doctor_id, follower_id, follower_type)
		)`,

		`CREATE TABLE IF NOT EXISTS blog_posts (
            post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            specialty VARCHAR(100) NOT NULL,
            keywords TEXT[] NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`,

		`CREATE TABLE IF NOT EXISTS comments (
			comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			post_id UUID NOT NULL REFERENCES blog_posts(post_id),
			user_id UUID NOT NULL,
			user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
			content TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS likes (
			like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			post_id UUID NOT NULL REFERENCES blog_posts(post_id),
			user_id UUID NOT NULL,
			user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
			liked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			UNIQUE (post_id, user_id, user_type)
		);`,

		`CREATE TABLE IF NOT EXISTS medical_diagnosis_history (
			diag_history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			diagnosis_name VARCHAR(50) NOT NULL,
			diagnosis_details TEXT,
			diagnosis_doctor_name VARCHAR(50) NOT NULL,
			diagnosis_doctor_id UUID,
			diagnosis_patient_id UUID,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS medical_reports (
			report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			appointment_id UUID REFERENCES appointments(appointment_id),
			doctor_id UUID REFERENCES doctor_info(doctor_id),
			patient_id UUID REFERENCES patient_info(patient_id),
			patient_first_name VARCHAR(100), 
			patient_last_name VARCHAR(100), 
			doctor_first_name VARCHAR(100), 
			doctor_last_name VARCHAR(100),
			diagnosis_made boolean,
			diagnosis_name VARCHAR(255),
			diagnosis_details TEXT,
			report_content TEXT,
			referral_needed boolean,
			referral_doctor_id UUID REFERENCES doctor_info(doctor_id),
			referral_specialty VARCHAR(255),
			referral_doctor_name VARCHAR(255),
			referral_message TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
			);
		`,

		`CREATE INDEX IF NOT EXISTS idx_medical_reports_appointment_id ON medical_reports(appointment_id)`,
		`CREATE INDEX IF NOT EXISTS idx_medical_reports_doctor_id ON medical_reports(doctor_id)`,
		`CREATE INDEX IF NOT EXISTS idx_medical_reports_patient_id ON medical_reports(patient_id)`,

		`CREATE TABLE IF NOT EXISTS public.medications(
			medication_id uuid NOT NULL DEFAULT gen_random_uuid(),
			patient_id uuid NOT NULL REFERENCES patient_info(patient_id),
			medication_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
			dosage character varying(100) COLLATE pg_catalog."default" NOT NULL,
			frequency character varying(100) COLLATE pg_catalog."default" NOT NULL,
			duration character varying(100) COLLATE pg_catalog."default" NOT NULL,
			instructions text COLLATE pg_catalog."default",
			prescribing_doctor_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
			prescribing_doctor_id uuid NOT NULL REFERENCES doctor_info(doctor_id),
			report_id uuid,
			created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
			updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT medications_pkey PRIMARY KEY (medication_id),
			CONSTRAINT medications_report_id_fkey FOREIGN KEY (report_id)
				REFERENCES public.medical_reports (report_id) MATCH SIMPLE
				ON UPDATE NO ACTION
				ON DELETE NO ACTION
		)`,

		`CREATE TABLE IF NOT EXISTS medical_referrals (
			referral_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			referring_doctor_id UUID REFERENCES doctor_info(doctor_id),
			referred_patient_id UUID REFERENCES patient_info(patient_id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`,

		`CREATE TABLE IF NOT EXISTS receptionist_experiences (
			experience_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			receptionist_id UUID NOT NULL REFERENCES receptionists(receptionist_id),
			organization_name VARCHAR(255) NOT NULL,
			position_title VARCHAR(255) NOT NULL,
			location VARCHAR(255),
			start_date DATE NOT NULL,
			end_date DATE,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE INDEX IF NOT EXISTS idx_receptionist_experiences_receptionist_id ON receptionist_experiences(receptionist_id)`,

		`CREATE TABLE IF NOT EXISTS receptionist_hiring_proposals (
			proposal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			receptionist_id UUID NOT NULL REFERENCES receptionists(receptionist_id),
			status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'rejected', 'withdrawn')),
			initial_message TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE INDEX IF NOT EXISTS idx_receptionist_hiring_proposals_receptionist_id ON receptionist_hiring_proposals(receptionist_id)`,
		`CREATE INDEX IF NOT EXISTS idx_receptionist_hiring_proposals_doctor_id ON receptionist_hiring_proposals(doctor_id)`,
		`CREATE INDEX IF NOT EXISTS idx_receptionist_hiring_proposals_status ON receptionist_hiring_proposals(status)`,

		`CREATE TABLE IF NOT EXISTS receptionist_hiring_messages (
			message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			proposal_id UUID NOT NULL REFERENCES receptionist_hiring_proposals(proposal_id),
			sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('doctor', 'receptionist')),
			sender_id UUID NOT NULL,
			message TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE INDEX IF NOT EXISTS idx_receptionist_hiring_messages_proposal_id ON receptionist_hiring_messages(proposal_id)`,

		`CREATE TABLE IF NOT EXISTS receptionist_employments (
			employment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			receptionist_id UUID NOT NULL REFERENCES receptionists(receptionist_id),
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
			ended_at TIMESTAMP WITH TIME ZONE,
			dismissed_reason TEXT,
			dismissed_by UUID,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE INDEX IF NOT EXISTS idx_receptionist_employments_receptionist_id ON receptionist_employments(receptionist_id)`,
		`CREATE INDEX IF NOT EXISTS idx_receptionist_employments_doctor_id ON receptionist_employments(doctor_id)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_receptionist_employment ON receptionist_employments(receptionist_id) WHERE ended_at IS NULL`,

		`CREATE TABLE IF NOT EXISTS diagnosis_history (
			id SERIAL PRIMARY KEY,
			appointment_id UUID NOT NULL REFERENCES appointments(appointment_id),
			diagnosis_name VARCHAR(255) NOT NULL,
			diagnosis_details TEXT,
			diagnosis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
			doctor_name VARCHAR(255) NOT NULL,
			severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
			status VARCHAR(20) CHECK (status IN ('active', 'resolved', 'chronic')),
			notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_calendar_events (
			event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			doctor_id UUID NOT NULL REFERENCES doctor_info(doctor_id),
			title VARCHAR(255) NOT NULL,
			description TEXT,
			event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('personal', 'blocked', 'recurring_block')),
			start_time TIMESTAMP WITH TIME ZONE NOT NULL,
			end_time TIMESTAMP WITH TIME ZONE NOT NULL,
			all_day BOOLEAN DEFAULT FALSE,
			blocks_appointments BOOLEAN DEFAULT FALSE,
			recurring_pattern JSONB,
			parent_event_id UUID REFERENCES doctor_calendar_events(event_id),
			color VARCHAR(7) DEFAULT '#FFB84D',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_doctor_events_doctor ON doctor_calendar_events(doctor_id)`,
		`CREATE INDEX IF NOT EXISTS idx_doctor_events_time ON doctor_calendar_events(start_time, end_time)`,
		`CREATE INDEX IF NOT EXISTS idx_doctor_events_blocking ON doctor_calendar_events(blocks_appointments)`,

		`CREATE TABLE IF NOT EXISTS public_holidays (
			holiday_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(255) NOT NULL,
			name_ar VARCHAR(255),
			name_fr VARCHAR(255),
			description TEXT,
			holiday_date DATE NOT NULL,
			duration_days INT DEFAULT 1,
			country_code VARCHAR(2),
			region VARCHAR(100),
			is_recurring BOOLEAN DEFAULT TRUE,
			affects_booking BOOLEAN DEFAULT TRUE,
			display_in_calendar BOOLEAN DEFAULT TRUE,
			institution_id UUID,
			color VARCHAR(7) DEFAULT '#FBB6CE',
			created_by UUID,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_holidays_date ON public_holidays(holiday_date)`,
		`CREATE INDEX IF NOT EXISTS idx_holidays_country ON public_holidays(country_code)`,
		`CREATE INDEX IF NOT EXISTS idx_holidays_affecting ON public_holidays(affects_booking)`,

		`CREATE TABLE IF NOT EXISTS user_health_profile (
			profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL,
			user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('doctor', 'patient', 'receptionist')),
			blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown')),
			height_cm DECIMAL(5,2),
			weight_kg DECIMAL(5,2),
			allergies TEXT[],
			chronic_conditions TEXT[],
			current_medications TEXT[],
			emergency_contact_name VARCHAR(255),
			emergency_contact_phone VARCHAR(50),
			emergency_contact_relationship VARCHAR(100),
			smoking_status VARCHAR(50) CHECK (smoking_status IN ('never', 'former', 'current', 'unknown')),
			alcohol_consumption VARCHAR(50) CHECK (alcohol_consumption IN ('none', 'occasional', 'moderate', 'heavy', 'unknown')),
			exercise_frequency VARCHAR(50) CHECK (exercise_frequency IN ('none', 'rarely', 'weekly', 'daily', 'unknown')),
			dietary_restrictions TEXT[],
			family_history TEXT,
			notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			UNIQUE(user_id, user_type)
		)`,

		`CREATE TABLE IF NOT EXISTS user_vaccinations (
			vaccination_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL,
			user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('doctor', 'patient', 'receptionist')),
			vaccine_name VARCHAR(255) NOT NULL,
			vaccine_type VARCHAR(100),
			date_administered DATE,
			next_dose_date DATE,
			administered_by VARCHAR(255),
			location VARCHAR(255),
			batch_number VARCHAR(100),
			notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_health_profile_user ON user_health_profile(user_id, user_type)`,
		`CREATE INDEX IF NOT EXISTS idx_vaccinations_user ON user_vaccinations(user_id, user_type)`,
		`CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON user_vaccinations(date_administered)`,
		`CREATE INDEX IF NOT EXISTS idx_vaccinations_next_dose ON user_vaccinations(next_dose_date)`,

		`CREATE TABLE IF NOT EXISTS file_folder_history (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			item_id UUID NOT NULL REFERENCES folder_file_info(id),
			action_type VARCHAR(50) NOT NULL,
			performed_by_id UUID NOT NULL,
			performed_by_type VARCHAR(20) NOT NULL,
			old_value TEXT,
			new_value TEXT,
			shared_with_id UUID,
			shared_with_type VARCHAR(20),
			metadata JSONB,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_file_folder_history_item_id ON file_folder_history(item_id)`,
		`CREATE INDEX IF NOT EXISTS idx_file_folder_history_created_at ON file_folder_history(created_at DESC)`,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	tx, err := conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin schema transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	for _, query := range sqlQueries {
		_, err := tx.Exec(ctx, query)
		if err != nil {
			return fmt.Errorf("failed to execute query: %v", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit schema transaction: %v", err)
	}

	return nil
}
