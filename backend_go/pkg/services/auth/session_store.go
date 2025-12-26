package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"time"
)

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (s *AuthService) CreateAuthSession(ctx context.Context, userID, userType, refreshToken, ipAddress, userAgent string, expiresAt time.Time) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(ctx, `INSERT INTO auth_sessions (user_id, user_type, token_hash, created_at, last_used_at, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6)`, userID, userType, hashToken(refreshToken), expiresAt, ipAddress, userAgent)
	return err
}

func (s *AuthService) RotateAuthSession(ctx context.Context, oldRefreshToken, newRefreshToken, ipAddress, userAgent string, newExpiresAt time.Time) (bool, error) {
	if s.db == nil {
		return true, nil
	}
	oldHash := hashToken(oldRefreshToken)
	newHash := hashToken(newRefreshToken)

	tag, err := s.db.Exec(ctx, `UPDATE auth_sessions
		SET token_hash = $1, last_used_at = NOW(), expires_at = $2, ip_address = $3, user_agent = $4
		WHERE token_hash = $5 AND revoked_at IS NULL AND expires_at > NOW()`, newHash, newExpiresAt, ipAddress, userAgent, oldHash)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

func (s *AuthService) RevokeAuthSession(ctx context.Context, refreshToken string) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(ctx, `UPDATE auth_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`, hashToken(refreshToken))
	return err
}
