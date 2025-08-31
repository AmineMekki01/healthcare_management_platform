package routes

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/handlers"
	"healthcare_backend/pkg/middleware"
	"healthcare_backend/pkg/routes/appointment"
	"healthcare_backend/pkg/routes/auth"
	"healthcare_backend/pkg/routes/chat"
	"healthcare_backend/pkg/routes/doctor"
	"healthcare_backend/pkg/routes/feed"
	"healthcare_backend/pkg/routes/follow"
	medicalrecords "healthcare_backend/pkg/routes/medical-records"
	"healthcare_backend/pkg/routes/patient"
	"healthcare_backend/pkg/routes/receptionist"
	"healthcare_backend/pkg/routes/search"
	"healthcare_backend/pkg/services"
	"healthcare_backend/pkg/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupRoutes(router *gin.Engine, db *pgxpool.Pool, cfg *config.Config) {
	wsClients := make(map[string]*utils.WSClient)

	router.Static("/user_photos", "./user_photos")
	router.Static("/uploads", "./uploads")

	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://10.188.27.252:3000", "http://192.168.1.239:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	api := router.Group("/api/v1")

	auth.SetupPublicAuthRoutes(api, db, cfg)

	doctor.SetupPublicDoctorRoutes(api, db, cfg)

	search.SetupPublicSearchRoutes(api, db, cfg)

	router.GET("/ws", func(c *gin.Context) {
		userID := c.Query("userId")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
			return
		}

		conn, err := utils.Upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "WebSocket upgrade failed"})
			return
		}

		client := &utils.WSClient{
			UserID: userID,
			Conn:   conn,
			Send:   make(chan []byte, 256),
		}

		wsClients[userID] = client

		go handleWebSocketConnection(client, wsClients)
	})

	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		auth.SetupProtectedAuthRoutes(protected, db, cfg)

		search.SetupSearchRoutes(protected, db, cfg)

		appointment.SetupAppointmentRoutes(protected, db, cfg)

		chat.SetupChatRoutes(protected, db, cfg, wsClients)

		medicalrecords.SetupMedicalRecordsRoutes(protected, db, cfg)

		feed.SetupFeedRoutes(protected, db, cfg)

		follow.SetupFollowRoutes(protected, db, cfg)

		patient.SetupPatientRoutes(protected, db, cfg)

		protected.GET("/users/image/:userId/:userType", func(c *gin.Context) {
			utils.GetUserImageRoute(c, db)
		})

		settingsService := services.NewSettingsService(db, cfg)
		settingsHandler := handlers.NewSettingsHandler(settingsService)
		protected.GET("/user/:userId", settingsHandler.GetUserByID)
		protected.PUT("/user/:userId", settingsHandler.UpdateUserInfo)

		protected.GET("/doctor/additional-info/:doctorId", settingsHandler.GetDoctorAdditionalInfo)
		protected.PUT("/doctor/additional-info/:doctorId", settingsHandler.UpdateDoctorAdditionalInfo)

		settings := protected.Group("/settings")
		{
			settings.GET("/user/:userId", settingsHandler.GetUserByID)
			settings.PUT("/user/:userId", settingsHandler.UpdateUserInfo)
			settings.GET("/doctor/:doctorId/additional", settingsHandler.GetDoctorAdditionalInfo)
			settings.PUT("/doctor/:doctorId/additional", settingsHandler.UpdateDoctorAdditionalInfo)
		}

		doctorOnly := protected.Group("/")
		doctorOnly.Use(middleware.DoctorOnly())
		doctor.SetupDoctorOnlyRoutes(doctorOnly, db, cfg)

		receptionist.SetupReceptionistRoutes(router, db, cfg)
	}
}

func handleWebSocketConnection(client *utils.WSClient, wsClients map[string]*utils.WSClient) {
	defer func() {
		delete(wsClients, client.UserID)
		client.Conn.Close()
		log.Printf("User %s disconnected. Total clients: %d", client.UserID, len(wsClients))
	}()

	go func() {
		defer client.Conn.Close()
		for {
			message, ok := <-client.Send
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				break
			}
			client.Conn.WriteMessage(websocket.TextMessage, message)
		}
	}()

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket read error for user %s: %v", client.UserID, err)
			break
		}

		var msg struct {
			ChatID      string `json:"chat_id"`
			SenderID    string `json:"sender_id"`
			RecipientID string `json:"recipient_id"`
			Content     string `json:"content"`
		}

		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error parsing WebSocket message: %v", err)
			continue
		}

		if recipient, exists := wsClients[msg.RecipientID]; exists {
			select {
			case recipient.Send <- message:
				log.Printf("Message forwarded from %s to %s", msg.SenderID, msg.RecipientID)
			default:
				log.Printf("Recipient %s channel is full, message dropped", msg.RecipientID)
			}
		} else {
			log.Printf("Recipient %s not connected", msg.RecipientID)
		}
	}
}
