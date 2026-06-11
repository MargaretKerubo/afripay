package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// MVP Fixed Exchange Rates (Price of 1 whole BTC in local African fiat)
const (
	BtcToKes = 9000000.0  // 1 BTC = 9,000,000 Kenyan Shillings
	BtcToUgx = 25000000.0 // 1 BTC = 25,000,000 Ugandan Shillings
	BtcToTzs = 18000000.0 // 1 BTC = 18,000,000 Tanzanian Shillings
)

// Utility Function: Converts Satoshis back to whole Bitcoin
// Because 1 BTC = 100,000,000 Satoshis
func SatsToBtc(sats int64) float64 {
	return float64(sats) / 100000000
}

func main() {
	// Initialize the Gin router to handle web requests
	r := gin.Default()

	// API Endpoint: GET /api/convert
	// This allows the frontend to request a calculation
	r.GET("/api/convert", func(c *gin.Context) {
		satsStr := c.Query("sats")
		targetCurrency := c.Query("currency") // Expecting: KES, UGX, or TZS

		// 1. Input Validation (Checking if the user sent correct information)
		if satsStr == "" || targetCurrency == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing 'sats' or 'currency' parameter"})
			return
		}

		sats, err := strconv.ParseInt(satsStr, 10, 64)
		if err != nil || sats < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid satoshi amount"})
			return
		}

		// 2. Perform the conversion logic
		btcAmount := SatsToBtc(sats)
		var fiatAmount float64

		switch targetCurrency {
		case "KES":
			fiatAmount = btcAmount * BtcToKes
		case "UGX":
			fiatAmount = btcAmount * BtcToUgx
		case "TZS":
			fiatAmount = btcAmount * BtcToTzs
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported currency. Use KES, UGX, or TZS"})
			return
		}

		// 3. Return the clean, successful JSON response back to the app
		c.JSON(http.StatusOK, gin.H{
			"sats":            sats,
			"btc_equivalent":  btcAmount,
			"target_currency": targetCurrency,
			"converted_value": fiatAmount,
		})
	})

	// Run the server on port 8080
	r.Run(":8080")
}
