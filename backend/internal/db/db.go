package db

import (
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB is the global database instance
var DB *gorm.DB

// InitDB initializes the SQLite database and runs migrations
func InitDB(dbPath string) *gorm.DB {
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	log.Printf("Database initialized at %s. Running migrations...", dbPath)

	// Migrate the schema
	err = DB.AutoMigrate(&User{}, &Wallet{}, &Transaction{}, &EscrowTrade{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	seedUsers()

	return DB
}

// seedUsers creates demo users if none exist in the database
func seedUsers() {
	var count int64
	DB.Model(&User{}).Count(&count)
	if count > 0 {
		return
	}

	log.Println("Seeding demo users: alice, bob, charlie")
	users := []struct {
		Username string
		Password string
		Currency string
		Balance  int64
	}{
		{"alice", "password123", "KES", 100000}, // Kenyan trader, starting with 100,000 sats
		{"bob", "password123", "UGX", 50000},   // Ugandan trader, starting with 50,000 sats
		{"charlie", "password123", "KES", 0},     // Arbitrator
	}

	for _, u := range users {
		hashed, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash password for %s: %v", u.Username, err)
			continue
		}

		user := User{
			Username:      u.Username,
			PasswordHash:  string(hashed),
			LocalCurrency: u.Currency,
		}

		if err := DB.Create(&user).Error; err != nil {
			log.Printf("Failed to seed user %s: %v", u.Username, err)
			continue
		}

		wallet := Wallet{
			UserID:      user.ID,
			BalanceSats: u.Balance,
		}

		if err := DB.Create(&wallet).Error; err != nil {
			log.Printf("Failed to seed wallet for %s: %v", u.Username, err)
		}
	}
}
