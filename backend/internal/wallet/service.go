package wallet

import (
	"errors"
	"fmt"

	"afripay/internal/db"
	"afripay/internal/rates"

	"gorm.io/gorm"
)

// ErrWalletNotFound is returned when a wallet cannot be located for a user
var ErrWalletNotFound = errors.New("wallet not found")

// Service handles wallet-related business logic
type Service struct {
	db    *gorm.DB
	rates *rates.RateService
}

// NewService creates a new wallet service
func NewService(database *gorm.DB, rateService *rates.RateService) *Service {
	return &Service{
		db:    database,
		rates: rateService,
	}
}

// BalanceResponse is the JSON shape returned by GET /api/wallet/balance
type BalanceResponse struct {
	BalanceSats int64   `json:"balance_sats"`
	FiatBalance float64 `json:"fiat_balance"`
	Currency    string  `json:"currency"`
}

// GetBalance returns the user's BTC balance plus its fiat equivalent
func (s *Service) GetBalance(userID uint) (*BalanceResponse, error) {
	var user db.User
	if err := s.db.Preload("Wallet").First(&user, userID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	fiatVal, err := s.rates.ConvertSatsToFiat(user.Wallet.BalanceSats, user.LocalCurrency)
	if err != nil {
		fiatVal = 0.0
	}

	return &BalanceResponse{
		BalanceSats: user.Wallet.BalanceSats,
		FiatBalance: fiatVal,
		Currency:    user.LocalCurrency,
	}, nil
}

// ListTransactions returns the user's transaction history, most recent first
func (s *Service) ListTransactions(userID uint, limit int) ([]db.Transaction, error) {
	var txns []db.Transaction
	err := s.db.Where("sender_id = ? OR receiver_id = ?", userID, userID).
		Order("created_at desc").
		Limit(limit).
		Find(&txns).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transactions: %w", err)
	}
	return txns, nil
}