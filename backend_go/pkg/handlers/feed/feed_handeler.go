package feed

import (
	"log"
	"net/http"

	"healthcare_backend/pkg/services/feed"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FeedHandler struct {
	feedService *feed.FeedService
}

func NewFeedHandler(feedService *feed.FeedService) *FeedHandler {
	return &FeedHandler{
		feedService: feedService,
	}
}

func (h *FeedHandler) CreateBlogPost(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication required"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		log.Println("User type not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	if userType != "doctor" {
		log.Println("Non-doctor user attempted to create post")
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can create posts"})
		return
	}

	var req struct {
		Title     string   `json:"title" binding:"required"`
		Content   string   `json:"content" binding:"required"`
		Specialty string   `json:"specialty" binding:"required"`
		Keywords  []string `json:"keywords" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("Invalid request body : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title, content, specialty, and keywords are required"})
		return
	}

	err := h.feedService.CreateBlogPost(req.Title, req.Content, userID.(string), req.Specialty, req.Keywords)
	if err != nil {
		log.Println("Failed to create post : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post created successfully"})
}

func (h *FeedHandler) LikePost(c *gin.Context) {
	postIDStr := c.Param("postID")

	userIDStr, exists := c.Get("userId")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication required"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		log.Println("User type not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		log.Println("Invalid post ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		log.Println("Invalid user ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = h.feedService.LikePost(postID, userID, userType.(string))
	if err != nil {
		log.Println("Failed to like post : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post liked successfully"})
}

func (h *FeedHandler) UnlikePost(c *gin.Context) {
	postIDStr := c.Param("postID")

	userIDStr, exists := c.Get("userId")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication required"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		log.Println("User type not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		log.Println("Invalid post ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		log.Println("Invalid user ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = h.feedService.UnlikePost(postID, userID, userType.(string))
	if err != nil {
		log.Println("Failed to unlike post : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post unliked successfully"})
}

func (h *FeedHandler) AddComment(c *gin.Context) {
	postIDStr := c.Param("postID")

	userIDStr, exists := c.Get("userId")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication required"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		log.Println("User type not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		log.Println("Invalid post ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		log.Println("Invalid user ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("Content is required : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content is required"})
		return
	}

	comment, err := h.feedService.AddComment(postID, userID, userType.(string), req.Content)
	if err != nil {
		log.Println("Failed to add comment : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment added successfully", "comment": comment})
}

func (h *FeedHandler) GetComments(c *gin.Context) {
	postIDStr := c.Param("postID")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	comments, err := h.feedService.GetComments(postID)
	if err != nil {
		log.Println("Failed to retrieve comments : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"comments": comments})
}

func (h *FeedHandler) GetFeed(c *gin.Context) {
	userIDStr, exists := c.Get("userId")
	if !exists {
		log.Println("GetFeed: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication required"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		log.Println("GetFeed: User type not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	specialty := c.Query("specialty")
	searchQuery := c.Query("search")

	posts, err := h.feedService.GetFeed(userType.(string), userIDStr.(string), specialty, searchQuery)
	if err != nil {
		log.Printf("GetFeed: Service error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve feed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

func (h *FeedHandler) GetPostByID(c *gin.Context) {
	postIDStr := c.Param("postID")

	userIDStr, exists := c.Get("userId")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication required"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		log.Println("User type not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		log.Println("Invalid user ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		log.Println("Invalid post ID : ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	post, err := h.feedService.GetPostByID(postID, userID, userType.(string))
	if err != nil {
		log.Printf("Failed to fetch post by ID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve post"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *FeedHandler) GetDoctorPosts(c *gin.Context) {
	userID := c.Param("userId")

	if userID == "" {
		log.Println("Missing userID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	posts, err := h.feedService.GetDoctorPosts(userID)
	if err != nil {
		log.Println("Failed to retrieve blog posts: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve blog posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

func (h *FeedHandler) EditDoctorPost(c *gin.Context) {
	postID := c.Param("postID")

	userID, exists := c.Get("userId")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication required"})
		return
	}

	userType, exists := c.Get("userType")
	if !exists {
		log.Println("User type not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
		return
	}

	if userType != "doctor" {
		log.Println("Non-doctor user attempted to edit post")
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can edit posts"})
		return
	}

	var requestBody struct {
		Title     string   `json:"title" binding:"required"`
		Content   string   `json:"content" binding:"required"`
		Specialty string   `json:"specialty" binding:"required"`
		Keywords  []string `json:"keywords" binding:"required"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err := h.feedService.EditDoctorPost(postID, userID.(string), requestBody.Title, requestBody.Content, requestBody.Specialty, requestBody.Keywords)
	if err != nil {
		if err == feed.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		log.Println("Failed to update blog post: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully"})
}

func (h *FeedHandler) DeleteDoctorPost(c *gin.Context) {
	postID := c.Param("postID")

	err := h.feedService.DeleteDoctorPost(postID)
	if err != nil {
		log.Println("Failed to delete post: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post and associated data deleted successfully"})
}
