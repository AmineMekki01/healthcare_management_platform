package feed

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"
	"healthcare_backend/pkg/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/lib/pq"
)

type FeedService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

var ErrPostNotFound = errors.New("post not found")

func NewFeedService(db *pgxpool.Pool, cfg *config.Config) *FeedService {
	return &FeedService{
		db:  db,
		cfg: cfg,
	}
}

func (s *FeedService) CreateBlogPost(title, content, userID, specialty string, keywords []string) error {
	_, err := s.db.Exec(context.Background(), `
		INSERT INTO blog_posts (doctor_id, title, content, specialty, keywords, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, userID, title, content, specialty, pq.Array(keywords), time.Now(), time.Now())

	return err
}

func (s *FeedService) LikePost(postID, userID uuid.UUID, userType string) error {
	_, err := s.db.Exec(context.Background(), `
		INSERT INTO likes (post_id, user_id, user_type)
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING
	`, postID, userID, userType)

	return err
}

func (s *FeedService) UnlikePost(postID, userID uuid.UUID, userType string) error {
	_, err := s.db.Exec(context.Background(), `
		DELETE FROM likes
		WHERE post_id = $1 AND user_id = $2 AND user_type = $3
	`, postID, userID, userType)

	return err
}

func (s *FeedService) AddComment(postID, userID uuid.UUID, userType, content string) (*models.Comment, error) {
	var commentID uuid.UUID
	err := s.db.QueryRow(context.Background(), `
		INSERT INTO comments (post_id, user_id, user_type, content)
		VALUES ($1, $2, $3, $4)
		RETURNING comment_id
	`, postID, userID, userType, content).Scan(&commentID)

	if err != nil {
		return nil, err
	}

	var comment models.Comment
	err = s.db.QueryRow(context.Background(), `
		SELECT
			c.comment_id,
			c.post_id,
			c.user_id,
			COALESCE(di.first_name || ' ' || di.last_name, pi.first_name || ' ' || pi.last_name, r.first_name || ' ' || r.last_name, '') AS user_name,
			COALESCE(di.first_name, pi.first_name, r.first_name, '') AS user_first_name,
			COALESCE(di.first_name_ar, pi.first_name_ar, r.first_name_ar, '') AS user_first_name_ar,
			COALESCE(di.last_name, pi.last_name, r.last_name, '') AS user_last_name,
			COALESCE(di.last_name_ar, pi.last_name_ar, r.last_name_ar, '') AS user_last_name_ar,
			COALESCE(di.profile_photo_url, pi.profile_photo_url, r.profile_photo_url, '') AS user_avatar,
			c.content,
			c.created_at
		FROM comments c
		LEFT JOIN doctor_info di ON c.user_id = di.doctor_id AND c.user_type = 'doctor'
		LEFT JOIN patient_info pi ON c.user_id = pi.patient_id AND c.user_type = 'patient'
		LEFT JOIN receptionists r ON c.user_id = r.receptionist_id AND c.user_type = 'receptionist'
		WHERE c.comment_id = $1
	`, commentID).Scan(
		&comment.CommentID,
		&comment.PostID,
		&comment.UserID,
		&comment.UserName,
		&comment.UserFirstName,
		&comment.UserFirstNameAr,
		&comment.UserLastName,
		&comment.UserLastNameAr,
		&comment.UserAvatar,
		&comment.Content,
		&comment.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	if comment.UserAvatar != "" {
		presignedURL, err := utils.GeneratePresignedObjectURL(comment.UserAvatar)
		if err != nil {
			log.Printf("Warning: failed to generate presigned URL for comment avatar: %v", err)
		} else {
			comment.UserAvatar = presignedURL
		}
	}

	return &comment, nil
}

func (s *FeedService) GetComments(postID uuid.UUID) ([]models.Comment, error) {
	rows, err := s.db.Query(context.Background(), `
		SELECT
			c.comment_id,
			c.post_id,
			c.user_id,
			COALESCE(di.first_name || ' ' || di.last_name, pi.first_name || ' ' || pi.last_name, r.first_name || ' ' || r.last_name, '') AS user_name,
			COALESCE(di.first_name, pi.first_name, r.first_name, '') AS user_first_name,
			COALESCE(di.first_name_ar, pi.first_name_ar, r.first_name_ar, '') AS user_first_name_ar,
			COALESCE(di.last_name, pi.last_name, r.last_name, '') AS user_last_name,
			COALESCE(di.last_name_ar, pi.last_name_ar, r.last_name_ar, '') AS user_last_name_ar,
			COALESCE(di.profile_photo_url, pi.profile_photo_url, r.profile_photo_url, '') AS user_avatar,
			c.content,
			c.created_at
		FROM comments c
		LEFT JOIN doctor_info di ON c.user_id = di.doctor_id AND c.user_type = 'doctor'
		LEFT JOIN patient_info pi ON c.user_id = pi.patient_id AND c.user_type = 'patient'
		LEFT JOIN receptionists r ON c.user_id = r.receptionist_id AND c.user_type = 'receptionist'
		WHERE c.post_id = $1
		ORDER BY c.created_at ASC
	`, postID)

	if err != nil {
		return nil, err
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
			&comment.UserFirstName,
			&comment.UserFirstNameAr,
			&comment.UserLastName,
			&comment.UserLastNameAr,
			&comment.UserAvatar,
			&comment.Content,
			&comment.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if comment.UserAvatar != "" {
			presignedURL, err := utils.GeneratePresignedObjectURL(comment.UserAvatar)
			if err != nil {
				log.Printf("Warning: failed to generate presigned URL for comment avatar: %v", err)
			} else {
				comment.UserAvatar = presignedURL
			}
		}

		comments = append(comments, comment)
	}

	return comments, nil
}

func (s *FeedService) GetFeed(userType, userID, specialty, searchQuery string) ([]models.BlogPost, error) {
	rows, err := s.db.Query(context.Background(), `
		SELECT doctor_id FROM followers
		WHERE follower_id = $1 AND follower_type = $2
	`, userID, userType)

	if err != nil {
		log.Printf("GetFeed: Error querying followers: %v", err)
		return nil, err
	}
	defer rows.Close()

	var doctorIDs []uuid.UUID
	for rows.Next() {
		var doctorID uuid.UUID
		err := rows.Scan(&doctorID)
		if err != nil {
			log.Printf("GetFeed: Error scanning doctor ID: %v", err)
			return nil, err
		}
		doctorIDs = append(doctorIDs, doctorID)
	}

	if userType == "doctor" {
		doctorUUID, err := uuid.Parse(userID)
		if err != nil {
			log.Printf("GetFeed: Error parsing doctor userID '%s': %v", userID, err)
			return nil, err
		}
		doctorIDs = append(doctorIDs, doctorUUID)
	}

	if len(doctorIDs) == 0 {
		log.Printf("GetFeed: No doctors found for user %s (%s), returning empty feed", userID, userType)
		return []models.BlogPost{}, nil
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
			di.first_name AS doctor_first_name,
			COALESCE(di.first_name_ar, '') AS doctor_first_name_ar,
			di.last_name AS doctor_last_name,
			COALESCE(di.last_name_ar, '') AS doctor_last_name_ar,
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

	postsRows, err := s.db.Query(context.Background(), query, params...)
	if err != nil {
		return nil, err
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
			&post.DoctorFirstName,
			&post.DoctorFirstNameAr,
			&post.DoctorLastName,
			&post.DoctorLastNameAr,
			&post.DoctorAvatar,
			&post.LikesCount,
			&post.CommentsCount,
			&post.IsLiked,
		)

		var doctorIDStr string
		doctorIDStr = post.DoctorID.String()
		post.DoctorAvatar, _ = utils.GetUserImage(doctorIDStr, "doctor", context.Background(), s.db)

		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

func (s *FeedService) GetPostByID(postID, userID uuid.UUID, userType string) (*models.BlogPost, error) {
	query := `
		SELECT 
			bp.post_id,
			bp.doctor_id,
			d.first_name || ' ' || d.last_name AS doctor_name,
			d.first_name AS doctor_first_name,
			COALESCE(d.first_name_ar, '') AS doctor_first_name_ar,
			d.last_name AS doctor_last_name,
			COALESCE(d.last_name_ar, '') AS doctor_last_name_ar,
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
		WHERE bp.post_id = $1
	`

	var post models.BlogPost
	row := s.db.QueryRow(context.Background(), query, postID, userID, userType)
	err := row.Scan(
		&post.PostID,
		&post.DoctorID,
		&post.DoctorName,
		&post.DoctorFirstName,
		&post.DoctorFirstNameAr,
		&post.DoctorLastName,
		&post.DoctorLastNameAr,
		&post.DoctorAvatar,
		&post.Title,
		&post.Content,
		&post.CreatedAt,
		&post.Specialty,
		pq.Array(&post.Keywords),
		&post.LikesCount,
		&post.CommentsCount,
		&post.IsLiked,
	)

	if err != nil {
		return nil, err
	}

	var doctorIDStr string
	doctorIDStr = post.DoctorID.String()
	post.DoctorAvatar, _ = utils.GetUserImage(doctorIDStr, "doctor", context.Background(), s.db)

	return &post, nil
}

func (s *FeedService) GetDoctorPosts(userID string) ([]models.BlogPost, error) {
	postsRows, err := s.db.Query(context.Background(), `
		SELECT
			bp.post_id,
			bp.doctor_id,
			bp.title,
			bp.content,
			bp.created_at,
			bp.updated_at,
			bp.specialty,
			bp.keywords,
			di.first_name || ' ' || di.last_name AS doctor_name,
			di.first_name AS doctor_first_name,
			COALESCE(di.first_name_ar, '') AS doctor_first_name_ar,
			di.last_name AS doctor_last_name,
			COALESCE(di.last_name_ar, '') AS doctor_last_name_ar,
			di.profile_photo_url AS doctor_avatar,
			(SELECT COUNT(*) FROM likes l WHERE l.post_id = bp.post_id) AS likes_count,
			(SELECT COUNT(*) FROM comments c WHERE c.post_id = bp.post_id) AS comments_count
		FROM blog_posts bp
		JOIN doctor_info di ON bp.doctor_id = di.doctor_id
		WHERE bp.doctor_id = $1
		ORDER BY bp.created_at DESC
	`, userID)

	if err != nil {
		return nil, err
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
			&post.DoctorFirstName,
			&post.DoctorFirstNameAr,
			&post.DoctorLastName,
			&post.DoctorLastNameAr,
			&post.DoctorAvatar,
			&post.LikesCount,
			&post.CommentsCount,
		)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

func (s *FeedService) EditDoctorPost(postID, doctorID, title, content, specialty string, keywords []string) error {
	cmd, err := s.db.Exec(context.Background(), `
		UPDATE blog_posts 
		SET title = $1, content = $2, specialty = $3, keywords = $4, updated_at = NOW() 
		WHERE post_id = $5 AND doctor_id = $6
	`, title, content, specialty, pq.Array(keywords), postID, doctorID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrPostNotFound
	}

	return nil
}

func (s *FeedService) DeleteDoctorPost(postID string) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(), `
		DELETE FROM likes WHERE post_id = $1
	`, postID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(context.Background(), `
		DELETE FROM comments WHERE post_id = $1
	`, postID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(context.Background(), `
		DELETE FROM blog_posts WHERE post_id = $1
	`, postID)
	if err != nil {
		return err
	}

	return tx.Commit(context.Background())
}
