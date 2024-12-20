package services

// ... other imports
import (
	"backend_go/models"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type CombinedUser struct {
	UserID    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	UserType  string `json:"user_type"`
}

type CombinedMessage struct {
	ChatID      string    `json:"chat_id"`
	SenderID    string    `json:"sender_id"`
	RecipientID string    `json:"recipient_id"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
	Key         *string   `json:"key"`
}

type Presigner struct {
	PresignClient *s3.PresignClient
}

func GetChatsForUser(conn *pgxpool.Conn, userID string, c *gin.Context) ([]models.Chat, error) {
	const query = `
	SELECT
		c.id,
		MAX(c.updated_at) AS updated_at,
		$1 AS sender_user_id,
		CASE
			WHEN curr_p.user_id::text = $1 THEN other_p.user_id
			ELSE curr_p.user_id
		END AS recipient_user_id,
		MAX(
			CASE
				WHEN curr_p.user_id::text = $1 THEN other_user.first_name
				ELSE curr_user.first_name
			END
		) AS first_name_recipient,
		MAX(
			CASE
				WHEN curr_p.user_id::text = $1 THEN other_user.last_name
				ELSE curr_user.last_name
			END
		) AS last_name_recipient,
		MAX(lm.content) AS latest_message_content,
		MAX(lm.created_at) AS latest_message_time,
		MAX(
			CASE
				WHEN curr_p.user_id::text = $1 THEN other_user.profile_photo_url
				ELSE curr_user.profile_photo_url
			END
		) AS recipient_image_url,
		MAX(
			CASE
				WHEN curr_p.user_id::text = $1 THEN other_user.user_type
				ELSE curr_user.user_type
			END
		) AS recipient_user_type
	FROM
		chats c
	JOIN
		participants curr_p ON c.id = curr_p.chat_id
	JOIN
		participants other_p ON c.id = other_p.chat_id AND curr_p.user_id != other_p.user_id
	LEFT JOIN (
		SELECT doctor_id AS user_id, first_name, last_name, profile_photo_url, 'doctor' AS user_type
		FROM doctor_info
		UNION
		SELECT patient_id AS user_id, first_name, last_name, profile_photo_url, 'patient' AS user_type
		FROM patient_info
	) curr_user ON curr_p.user_id = curr_user.user_id
	LEFT JOIN (
		SELECT doctor_id AS user_id, first_name, last_name, profile_photo_url, 'doctor' AS user_type
		FROM doctor_info
		UNION
		SELECT patient_id AS user_id, first_name, last_name, profile_photo_url, 'patient' AS user_type
		FROM patient_info
	) other_user ON other_p.user_id = other_user.user_id
	LEFT JOIN (
		SELECT
			chat_id,
			content,
			created_at,
			ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) AS rn
		FROM
			messages
	) lm ON c.id = lm.chat_id AND lm.rn = 1
	WHERE
		(curr_p.user_id::text = $1 OR other_p.user_id::text = $1)
		AND curr_p.deleted_at IS NULL
		AND c.deleted_at IS NULL
	GROUP BY
		c.id, recipient_user_id
	ORDER BY
		latest_message_time DESC;

    `
	rows, err := conn.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("error querying chats for user: ", err)
		return nil, fmt.Errorf("error querying chats for user %s: %v", userID, err)
	}
	defer rows.Close()
	var chats []models.Chat
	for rows.Next() {
		var chat models.Chat
		if err := rows.Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID, &chat.FirstNameRecipient, &chat.LastNameRecipient, &chat.LastMessage, &chat.LastMessageCreatedAt, &chat.RecipientImageURL, &chat.RecipientUserType); err != nil {
			log.Println("error scanning chat row: ", err)
			return nil, fmt.Errorf("error scanning chat row: %v", err)
		}

		chat.RecipientImageURL, err = GetImageURL(c, chat.RecipientImageURL)

		chats = append(chats, chat)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating chat rows: %v", err)
	}

	return chats, nil
}

func ListChatsForUser(c *gin.Context, pool *pgxpool.Pool) {
	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acquire a database connection"})
		return
	}
	defer conn.Release()

	userID := c.Query("userID")
	chats, err := GetChatsForUser(conn, userID, c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chats"})
		return
	}
	c.JSON(http.StatusOK, chats)
}

func SendMessage(c *gin.Context, pool *pgxpool.Pool) {
	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acquire a database connection"})
		return
	}
	defer conn.Release()

	var newMessage CombinedMessage
	if err := c.BindJSON(&newMessage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message format: " + err.Error()})
		return
	}

	err = storeMessage(conn, newMessage.SenderID, newMessage.ChatID, newMessage.Content, newMessage.CreatedAt, newMessage.Key)
	if err != nil {
		log.Printf("Failed to store message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "Message sent successfully"})
}

func InitS3Client() (*s3.Client, *s3.PresignClient) {
	region := os.Getenv("S3_BUCKET_REGION")
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	s3Client := s3.NewFromConfig(cfg)

	presignClient := s3.NewPresignClient(s3Client)

	return s3Client, presignClient
}

func GeneratePresignedURL(presignClient *s3.PresignClient, bucket, key string) (string, error) {
	request, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Minute * 5
	})
	if err != nil {
		log.Println("Error creating the presigned URL:", err)
		return "", err
	}

	log.Println("Generated presigned URL:", request.URL)
	return request.URL, nil
}

func GetImageURL(c *gin.Context, key string) (string, error) {
	bucket := os.Getenv("S3_BUCKET_NAME")
	_, presignClient := InitS3Client()
	url, err := GeneratePresignedURL(presignClient, bucket, key)
	if err != nil {
		log.Println("Failed to generate pre-signed URL : ", err)
		c.JSON(500, gin.H{"error": "Failed to generate pre-signed URL"})
		return "", err
	}
	return url, nil
}

func UploadImage(c *gin.Context, pool *pgxpool.Pool) {
	s3Client, _ := InitS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		log.Println("Invalid file : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file"})
		return
	}
	defer file.Close()

	key := fmt.Sprintf("images/%d_%s", time.Now().Unix(), header.Filename)
	_, err = s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   file,
	})
	if err != nil {
		log.Println("Failed to upload file : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
		return
	}
	_, presignClient := InitS3Client()
	presignedURL, err := GeneratePresignedURL(presignClient, bucket, key)

	c.JSON(http.StatusOK, gin.H{"message": "Image uploaded successfully", "presigned_url": presignedURL, "s3_key": key})
}

func storeMessage(conn *pgxpool.Conn, senderID, chatID, content string, createdAt time.Time, key *string) error {
	_, err := conn.Exec(context.Background(),
		`INSERT INTO messages (chat_id, sender_id, content, key, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
		chatID, senderID, content, key, createdAt)
	return err
}

