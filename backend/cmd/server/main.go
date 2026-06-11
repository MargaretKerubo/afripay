package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"afripay/internal/auth"
	"afripay/internal/db"
	"afripay/internal/lightning"
	"afripay/internal/rates"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	// Read configurations
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "afripay.db"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "afripay-super-secret-key-change-in-production"
	}

	// LND Node credentials
	lndHost := os.Getenv("LND_HOST")
	lndMacaroon := os.Getenv("LND_MACAROON")
	lndCertPath := os.Getenv("LND_TLS_CERT_PATH")

	// Initialize database
	database := db.InitDB(dbPath)
	log.Printf("GORM database initialized with %v client", database.Name())

	// Initialize Lightning Client
	lnClient := lightning.NewClient(lndHost, lndMacaroon, lndCertPath)

	// Initialize Rate Service
	rateService := rates.NewRateService()

	// Initialize Gin engine
	r := gin.Default()

	// Global CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	r.GET("/api/health", func(c *gin.Context) {
		lndInfo, err := lnClient.GetInfo()
		lndStatus := "OK"
		if err != nil {
			lndStatus = "DISCONNECTED"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":      "OK",
			"database":    "CONNECTED",
			"lightning":   lndStatus,
			"node_alias":  lndInfo.Alias,
			"synced":      lndInfo.SyncedToChain,
			"simulated":   lnClient.IsSimulated,
		})
	})

	// Public Auth Routes
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/register", func(c *gin.Context) {
			var req struct {
				Username string `json:"username" binding:"required"`
				Password string `json:"password" binding:"required"`
				Currency string `json:"currency"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Validate currency
			if req.Currency == "" {
				req.Currency = "KES"
			}
			if req.Currency != "KES" && req.Currency != "UGX" && req.Currency != "TZS" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported fiat currency. Choose KES, UGX, or TZS."})
				return
			}

			// Hash password
			hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
				return
			}

			// Create User
			user := db.User{
				Username:      req.Username,
				PasswordHash:  string(hashed),
				LocalCurrency: req.Currency,
			}
			if err := database.Create(&user).Error; err != nil {
				c.JSON(http.StatusConflict, gin.H{"error": "Username is already taken"})
				return
			}

			// Create Wallet
			wallet := db.Wallet{
				UserID:      user.ID,
				BalanceSats: 10000, // starting balance of 10,000 sats for demo
			}
			if err := database.Create(&wallet).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user wallet"})
				return
			}

			// Generate Token
			token, err := auth.GenerateToken(user.ID, jwtSecret)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"message": "User registered successfully",
				"token":   token,
				"user": gin.H{
					"id":             user.ID,
					"username":       user.Username,
					"local_currency": user.LocalCurrency,
				},
			})
		})

		authGroup.POST("/login", func(c *gin.Context) {
			var req struct {
				Username string `json:"username" binding:"required"`
				Password string `json:"password" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			var user db.User
			if err := database.Preload("Wallet").Where("username = ?", req.Username).First(&user).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
				return
			}

			if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
				return
			}

			token, err := auth.GenerateToken(user.ID, jwtSecret)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"token": token,
				"user": gin.H{
					"id":             user.ID,
					"username":       user.Username,
					"local_currency": user.LocalCurrency,
					"balance_sats":   user.Wallet.BalanceSats,
				},
			})
		})
	}

	// Rates Route
	r.GET("/api/rates", func(c *gin.Context) {
		currentRates := rateService.GetRates()
		c.JSON(http.StatusOK, gin.H{
			"kes":          currentRates.KES,
			"ugx":          currentRates.UGX,
			"tzs":          currentRates.TZS,
			"last_updated": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Protected Wallet Routes
	walletGroup := r.Group("/api/wallet")
	walletGroup.Use(auth.AuthMiddleware(jwtSecret))
	{
		walletGroup.GET("/balance", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var wallet db.Wallet
			if err := database.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
				return
			}

			var user db.User
			database.First(&user, userID)

			// Convert current balance to user's preferred currency
			fiatBalance, err := rateService.ConvertSatsToFiat(wallet.BalanceSats, user.LocalCurrency)
			if err != nil {
				fiatBalance = 0.0
			}

			c.JSON(http.StatusOK, gin.H{
				"balance_sats": wallet.BalanceSats,
				"fiat_balance": fiatBalance,
				"currency":     user.LocalCurrency,
			})
		})

		walletGroup.GET("/transactions", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var transactions []db.Transaction
			if err := database.Where("sender_id = ? OR receiver_id = ?", userID, userID).
				Order("created_at desc").Find(&transactions).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve transactions"})
				return
			}

			c.JSON(http.StatusOK, transactions)
		})

		walletGroup.POST("/deposit", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var req struct {
				AmountSats int64 `json:"amount_sats" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
				return
			}

			if req.AmountSats <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Deposit amount must be greater than zero"})
				return
			}

			var user db.User
			if err := database.First(&user, userID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}

			// Generate invoice
			memo := fmt.Sprintf("Deposit to afripay user %s", user.Username)
			invoice, paymentHash, err := lnClient.CreateInvoice(req.AmountSats, memo)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to generate Lightning invoice: %v", err)})
				return
			}

			// Convert amount to fiat
			fiatVal, err := rateService.ConvertSatsToFiat(req.AmountSats, user.LocalCurrency)
			if err != nil {
				fiatVal = 0.0
			}

			// Create transaction
			receiverID := user.ID
			tx := db.Transaction{
				ReceiverID:     &receiverID,
				AmountSats:     req.AmountSats,
				FiatAmount:     fiatVal,
				FiatCurrency:   user.LocalCurrency,
				Type:           "RECEIVE",
				Status:         "PENDING",
				PaymentRequest: invoice,
				PaymentHash:    paymentHash,
			}

			if err := database.Create(&tx).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction entry"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"payment_request": invoice,
				"payment_hash":    paymentHash,
				"amount_sats":     req.AmountSats,
			})
		})
	}

	// Start server
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}
