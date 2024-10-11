package models

import (
	"time"

	"github.com/google/uuid"
)

type BlogPost struct {
	PostID        uuid.UUID `json:"post_id"`
	DoctorID      uuid.UUID `json:"doctor_id"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	Specialty     string    `json:"specialty"`
	Keywords      []string  `json:"keywords"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	DoctorName    string    `json:"doctor_name"`
	DoctorAvatar  string    `json:"doctor_avatar"`
	LikesCount    int       `json:"likes_count"`
	CommentsCount int       `json:"comments_count"`
	IsLiked       bool      `json:"is_liked"`
}

type Comment struct {
	CommentID  uuid.UUID `json:"comment_id"`
	PostID     uuid.UUID `json:"post_id"`
	UserID     uuid.UUID `json:"user_id"`
	UserName   string    `json:"user_name"`
	UserAvatar string    `json:"user_avatar"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}
