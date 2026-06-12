package db

import (
	"time"
)

// User represents a user/trader in AfriPay
type User struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Username      string    `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash  string    `gorm:"not null" json:"-"`
	LocalCurrency string    `gorm:"default:'KES';not null" json:"local_currency"` // KES, UGX, TZS, etc.
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Wallet        Wallet    `json:"wallet"`
}

// Wallet represents a user's Bitcoin wallet balance and lightning node link
type Wallet struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	BalanceSats int64     `gorm:"default:0;not null" json:"balance_sats"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Transaction represents a Bitcoin/Lightning payment
type Transaction struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	SenderID       *uint      `json:"sender_id,omitempty"` // Nullable if external lightning payment
	ReceiverID     *uint      `json:"receiver_id,omitempty"` // Nullable if paying external invoice
	AmountSats     int64      `gorm:"not null" json:"amount_sats"`
	FiatAmount     float64    `gorm:"not null" json:"fiat_amount"`
	FiatCurrency   string     `gorm:"not null" json:"fiat_currency"`
	Type           string     `gorm:"not null" json:"type"` // "SEND", "RECEIVE", "ESCROW"
	Status         string     `gorm:"default:'PENDING';not null" json:"status"` // "PENDING", "SETTLED", "FAILED"
	PaymentRequest string     `json:"payment_request,omitempty"` // Bolt11 invoice
	PaymentHash    string     `gorm:"index" json:"payment_hash,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	SettledAt      *time.Time `json:"settled_at,omitempty"`
}

// EscrowTrade represents a 2-of-3 multisig trade protection mechanism
type EscrowTrade struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	BuyerID            uint      `gorm:"not null" json:"buyer_id"`
	SellerID           uint      `gorm:"not null" json:"seller_id"`
	ArbitratorID       uint      `gorm:"not null" json:"arbitrator_id"`
	AmountSats         int64     `gorm:"not null" json:"amount_sats"`
	Status             string    `gorm:"default:'LOCKED';not null" json:"status"` // "LOCKED", "RELEASED", "DISPUTED"
	BuyerApproval      bool      `gorm:"default:false;not null" json:"buyer_approval"`
	SellerApproval     bool      `gorm:"default:false;not null" json:"seller_approval"`
	ArbitratorApproval bool      `gorm:"default:false;not null" json:"arbitrator_approval"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// Relationships
	Buyer      User `gorm:"foreignKey:BuyerID" json:"buyer"`
	Seller     User `gorm:"foreignKey:SellerID" json:"seller"`
	Arbitrator User `gorm:"foreignKey:ArbitratorID" json:"arbitrator"`
}

// WaitlistEntry represents a sign-up for the waitlist
type WaitlistEntry struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Country   string    `json:"country"`
	CreatedAt time.Time `json:"created_at"`
}

