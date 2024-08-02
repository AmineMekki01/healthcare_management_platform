package services

// ... other imports
import (
	"backend_go/models"
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type CombinedUser struct {
	UserID    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// GetChatsForUser retrieves all chat sessions for the specified user.
func GetChatsForUser(db *pgx.Conn, userID string) ([]models.Chat, error) {
	const query = `
    SELECT
        c.id,
        MAX(c.updated_at) AS updated_at,
        $1 AS sender_user_id,
        CASE 
            WHEN curr_p.user_id = other_p.user_id THEN curr_p.user_id 
            WHEN curr_p.user_id::text = $1 THEN other_p.user_id 
            ELSE curr_p.user_id 
        END AS recipient_user_id,
        MAX(CASE 
            WHEN curr_user.user_id::text = $1 THEN curr_user.first_name 
            ELSE other_user.first_name 
        END) AS first_name_sender,
        MAX(CASE 
            WHEN curr_user.user_id::text = $1 THEN curr_user.last_name 
            ELSE other_user.last_name 
        END) AS last_name_sender,
        MAX(CASE 
            WHEN other_user.user_id::text != $1 THEN other_user.first_name 
            ELSE curr_user.first_name 
        END) AS first_name_recipient,
        MAX(CASE 
            WHEN other_user.user_id::text != $1 THEN other_user.last_name 
            ELSE curr_user.last_name 
        END) AS last_name_recipient,
        MAX(lm.content) AS latest_message_content,
        MAX(lm.created_at) AS latest_message_time
    FROM
        chats c
    JOIN
        participants curr_p ON c.id = curr_p.chat_id
    JOIN
        participants other_p ON c.id = other_p.chat_id AND curr_p.user_id != other_p.user_id
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
        (curr_p.user_id::text = $1 OR other_p.user_id::text = $1)
    AND
        curr_p.deleted_at IS NULL 
    AND
       c.deleted_at IS NULL 
    GROUP BY
        c.id, recipient_user_id
    ORDER BY
        latest_message_time DESC;
    `
	rows, err := db.Query(context.Background(), query, userID)
	if err != nil {
		log.Println("error querying chats for user: ", err)
		return nil, fmt.Errorf("error querying chats for user %s: %v", userID, err)
	}
	defer rows.Close()
	log.Println("rowsssss: ", rows)
	var chats []models.Chat
	for rows.Next() {
		var chat models.Chat
		if err := rows.Scan(&chat.ID, &chat.UpdatedAt, &chat.SenderUserID, &chat.RecipientUserID, &chat.FirstNameSender, &chat.LastNameSender, &chat.FirstNameRecipient, &chat.LastNameRecipient, &chat.LastMessage, &chat.LastMessageCreatedAt); err != nil {
			log.Println("error scanning chat row: ", err)
			return nil, fmt.Errorf("error scanning chat row: %v", err)
		}
		log.Println("chat: ", chat)
		chats = append(chats, chat)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating chat rows: %v", err)
	}

	return chats, nil
}

func ListChatsForUser(db *pgx.Conn, c *gin.Context) {
	userID := c.Query("userID")
	log.Println("userID: ", userID)
	chats, err := GetChatsForUser(db, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chats"})
		return
	}
	c.JSON(http.StatusOK, chats)
}

type CombinedMessage struct {
	ChatID      string    `json:"chat_id"`
	SenderID    string    `json:"sender_id"`
	RecipientID string    `json:"recipient_id"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
}

// SendMessage - sends a new message to a chat
func SendMessage(db *pgx.Conn, c *gin.Context) {
	var newMessage CombinedMessage
	if err := c.BindJSON(&newMessage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message format: " + err.Error()})
		return
	}

	err := storeMessage(db, newMessage.SenderID, newMessage.ChatID, newMessage.Content, newMessage.CreatedAt)
	if err != nil {
		log.Printf("Failed to store message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "Message sent successfully"})
}

func storeMessage(db *pgx.Conn, senderID string, chatID string, content string, createdAT time.Time) error {
	_, err := db.Exec(context.Background(),
		`INSERT INTO messages (chat_id, sender_id, content, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW())`,
		chatID, senderID, content, createdAT)
	return err
}

func SearchUsers(c *gin.Context, pool *pgxpool.Pool) {
	inputName := c.Param("username")
	currentUserId := c.Param("userId")

	var combinedUsers []CombinedUser

	queries := map[string]string{
		"patient": `SELECT patient_id, first_name, last_name FROM patient_info WHERE LOWER(first_name || ' ' || last_name) LIKE LOWER($1) AND patient_id != $2`,
		"doctor":  `SELECT doctor_id, first_name, last_name FROM doctor_info WHERE LOWER(first_name || ' ' || last_name) LIKE LOWER($1) AND doctor_id != $2`,
	}

	for userType, query := range queries {
		rows, err := pool.Query(context.Background(), query, inputName+"%", currentUserId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error querying " + userType + " table"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var user CombinedUser
			err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName)
			if err != nil {
				continue
			}
			combinedUsers = append(combinedUsers, user)
		}
	}

	c.JSON(http.StatusOK, gin.H{"users": combinedUsers})
}

func createChat(db *pgx.Conn, user1ID, user2ID int, user1Type, user2Type string) (int, error) {
	tx, err := db.Begin(context.Background())
	if err != nil {
		log.Println("Error starting transaction:", err)
		return 0, err
	}

	// Create a new chat
	var chatID int
	err = tx.QueryRow(context.Background(),
		`INSERT INTO chats (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id`).Scan(&chatID)
	if err != nil {
		log.Println("Error creating chat:", err)
		tx.Rollback(context.Background())
		return 0, err
	}

	// Add participants
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

func GetMessagesForChat(db *pgx.Conn, c *gin.Context) {
	chatID := c.Param("chatId")
	log.Println("chatID: ", chatID)
	rows, err := db.Query(context.Background(), `
    SELECT id, chat_id, sender_id, content, created_at, updated_at FROM messages 
    WHERE chat_id = $1 AND deleted_at IS NULL
    ORDER BY created_at ASC;`, chatID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.CreatedAt, &msg.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
			log.Println("Failed to retrieve messages : ", err)
			return
		}
		messages = append(messages, msg)
		log.Println("messages: ", messages)
	}
	if len(messages) == 0 {
		log.Println("No messages found for chat ID:", chatID)
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func findOrCreateChatWithUser(db *pgx.Conn, currentUserID, selectedUserID string) ([]models.Chat, error) {

	// Step 1: Check for an existing chat
	var chat models.Chat
	err := db.QueryRow(context.Background(),
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
		// Step 2: No existing chat, so create a new one
		tx, err := db.Begin(context.Background())
		if err != nil {
			log.Println("Error starting transaction:", err)
			return nil, err
		}
		err = tx.QueryRow(context.Background(),
			`INSERT INTO chats (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id`).Scan(&chat.ID)
		if err != nil {
			log.Println("Ther was an error in creating a chat : ", err)
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
			log.Println("Ther was an error in adding participants : ", err)
			tx.Rollback(context.Background())
			return nil, err
		}

		err = tx.Commit(context.Background())
		if err != nil {
			return nil, err
		}

		err = db.QueryRow(context.Background(),
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
		log.Println("chat : ", chat)
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

func FindOrCreateChatWithUser(db *pgx.Conn, c *gin.Context) {
	currentUserID := c.Query("currentUserId")
	selectedUserID := c.Query("selectedUserId")
	log.Println("currentUserId: ", currentUserID)
	log.Println("selectedUserId: ", selectedUserID)
	chats, err := findOrCreateChatWithUser(db, currentUserID, selectedUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}
