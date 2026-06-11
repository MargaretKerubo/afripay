package lightning

import (
	"testing"
)

func TestDecodeBase64OrHex(t *testing.T) {
	// 32-byte hex hash
	hexHash := "02e130c8f24bc7ee30b6ae000dd91a0e4c92aeb62d5c9b8fb102246540b6023a"
	res, err := decodeBase64OrHex(hexHash)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res != hexHash {
		t.Errorf("expected %s, got %s", hexHash, res)
	}

	// Base64 encoded hash
	// hex "02e130c8f24bc7ee30b6ae000dd91a0e4c92aeb62d5c9b8fb102246540b6023a"
	// standard base64: "AuEwyPJLx+4wtq4ADdkaDkySrrYtXJuPsQIkZUC2Ajo="
	base64Hash := "AuEwyPJLx+4wtq4ADdkaDkySrrYtXJuPsQIkZUC2Ajo="
	res, err = decodeBase64OrHex(base64Hash)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res != hexHash {
		t.Errorf("expected %s, got %s", hexHash, res)
	}

	// URL encoded base64 hash (e.g. without padding or safe chars)
	urlSafeBase64Hash := "AuEwyPJLx-4wtq4ADdkaDkySrrYtXJuPsQIkZUC2Ajo"
	res, err = decodeBase64OrHex(urlSafeBase64Hash)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res != hexHash {
		t.Errorf("expected %s, got %s", hexHash, res)
	}

	// Invalid input
	_, err = decodeBase64OrHex("invalid_base64_string_that_cannot_be_decoded")
	if err == nil {
		t.Errorf("expected error for invalid base64, got nil")
	}
}

func TestSimulatedClient(t *testing.T) {
	c := NewClient("", "", "") // starts in simulated mode
	if !c.IsSimulated {
		t.Errorf("expected client to be simulated")
	}

	info, err := c.GetInfo()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.Alias != "AfriPay-Simulated-Node" {
		t.Errorf("expected simulated alias, got %s", info.Alias)
	}

	invoice, hash, err := c.CreateInvoice(1000, "test")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if invoice == "" || hash == "" {
		t.Errorf("expected non-empty invoice and hash")
	}

	decoded, err := c.DecodeInvoice(invoice)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if decoded.NumSatoshis != 1000 {
		t.Errorf("expected 1000 sats, got %d", decoded.NumSatoshis)
	}

	payHash, err := c.PayInvoice(invoice)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if payHash == "" {
		t.Errorf("expected non-empty pay preimage/hash")
	}
}
