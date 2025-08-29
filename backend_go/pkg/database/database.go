package database

import (
	"context"
	"fmt"
	"log"

	"healthcare_backend/pkg/config"

	"github.com/jackc/pgx/v4/pgxpool"
)

func Initialize(cfg *config.Config) (*pgxpool.Pool, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s database=%s",
		cfg.DatabaseHost, cfg.DatabasePort, cfg.DatabaseUser, cfg.DatabasePassword, cfg.DatabaseName)

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse config: %v", err)
	}

	if config.ConnConfig.RuntimeParams == nil {
		config.ConnConfig.RuntimeParams = map[string]string{}
	}
	config.ConnConfig.RuntimeParams["TimeZone"] = "Africa/Casablanca"

	conn, err := pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	if err := createTables(conn); err != nil {
		return nil, fmt.Errorf("failed to create tables: %v", err)
	}

	log.Println("Database initialized successfully")
	return conn, nil
}

func createTables(conn *pgxpool.Pool) error {
	sqlQueries := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

		`CREATE TABLE IF NOT EXISTS doctor_info (
			doctor_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			username VARCHAR(50) NOT NULL,
			first_name VARCHAR(50) NOT NULL,	
			last_name VARCHAR(50) NOT NULL,
			age INTEGER NOT NULL,
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt VARCHAR(50) NOT NULL,
			specialty VARCHAR(50) NOT NULL,
			experience VARCHAR(50) NOT NULL,
			rating_score NUMERIC ,
			rating_count INTEGER NOT NULL,
			medical_license VARCHAR(50) NOT NULL,
			is_verified BOOLEAN NOT NULL DEFAULT FALSE,
			bio TEXT,
			email VARCHAR(255) NOT NULL,
			phone_number VARCHAR(255) NOT NULL,
			street_address VARCHAR(255) NOT NULL,
			city_name VARCHAR(255) NOT NULL,
			state_name VARCHAR(255) NOT NULL,
			zip_code VARCHAR(255) NOT NULL,
			country_name VARCHAR(255) NOT NULL,
			latitude DOUBLE PRECISION,
			longitude DOUBLE PRECISION,
			birth_date DATE NOT NULL,
			location VARCHAR(255) NOT NULL,
			profile_photo_url VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_hospitals (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID REFERENCES doctor_info(doctor_id),
			hospital_name TEXT NOT NULL,
			position TEXT,
			start_date DATE,
			end_date DATE,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_organizations (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID REFERENCES doctor_info(doctor_id),
			organization_name TEXT NOT NULL,
			role TEXT,
			start_date DATE,
			end_date DATE,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_awards (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID REFERENCES doctor_info(doctor_id),
			award_name TEXT NOT NULL,
			date_awarded DATE,
			issuing_organization TEXT,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_certifications (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID REFERENCES doctor_info(doctor_id),
			certification_name TEXT NOT NULL,
			issued_by TEXT,
			issue_date DATE,
			expiration_date DATE,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_languages (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id UUID REFERENCES doctor_info(doctor_id),
			language_name TEXT NOT NULL,
			proficiency_level TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS patient_info (
			patient_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			username VARCHAR(50) NOT NULL,
			first_name VARCHAR(50) NOT NULL,	
			last_name VARCHAR(50) NOT NULL,
			age INTEGER NOT NULL,
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt VARCHAR(50) NOT NULL,
			is_verified BOOLEAN NOT NULL DEFAULT FALSE,
			bio TEXT NOT NULL,
			email VARCHAR(255) NOT NULL,
			phone_number VARCHAR(50) NOT NULL,
			street_address VARCHAR(255) NOT NULL,
			city_name VARCHAR(255) NOT NULL,
			state_name VARCHAR(255) NOT NULL,
			zip_code VARCHAR(255) NOT NULL,
			country_name VARCHAR(255) NOT NULL,
			birth_date DATE NOT NULL,
			location VARCHAR(255) NOT NULL,
			profile_photo_url VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS availabilities (
			availability_id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id uuid REFERENCES doctor_info(doctor_id),
			weekday VARCHAR(10),
			availability_start TIMESTAMP WITH TIME ZONE NOT NULL,
			availability_end TIMESTAMP WITH TIME ZONE NOT NULL,
			slot_duration INTEGER
		)`,

		`CREATE TABLE IF NOT EXISTS doctor_exception (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
			doctor_id uuid REFERENCES doctor_info(doctor_id),
			date DATE,
			start_time TIMESTAMP WITH TIME ZONE NOT NULL,
			end_time TIMESTAMP WITH TIME ZONE NOT NULL,
			type VARCHAR(10)
		)`,

		`CREATE TABLE IF NOT EXISTS appointments (
			appointment_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			appointment_start TIMESTAMP NOT NULL,
			appointment_end TIMESTAMP NOT NULL,
			title VARCHAR(50) NOT NULL,
			doctor_id uuid REFERENCES doctor_info(doctor_id),
			patient_id uuid,
			is_doctor_patient BOOLEAN NOT NULL DEFAULT FALSE,
			canceled BOOLEAN DEFAULT FALSE,
			canceled_by VARCHAR(255),
			cancellation_reason TEXT,
			cancellation_timestamp TIMESTAMP WITH TIME ZONE,
			receptionist_id uuid,
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

		);`,

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
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

		)`,

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
			chat_id uuid NOT NULL,
			user_id uuid NOT NULL,
			joined_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS messages (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			chat_id uuid NOT NULL,
			sender_id uuid NOT NULL,
			content TEXT,
			key TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS verification_tokens (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			email VARCHAR(255) NOT NULL,
			token VARCHAR(255) NOT NULL,
			type VARCHAR(255) NOT NULL
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
			post_id UUID NOT NULL REFERENCES blog_posts(post_id) ON DELETE CASCADE,
			user_id UUID NOT NULL,
			user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
			content TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS likes (
			like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			post_id UUID NOT NULL REFERENCES blog_posts(post_id) ON DELETE CASCADE,
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

		`CREATE TABLE IF NOT EXISTS public.medications(
			medication_id uuid NOT NULL DEFAULT gen_random_uuid(),
			patient_id uuid NOT NULL,
			medication_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
			dosage character varying(100) COLLATE pg_catalog."default" NOT NULL,
			frequency character varying(100) COLLATE pg_catalog."default" NOT NULL,
			duration character varying(100) COLLATE pg_catalog."default" NOT NULL,
			instructions text COLLATE pg_catalog."default",
			prescribing_doctor_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
			prescribing_doctor_id uuid NOT NULL,
			report_id uuid,
			created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
			updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT medications_pkey PRIMARY KEY (medication_id),
			CONSTRAINT medications_report_id_fkey FOREIGN KEY (report_id)
				REFERENCES public.medical_reports (report_id) MATCH SIMPLE
				ON UPDATE NO ACTION
				ON DELETE CASCADE
		)`,

		`CREATE TABLE IF NOT EXISTS medical_reports (
			report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			appointment_id UUID REFERENCES appointments(appointment_id),
			doctor_id UUID REFERENCES doctor_info(doctor_id),
			patient_id UUID,
			patient_first_name VARCHAR(100), 
			patient_last_name VARCHAR(100), 
			doctor_first_name VARCHAR(100), 
			doctor_last_name VARCHAR(100),
			diagnosis_made boolean,
			diagnosis_name VARCHAR(255),
			diagnosis_details TEXT,
			report_content TEXT,
			referral_needed boolean,
			referral_specialty VARCHAR(255),
			referral_doctor_name VARCHAR(255),
			referral_message TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
			);
		`,

		`CREATE TABLE IF NOT EXISTS medical_referrals (
			referral_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			referring_doctor_id UUID REFERENCES doctor_info(doctor_id),
			referred_patient_id UUID REFERENCES patient_info(patient_id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`,

		`CREATE TABLE IF NOT EXISTS receptionists (
			receptionist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			username VARCHAR(50) UNIQUE NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			sex VARCHAR(50) NOT NULL,
			hashed_password VARCHAR(255) NOT NULL,
			salt TEXT NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			phone_number VARCHAR(20) NOT NULL,
			street_address TEXT,
			city_name VARCHAR(100) NOT NULL,
			state_name VARCHAR(100) NOT NULL,
			zip_code VARCHAR(20),
			country_name VARCHAR(100) NOT NULL,
			birth_date DATE,
			bio TEXT,
			profile_photo_url TEXT,
			assigned_doctor_id UUID REFERENCES doctor_info(doctor_id) ON DELETE SET NULL,
			is_active BOOLEAN DEFAULT true,
			email_verified BOOLEAN DEFAULT false,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS receptionist_work_schedule (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			receptionist_id UUID NOT NULL REFERENCES receptionists(receptionist_id) ON DELETE CASCADE,
			day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
			start_time TIME NOT NULL,
			end_time TIME NOT NULL,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(receptionist_id, day_of_week)
		)`,

		`CREATE TABLE IF NOT EXISTS receptionist_permissions (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			receptionist_id UUID NOT NULL REFERENCES receptionists(receptionist_id) ON DELETE CASCADE,
			permission_type VARCHAR(50) NOT NULL,
			permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
			granted_by UUID,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS document_verifications (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			patient_id UUID NOT NULL REFERENCES patient_info(patient_id) ON DELETE CASCADE,
			receptionist_id UUID REFERENCES receptionists(receptionist_id) ON DELETE SET NULL,
			document_type VARCHAR(100) NOT NULL,
			document_url TEXT NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
			notes TEXT,
			verified_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS receptionist_activities (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			receptionist_id UUID NOT NULL REFERENCES receptionists(receptionist_id) ON DELETE CASCADE,
			activity_type VARCHAR(50) NOT NULL,
			description TEXT NOT NULL,
			related_id TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS diagnosis_history (
			id SERIAL PRIMARY KEY,
			appointment_id UUID NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
			diagnosis_name VARCHAR(255) NOT NULL,
			diagnosis_details TEXT,
			diagnosis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
			doctor_name VARCHAR(255) NOT NULL,
			severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
			status VARCHAR(20) CHECK (status IN ('active', 'resolved', 'chronic')),
			notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,

		`ALTER TABLE appointments 
		ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'consultation',
		ADD COLUMN IF NOT EXISTS notes TEXT,
		ADD COLUMN IF NOT EXISTS created_by UUID,
		ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT false,
		ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,

		`ALTER TABLE patient_info 
		ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
	}

	for _, query := range sqlQueries {
		_, err := conn.Exec(context.Background(), query)
		if err != nil {
			return fmt.Errorf("failed to execute query: %v", err)
		}
	}

	return nil
}
