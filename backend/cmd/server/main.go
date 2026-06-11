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
	"gorm.io/gorm"
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

	// Start background invoice monitor
	startInvoiceMonitor(database, lnClient)

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

		walletGroup.POST("/deposit/simulate", func(c *gin.Context) {
			var req struct {
				PaymentHash string `json:"payment_hash" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
				return
			}

			var transaction db.Transaction
			if err := database.Where("payment_hash = ? AND status = ? AND type = ?", req.PaymentHash, "PENDING", "RECEIVE").
				First(&transaction).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Pending deposit transaction not found"})
				return
			}

			if transaction.ReceiverID == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction has no receiver"})
				return
			}

			// Perform GORM transaction to credit user wallet and update status
			txErr := database.Transaction(func(tx *gorm.DB) error {
				var wallet db.Wallet
				// Lock wallet for update to prevent race conditions
				if err := tx.Set("gorm:query_option", "FOR UPDATE").
					Where("user_id = ?", *transaction.ReceiverID).First(&wallet).Error; err != nil {
					return err
				}

				wallet.BalanceSats += transaction.AmountSats
				if err := tx.Save(&wallet).Error; err != nil {
					return err
				}

				now := time.Now()
				transaction.Status = "SETTLED"
				transaction.SettledAt = &now
				if err := tx.Save(&transaction).Error; err != nil {
					return err
				}

				return nil
			})

			if txErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to settle transaction: %v", txErr)})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":      "Transaction settled successfully (simulated)",
				"payment_hash": transaction.PaymentHash,
				"amount_sats":  transaction.AmountSats,
			})
		})

		walletGroup.POST("/withdraw", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var req struct {
				PaymentRequest string `json:"payment_request" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
				return
			}

			// Decode invoice
			decoded, err := lnClient.DecodeInvoice(req.PaymentRequest)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Failed to parse Lightning invoice: %v", err)})
				return
			}

			if decoded.NumSatoshis <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice must specify an amount greater than zero"})
				return
			}

			// Fetch user info for currency
			var user db.User
			if err := database.First(&user, userID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}

			// Try to deduct user balance first
			var wallet db.Wallet
			deductErr := database.Transaction(func(dbTx *gorm.DB) error {
				if err := dbTx.Set("gorm:query_option", "FOR UPDATE").
					Where("user_id = ?", userID).First(&wallet).Error; err != nil {
					return err
				}

				if wallet.BalanceSats < decoded.NumSatoshis {
					return fmt.Errorf("insufficient balance: you have %d sats, but invoice requires %d sats", wallet.BalanceSats, decoded.NumSatoshis)
				}

				wallet.BalanceSats -= decoded.NumSatoshis
				return dbTx.Save(&wallet).Error
			})

			if deductErr != nil {
				c.JSON(http.StatusPaymentRequired, gin.H{"error": deductErr.Error()})
				return
			}

			// Now pay the invoice via LND
			paymentHash, payErr := lnClient.PayInvoice(req.PaymentRequest)
			if payErr != nil {
				// Refund the user if LND payment failed
				refundErr := database.Transaction(func(dbTx *gorm.DB) error {
					var w db.Wallet
					if err := dbTx.Set("gorm:query_option", "FOR UPDATE").
						Where("user_id = ?", userID).First(&w).Error; err != nil {
						return err
					}
					w.BalanceSats += decoded.NumSatoshis
					return dbTx.Save(&w).Error
				})
				if refundErr != nil {
					log.Printf("CRITICAL: Failed to refund user ID %d after failed payment: %v", userID, refundErr)
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Lightning payment failed: %v", payErr)})
				return
			}

			// Record the successful transaction in DB
			fiatVal, _ := rateService.ConvertSatsToFiat(decoded.NumSatoshis, user.LocalCurrency)
			senderID := user.ID
			now := time.Now()
			tx := db.Transaction{
				SenderID:       &senderID,
				AmountSats:     decoded.NumSatoshis,
				FiatAmount:     fiatVal,
				FiatCurrency:   user.LocalCurrency,
				Type:           "SEND",
				Status:         "SETTLED",
				PaymentRequest: req.PaymentRequest,
				PaymentHash:    paymentHash,
				SettledAt:      &now,
			}

			if err := database.Create(&tx).Error; err != nil {
				log.Printf("WARNING: Failed to log withdrawal transaction: %v", err)
			}

			c.JSON(http.StatusOK, gin.H{
				"message":      "Payment sent successfully",
				"payment_hash": paymentHash,
				"amount_sats":  decoded.NumSatoshis,
			})
		})

		walletGroup.POST("/transfer", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var req struct {
				Username   string `json:"username" binding:"required"`
				AmountSats int64  `json:"amount_sats" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
				return
			}

			if req.AmountSats <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Transfer amount must be greater than zero"})
				return
			}

			// Find receiver user
			var receiver db.User
			if err := database.Where("username = ?", req.Username).First(&receiver).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Receiver user not found"})
				return
			}

			if receiver.ID == userID {
				c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot transfer money to yourself"})
				return
			}

			// Find sender user
			var sender db.User
			if err := database.First(&sender, userID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Sender user not found"})
				return
			}

			// Execute DB transaction
			txErr := database.Transaction(func(dbTx *gorm.DB) error {
				var senderWallet db.Wallet
				if err := dbTx.Set("gorm:query_option", "FOR UPDATE").
					Where("user_id = ?", userID).First(&senderWallet).Error; err != nil {
					return err
				}

				if senderWallet.BalanceSats < req.AmountSats {
					return fmt.Errorf("insufficient balance: you have %d sats, but transfer requires %d sats", senderWallet.BalanceSats, req.AmountSats)
				}

				var receiverWallet db.Wallet
				if err := dbTx.Set("gorm:query_option", "FOR UPDATE").
					Where("user_id = ?", receiver.ID).First(&receiverWallet).Error; err != nil {
					return err
				}

				// Deduct & Add
				senderWallet.BalanceSats -= req.AmountSats
				receiverWallet.BalanceSats += req.AmountSats

				if err := dbTx.Save(&senderWallet).Error; err != nil {
					return err
				}
				if err := dbTx.Save(&receiverWallet).Error; err != nil {
					return err
				}

				// Create logged transaction
				fiatVal, _ := rateService.ConvertSatsToFiat(req.AmountSats, sender.LocalCurrency)
				now := time.Now()
				senderID := sender.ID
				receiverID := receiver.ID
				
				txRecord := db.Transaction{
					SenderID:     &senderID,
					ReceiverID:   &receiverID,
					AmountSats:   req.AmountSats,
					FiatAmount:   fiatVal,
					FiatCurrency: sender.LocalCurrency,
					Type:         "SEND",
					Status:       "SETTLED",
					SettledAt:    &now,
				}

				return dbTx.Create(&txRecord).Error
			})

			if txErr != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": txErr.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":     "Internal transfer completed successfully",
				"receiver":    receiver.Username,
				"amount_sats": req.AmountSats,
			})
		})

		walletGroup.POST("/swap-currency", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var req struct {
				Currency string `json:"currency" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
				return
			}

			if req.Currency != "KES" && req.Currency != "UGX" && req.Currency != "TZS" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported fiat currency. Choose KES, UGX, or TZS."})
				return
			}

			if err := database.Model(&db.User{}).Where("id = ?", userID).Update("local_currency", req.Currency).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update currency settings"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":  "Currency updated successfully",
				"currency": req.Currency,
			})
		})

		walletGroup.POST("/escrow/create", func(c *gin.Context) {
			buyerID := c.MustGet("userID").(uint)

			var req struct {
				SellerUsername     string `json:"seller_username" binding:"required"`
				ArbitratorUsername string `json:"arbitrator_username" binding:"required"`
				AmountSats         int64  `json:"amount_sats" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
				return
			}

			if req.AmountSats <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Escrow amount must be greater than zero"})
				return
			}

			// Find seller and arbitrator
			var seller db.User
			if err := database.Where("username = ?", req.SellerUsername).First(&seller).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Seller user not found"})
				return
			}

			var arbitrator db.User
			if err := database.Where("username = ?", req.ArbitratorUsername).First(&arbitrator).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Arbitrator user not found"})
				return
			}

			if seller.ID == buyerID || arbitrator.ID == buyerID || seller.ID == arbitrator.ID {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Buyer, Seller, and Arbitrator must be unique users"})
				return
			}

			var buyer db.User
			database.First(&buyer, buyerID)

			// DB transaction to lock buyer funds
			txErr := database.Transaction(func(dbTx *gorm.DB) error {
				var buyerWallet db.Wallet
				if err := dbTx.Set("gorm:query_option", "FOR UPDATE").
					Where("user_id = ?", buyerID).First(&buyerWallet).Error; err != nil {
					return err
				}

				if buyerWallet.BalanceSats < req.AmountSats {
					return fmt.Errorf("insufficient balance to lock in escrow: you have %d sats, need %d sats", buyerWallet.BalanceSats, req.AmountSats)
				}

				buyerWallet.BalanceSats -= req.AmountSats
				if err := dbTx.Save(&buyerWallet).Error; err != nil {
					return err
				}

				// Create EscrowTrade record
				escrow := db.EscrowTrade{
					BuyerID:            buyerID,
					SellerID:           seller.ID,
					ArbitratorID:       arbitrator.ID,
					AmountSats:         req.AmountSats,
					Status:             "LOCKED",
					BuyerApproval:      false,
					SellerApproval:     false,
					ArbitratorApproval: false,
				}

				if err := dbTx.Create(&escrow).Error; err != nil {
					return err
				}

				// Create pending transaction log
				fiatVal, _ := rateService.ConvertSatsToFiat(req.AmountSats, buyer.LocalCurrency)
				txLog := db.Transaction{
					SenderID:     &buyerID,
					AmountSats:   req.AmountSats,
					FiatAmount:   fiatVal,
					FiatCurrency: buyer.LocalCurrency,
					Type:         "ESCROW",
					Status:       "PENDING", // PENDING means locked in escrow
					PaymentHash:  fmt.Sprintf("escrow-%d", escrow.ID),
				}

				return dbTx.Create(&txLog).Error
			})

			if txErr != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": txErr.Error()})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"message":     "Escrow trade protection initialized and funds locked",
				"amount_sats": req.AmountSats,
				"seller":      seller.Username,
				"arbitrator":  arbitrator.Username,
			})
		})

		walletGroup.GET("/escrow/list", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var escrows []db.EscrowTrade
			if err := database.Preload("Buyer").Preload("Seller").Preload("Arbitrator").
				Where("buyer_id = ? OR seller_id = ? OR arbitrator_id = ?", userID, userID, userID).
				Order("created_at desc").Find(&escrows).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve escrow trades"})
				return
			}

			c.JSON(http.StatusOK, escrows)
		})

		walletGroup.POST("/escrow/release", func(c *gin.Context) {
			userID := c.MustGet("userID").(uint)

			var req struct {
				EscrowID uint `json:"escrow_id" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request parameters"})
				return
			}

			var escrow db.EscrowTrade
			if err := database.Where("id = ?", req.EscrowID).First(&escrow).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Escrow trade not found"})
				return
			}

			if escrow.Status != "LOCKED" && escrow.Status != "DISPUTED" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Escrow trade must be in LOCKED or DISPUTED status to release"})
				return
			}

			// Approve based on role
			if userID == escrow.BuyerID {
				escrow.BuyerApproval = true
			} else if userID == escrow.SellerID {
				escrow.SellerApproval = true
			} else if userID == escrow.ArbitratorID {
				escrow.ArbitratorApproval = true
			} else {
				c.JSON(http.StatusForbidden, gin.H{"error": "You are not a party to this escrow trade"})
				return
			}

			// Save approvals
			database.Save(&escrow)

			// Count approvals
			approvalCount := 0
			if escrow.BuyerApproval {
				approvalCount++
			}
			if escrow.SellerApproval {
				approvalCount++
			}
			if escrow.ArbitratorApproval {
				approvalCount++
			}

			// If at least 2 approvals, release funds to seller
			if approvalCount >= 2 {
				// Perform GORM transaction to release funds
				txErr := database.Transaction(func(dbTx *gorm.DB) error {
					var sellerWallet db.Wallet
					if err := dbTx.Set("gorm:query_option", "FOR UPDATE").
						Where("user_id = ?", escrow.SellerID).First(&sellerWallet).Error; err != nil {
						return err
					}

					sellerWallet.BalanceSats += escrow.AmountSats
					if err := dbTx.Save(&sellerWallet).Error; err != nil {
						return err
					}

					// Update escrow status
					escrow.Status = "RELEASED"
					if err := dbTx.Save(&escrow).Error; err != nil {
						return err
					}

					// Update buyer's transaction record status to SETTLED
					var transaction db.Transaction
					paymentHashPrefix := fmt.Sprintf("escrow-%d", escrow.ID)
					if err := dbTx.Where("payment_hash = ?", paymentHashPrefix).First(&transaction).Error; err == nil {
						transaction.Status = "SETTLED"
						now := time.Now()
						transaction.SettledAt = &now
						dbTx.Save(&transaction)
					}

					// Fetch seller details for currency conversion log
					var sellerUser db.User
					if err := dbTx.Where("id = ?", escrow.SellerID).First(&sellerUser).Error; err == nil {
						fiatVal, _ := rateService.ConvertSatsToFiat(escrow.AmountSats, sellerUser.LocalCurrency)
						sellerID := sellerUser.ID
						buyerID := escrow.BuyerID
						now := time.Now()
						sellerTx := db.Transaction{
							SenderID:     &buyerID,
							ReceiverID:   &sellerID,
							AmountSats:   escrow.AmountSats,
							FiatAmount:   fiatVal,
							FiatCurrency: sellerUser.LocalCurrency,
							Type:         "RECEIVE",
							Status:       "SETTLED",
							PaymentHash:  paymentHashPrefix,
							SettledAt:    &now,
						}
						dbTx.Create(&sellerTx)
					}

					return nil
				})

				if txErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to release escrow: %v", txErr)})
					return
				}

				c.JSON(http.StatusOK, gin.H{
					"message":       "Escrow released successfully. Funds transferred to Seller.",
					"status":        "RELEASED",
					"approval_count": approvalCount,
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":        "Approval recorded. Awaiting second approval to release funds.",
				"status":         escrow.Status,
				"approval_count": approvalCount,
			})
		})
	}

	// Start server
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}

