package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Transaction holds the record of a single spending event
type Transaction struct {
	Timestamp string  `json:"timestamp"`
	Category  string  `json:"category"`
	Amount    float64 `json:"amount"`
}

// UserProfile holds the global financial configuration and ledger history
type UserProfile struct {
	CurrencySymbol string  `json:"currency_symbol"`
	MonthlySalary  float64 `json:"monthly_salary"`
	NeedsBudget    float64 `json:"needs_budget"`
	WantsBudget    float64 `json:"wants_budget"`
	SavingsBudget  float64 `json:"savings_budget"`

	// Needs Sub-Envelopes
	AllocatedRent      float64 `json:"allocated_rent"`
	AllocatedFood      float64 `json:"allocated_food"`
	AllocatedTransport float64 `json:"allocated_transport"`
	AllocatedUtilities float64 `json:"allocated_utilities"`

	// The Ledger History Array
	History []Transaction `json:"history"`
}

const dbFilename = "budget.json"

var currentProfile UserProfile

func main() {
	fmt.Println("=========================================")
	fmt.Println("    SAFI-BUDGET: SMART FINANCIAL CLI     ")
	fmt.Println("=========================================")

	if loadProfile() {
		fmt.Println("✨ Welcome back! Loaded your saved budget configuration.")
	} else {
		fmt.Println("👋 New profile detected. Let's set up your system.")
		runOnboarding()
		saveProfile()
	}

	runMainLoop()
}

func saveProfile() {
	data, err := json.MarshalIndent(currentProfile, "", "  ")
	if err != nil {
		fmt.Println("❌ Error processing budget data.")
		return
	}
	_ = os.WriteFile(dbFilename, data, 0644)
}

func loadProfile() bool {
	if _, err := os.Stat(dbFilename); os.IsNotExist(err) {
		return false
	}
	data, err := os.ReadFile(dbFilename)
	if err != nil {
		return false
	}
	_ = json.Unmarshal(data, &currentProfile)
	return true
}

func runOnboarding() {
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Println("\nSelect your currency display symbol.")
	fmt.Print("Press ENTER for local default (KSh), or type yours: ")
	scanner.Scan()
	symbol := strings.TrimSpace(scanner.Text())
	if symbol == "" {
		symbol = "KSh"
	}
	currentProfile.CurrencySymbol = symbol

	var salary float64
	for {
		fmt.Printf("Enter your Monthly Net Income (in %s): ", currentProfile.CurrencySymbol)
		scanner.Scan()
		valStr := strings.TrimSpace(scanner.Text())
		parsed, err := strconv.ParseFloat(valStr, 64)
		if err == nil && parsed > 0 {
			salary = parsed
			break
		}
		fmt.Println("❌ Invalid amount. Try again.")
	}
	currentProfile.MonthlySalary = salary

	currentProfile.NeedsBudget = currentProfile.MonthlySalary * 0.50
	currentProfile.WantsBudget = currentProfile.MonthlySalary * 0.30
	currentProfile.SavingsBudget = currentProfile.MonthlySalary * 0.20

	currentProfile.AllocatedRent = currentProfile.MonthlySalary * 0.20
	currentProfile.AllocatedFood = currentProfile.NeedsBudget * 0.40
	currentProfile.AllocatedTransport = currentProfile.NeedsBudget * 0.20
	currentProfile.AllocatedUtilities = currentProfile.NeedsBudget - (currentProfile.AllocatedRent + currentProfile.AllocatedFood + currentProfile.AllocatedTransport)

	currentProfile.History = []Transaction{}
	fmt.Println("\n✅ Budget initialized to standard safety limits.")
}

