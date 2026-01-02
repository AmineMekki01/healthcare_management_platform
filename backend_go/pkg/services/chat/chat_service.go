package chat

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type CombinedUser struct {
	UserID                string `json:"userId"`
	FirstName             string `json:"firstName"`
	FirstNameAr           string `json:"firstNameAr"`
	LastName              string `json:"lastName"`
	LastNameAr            string `json:"lastNameAr"`
	UserType              string `json:"userType"`
	UserProfilePictureURL string `json:"profile_photo_url"`
}

type CombinedMessage struct {
	ChatID      string    `json:"chatId"`
	SenderID    string    `json:"senderId"`
	RecipientID string    `json:"recipientId"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"createdAt"`
	Key         *string   `json:"key"`
}

type ChatService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewChatService(db *pgxpool.Pool, cfg *config.Config) *ChatService {
	return &ChatService{
		db:  db,
		cfg: cfg,
	}
}

func (s *ChatService) GetChatsForUser(userID string) ([]models.Chat, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to acquire database connection: %v", err)
	}
	defer conn.Release()

	const query = `
	WITH one_to_one_chats AS (
		SELECT chat_id
		FROM participants
		GROUP BY chat_id
		HAVING COUNT(DISTINCT user_id) = 2
	),
	my_one_to_one_chats AS (
		SELECT oc.chat_id
		FROM one_to_one_chats oc
		JOIN participants p ON p.chat_id = oc.chat_id
		WHERE p.user_id::text = $1
	)
	SELECT
		c.id,
		c.updated_at AS updated_at,
		$1 AS sender_user_id,
		other_p.user_id AS recipient_user_id,
		other_user.first_name AS first_name_recipient,
		other_user.first_name_ar AS first_name_recipient_ar,
		other_user.last_name AS last_name_recipient,
		other_user.last_name_ar AS last_name_recipient_ar,
		lm.content AS latest_message_content,
		lm.created_at AS latest_message_time,
		other_user.profile_photo_url AS recipient_image_url,
		other_user.user_type AS recipient_user_type
	FROM
		my_one_to_one_chats mc
	JOIN
		chats c ON c.id = mc.chat_id
	JOIN
		(
			SELECT DISTINCT chat_id, user_id
			FROM participants
		) other_p ON c.id = other_p.chat_id AND other_p.user_id::text <> $1
	LEFT JOIN (
		SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar, profile_photo_url, 'doctor' AS user_type
		FROM doctor_info
		UNION
		SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar, profile_photo_url, 'patient' AS user_type
		FROM patient_info
		UNION
		SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar, profile_photo_url, 'receptionist' AS user_type
		FROM receptionists
	) other_user ON other_p.user_id = other_user.user_id
	LEFT JOIN (
		SELECT chat_id, content, created_at
		FROM (
			SELECT
				chat_id,
				content,
				created_at,
				ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) AS rn
			FROM messages
		) ranked
		WHERE rn = 1
	) lm ON c.id = lm.chat_id
	ORDER BY
		COALESCE(lm.created_at, c.updated_at) DESC`

	rows, err := conn.Query(context.Background(), query, userID)
	if err != nil {
		return nil, fmt.Errorf("error querying chats for user %s: %v", userID, err)
	}
	defer rows.Close()

	var chats []models.Chat
	for rows.Next() {
		var chat models.Chat
		if err := rows.Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID,
			&chat.FirstNameRecipient, &chat.FirstNameRecipientAr, &chat.LastNameRecipient, &chat.LastNameRecipientAr, &chat.LastMessage, &chat.LastMessageCreatedAt,
			&chat.RecipientImageURL, &chat.RecipientUserType); err != nil {
			return nil, fmt.Errorf("error scanning chat row: %v", err)
		}

		if chat.RecipientImageURL != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(chat.RecipientImageURL)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for image: %v", err)
			} else {
				chat.RecipientImageURL = presignedURL
			}
		}

		chats = append(chats, chat)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating chat rows: %v", err)
	}

	return chats, nil
}

