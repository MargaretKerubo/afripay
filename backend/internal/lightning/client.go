package lightning

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
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
		Timeout:   2 * time.Second,
	}

	client := &Client{
		Host:       host,
		Macaroon:   macaroon,
		CertPath:   certPath,
		httpClient: httpClient,
		IsSimulated: false,
	}

	// Verify LND connectivity on startup and fallback to simulated mode if unreachable
	_, err := client.GetInfo()
	if err != nil {
		log.Printf("WARNING: Failed to connect to LND node at %s: %v. Falling back to SIMULATED mode.", host, err)
		client.IsSimulated = true
	} else {
		log.Printf("SUCCESS: Connected to LND node at %s", host)
		// Restore full timeout for normal operations
		httpClient.Timeout = 10 * time.Second
	}

	return client
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

	paymentHashHex, err := decodeBase64OrHex(invoiceResp.RHash)
	if err != nil {
		return "", "", fmt.Errorf("failed to decode payment hash: %w", err)
	}

	return invoiceResp.PaymentRequest, paymentHashHex, nil
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

	paymentHashHex, err := decodeBase64OrHex(payResp.PaymentHash)
	if err != nil {
		return "", fmt.Errorf("failed to decode payment hash: %w", err)
	}

	return paymentHashHex, nil
}

// LndDecodePayReqResponse represents the decode payment request response
type LndDecodePayReqResponse struct {
	NumSatoshis int64  `json:"num_satoshis,string"`
	PaymentHash string `json:"payment_hash"`
	Description string `json:"description"`
}

// DecodeInvoice decodes a BOLT11 invoice
func (c *Client) DecodeInvoice(payReq string) (*LndDecodePayReqResponse, error) {
	if c.IsSimulated {
		return &LndDecodePayReqResponse{
			NumSatoshis: 1000,
			PaymentHash: hex.EncodeToString([]byte(fmt.Sprintf("sim-decoded-%d", time.Now().UnixNano()))),
			Description: "Simulated Invoice Payment",
		}, nil
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/v1/payreq/%s", c.Host, payReq), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Grpc-Metadata-macaroon", c.Macaroon)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to decode invoice: %s (%s)", resp.Status, string(body))
	}

	var decodeResp LndDecodePayReqResponse
	if err := json.NewDecoder(resp.Body).Decode(&decodeResp); err != nil {
		return nil, err
	}

	return &decodeResp, nil
}

// LndInvoiceLookupResponse represents LND invoice lookup response
type LndInvoiceLookupResponse struct {
	Settled bool   `json:"settled"`
	State   string `json:"state"` // "OPEN", "SETTLED", "CANCELED", "ACCEPTED"
}

// LookupInvoice checks the status of a generated invoice
func (c *Client) LookupInvoice(paymentHashHex string) (*LndInvoiceLookupResponse, error) {
	if c.IsSimulated {
		return &LndInvoiceLookupResponse{Settled: false, State: "OPEN"}, nil
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/v1/invoice/%s", c.Host, paymentHashHex), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Grpc-Metadata-macaroon", c.Macaroon)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to lookup invoice: %s (%s)", resp.Status, string(body))
	}

	var lookupResp LndInvoiceLookupResponse
	if err := json.NewDecoder(resp.Body).Decode(&lookupResp); err != nil {
		return nil, err
	}

	return &lookupResp, nil
}

// decodeBase64OrHex decodes string from base64 (std or url, padded or raw) or accepts hex directly, returning hex representation
func decodeBase64OrHex(s string) (string, error) {
	if len(s) == 64 {
		if _, err := hex.DecodeString(s); err == nil {
			return s, nil
		}
	}
	data, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		data, err = base64.RawStdEncoding.DecodeString(s)
		if err != nil {
			data, err = base64.URLEncoding.DecodeString(s)
			if err != nil {
				data, err = base64.RawURLEncoding.DecodeString(s)
				if err != nil {
					return "", err
				}
			}
		}
	}
	return hex.EncodeToString(data), nil
}

// ReadFileToHex is a utility to read Polar credentials (like admin.macaroon) and convert to hex
func ReadFileToHex(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(data), nil
}