func startInvoiceMonitor(database *gorm.DB, lnClient *lightning.Client) {
	// Don't monitor if simulated mode
	if lnClient.IsSimulated {
		log.Println("Invoice monitoring disabled (running in simulated mode)")
		return
	}

	log.Println("Starting background Lightning invoice monitoring worker...")
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		for range ticker.C {
			var pendingTx []db.Transaction
			if err := database.Where("status = ? AND type = ? AND payment_hash != ? AND receiver_id IS NOT NULL", "PENDING", "RECEIVE", "").Find(&pendingTx).Error; err != nil {
				continue
			}

			for _, tx := range pendingTx {
				status, err := lnClient.LookupInvoice(tx.PaymentHash)
				if err != nil {
					log.Printf("Monitor: Failed to look up invoice %s: %v", tx.PaymentHash, err)
					continue
				}

				if status.Settled || status.State == "SETTLED" {
					log.Printf("Monitor: Detected settled invoice %s. Crediting wallet...", tx.PaymentHash)
					
					err := database.Transaction(func(dbTx *gorm.DB) error {
						var wallet db.Wallet
						if err := dbTx.Set("gorm:query_option", "FOR UPDATE").
							Where("user_id = ?", *tx.ReceiverID).First(&wallet).Error; err != nil {
							return err
						}

						wallet.BalanceSats += tx.AmountSats
						if err := dbTx.Save(&wallet).Error; err != nil {
							return err
						}

						now := time.Now()
						tx.Status = "SETTLED"
						tx.SettledAt = &now
						if err := dbTx.Save(&tx).Error; err != nil {
							return err
						}

						return nil
					})

					if err != nil {
						log.Printf("Monitor: GORM transaction failed for tx %d: %v", tx.ID, err)
					} else {
						log.Printf("Monitor: Successfully settled deposit of %d sats for user ID %d", tx.AmountSats, *tx.ReceiverID)
					}
				}
			}
		}
	}()
}