func (s *ChatService) SendMessage(message CombinedMessage) error {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return fmt.Errorf("failed to acquire database connection: %v", err)
	}
	defer conn.Release()

	return s.storeMessage(conn, message.SenderID, message.ChatID, message.Content, message.CreatedAt, message.Key)
}

func (s *ChatService) storeMessage(conn *pgxpool.Conn, senderID, chatID, content string, createdAt time.Time, key *string) error {
	_, err := conn.Exec(context.Background(),
		`INSERT INTO messages (chat_id, sender_id, content, key, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
		chatID, senderID, content, key, createdAt)
	return err
}

func (s *ChatService) UploadImage(file multipart.File, header *multipart.FileHeader) (string, string, error) {
	awsRegion := os.Getenv("AWS_REGION")
	bucket := os.Getenv("S3_BUCKET_NAME")

	if awsRegion != "" && bucket != "" {
		key := fmt.Sprintf("images/%d_%s", time.Now().Unix(), header.Filename)

		if err := utils.UploadToS3(file, header, key); err != nil {
			return "", "", fmt.Errorf("failed to upload to S3: %v", err)
		}

		presignedURL, err := utils.GeneratePresignedObjectURL(key)
		if err != nil {
			return "", "", fmt.Errorf("failed to generate presigned URL: %v", err)
		}

		return presignedURL, key, nil
	}

	uploadDir := filepath.Join("uploads", "chat")
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return "", "", fmt.Errorf("failed to prepare upload directory: %v", err)
	}

	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
	dstPath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()

	if seeker, ok := file.(interface {
		Seek(offset int64, whence int) (int64, error)
	}); ok {
		_, _ = seeker.Seek(0, 0)
	}

	if _, err := io.Copy(dst, file); err != nil {
		return "", "", fmt.Errorf("failed to write file: %v", err)
	}

	baseURL := fmt.Sprintf("http://localhost:%s", s.cfg.ServerPort)
	publicURL := baseURL + "/uploads/chat/" + filename

	return publicURL, "", nil
}

func (s *ChatService) SearchUsers(inputName, currentUserID, currentUserType string) ([]CombinedUser, error) {
	var combinedUsers []CombinedUser

	if currentUserType == "patient" || currentUserType == "receptionist" {
		query := `
            SELECT DISTINCT di.doctor_id, di.first_name, COALESCE(di.first_name_ar, ''), di.last_name, COALESCE(di.last_name_ar, ''), di.profile_photo_url
			FROM doctor_info di
			LEFT JOIN followers f ON di.doctor_id = f.doctor_id AND f.follower_id = $2
			LEFT JOIN appointments apt ON di.doctor_id = apt.doctor_id AND apt.patient_id = $2 AND apt.canceled = FALSE
			WHERE (
				LOWER(di.first_name || ' ' || di.last_name) LIKE LOWER($1)
				OR LOWER(COALESCE(di.first_name_ar, '') || ' ' || COALESCE(di.last_name_ar, '')) LIKE LOWER($1)
				OR LOWER(COALESCE(di.first_name_ar, '')) LIKE LOWER($1)
				OR LOWER(COALESCE(di.last_name_ar, '')) LIKE LOWER($1)
			)
			AND di.doctor_id != $2
			AND (f.follower_id IS NOT NULL OR apt.patient_id IS NOT NULL)`

		rows, err := s.db.Query(context.Background(), query, inputName+"%", currentUserID)
		if err != nil {
			return nil, fmt.Errorf("error querying doctors for patient: %v", err)
		}
		defer rows.Close()

		for rows.Next() {
			var user CombinedUser
			err := rows.Scan(&user.UserID, &user.FirstName, &user.FirstNameAr, &user.LastName, &user.LastNameAr, &user.UserProfilePictureURL)
			if err != nil {
				log.Printf("Error scanning user: %v", err)
				continue
			}
			user.UserType = "doctor"
			newProfilePictureURL, err := utils.GeneratePresignedObjectURL(user.UserProfilePictureURL)
			if err != nil {
				return nil, fmt.Errorf("failed to generate presigned URL: %v", err)
			}
			user.UserProfilePictureURL = newProfilePictureURL
			combinedUsers = append(combinedUsers, user)
		}
	} else if currentUserType == "doctor" {
		queries := map[string]string{
			"patient": `
				SELECT pi.patient_id, pi.first_name, COALESCE(pi.first_name_ar, ''), pi.last_name, COALESCE(pi.last_name_ar, ''), pi.profile_photo_url
				FROM patient_info pi
				WHERE (
					LOWER(pi.first_name || ' ' || pi.last_name) LIKE LOWER($1)
					OR LOWER(COALESCE(pi.first_name_ar, '') || ' ' || COALESCE(pi.last_name_ar, '')) LIKE LOWER($1)
					OR LOWER(COALESCE(pi.first_name_ar, '')) LIKE LOWER($1)
					OR LOWER(COALESCE(pi.last_name_ar, '')) LIKE LOWER($1)
				)
				AND pi.patient_id != $2`,
			"doctor": `
				SELECT di.doctor_id, di.first_name, COALESCE(di.first_name_ar, ''), di.last_name, COALESCE(di.last_name_ar, ''), di.profile_photo_url
				FROM doctor_info di
				WHERE (
					LOWER(di.first_name || ' ' || di.last_name) LIKE LOWER($1)
					OR LOWER(COALESCE(di.first_name_ar, '') || ' ' || COALESCE(di.last_name_ar, '')) LIKE LOWER($1)
					OR LOWER(COALESCE(di.first_name_ar, '')) LIKE LOWER($1)
					OR LOWER(COALESCE(di.last_name_ar, '')) LIKE LOWER($1)
				)
				AND di.doctor_id != $2`,
			"receptionist": `
				SELECT r.receptionist_id, r.first_name, COALESCE(r.first_name_ar, ''), r.last_name, COALESCE(r.last_name_ar, ''), r.profile_photo_url
				FROM receptionists r
				WHERE (
					LOWER(r.first_name || ' ' || r.last_name) LIKE LOWER($1)
					OR LOWER(COALESCE(r.first_name_ar, '') || ' ' || COALESCE(r.last_name_ar, '')) LIKE LOWER($1)
					OR LOWER(COALESCE(r.first_name_ar, '')) LIKE LOWER($1)
					OR LOWER(COALESCE(r.last_name_ar, '')) LIKE LOWER($1)
				)
				AND r.receptionist_id != $2`,
		}

		for userType, query := range queries {
			rows, err := s.db.Query(context.Background(), query, inputName+"%", currentUserID)
			if err != nil {
				return nil, fmt.Errorf("error querying %s table: %v", userType, err)
			}
			defer rows.Close()

			for rows.Next() {
				var user CombinedUser
				err := rows.Scan(&user.UserID, &user.FirstName, &user.FirstNameAr, &user.LastName, &user.LastNameAr, &user.UserProfilePictureURL)
				if err != nil {
					log.Printf("Error scanning user: %v", err)
					continue
				}
				user.UserType = userType
				newProfilePictureURL, err := utils.GeneratePresignedObjectURL(user.UserProfilePictureURL)
				if err != nil {
					return nil, fmt.Errorf("failed to generate presigned URL: %v", err)
				}
				user.UserProfilePictureURL = newProfilePictureURL
				combinedUsers = append(combinedUsers, user)
			}
		}
	} else {
		return nil, fmt.Errorf("invalid user type: %s", currentUserType)
	}

	return combinedUsers, nil
}

func (s *ChatService) GetMessagesForChat(chatID string) ([]models.Message, error) {
	rows, err := s.db.Query(context.Background(),
		"SELECT id, chat_id, sender_id, content, key, created_at FROM messages WHERE chat_id = $1", chatID)
	if err != nil {
		log.Printf("Error retrieving messages for chat %s: %v", chatID, err)
		return nil, fmt.Errorf("failed to retrieve messages: %v", err)
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Key, &msg.CreatedAt); err != nil {
			log.Printf("Error scanning message for chat %s: %v", chatID, err)
			return nil, fmt.Errorf("failed to scan message: %v", err)
		}

		if msg.Key != nil && *msg.Key != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(*msg.Key)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for key %s: %v", *msg.Key, err)
				log.Printf("Failed to generate presigned URL for key %s: %v", *msg.Key, err)
			} else {
				msg.Content = &presignedURL
			}
		}
		messages = append(messages, msg)
	}
	return messages, nil
}

func (s *ChatService) FindOrCreateChatWithUser(currentUserID, selectedUserID, currentUserType, selectedUserType string) ([]models.Chat, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to acquire database connection: %v", err)
	}
	defer conn.Release()

	if (currentUserType == "patient" || currentUserType == "receptionist") && selectedUserType == "doctor" {
		hasAppointment, err := s.checkPatientDoctorConnection(conn, currentUserID, selectedUserID)
		if err != nil {
			return nil, fmt.Errorf("failed to check patient-doctor connection: %v", err)
		}
		if !hasAppointment && currentUserType == "patient" {
			return nil, fmt.Errorf("you cannot message this doctor without an appointment")
		}
	}

	return s.findOrCreateChat(conn, currentUserID, selectedUserID, currentUserType)
}

func (s *ChatService) findOrCreateChat(conn *pgxpool.Conn, currentUserID, selectedUserID string, currentUserType string) ([]models.Chat, error) {
	var chat models.Chat
	var err error
	if currentUserType == "patient" {
		err = conn.QueryRow(context.Background(),
			`SELECT DISTINCT
            c.id,
            c.updated_at,
            curr_p.user_id AS sender_user_id,
            other_p.user_id AS recipient_user_id,
            curr_user.first_name AS first_name_sender,
            curr_user.last_name AS last_name_sender,
            other_user.first_name AS first_name_recipient,
            other_user.first_name_ar AS first_name_recipient_ar,
            other_user.last_name AS last_name_recipient,
            other_user.last_name_ar AS last_name_recipient_ar,
            lm.content AS latest_message_content,
            lm.created_at AS latest_message_time
        FROM
            chats c
        JOIN
            participants curr_p ON c.id = curr_p.chat_id
        JOIN
            participants other_p ON c.id = other_p.chat_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
            UNION
            SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) curr_user ON curr_p.user_id = curr_user.user_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
            UNION
            SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) other_user ON other_p.user_id = other_user.user_id
        LEFT JOIN
            (SELECT
                chat_id,
                content,
                created_at,
                ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY created_at DESC) as rn
            FROM
                messages) lm ON c.id = lm.chat_id AND lm.rn = 1
        WHERE
            curr_p.user_id = $1 
        AND
            other_p.user_id = $2 
        AND
            (SELECT COUNT(DISTINCT user_id) FROM participants p2 WHERE p2.chat_id = c.id) = 2
        ORDER BY
            lm.created_at DESC`,
			currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID,
			&chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.FirstNameRecipientAr, &chat.LastNameRecipient, &chat.LastNameRecipientAr,
			&chat.LastMessage, &chat.LastMessageCreatedAt)
	} else if currentUserType == "doctor" {
		err = conn.QueryRow(context.Background(),
			`SELECT DISTINCT
            c.id,
            c.updated_at,
            curr_p.user_id AS sender_user_id,
            other_p.user_id AS recipient_user_id,
            curr_user.first_name AS first_name_sender,
            curr_user.last_name AS last_name_sender,
            other_user.first_name AS first_name_recipient,
            other_user.first_name_ar AS first_name_recipient_ar,
            other_user.last_name AS last_name_recipient,
            other_user.last_name_ar AS last_name_recipient_ar,
            lm.content AS latest_message_content,
            lm.created_at AS latest_message_time
        FROM
            chats c
        JOIN
            participants curr_p ON c.id = curr_p.chat_id
        JOIN
            participants other_p ON c.id = other_p.chat_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
            UNION
            SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) curr_user ON curr_p.user_id = curr_user.user_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
            UNION
            SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) other_user ON other_p.user_id = other_user.user_id
        LEFT JOIN
            (SELECT
                chat_id,
                content,
                created_at,
                ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY created_at DESC) as rn
            FROM
                messages) lm ON c.id = lm.chat_id AND lm.rn = 1
        WHERE
            curr_p.user_id = $1 
        AND
            other_p.user_id = $2 
        AND
            (SELECT COUNT(DISTINCT user_id) FROM participants p2 WHERE p2.chat_id = c.id) = 2
        ORDER BY
            lm.created_at DESC`,
			currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID,
			&chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.FirstNameRecipientAr, &chat.LastNameRecipient, &chat.LastNameRecipientAr,
			&chat.LastMessage, &chat.LastMessageCreatedAt)
	} else if currentUserType == "receptionist" {
		err = conn.QueryRow(context.Background(),
			`SELECT DISTINCT
            c.id,
            c.updated_at,
            curr_p.user_id AS sender_user_id,
            other_p.user_id AS recipient_user_id,
            curr_user.first_name AS first_name_sender,
            curr_user.last_name AS last_name_sender,
            other_user.first_name AS first_name_recipient,
            other_user.first_name_ar AS first_name_recipient_ar,
            other_user.last_name AS last_name_recipient,
            other_user.last_name_ar AS last_name_recipient_ar,
            lm.content AS latest_message_content,
            lm.created_at AS latest_message_time
        FROM
            chats c
        JOIN
            participants curr_p ON c.id = curr_p.chat_id
        JOIN
            participants other_p ON c.id = other_p.chat_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
            UNION
            SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) curr_user ON curr_p.user_id = curr_user.user_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
            UNION
            SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) other_user ON other_p.user_id = other_user.user_id
        LEFT JOIN
            (SELECT
                chat_id,
                content,
                created_at,
                ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY created_at DESC) as rn
            FROM
                messages) lm ON c.id = lm.chat_id AND lm.rn = 1
        WHERE
            curr_p.user_id = $1 
        AND
            other_p.user_id = $2 
        AND
            (SELECT COUNT(DISTINCT user_id) FROM participants p2 WHERE p2.chat_id = c.id) = 2
        ORDER BY
            lm.created_at DESC`,
			currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID,
			&chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.FirstNameRecipientAr, &chat.LastNameRecipient, &chat.LastNameRecipientAr,
			&chat.LastMessage, &chat.LastMessageCreatedAt)
	}
	chat.UpdatedAt = time.Now()

	if err == pgx.ErrNoRows {
		tx, err := conn.Begin(context.Background())
		if err != nil {
			return nil, fmt.Errorf("error starting transaction: %v", err)
		}
		defer tx.Rollback(context.Background())

		err = tx.QueryRow(context.Background(),
			`INSERT INTO chats (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id`).Scan(&chat.ID)
		if err != nil {
			return nil, fmt.Errorf("error creating chat: %v", err)
		}

		isSelfChat := currentUserID == selectedUserID
		if isSelfChat {
			_, err = tx.Exec(context.Background(), `
                INSERT INTO participants (chat_id, user_id, joined_at, created_at, updated_at) 
                VALUES ($1, $2, NOW(), NOW(), NOW()), ($1, $2, NOW(), NOW(), NOW())
            `, chat.ID, currentUserID)
		} else {
			_, err = tx.Exec(context.Background(), `
                INSERT INTO participants (chat_id, user_id, joined_at, created_at, updated_at) 
                VALUES ($1, $2, NOW(), NOW(), NOW()), ($1, $3, NOW(), NOW(), NOW())
            `, chat.ID, currentUserID, selectedUserID)
		}

		if err != nil {
			return nil, fmt.Errorf("error adding participants: %v", err)
		}

		err = tx.Commit(context.Background())
		if err != nil {
			return nil, fmt.Errorf("error committing transaction: %v", err)
		}

		if currentUserType == "patient" {
			err = conn.QueryRow(context.Background(),
				`SELECT DISTINCT
				c.id,
				c.updated_at,
				curr_p.user_id AS sender_user_id,
				other_p.user_id AS recipient_user_id,
				curr_user.first_name AS first_name_sender,
				curr_user.last_name AS last_name_sender,
				other_user.first_name AS first_name_recipient,
				other_user.first_name_ar AS first_name_recipient_ar,
				other_user.last_name AS last_name_recipient,
				other_user.last_name_ar AS last_name_recipient_ar,
				lm.content AS latest_message_content,
				lm.created_at AS latest_message_time
			FROM
				chats c
			JOIN
				participants curr_p ON c.id = curr_p.chat_id
			JOIN
				participants other_p ON c.id = other_p.chat_id
			LEFT JOIN
				(SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
				UNION
				SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
				UNION
				SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) curr_user ON curr_p.user_id = curr_user.user_id
			LEFT JOIN
				(SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
				UNION
				SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
				UNION
				SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) other_user ON other_p.user_id = other_user.user_id
			LEFT JOIN
				(SELECT
					chat_id,
					content,
					created_at,
					ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY created_at DESC) as rn
				FROM
					messages) lm ON c.id = lm.chat_id AND lm.rn = 1
			WHERE
				curr_p.user_id = $1 
			AND
				other_p.user_id = $2 
			AND
				(SELECT COUNT(DISTINCT user_id) FROM participants p2 WHERE p2.chat_id = c.id) = 2
			ORDER BY
				lm.created_at DESC`,
				currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID,
				&chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.FirstNameRecipientAr, &chat.LastNameRecipient, &chat.LastNameRecipientAr,
				&chat.LastMessage, &chat.LastMessageCreatedAt)

		} else if currentUserType == "doctor" {
			err = conn.QueryRow(context.Background(),
				`SELECT DISTINCT
				c.id,
				c.updated_at,
				curr_p.user_id AS sender_user_id,
				other_p.user_id AS recipient_user_id,
				curr_user.first_name AS first_name_sender,
				curr_user.last_name AS last_name_sender,
				other_user.first_name AS first_name_recipient,
				COALESCE(other_user.first_name_ar, '') AS first_name_recipient_ar,
				other_user.last_name AS last_name_recipient,
				COALESCE(other_user.last_name_ar, '') AS last_name_recipient_ar,
				lm.content AS latest_message_content,
				lm.created_at AS latest_message_time
			FROM
				chats c
			JOIN
				participants curr_p ON c.id = curr_p.chat_id
			JOIN
				participants other_p ON c.id = other_p.chat_id
			LEFT JOIN
				(SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
				UNION
				SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
				UNION
				SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) curr_user ON curr_p.user_id = curr_user.user_id
			LEFT JOIN
				(SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
				UNION
				SELECT patient_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM patient_info
				UNION
				SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) other_user ON other_p.user_id = other_user.user_id
			LEFT JOIN
				(SELECT
					chat_id,
					content,
					created_at,
					ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY created_at DESC) as rn
				FROM
					messages) lm ON c.id = lm.chat_id AND lm.rn = 1
			WHERE
				curr_p.user_id = $1 
			AND
				other_p.user_id = $2 
			AND
				(SELECT COUNT(DISTINCT user_id) FROM participants p2 WHERE p2.chat_id = c.id) = 2
			ORDER BY
				lm.created_at DESC`,
				currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID,
				&chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.FirstNameRecipientAr, &chat.LastNameRecipient, &chat.LastNameRecipientAr,
				&chat.LastMessage, &chat.LastMessageCreatedAt)

		} else if currentUserType == "receptionist" {
			err = conn.QueryRow(context.Background(),
				`SELECT DISTINCT
				c.id,
				c.updated_at,
				curr_p.user_id AS sender_user_id,
				other_p.user_id AS recipient_user_id,
				curr_user.first_name AS first_name_sender,
				curr_user.last_name AS last_name_sender,
				other_user.first_name AS first_name_recipient,
				COALESCE(other_user.first_name_ar, '') AS first_name_recipient_ar,
				other_user.last_name AS last_name_recipient,
				COALESCE(other_user.last_name_ar, '') AS last_name_recipient_ar,
				lm.content AS latest_message_content,
				lm.created_at AS latest_message_time
			FROM
				chats c
			JOIN
				participants curr_p ON c.id = curr_p.chat_id
			JOIN
				participants other_p ON c.id = other_p.chat_id
			LEFT JOIN
				(SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
				UNION
				SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) curr_user ON curr_p.user_id = curr_user.user_id
			LEFT JOIN
				(SELECT doctor_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM doctor_info
				UNION
				SELECT receptionist_id AS user_id, first_name, COALESCE(first_name_ar, '') AS first_name_ar, last_name, COALESCE(last_name_ar, '') AS last_name_ar FROM receptionists) other_user ON other_p.user_id = other_user.user_id
			LEFT JOIN
				(SELECT
					chat_id,
					content,
					created_at,
					ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY created_at DESC) as rn
				FROM
					messages) lm ON c.id = lm.chat_id AND lm.rn = 1
			WHERE
				curr_p.user_id = $1 
			AND
				other_p.user_id = $2 
			AND
				(SELECT COUNT(DISTINCT user_id) FROM participants p2 WHERE p2.chat_id = c.id) = 2
			ORDER BY
				lm.created_at DESC`,
				currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID,
				&chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.FirstNameRecipientAr, &chat.LastNameRecipient, &chat.LastNameRecipientAr,
				&chat.LastMessage, &chat.LastMessageCreatedAt)
		}

		chat.UpdatedAt = time.Now()
		if err != nil {
			return nil, fmt.Errorf("error finding created chat: %v", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("error finding chat: %v", err)
	}

	chats := []models.Chat{chat}
	return chats, nil
}

func (s *ChatService) GetUserImage(userID, userType string) (string, error) {
	conn, err := s.db.Acquire(context.Background())
	if err != nil {
		return "", fmt.Errorf("failed to acquire database connection: %v", err)
	}
	defer conn.Release()

	var imageURL string

	if userType == "doctor" {
		err = conn.QueryRow(context.Background(),
			`SELECT profile_photo_url FROM doctor_info WHERE doctor_id = $1`, userID).Scan(&imageURL)
	} else if userType == "patient" {
		err = conn.QueryRow(context.Background(),
			`SELECT profile_photo_url FROM patient_info WHERE patient_id = $1`, userID).Scan(&imageURL)
	} else if userType == "receptionist" {
		err = conn.QueryRow(context.Background(),
			`SELECT profile_photo_url FROM receptionists WHERE receptionist_id = $1`, userID).Scan(&imageURL)
	} else {
		return "", fmt.Errorf("invalid user type: %s", userType)
	}

	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("user not found")
		}
		return "", fmt.Errorf("error fetching user image: %v", err)
	}

	presignedURL, err := utils.GeneratePresignedObjectURL(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %v", err)
	}

	return presignedURL, nil
}

func (s *ChatService) isPatientFollowingDoctor(conn *pgxpool.Conn, patientID, doctorID string) (bool, error) {
	var count int
	err := conn.QueryRow(context.Background(), `
        SELECT COUNT(*) FROM followers
        WHERE follower_id = $1 AND doctor_id = $2
    `, patientID, doctorID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *ChatService) hasPatientDoctorAppointment(conn *pgxpool.Conn, patientID, doctorID string) (bool, error) {
	var count int
	err := conn.QueryRow(context.Background(), `
        SELECT COUNT(*) FROM appointments
        WHERE patient_id = $1 AND doctor_id = $2 AND canceled = FALSE
    `, patientID, doctorID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *ChatService) checkPatientDoctorConnection(conn *pgxpool.Conn, patientID, doctorID string) (bool, error) {
	follows, err := s.isPatientFollowingDoctor(conn, patientID, doctorID)
	if err != nil {
		return false, fmt.Errorf("failed to check if patient is following doctor: %v", err)
	}
	if !follows {
		return false, nil
	}

	hasAppointment, err := s.hasPatientDoctorAppointment(conn, patientID, doctorID)
	if err != nil {
		return false, fmt.Errorf("failed to check if patient has appointment with doctor: %v", err)
	}
	if !hasAppointment {
		return false, nil
	}

	return hasAppointment, nil
}
