package rates

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// CurrencyRates holds the exchange rates from 1 BTC to target fiat currencies
type CurrencyRates struct {
	KES float64
	UGX float64
	TZS float64
}

// RateService manages fetching and caching exchange rates
type RateService struct {
	mu           sync.RWMutex
	currentRates CurrencyRates
	lastUpdated  time.Time
}

// CoinGeckoResponse represents the simple price response structure
type CoinGeckoResponse struct {
	Bitcoin map[string]float64 `json:"bitcoin"`
}

// Fallback rates (approximate values)
var defaultFallbackRates = CurrencyRates{
	KES: 135000000.0, // 1 BTC = ~135M KES (~1.35 KES per sat)
	UGX: 3750000000.0, // 1 BTC = ~3.75B UGX (~37.5 UGX per sat)
	TZS: 2600000000.0, // 1 BTC = ~2.6B TZS (~26 TZS per sat)
}

// NewRateService creates a new rate service and starts a background updater
func NewRateService() *RateService {
	s := &RateService{
		currentRates: defaultFallbackRates,
		lastUpdated:  time.Now(),
	}

	// Fetch initial rates immediately
	s.fetchRates()

	// Update rates every 10 minutes in the background
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		for range ticker.C {
			s.fetchRates()
		}
	}()

	return s
}

// fetchRates requests the latest price from CoinGecko
func (s *RateService) fetchRates() {
	log.Println("Updating exchange rates from CoinGecko...")
	url := "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=kes,ugx,tzs,usd"
	
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		log.Printf("Error fetching rates from CoinGecko: %v. Using fallback rates.", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("CoinGecko returned non-200 status: %d. Using fallback rates.", resp.StatusCode)
		return
	}

	var data CoinGeckoResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Printf("Failed to decode CoinGecko response: %v. Using fallback rates.", err)
		return
	}

	usdRate, ok := data.Bitcoin["usd"]
	if !ok {
		log.Println("CoinGecko response missing USD. Using fallback rates.")
		return
	}

	kesRate := data.Bitcoin["kes"]
	if kesRate == 0 {
		kesRate = usdRate * 130.0 // fallback
	}

	ugxRate := data.Bitcoin["ugx"]
	if ugxRate == 0 {
		ugxRate = usdRate * 3750.0 // fallback
	}

	tzsRate := data.Bitcoin["tzs"]
	if tzsRate == 0 {
		tzsRate = usdRate * 2600.0 // fallback
	}

	s.mu.Lock()
	s.currentRates = CurrencyRates{
		KES: kesRate,
		UGX: ugxRate,
		TZS: tzsRate,
	}
	s.lastUpdated = time.Now()
	s.mu.Unlock()

	log.Printf("Rates successfully updated: KES=%.2f, UGX=%.2f, TZS=%.2f", s.currentRates.KES, s.currentRates.UGX, s.currentRates.TZS)
}

// ConvertSatsToFiat converts satoshis to a specific fiat currency
func (s *RateService) ConvertSatsToFiat(sats int64, currency string) (float64, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var btcRate float64
	switch currency {
	case "KES":
		btcRate = s.currentRates.KES
	case "UGX":
		btcRate = s.currentRates.UGX
	case "TZS":
		btcRate = s.currentRates.TZS
	default:
		return 0, fmt.Errorf("unsupported fiat currency: %s", currency)
	}

	// 1 BTC = 100,000,000 satoshis
	btcValue := float64(sats) / 100000000.0
	fiatValue := btcValue * btcRate
	return fiatValue, nil
}

// GetRates returns the current exchange rates cached in the service
func (s *RateService) GetRates() CurrencyRates {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.currentRates
}
