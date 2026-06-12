package wallet

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

// NewHandler constructs a Handler backed by the given Service.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes attaches all wallet routes to the given router group.
// The group is expected to already have the auth middleware applied.
//
//	GET /balance       — current sats balance + fiat equivalent
//	GET /transactions  — paginated transaction history (newest-first)
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/balance", h.getBalance)
	rg.GET("/transactions", h.listTransactions)
}

// getBalance returns the authenticated user's wallet balance in sats and their
func (h *Handler) getBalance(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	resp, err := h.service.GetBalance(userID)
	if err != nil {
		if errors.Is(err, ErrWalletNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found for this user"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve wallet balance"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// listTransactions returns the authenticated user's transaction history.
func (h *Handler) listTransactions(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	limit := 50
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	txns, err := h.service.ListTransactions(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": txns,
		"count":        len(txns),
	})
}