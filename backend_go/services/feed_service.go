package services

import (
	"backend_go/models"
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/lib/pq"
	"github.com/microcosm-cc/bluemonday"
)

func CreateBlogPost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Title     string   `json:"title" binding:"required"`
			Content   string   `json:"content" binding:"required"`
			UserID    string   `json:"userId" binding:"required"`
			Specialty string   `json:"specialty" binding:"required"`
			Keywords  []string `json:"keywords" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			log.Println("Title and content are required : ", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Title and content are required"})
			return
		}

		cleanContent := sanitizeHTML(req.Content)

		_, err := db.Exec(context.Background(), `
            INSERT INTO blog_posts (doctor_id, title, content, specialty, keywords, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, req.UserID, req.Title, cleanContent, req.Specialty, pq.Array(req.Keywords), time.Now(), time.Now())

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
		specialty := c.Query("specialty")
		searchQuery := c.Query("search")
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
			doctorIDs = append(doctorIDs, doctorID)
		}

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
			log.Println("No doctors found.")
			c.JSON(http.StatusOK, gin.H{"posts": []models.BlogPost{}})
			return
		}

		query := `
            SELECT
                bp.post_id,
                bp.doctor_id,
                bp.title,
                bp.content,
                bp.specialty,
                bp.keywords,
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
        `
		params := []interface{}{doctorIDs, userID, userType}
		paramCount := 4

		if specialty != "" {
			query += fmt.Sprintf(" AND bp.specialty = $%d", paramCount)
			params = append(params, specialty)
			paramCount++
		}

		if searchQuery != "" {

			keywords := strings.Fields(strings.ToLower(searchQuery))
			for _, keyword := range keywords {
				query += fmt.Sprintf(" AND EXISTS (SELECT 1 FROM unnest(bp.keywords) k WHERE LOWER(k) LIKE $%d)", paramCount)
				params = append(params, "%"+keyword+"%")
				paramCount++
			}
		}

		query += " ORDER BY bp.created_at DESC"

		postsRows, err := db.Query(context.Background(), query, params...)
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
				&post.Specialty,
				pq.Array(&post.Keywords),
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
		bp.title,
        bp.content,
        bp.created_at,
		bp.specialty,
		bp.keywords,
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
	err = row.Scan(&post.PostID, &post.DoctorName, &post.DoctorAvatar, &post.Title, &post.Content, &post.CreatedAt, &post.Specialty, pq.Array(&post.Keywords), &post.LikesCount, &post.CommentsCount, &post.IsLiked)
	if err != nil {
		log.Printf("Failed to fetch post by ID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve post"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func GetDoctorPosts(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("userId")

		if userID == "" {
			log.Println("Missing userID")
			c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
			return
		}

		postsRows, err := pool.Query(context.Background(), `
			SELECT
				bp.post_id,
				bp.doctor_id,
				bp.title,
				bp.content,
				bp.created_at,
				bp.updated_at,
				bp.specialty,
				bp.Keywords,
				di.first_name || ' ' || di.last_name AS doctor_name,
				di.profile_photo_url AS doctor_avatar,
				(SELECT COUNT(*) FROM likes l WHERE l.post_id = bp.post_id) AS likes_count,
				(SELECT COUNT(*) FROM comments c WHERE c.post_id = bp.post_id) AS comments_count
			FROM blog_posts bp
			JOIN doctor_info di ON bp.doctor_id = di.doctor_id
			WHERE bp.doctor_id = $1
			ORDER BY bp.created_at DESC
		`, userID)

		if err != nil {
			log.Println("Failed to retrieve blog posts: ", err)
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
				&post.Specialty,
				pq.Array(&post.Keywords),
				&post.DoctorName,
				&post.DoctorAvatar,
				&post.LikesCount,
				&post.CommentsCount,
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

func EditDoctorPost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		postID := c.Param("postID")
		var requestBody struct {
			Title   string `json:"title"`
			Content string `json:"content"`
		}

		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		_, err := db.Exec(context.Background(), `
            UPDATE blog_posts 
            SET title = $1, content = $2, updated_at = NOW() 
            WHERE post_id = $3
        `, requestBody.Title, requestBody.Content, postID)

		if err != nil {
			log.Println("Failed to update blog post: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully"})
	}
}

func DeleteDoctorPost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		postID := c.Param("postID")

		tx, err := db.Begin(context.Background())
		if err != nil {
			log.Println("Failed to start transaction: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
			return
		}
		defer tx.Rollback(context.Background())

		_, err = tx.Exec(context.Background(), `
			DELETE FROM likes WHERE post_id = $1
		`, postID)
		if err != nil {
			log.Println("Failed to delete likes: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post likes"})
			return
		}

		_, err = tx.Exec(context.Background(), `
			DELETE FROM comments WHERE post_id = $1
		`, postID)
		if err != nil {
			log.Println("Failed to delete comments: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post comments"})
			return
		}

		_, err = tx.Exec(context.Background(), `
			DELETE FROM blog_posts WHERE post_id = $1
		`, postID)
		if err != nil {
			log.Println("Failed to delete blog post: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
			return
		}

		err = tx.Commit(context.Background())
		if err != nil {
			log.Println("Failed to commit transaction: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Post and associated data deleted successfully"})
	}
}
