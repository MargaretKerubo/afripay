package wallet

import (
	"errors"
	"fmt"

	"afripay/internal/db"
	"afripay/internal/rates"

	"gorm.io/gorm"
)

var ErrWalletNotFound = errors.New("wallet not found")
var ErrInsufficientBalance = errors.New("insufficient balance")

func CreateWalletForUserID(tx *gorm.DB, userID uint) error {
	wallet := db.Wallet{
		UserID:      userID,
		BalanceSats: 0,
	}
	return tx.Create(&wallet).Error
}

func GetByUserID(tx *gorm.DB, userID uint) (*db.Wallet, error) {
	var wallet db.Wallet
	if err := tx.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWalletNotFound
		}
		return nil, fmt.Errorf("querying wallet: %w", err)
	}
	return &wallet, nil
}

func CreditBalance(tx *gorm.DB, userID uint, sats int64) (*db.Wallet, error) {
	var wallet db.Wallet
	if err := tx.Set("gorm:query_option", "FOR UPDATE").
		Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		return nil, fmt.Errorf("fetching wallet: %w", err)
	}
	wallet.BalanceSats += sats
	if err := tx.Save(&wallet).Error; err != nil {
		return nil, fmt.Errorf("saving wallet: %w", err)
	}
	return &wallet, nil
}

func DebitBalance(tx *gorm.DB, userID uint, sats int64) (*db.Wallet, error) {
	var wallet db.Wallet
	if err := tx.Set("gorm:query_option", "FOR UPDATE").
		Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		return nil, fmt.Errorf("fetching wallet: %w", err)
	}
	if wallet.BalanceSats < sats {
		return nil, ErrInsufficientBalance
	}
	wallet.BalanceSats -= sats
	if err := tx.Save(&wallet).Error; err != nil {
		return nil, fmt.Errorf("saving wallet: %w", err)
	}
	return &wallet, nil
}

type BalanceResponse struct {
	BalanceSats int64   `json:"balance_sats"`
	FiatBalance float64 `json:"fiat_balance"`
	Currency    string  `json:"currency"`
}

type TransactionSummary struct {
	ID           uint    `json:"id"`
	Type         string  `json:"type"`
	Status       string  `json:"status"`
	AmountSats   int64   `json:"amount_sats"`
	FiatAmount   float64 `json:"fiat_amount"`
	FiatCurrency string  `json:"fiat_currency"`
	CreatedAt    string  `json:"created_at"` // ISO-8601
}

type Service struct {
	db          *gorm.DB
	rateService *rates.RateService
}

// NewService constructs a wallet Service with the given dependencies.
func NewService(database *gorm.DB, rateService *rates.RateService) *Service {
	return &Service{
		db:          database,
		rateService: rateService,
	}
}

// GetBalance returns the sats balance and its fiat equivalent for the given user.
// It returns ErrWalletNotFound when no wallet exists for that user ID.
func (s *Service) GetBalance(userID uint) (*BalanceResponse, error) {
	var wallet db.Wallet
	if err := s.db.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWalletNotFound
		}
		return nil, fmt.Errorf("querying wallet: %w", err)
	}

	var user db.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, fmt.Errorf("querying user for currency preference: %w", err)
	}

	fiatBalance, err := s.rateService.ConvertSatsToFiat(wallet.BalanceSats, user.LocalCurrency)
	if err != nil {
		// Rate conversion failing is non-fatal — surface 0 rather than an error so
		// the client can still display the sats balance.
		fiatBalance = 0
	}

	return &BalanceResponse{
		BalanceSats: wallet.BalanceSats,
		FiatBalance: fiatBalance,
		Currency:    user.LocalCurrency,
	}, nil
}

// ListTransactions returns the most recent transactions for the given user,
// capped at limit. Transactions are ordered newest-first.
func (s *Service) ListTransactions(userID uint, limit int) ([]TransactionSummary, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var txns []db.Transaction
	err := s.db.
		Where("sender_id = ? OR receiver_id = ?", userID, userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&txns).Error
	if err != nil {
		return nil, fmt.Errorf("querying transactions: %w", err)
	}

	summaries := make([]TransactionSummary, 0, len(txns))
	for _, t := range txns {
		summaries = append(summaries, TransactionSummary{
			ID:           t.ID,
			Type:         t.Type,
			Status:       t.Status,
			AmountSats:   t.AmountSats,
			FiatAmount:   t.FiatAmount,
			FiatCurrency: t.FiatCurrency,
			CreatedAt:    t.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		})
	}

	return summaries, nil
}