func runMainLoop() {
	scanner := bufio.NewScanner(os.Stdin)

	for {
		fmt.Println("\n=========================================")
		fmt.Println("         SAFI-BUDGET MAIN MENU           ")
		fmt.Println("=========================================")
		fmt.Println("1. View Current Dashboard Balances")
		fmt.Println("2. Run End-of-Month Savings Advisor")
		fmt.Println("3. Log a New Expense (Spend Money)")
		fmt.Println("4. View Statement (Transaction History)")
		fmt.Println("5. Exit Application")
		fmt.Print("Choose an option (1-5): ")

		scanner.Scan()
		choice := strings.TrimSpace(scanner.Text())

		switch choice {
		case "1":
			fmt.Println("\n📋 --- LIVE DASHBOARD STATUS ---")
			fmt.Printf("🏠 Rent Allocation:    %.2f %s\n", currentProfile.AllocatedRent, currentProfile.CurrencySymbol)
			fmt.Printf("🍲 Groceries & Food:   %.2f %s\n", currentProfile.AllocatedFood, currentProfile.CurrencySymbol)
			fmt.Printf("🚌 Transport Budget:   %.2f %s\n", currentProfile.AllocatedTransport, currentProfile.CurrencySymbol)
			fmt.Printf("💡 Bills & Tokens:     %.2f %s\n", currentProfile.AllocatedUtilities, currentProfile.CurrencySymbol)
			fmt.Printf("🔵 Baseline Savings:   %.2f %s\n", currentProfile.SavingsBudget, currentProfile.CurrencySymbol)

		case "2":
			fmt.Println("\n⏳ --- END-OF-MONTH CLOSING UTILITY ---")
			fmt.Print("Enter the total leftover cash remaining in your wallet: ")
			scanner.Scan()
			valStr := strings.TrimSpace(scanner.Text())
			unspentCash, err := strconv.ParseFloat(valStr, 64)

			if err != nil || unspentCash < 0 {
				fmt.Println("❌ Invalid amount.")
				continue
			}
			if unspentCash == 0 {
				fmt.Println("\n📉 Balanced to zero. Great job staying within limits!")
			} else {
				fmt.Println("\n🧠 --- STRATEGIC INVESTMENT ACTION PLAN ---")
				fmt.Printf("🔥 Outstanding discipline! You have %.2f %s leftover.\n", unspentCash, currentProfile.CurrencySymbol)
				fmt.Printf("📥 Deposit %.2f %s ➡️ Sacco (Compounding Growth).\n", unspentCash*0.5, currentProfile.CurrencySymbol)
				fmt.Printf("📥 Deposit %.2f %s ➡️ MMF (Liquidity Emergency Reserve).\n", unspentCash*0.5, currentProfile.CurrencySymbol)
			}

		case "3":
			fmt.Println("\n💸 --- LOG AN EXPENSE ---")
			fmt.Println("1. Groceries & Food")
			fmt.Println("2. Transport/Commute")
			fmt.Println("3. Bills & Tokens")
			fmt.Print("Pick a category (1-3): ")
			scanner.Scan()
			cat := strings.TrimSpace(scanner.Text())

			fmt.Print("Enter amount spent: ")
			scanner.Scan()
			spendStr := strings.TrimSpace(scanner.Text())
			spend, err := strconv.ParseFloat(spendStr, 64)

			if err != nil || spend <= 0 {
				fmt.Println("❌ Invalid entry.")
				continue
			}

			categoryName := ""
			switch cat {
			case "1":
				if spend > currentProfile.AllocatedFood {
					fmt.Println("⚠️ Alert: This will overdraw your Food wallet!")
				}
				currentProfile.AllocatedFood -= spend
				categoryName = "Groceries & Food"
			case "2":
				if spend > currentProfile.AllocatedTransport {
					fmt.Println("⚠️ Alert: This will overdraw your Transport wallet!")
				}
				currentProfile.AllocatedTransport -= spend
				categoryName = "Transport/Commute"
			case "3":
				if spend > currentProfile.AllocatedUtilities {
					fmt.Println("⚠️ Alert: This will overdraw your Utilities wallet!")
				}
				currentProfile.AllocatedUtilities -= spend
				categoryName = "Bills & Tokens"
			default:
				fmt.Println("❌ Invalid Category.")
				continue
			}

			currentTime := time.Now().Format("2006-01-02 15:04:05")
			newTx := Transaction{Timestamp: currentTime, Category: categoryName, Amount: spend}
			currentProfile.History = append(currentProfile.History, newTx)

			fmt.Printf("✅ Deducted %.2f %s from %s and updated ledger.\n", spend, currentProfile.CurrencySymbol, categoryName)
			saveProfile()

		case "4":
			fmt.Println("\n📜 --- FINANCIAL STATEMENT AUDIT LOG ---")
			if len(currentProfile.History) == 0 {
				fmt.Println("No transactions recorded yet this month.")
				continue
			}
			for i, tx := range currentProfile.History {
				fmt.Printf("[%d] %s | Category: %-18s | Spent: %.2f %s\n", i+1, tx.Timestamp, tx.Category, tx.Amount, currentProfile.CurrencySymbol)
			}
			fmt.Println("----------------------------------------------------------------------")

		case "5":
			fmt.Println("Keep building smartly!")
			return

		default:
			fmt.Println("❌ Invalid choice. Please select 1-5.")
		}
	}
}
