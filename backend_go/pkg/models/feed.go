package models

import (
	"time"

	"github.com/google/uuid"
)

type BlogPost struct {
	PostID            uuid.UUID `json:"postId"`
	DoctorID          uuid.UUID `json:"doctorId"`
	Title             string    `json:"title"`
	Content           string    `json:"content"`
	Specialty         string    `json:"specialty"`
	Keywords          []string  `json:"keywords"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
	DoctorName        string    `json:"doctorName"`
	DoctorFirstName   string    `json:"doctorFirstName"`
	DoctorFirstNameAr string    `json:"doctorFirstNameAr"`
	DoctorLastName    string    `json:"doctorLastName"`
	DoctorLastNameAr  string    `json:"doctorLastNameAr"`
	DoctorAvatar      string    `json:"doctorAvatar"`
	LikesCount        int       `json:"likesCount"`
	CommentsCount     int       `json:"commentsCount"`
	IsLiked           bool      `json:"isLiked"`
}

type Comment struct {
	CommentID       uuid.UUID `json:"commentId"`
	PostID          uuid.UUID `json:"postId"`
	UserID          uuid.UUID `json:"userId"`
	UserName        string    `json:"userName"`
	UserFirstName   string    `json:"userFirstName"`
	UserFirstNameAr string    `json:"userFirstNameAr"`
	UserLastName    string    `json:"userLastName"`
	UserLastNameAr  string    `json:"userLastNameAr"`
	UserAvatar      string    `json:"userAvatar"`
	Content         string    `json:"content"`
	CreatedAt       time.Time `json:"createdAt"`
}
