package follow

import (
	"context"
	"fmt"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type FollowService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewFollowService(db *pgxpool.Pool, cfg *config.Config) *FollowService {
	return &FollowService{
		db:  db,
		cfg: cfg,
	}
}

func (s *FollowService) FollowDoctor(doctorID, followerID, followerType string) error {
	if _, err := uuid.Parse(doctorID); err != nil {
		return fmt.Errorf("invalid doctor ID: %v", err)
	}
	if _, err := uuid.Parse(followerID); err != nil {
		return fmt.Errorf("invalid follower ID: %v", err)
	}

	_, err := s.db.Exec(context.Background(),
		`INSERT INTO followers (doctor_id, follower_id, follower_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (doctor_id, follower_id, follower_type) DO NOTHING`,
		doctorID, followerID, followerType)

	if err != nil {
		return fmt.Errorf("failed to follow doctor: %v", err)
	}

	return nil
}

func (s *FollowService) UnfollowDoctor(doctorID, followerID string) error {
	if _, err := uuid.Parse(doctorID); err != nil {
		return fmt.Errorf("invalid doctor ID: %v", err)
	}
	if _, err := uuid.Parse(followerID); err != nil {
		return fmt.Errorf("invalid follower ID: %v", err)
	}

	tx, err := s.db.BeginTx(context.Background(), pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("failed to start transaction: %v", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback(context.Background())
			return
		}
		if cmErr := tx.Commit(context.Background()); cmErr != nil {
			err = fmt.Errorf("failed to complete request: %v", cmErr)
		}
	}()

	result, err := tx.Exec(context.Background(),
		`DELETE FROM followers 
         WHERE doctor_id = $1 AND follower_id = $2`,
		doctorID, followerID)

	if err != nil {
		return fmt.Errorf("failed to unfollow doctor: %v", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no follow relationship found to delete")
	}

	return nil
}

func (s *FollowService) GetDoctorFollowerCount(doctorID string) (int, error) {
	if _, err := uuid.Parse(doctorID); err != nil {
		return 0, fmt.Errorf("invalid doctor ID: %v", err)
	}

	var count int
	err := s.db.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM followers WHERE doctor_id = $1`,
		doctorID).Scan(&count)

	if err != nil {
		return 0, fmt.Errorf("failed to get follower count: %v", err)
	}

	return count, nil
}

func (s *FollowService) IsFollowingDoctor(doctorID, followerID, followerType string) (bool, error) {
	if _, err := uuid.Parse(doctorID); err != nil {
		return false, fmt.Errorf("invalid doctor ID: %v", err)
	}
	if _, err := uuid.Parse(followerID); err != nil {
		return false, fmt.Errorf("invalid follower ID: %v", err)
	}

	var isFollowing bool
	err := s.db.QueryRow(context.Background(),
		`SELECT EXISTS (
            SELECT 1 FROM followers
            WHERE doctor_id = $1 AND follower_id = $2 AND follower_type = $3
         )`,
		doctorID, followerID, followerType).Scan(&isFollowing)

	if err != nil {
		return false, fmt.Errorf("failed to check following status: %v", err)
	}

	return isFollowing, nil
}

func (s *FollowService) GetUserFollowings(userID string) ([]models.Doctor, error) {
	if _, err := uuid.Parse(userID); err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	sqlQuery := `
		SELECT 
			di.first_name, di.last_name, di.specialty, fl.doctor_id
		FROM 
			followers fl
		JOIN 
			doctor_info di ON di.doctor_id = fl.doctor_id
		WHERE 
			fl.follower_id = $1`

	rows, err := s.db.Query(context.Background(), sqlQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user's followings: %v", err)
	}
	defer rows.Close()

	var doctors []models.Doctor
	for rows.Next() {
		var doctor models.Doctor
		err := rows.Scan(
			&doctor.FirstName,
			&doctor.LastName,
			&doctor.Specialty,
			&doctor.DoctorID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user's followings results: %v", err)
		}
		doctors = append(doctors, doctor)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over rows: %v", err)
	}

	return doctors, nil
}
