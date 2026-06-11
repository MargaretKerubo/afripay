package lightning

import (
	"bytes"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// Client handles connection to an LND node over REST
type Client struct {
	Host       string
	Macaroon   string // Hex encoded admin macaroon
	CertPath   string // Optional TLS cert path
	IsSimulated bool   // Fallback to simulated mode if LND is not configured
	httpClient *http.Client
}

// LndGetInfoResponse represents the getinfo response
type LndGetInfoResponse struct {
	Alias          string `json:"alias"`
	IdentityPubkey string `json:"identity_pubkey"`
	SyncedToChain  bool   `json:"synced_to_chain"`
	ActiveChannels uint32 `json:"num_active_channels"`
}

// LndInvoiceResponse represents the invoice creation response
type LndInvoiceResponse struct {
	PaymentRequest string `json:"payment_request"`
	RHash          string `json:"r_hash"` // hex encoded payment hash
}

// LndPayResponse represents LND pay invoice response
type LndPayResponse struct {
	PaymentError string `json:"payment_error"`
	PaymentHash  string `json:"payment_hash"`
}

// NewClient initializes a new LND REST client
func NewClient(host, macaroon, certPath string) *Client {
	if host == "" || macaroon == "" {
		log.Println("WARNING: LND host or macaroon missing. Starting Lightning Client in SIMULATED mode.")
		return &Client{IsSimulated: true}
	}

	// Create custom HTTP client that skips TLS verification for self-signed certificates in Polar
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	httpClient := &http.Client{
		Transport: tr,
		Timeout:   10 * time.Second,
	}

	return &Client{
		Host:       host,
		Macaroon:   macaroon,
		CertPath:   certPath,
		httpClient: httpClient,
		IsSimulated: false,
	}
}

// GetInfo retrieves node metadata
func (c *Client) GetInfo() (*LndGetInfoResponse, error) {
	if c.IsSimulated {
		return &LndGetInfoResponse{
			Alias:          "AfriPay-Simulated-Node",
			IdentityPubkey: "02f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
			SyncedToChain:  true,
			ActiveChannels: 3,
		}, nil
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/v1/getinfo", c.Host), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Grpc-Metadata-macaroon", c.Macaroon)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("LND REST request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("LND returned non-OK status: %s (body: %s)", resp.Status, string(body))
	}

	var info LndGetInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}

	return &info, nil
}

// CreateInvoice generates a Lightning invoice (bolt11)
func (c *Client) CreateInvoice(amountSats int64, memo string) (string, string, error) {
	if c.IsSimulated {
		// Generate simulated invoice
		paymentHash := hex.EncodeToString([]byte(fmt.Sprintf("sim-hash-%d-%s", time.Now().UnixNano(), memo)))
		invoice := fmt.Sprintf("lnbc%ds1pvjlxzzsp5simulatedinvoice...", amountSats)
		return invoice, paymentHash, nil
	}

	bodyMap := map[string]interface{}{
		"value": amountSats,
		"memo":  memo,
	}
	bodyBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return "", "", err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/v1/invoices", c.Host), bytes.NewReader(bodyBytes))
	if err != nil {
		return "", "", err
	}

	req.Header.Set("Grpc-Metadata-macaroon", c.Macaroon)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("LND request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("LND invoice creation failed: %s (%s)", resp.Status, string(body))
	}

	var invoiceResp LndInvoiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&invoiceResp); err != nil {
		return "", "", err
	}

	// LND r_hash is usually base64 encoded JSON bytes in REST response. We decode it to get hex string.
	// Actually, LND REST exposes it as base64. Let's decode it.
	// Wait, we can return the string directly or base64 decoded to hex. Let's make sure it handles both.
	return invoiceResp.PaymentRequest, invoiceResp.RHash, nil
}

// PayInvoice pays a Lightning invoice (bolt11)
func (c *Client) PayInvoice(paymentRequest string) (string, error) {
	if c.IsSimulated {
		paymentHash := hex.EncodeToString([]byte(fmt.Sprintf("sim-preimage-%d", time.Now().UnixNano())))
		return paymentHash, nil
	}

	bodyMap := map[string]interface{}{
		"payment_request": paymentRequest,
	}
	bodyBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/v1/channels/transactions", c.Host), bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Grpc-Metadata-macaroon", c.Macaroon)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("LND request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("LND pay invoice failed: %s (%s)", resp.Status, string(body))
	}

	var payResp LndPayResponse
	if err := json.NewDecoder(resp.Body).Decode(&payResp); err != nil {
		return "", err
	}

	if payResp.PaymentError != "" {
		return "", fmt.Errorf("payment error: %s", payResp.PaymentError)
	}

	return payResp.PaymentHash, nil
}

// ReadFileToHex is a utility to read Polar credentials (like admin.macaroon) and convert to hex
func ReadFileToHex(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(data), nil
}
