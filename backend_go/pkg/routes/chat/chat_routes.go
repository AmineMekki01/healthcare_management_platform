package chat

import (
	"healthcare_backend/pkg/config"
	chatHandler "healthcare_backend/pkg/handlers/chat"
	"healthcare_backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func SetupChatRoutes(router *gin.RouterGroup, db *pgxpool.Pool, cfg *config.Config, wsClients map[string]*utils.WSClient) {
	handler := chatHandler.NewChatHandler(db, cfg, wsClients)

	chatRoutes := router.Group("/chats")
	chatRoutes.GET("", handler.GetChatsForUser)
	chatRoutes.GET("/search/:username/:userId", handler.SearchUsersLegacy)
	chatRoutes.GET("/:chatId/messages", handler.GetMessagesForChat)
	chatRoutes.GET("/find-or-create", handler.FindOrCreateChatWithUserLegacy)

	chatRoutes.POST("/send-message", handler.SendMessage)
	chatRoutes.POST("/upload-image", handler.UploadImage)
	chatRoutes.GET("/ws", handler.WebSocketHandler)
}
