package chat

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"healthcare_backend/pkg/config"
	chatService "healthcare_backend/pkg/services/chat"
	"healthcare_backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

type ChatHandler struct {
	chatService *chatService.ChatService
	config      *config.Config
	wsClients   map[string]*utils.WSClient
}

func NewChatHandler(db *pgxpool.Pool, cfg *config.Config, wsClients map[string]*utils.WSClient) *ChatHandler {
	return &ChatHandler{
		chatService: chatService.NewChatService(db, cfg),
		config:      cfg,
		wsClients:   wsClients,
	}
}

func (h *ChatHandler) GetChatsForUser(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	chats, err := h.chatService.GetChatsForUser(userID)
	if err != nil {
		log.Printf("Error getting chats for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chats"})
		return
	}

	c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	var request struct {
		ChatID      string  `json:"chatId" binding:"required"`
		RecipientID string  `json:"recipientId" binding:"required"`
		Content     string  `json:"content" binding:"required"`
		Key         *string `json:"key"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := chatService.CombinedMessage{
		ChatID:      request.ChatID,
		SenderID:    userID,
		RecipientID: request.RecipientID,
		Content:     request.Content,
		CreatedAt:   time.Now(),
		Key:         request.Key,
	}

	if err := h.chatService.SendMessage(message); err != nil {
		log.Printf("Error sending message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	if wsClient, exists := h.wsClients[request.RecipientID]; exists {
		wsMessage := gin.H{
			"type":         "new_message",
			"chat_id":      request.ChatID,
			"sender_id":    userID,
			"recipient_id": request.RecipientID,
			"content":      request.Content,
			"created_at":   message.CreatedAt,
		}

		if messageBytes, err := json.Marshal(wsMessage); err == nil {
			select {
			case wsClient.Send <- messageBytes:
			default:
				close(wsClient.Send)
				delete(h.wsClients, request.RecipientID)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message sent successfully"})
}

func (h *ChatHandler) UploadImage(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		log.Printf("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		file, header, err = c.Request.FormFile("file")
		if err != nil {
			log.Printf("Error getting file from request: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get image from request"})
			return
		}
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/jpg" {
		log.Println("Invalid image type:", contentType)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only JPEG and PNG images are allowed"})
		return
	}

	if header.Size > 5*1024*1024 {
		log.Println("File size exceeds 5MB limit")
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 5MB limit"})
		return
	}

	presignedURL, key, err := h.chatService.UploadImage(file, header)
	if err != nil {
		log.Printf("Error uploading image: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"presigned_url": presignedURL,
		"key":           key,
		"s3_key":        key,
	})
}

func (h *ChatHandler) SearchUsers(c *gin.Context) {
	userID := c.GetString("userId")
	userType := c.GetString("userType")

	if userID == "" || userType == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User credentials not found"})
		return
	}

	inputName := c.Query("name")
	if inputName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name parameter is required"})
		return
	}

	users, err := h.chatService.SearchUsers(inputName, userID, userType)
	if err != nil {
		log.Printf("Error searching users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *ChatHandler) GetMessagesForChat(c *gin.Context) {
	userID := c.GetString("userId")

	if userID == "" {
		log.Printf("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	chatID := c.Param("chatId")

	if chatID == "" {
		log.Printf("Chat ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	messages, err := h.chatService.GetMessagesForChat(chatID)
	if err != nil {
		log.Printf("Error getting messages for chat %s: %v", chatID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
	})
}

func (h *ChatHandler) FindOrCreateChatWithUser(c *gin.Context) {
	userID := c.GetString("userId")
	userType := c.GetString("userType")

	if userID == "" || userType == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User credentials not found"})
		return
	}

	var request struct {
		SelectedUserID   string `json:"selected_user_id" binding:"required"`
		SelectedUserType string `json:"selected_user_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chats, err := h.chatService.FindOrCreateChatWithUser(userID, request.SelectedUserID, userType, request.SelectedUserType)
	if err != nil {
		log.Printf("Error finding/creating chat: %v", err)

		if err.Error() == "you cannot message this doctor without an appointment" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find or create chat"})
		return
	}

	c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) GetUserImage(c *gin.Context) {
	userID := c.Param("userId")
	userType := c.Param("userType")

	if userID == "" || userType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and user type are required"})
		return
	}

	imageURL, err := h.chatService.GetUserImage(userID, userType)
	if err != nil {
		log.Printf("Error getting user image: %v", err)
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"image_url": imageURL})
}

func (h *ChatHandler) SearchUsersLegacy(c *gin.Context) {
	inputName := c.Param("username")
	currentUserID := c.Param("userId")
	currentUserType := c.Query("userType")

	if inputName == "" || currentUserID == "" || currentUserType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username, userID, and userType are required"})
		return
	}

	users, err := h.chatService.SearchUsers(inputName, currentUserID, currentUserType)
	if err != nil {
		log.Printf("Error searching users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (h *ChatHandler) FindOrCreateChatWithUserLegacy(c *gin.Context) {
	currentUserID := c.Query("currentUserId")
	selectedUserID := c.Query("selectedUserId")
	currentUserType := c.Query("currentUserType")
	selectedUserType := c.Query("selectedUserType")

	if currentUserID == "" || selectedUserID == "" || currentUserType == "" || selectedUserType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All user parameters are required"})
		return
	}

	chats, err := h.chatService.FindOrCreateChatWithUser(currentUserID, selectedUserID, currentUserType, selectedUserType)
	if err != nil {
		log.Printf("Error finding/creating chat: %v", err)

		if err.Error() == "you cannot message this doctor without an appointment" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find or create chat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

func (h *ChatHandler) WebSocketHandler(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	conn, err := utils.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	client := &utils.WSClient{
		Conn:   conn,
		Send:   make(chan []byte, 256),
		UserID: userID,
	}

	h.wsClients[userID] = client

	go h.handleWebSocketMessages(client)
	go h.handleWebSocketWrites(client)
}

func (h *ChatHandler) handleWebSocketMessages(client *utils.WSClient) {
	defer func() {
		delete(h.wsClients, client.UserID)
		client.Conn.Close()
	}()

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		var wsMessage map[string]interface{}
		if err := json.Unmarshal(message, &wsMessage); err != nil {
			log.Printf("Error unmarshaling WebSocket message: %v", err)
			continue
		}

		messageType, ok := wsMessage["type"].(string)
		if !ok {
			continue
		}

		switch messageType {
		case "ping":
			pongMessage := map[string]string{"type": "pong"}
			if pongBytes, err := json.Marshal(pongMessage); err == nil {
				select {
				case client.Send <- pongBytes:
				default:
					close(client.Send)
					return
				}
			}
		}
	}
}

func (h *ChatHandler) handleWebSocketWrites(client *utils.WSClient) {
	defer client.Conn.Close()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(1, []byte{})
				return
			}

			if err := client.Conn.WriteMessage(1, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}