func SearchUsers(c *gin.Context, pool *pgxpool.Pool) {
	inputName := c.Param("username")
	currentUserId := c.Param("userId")
	currentUserType := c.Query("userType")

	var combinedUsers []CombinedUser

	if currentUserType == "patient" {
		query := `
            SELECT DISTINCT di.doctor_id, di.first_name, di.last_name
			FROM doctor_info di
			LEFT JOIN followers f ON di.doctor_id = f.doctor_id AND f.follower_id = $2
			LEFT JOIN appointments apt ON di.doctor_id = apt.doctor_id AND apt.patient_id = $2 AND apt.canceled = FALSE
			WHERE LOWER(di.first_name || ' ' || di.last_name) LIKE LOWER($1)
			AND di.doctor_id != $2
			AND (f.follower_id IS NOT NULL OR apt.patient_id IS NOT NULL)
        `
		rows, err := pool.Query(context.Background(), query, inputName+"%", currentUserId)
		if err != nil {
			log.Println("Error querying doctors for patient : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error querying doctors for patient"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var user CombinedUser
			err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName)
			if err != nil {
				log.Println("Error Scanning users : ", err)
				continue
			}
			user.UserType = "doctor"
			combinedUsers = append(combinedUsers, user)
		}
	} else if currentUserType == "doctor" {
		queries := map[string]string{
			"patient": `
				SELECT pi.patient_id, pi.first_name, pi.last_name 
				FROM patient_info pi
				WHERE LOWER(pi.first_name || ' ' || pi.last_name) LIKE LOWER($1)
				  AND pi.patient_id != $2
			`,
			"doctor": `
				SELECT di.doctor_id, di.first_name, di.last_name 
				FROM doctor_info di
				WHERE LOWER(di.first_name || ' ' || di.last_name) LIKE LOWER($1)
				  AND di.doctor_id != $2
			`,
		}

		for userType, query := range queries {
			rows, err := pool.Query(context.Background(), query, inputName+"%", currentUserId)
			if err != nil {
				log.Println("Error querying "+userType+" table : ", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error querying " + userType + " table"})
				return
			}
			defer rows.Close()

			for rows.Next() {
				var user CombinedUser
				err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName)
				if err != nil {
					log.Println("Error Scanning users : ", err)
					continue
				}
				user.UserType = userType
				combinedUsers = append(combinedUsers, user)
			}
		}
	} else {
		log.Println("Invalid user type")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": combinedUsers})
}

func createChat(db *pgx.Conn, user1ID, user2ID int, user1Type, user2Type string) (int, error) {
	tx, err := db.Begin(context.Background())
	if err != nil {
		log.Println("Error starting transaction:", err)
		return 0, err
	}
	var chatID int
	err = tx.QueryRow(context.Background(),
		`INSERT INTO chats (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id`).Scan(&chatID)
	if err != nil {
		log.Println("Error creating chat:", err)
		tx.Rollback(context.Background())
		return 0, err
	}
	_, err = tx.Exec(context.Background(),
		`INSERT INTO participants (chat_id, user_id, user_type, joined_at, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW(), NOW()), ($1, $4, $5, NOW(), NOW(), NOW())`,
		chatID, user1ID, user1Type, user2ID, user2Type)
	if err != nil {
		log.Println("Error adding participants:", err)
		tx.Rollback(context.Background())
		return 0, err
	}

	err = tx.Commit(context.Background())
	if err != nil {
		log.Println("Error committing transaction:", err)
		return 0, err
	}
	return chatID, nil
}

func GetMessagesForChat(c *gin.Context, pool *pgxpool.Pool) {
	chatID := c.Param("chatId")
	bucket := os.Getenv("S3_BUCKET_NAME")
	rows, err := pool.Query(context.Background(), "SELECT id, chat_id, sender_id, content, key, created_at FROM messages WHERE chat_id = $1 AND deleted_at IS NULL", chatID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}
	defer rows.Close()
	_, presignClient := InitS3Client()
	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		var presignedURL string
		if err := rows.Scan(&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Key, &msg.CreatedAt); err != nil {
			log.Println("Failed to scan message:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
			return
		}

		if msg.Key != nil && *msg.Key != "" {
			presignedURL, err = GeneratePresignedURL(presignClient, bucket, *msg.Key)
			if err != nil {
				log.Println("Failed to generate presigned URL:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve image URL"})
				return
			}
			msg.Content = &presignedURL
		}

		messages = append(messages, msg)
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func findOrCreateChatWithUser(conn *pgxpool.Conn, currentUserID, selectedUserID string) ([]models.Chat, error) {
	var chat models.Chat
	err := conn.QueryRow(context.Background(),
		`SELECT DISTINCT
            c.id,
            c.updated_at,
            curr_p.user_id AS sender_user_id,
            other_p.user_id AS recipient_user_id,
            curr_user.first_name AS first_name_sender,
            curr_user.last_name AS last_name_sender,
            other_user.first_name AS first_name_recipient,
            other_user.last_name AS last_name_recipient,
            lm.content AS latest_message_content,
            lm.created_at AS latest_message_time
        FROM
            chats c
        JOIN
            participants curr_p ON c.id = curr_p.chat_id
        JOIN
            participants other_p ON c.id = other_p.chat_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, last_name FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, last_name FROM patient_info) curr_user ON curr_p.user_id = curr_user.user_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, last_name FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, last_name FROM patient_info) other_user ON other_p.user_id = other_user.user_id
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
            curr_p.deleted_at IS NULL 
        AND
            c.deleted_at IS NULL 
        ORDER BY
            lm.created_at DESC; 
        `,
		currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID, &chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.LastNameRecipient, &chat.LastMessage, &chat.LastMessageCreatedAt)
	chat.UpdatedAt = time.Now()
	if err == pgx.ErrNoRows {
		tx, err := conn.Begin(context.Background())
		if err != nil {
			log.Println("Error starting transaction:", err)
			return nil, err
		}
		err = tx.QueryRow(context.Background(),
			`INSERT INTO chats (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id`).Scan(&chat.ID)
		if err != nil {
			log.Println("There was an error in creating a chat : ", err)
			tx.Rollback(context.Background())
			return nil, err
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
			log.Println("There was an error in adding participants : ", err)
			tx.Rollback(context.Background())
			return nil, err
		}

		err = tx.Commit(context.Background())
		if err != nil {
			return nil, err
		}

		err = conn.QueryRow(context.Background(),
			`SELECT DISTINCT
            c.id,
            c.updated_at,
            curr_p.user_id AS sender_user_id,
            other_p.user_id AS recipient_user_id,
            curr_user.first_name AS first_name_sender,
            curr_user.last_name AS last_name_sender,
            other_user.first_name AS first_name_recipient,
            other_user.last_name AS last_name_recipient,
            lm.content AS latest_message_content,
            lm.created_at AS latest_message_time
        FROM
            chats c
        JOIN
            participants curr_p ON c.id = curr_p.chat_id
        JOIN
            participants other_p ON c.id = other_p.chat_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, last_name FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, last_name FROM patient_info) curr_user ON curr_p.user_id = curr_user.user_id
        LEFT JOIN
            (SELECT doctor_id AS user_id, first_name, last_name FROM doctor_info
            UNION
            SELECT patient_id AS user_id, first_name, last_name FROM patient_info) other_user ON other_p.user_id = other_user.user_id
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
            curr_p.deleted_at IS NULL 
        AND
            c.deleted_at IS NULL 
        ORDER BY
            lm.created_at DESC; 
        `,
			currentUserID, selectedUserID).Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID, &chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.LastNameRecipient, &chat.LastMessage, &chat.LastMessageCreatedAt)
		chat.UpdatedAt = time.Now()
		if err != nil {
			log.Printf("Error finding or creating chat 1: %v", err)
			return nil, err
		}
	} else if err != nil {
		log.Printf("Error finding or creating chat 2: %v", err)
		return nil, err
	}

	chats := []models.Chat{chat}
	return chats, nil
}

func FindOrCreateChatWithUser(c *gin.Context, pool *pgxpool.Pool) {
	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acquire a database connection"})
		return
	}
	defer conn.Release()

	currentUserID := c.Query("currentUserId")
	selectedUserID := c.Query("selectedUserId")
	currentUserType := c.Query("currentUserType")
	selectedUserType := c.Query("selectedUserType")

	if currentUserType == "patient" && selectedUserType == "doctor" {
		hasAppointment, err := checkPatientDoctorConnection(conn, currentUserID, selectedUserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check appointments"})
			return
		}
		if !hasAppointment {
			c.JSON(http.StatusForbidden, gin.H{"error": "You cannot message this doctor without an appointment"})
			return
		}
	}

	chats, err := findOrCreateChatWithUser(conn, currentUserID, selectedUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

func isPatientFollowingDoctor(conn *pgxpool.Conn, patientID, doctorID string) (bool, error) {
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

func hasPatientDoctorAppointment(conn *pgxpool.Conn, patientID, doctorID string) (bool, error) {
	var count int
	err := conn.QueryRow(context.Background(), `
        SELECT COUNT(*) FROM reservations
        WHERE patient_id = $1 AND doctor_id = $2 AND canceled = FALSE
    `, patientID, doctorID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func checkPatientDoctorConnection(conn *pgxpool.Conn, patientID, doctorID string) (bool, error) {
	follows, err := isPatientFollowingDoctor(conn, patientID, doctorID)
	if err != nil {
		return false, err
	}
	if !follows {
		return false, nil
	}

	hasAppointment, err := hasPatientDoctorAppointment(conn, patientID, doctorID)
	if err != nil {
		return false, err
	}
	return hasAppointment, nil
}

func GetUserImage(c *gin.Context, pool *pgxpool.Pool) {
	conn, err := pool.Acquire(c.Request.Context())
	if err != nil {
		log.Println("Failed to acquire a database connection :", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acquire a database connection"})
		return
	}
	defer conn.Release()

	userID := c.Param("userId")
	userType := c.Query("userType")

	log.Printf("GetUserImage called with userID: %s, userType: %s", userID, userType)

	var imageUrl string

	if userType == "doctor" {
		err = conn.QueryRow(c.Request.Context(), `SELECT profile_photo_url FROM doctor_info WHERE doctor_id = $1`, userID).Scan(&imageUrl)
		if err != nil {
			if err == pgx.ErrNoRows {
				log.Println("Doctor not found:", err)
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			} else {
				log.Println("Error fetching doctor image:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			}
			return
		}

	} else if userType == "patient" {
		err = conn.QueryRow(c.Request.Context(), `SELECT profile_photo_url FROM patient_info WHERE patient_id = $1`, userID).Scan(&imageUrl)
		if err != nil {
			if err == pgx.ErrNoRows {
				log.Println("Patient not found:", err)
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			} else {
				log.Println("Error fetching patient image:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			}
			return
		}

	} else {
		log.Println("Invalid userType:", userType)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user type"})
		return
	}
	presignedUrl, err := GetImageURL(c, imageUrl)
	c.JSON(http.StatusOK, gin.H{"imageUrl": presignedUrl})
	return
}
