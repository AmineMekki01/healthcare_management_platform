package services

import (
	"backend_go/models"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/microcosm-cc/bluemonday"
)

func CreateBlogPost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Title   string `json:"title" binding:"required"`
			Content string `json:"content" binding:"required"`
			UserID  string `json:"userId" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			log.Println("Title and content are required : ", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Title and content are required"})
			return
		}

		cleanContent := sanitizeHTML(req.Content)

		_, err := db.Exec(context.Background(), `
            INSERT INTO blog_posts (doctor_id, title, content, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
        `, req.UserID, req.Title, cleanContent, time.Now(), time.Now())

		if err != nil {
			log.Println("Failed to create post : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Post created successfully"})
	}
}

func sanitizeHTML(content string) string {
	policy := bluemonday.UGCPolicy()
	return policy.Sanitize(content)
}

func LikePost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		postIDStr := c.Param("postID")
		userType := c.Query("userType")
		userIDStr := c.Query("userId")
		log.Println("userIDStr : ", userIDStr)
		log.Println("userType : ", userType)
		postID, err := uuid.Parse(postIDStr)
		if err != nil {
			log.Println("Invalid post ID : ", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
			return
		}
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			log.Println("Invalid user ID : ", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		_, err = db.Exec(context.Background(), `
            INSERT INTO likes (post_id, user_id, user_type)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
        `, postID, userID, userType)
		if err != nil {
			log.Println("Failed to like post : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like post"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Post liked successfully"})
	}
}

func UnlikePost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		postIDStr := c.Param("postID")
		userType := c.Query("userType")
		userIDStr := c.Query("userId")

		postID, err := uuid.Parse(postIDStr)
		if err != nil {
			log.Println("Invalid post ID : ", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
			return
		}
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			log.Println("Invalid user ID : ", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		_, err = db.Exec(context.Background(), `
            DELETE FROM likes
            WHERE post_id = $1 AND user_id = $2 AND user_type = $3
        `, postID, userID, userType)
		if err != nil {
			log.Println("Failed to unlike post : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike post"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Post unliked successfully"})
	}
}

func AddComment(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		postIDStr := c.Param("postID")
		userType := c.Query("userType")
		userIDStr := c.Query("userId")
		log.Println("userIDStr : ", userIDStr)
		log.Println("userType : ", userType)
		postID, err := uuid.Parse(postIDStr)
		if err != nil {
			log.Println("Invalid post ID : ", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
			return
		}
		userID, err := uuid.Parse(userIDStr)
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

		var commentID uuid.UUID
		err = db.QueryRow(context.Background(), `
            INSERT INTO comments (post_id, user_id, user_type, content)
            VALUES ($1, $2, $3, $4)
            RETURNING comment_id
        `, postID, userID, userType, req.Content).Scan(&commentID)
		if err != nil {
			log.Println("Failed to add comment : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
			return
		}

		var comment models.Comment
		err = db.QueryRow(context.Background(), `
            SELECT
                c.comment_id,
                c.post_id,
                c.user_id,
                COALESCE(di.first_name || ' ' || di.last_name, pi.first_name || ' ' || pi.last_name) AS user_name,
                COALESCE(di.profile_photo_url, pi.profile_photo_url) AS user_avatar,
                c.content,
                c.created_at
            FROM comments c
            LEFT JOIN doctor_info di ON c.user_id = di.doctor_id AND c.user_type = 'doctor'
            LEFT JOIN patient_info pi ON c.user_id = pi.patient_id AND c.user_type = 'patient'
            WHERE c.comment_id = $1
        `, commentID).Scan(
			&comment.CommentID,
			&comment.PostID,
			&comment.UserID,
			&comment.UserName,
			&comment.UserAvatar,
			&comment.Content,
			&comment.CreatedAt,
		)
		if err != nil {
			log.Println("Failed to retrieve new comment : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve new comment"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Comment added successfully", "comment": comment})
	}
}

func GetComments(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		postIDStr := c.Param("postID")
		postID, err := uuid.Parse(postIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
			return
		}

		rows, err := db.Query(context.Background(), `
            SELECT
                c.comment_id,
                c.post_id,
                c.user_id,
                COALESCE(di.first_name || ' ' || di.last_name, pi.first_name || ' ' || pi.last_name) AS user_name,
                COALESCE(di.profile_photo_url, pi.profile_photo_url) AS user_avatar,
                c.content,
                c.created_at
            FROM comments c
            LEFT JOIN doctor_info di ON c.user_id = di.doctor_id AND c.user_type = 'doctor'
            LEFT JOIN patient_info pi ON c.user_id = pi.patient_id AND c.user_type = 'patient'
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
        `, postID)
		if err != nil {
			log.Println("Failed to retrieve comments : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve comments"})
			return
		}
		defer rows.Close()

		var comments []models.Comment
		for rows.Next() {
			var comment models.Comment
			err := rows.Scan(
				&comment.CommentID,
				&comment.PostID,
				&comment.UserID,
				&comment.UserName,
				&comment.UserAvatar,
				&comment.Content,
				&comment.CreatedAt,
			)
			if err != nil {
				log.Println("Failed to scan comments : ", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan comments"})
				return
			}
			comments = append(comments, comment)
		}

		c.JSON(http.StatusOK, gin.H{"comments": comments})
	}
}

func GetFeed(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userType := c.Query("userType")
		userID := c.Query("userId")

		if userType == "" || userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "userType and userId are required"})
			return
		}

		rows, err := db.Query(context.Background(), `
            SELECT doctor_id FROM followers
            WHERE follower_id = $1 AND follower_type = $2
        `, userID, userType)
		if err != nil {
			log.Println("Failed to retrieve followers : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve followers"})
			return
		}
		defer rows.Close()

		var doctorIDs []uuid.UUID
		for rows.Next() {
			var doctorID uuid.UUID
			err := rows.Scan(&doctorID)
			if err != nil {
				log.Println("Failed to retrieve doctor IDs : ", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve doctor IDs"})
				return
			}
			log.Println("single doc id : ", doctorID)
			doctorIDs = append(doctorIDs, doctorID)
		}

		log.Println("doctor ids : ", doctorIDs)
		if userType == "doctor" {
			doctorUUID, err := uuid.Parse(userID)
			if err != nil {
				log.Println("Invalid doctor ID : ", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
				return
			}
			doctorIDs = append(doctorIDs, doctorUUID)
		}

		if len(doctorIDs) == 0 {
			log.Println("nod doctors ")

			c.JSON(http.StatusOK, gin.H{"posts": []models.BlogPost{}})
			return
		}

		postsRows, err := db.Query(context.Background(), `
            SELECT
                bp.post_id,
                bp.doctor_id,
                bp.title,
                bp.content,
                bp.created_at,
                bp.updated_at,
                di.first_name || ' ' || di.last_name AS doctor_name,
                di.profile_photo_url AS doctor_avatar,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = bp.post_id) AS likes_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = bp.post_id) AS comments_count,
                EXISTS (
                    SELECT 1 FROM likes l
                    WHERE l.post_id = bp.post_id AND l.user_id = $2 AND l.user_type = $3
                ) AS is_liked
            FROM blog_posts bp
            JOIN doctor_info di ON bp.doctor_id = di.doctor_id
            WHERE bp.doctor_id = ANY($1)
            ORDER BY bp.created_at DESC
        `, doctorIDs, userID, userType)
		if err != nil {
			log.Println("Failed to retrieve blog posts : ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve blog posts"})
			return
		}
		defer postsRows.Close()

		var posts []models.BlogPost
		for postsRows.Next() {
			var post models.BlogPost
			err := postsRows.Scan(
				&post.PostID,
				&post.DoctorID,
				&post.Title,
				&post.Content,
				&post.CreatedAt,
				&post.UpdatedAt,
				&post.DoctorName,
				&post.DoctorAvatar,
				&post.LikesCount,
				&post.CommentsCount,
				&post.IsLiked,
			)
			if err != nil {
				log.Println("Failed to scan blog posts: ", err)

				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan blog posts"})
				return
			}
			posts = append(posts, post)
		}

		c.JSON(http.StatusOK, gin.H{"posts": posts})
	}
}

func GetPostByID(c *gin.Context, pool *pgxpool.Pool) {
	postIDStr := c.Param("postID")
	userType := c.Query("userType")
	userIDStr := c.Query("userId")
	userID, err := uuid.Parse(userIDStr)
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
	query := `
    SELECT 
        bp.post_id,
        d.first_name || ' ' || d.last_name AS doctor_name,
        d.profile_photo_url AS doctor_avatar,
        bp.content,
        bp.created_at,
        (SELECT COUNT(*) FROM likes WHERE post_id = bp.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = bp.post_id) AS comments_count,
		EXISTS (
                    SELECT 1 FROM likes l
                    WHERE l.post_id = bp.post_id AND l.user_id = $2 AND l.user_type = $3
                ) AS is_liked
    FROM blog_posts bp
    JOIN doctor_info d ON bp.doctor_id = d.doctor_id
    WHERE bp.post_id = $1;
    `
	var post models.BlogPost

	row := pool.QueryRow(context.Background(), query, postID, userID, userType)
	err = row.Scan(&post.PostID, &post.DoctorName, &post.DoctorAvatar, &post.Content, &post.CreatedAt, &post.LikesCount, &post.CommentsCount, &post.IsLiked)
	if err != nil {
		log.Printf("Failed to fetch post by ID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve post"})
		return
	}

	c.JSON(http.StatusOK, post)
}
