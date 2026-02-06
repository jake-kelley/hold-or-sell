# Rent vs Sell Calculator

A simple, accurate tool to compare the financial outcomes of renting vs selling your property.

## Quick Start

Open `index.html` in your browser. No build step or server required.

## Features

- **Dynamic Updates**: All values recalculate instantly as you change inputs
- **Amortization**: Accurate loan balance calculation using standard amortization formula
- **Capital Gains**: Handles primary residence exemption ($500k MFJ) for first 3 years
- **Opportunity Cost**: Shows what you're losing if rental cash flow is negative
- **Visual Chart**: Compare scenarios over time with Chart.js visualization
- **Detailed Breakdown**: Year-by-year analysis of all values
- **Input Validation**: All inputs are silently clamped to sensible ranges
- **URL Persistence**: All inputs are saved to URL parameters — bookmark or share to restore your scenario

## Inputs

| Input | Description |
|-------|-------------|
| Purchase Price | Original purchase price (basis for capital gains) |
| Loan Origination Date | When the mortgage started |
| Original Loan Amount | Initial loan principal |
| Interest Rate | Annual interest rate |
| Monthly P&I | Principal + Interest payment |
| Monthly HOA | Homeowners association fee |
| Monthly Taxes | Property taxes |
| Monthly Insurance | Homeowners insurance |
| Monthly Maintenance | Reserve for repairs/maintenance |
| Rental Price | Expected monthly rent |
| Annual Rent Increase | Expected yearly rent increase % |
| Property Management Fee | % of rent for property manager |
| Rental Tax Rate | Your marginal tax rate on rental income |
| Home Appreciation | Expected annual appreciation % |
| Selling Fees | Realtor + closing costs % |
| Capital Gains Tax | Tax rate on profits above basis |
| Investment Return | Expected return if you invest sale proceeds |
| Years to Hold | How many years to analyze |
| Primary Residence | Have you lived here 2 of last 5 years? |

## How It Works

### Rent Scenario
- Calculates annual rental income with appreciation
- Subtracts all costs (PITI, HOA, maintenance, property management)
- Applies tax on positive rental profit
- Tracks cumulative cash flow and equity growth

### Sell Scenario
- Calculates sale proceeds after fees
- Applies capital gains tax (with primary residence exemption)
- Projects invested value of proceeds over time

### Comparison
The tool shows which option gives you more net worth at each year:
- **Rent Net Worth** = Home Equity + Cumulative Cash Flow
- **Sell Net Worth** = Sale Proceeds invested at expected return rate

## Files

- `index.html` - Main application
- `styles.css` - Styling
- `calculator.js` - All calculation logic
- `dev-status.md` - Developer context and architectural decisions
