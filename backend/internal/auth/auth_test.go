package auth

import (
	"testing"
)

func TestGenerateAndValidateToken(t *testing.T) {
	secret := "my-awesome-secret-key-that-is-long"
	userID := uint(42)

	token, err := GenerateToken(userID, secret)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	if token == "" {
		t.Errorf("token should not be empty")
	}

	validatedID, err := ValidateToken(token, secret)
	if err != nil {
		t.Fatalf("failed to validate token: %v", err)
	}
	if validatedID != userID {
		t.Errorf("expected validated ID to be %d, got %d", userID, validatedID)
	}

	// Validate with wrong secret
	_, err = ValidateToken(token, "wrong-secret-key")
	if err == nil {
		t.Errorf("expected validation to fail with wrong secret, got nil error")
	}

	// Validate invalid token string
	_, err = ValidateToken("invalid.token.string", secret)
	if err == nil {
		t.Errorf("expected validation to fail with invalid token string, got nil error")
	}
}
