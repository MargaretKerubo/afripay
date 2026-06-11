package rates

import (
	"math"
	"testing"
)

func TestConvertSatsToFiat(t *testing.T) {
	s := &RateService{
		currentRates: CurrencyRates{
			KES: 100000000.0, // 1 BTC = 100M KES (1 KES per sat)
			UGX: 3000000000.0, // 1 BTC = 3B UGX (30 UGX per sat)
			TZS: 2000000000.0, // 1 BTC = 2B TZS (20 TZS per sat)
		},
	}

	valKES, err := s.ConvertSatsToFiat(1000, "KES")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if math.Abs(valKES-1000.0) > 1e-9 {
		t.Errorf("expected 1000.0 KES, got %f", valKES)
	}

	valUGX, err := s.ConvertSatsToFiat(1000, "UGX")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if math.Abs(valUGX-30000.0) > 1e-9 {
		t.Errorf("expected 30000.0 UGX, got %f", valUGX)
	}

	_, err = s.ConvertSatsToFiat(1000, "USD")
	if err == nil {
		t.Errorf("expected error for unsupported currency, got nil")
	}
}
