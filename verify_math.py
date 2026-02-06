"""
Verification script for Rent vs Sell Calculator
This script manually calculates the same values as the JavaScript calculator
to verify the math is correct.
"""

from datetime import datetime
from dateutil.relativedelta import relativedelta

# Sample Input Values (matching the default values in the calculator)
purchase_price = 400000
loan_origin_date = datetime(2022, 1, 1)
original_loan_amount = 320000
interest_rate = 6.5  # percent
monthly_pi = 2023
monthly_hoa = 150
monthly_taxes = 350
monthly_insurance = 150
monthly_maintenance = 200
rental_price = 2800
annual_rent_increase = 3  # percent
property_mgmt_fee = 10  # percent
costs_to_rent = 5000
rental_tax_rate = 22  # percent
home_appreciation = 3  # percent
selling_fees = 6  # percent
costs_to_sell = 10000
capital_gains_tax = 15  # percent
investment_return = 7  # percent
years_to_hold = 10
is_primary_residence = True

# Derived values
monthly_rate = interest_rate / 100 / 12
total_loan_months = 360  # 30-year mortgage
now = datetime(2026, 2, 4)  # Current date for testing

def months_elapsed(origin_date, current_date):
    """Calculate months between two dates"""
    diff = relativedelta(current_date, origin_date)
    return diff.years * 12 + diff.months

def calculate_remaining_balance(principal, monthly_rate, total_months, months_paid):
    """Standard amortization formula for remaining balance"""
    if monthly_rate == 0:
        return principal - (principal / total_months * months_paid)
    
    # B = P * [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
    factor = (1 + monthly_rate) ** total_months
    paid_factor = (1 + monthly_rate) ** months_paid
    balance = principal * (factor - paid_factor) / (factor - 1)
    return max(0, balance)

# Calculate months elapsed from loan origination to now
elapsed = months_elapsed(loan_origin_date, now)
print(f"=== VERIFICATION SCRIPT ===")
print(f"Loan originated: {loan_origin_date.strftime('%Y-%m-%d')}")
print(f"Current date: {now.strftime('%Y-%m-%d')}")
print(f"Months elapsed: {elapsed}")
print()

# Calculate current loan balance
current_balance = calculate_remaining_balance(original_loan_amount, monthly_rate, total_loan_months, elapsed)
print(f"=== LOAN AMORTIZATION CHECK ===")
print(f"Original loan: ${original_loan_amount:,.0f}")
print(f"Monthly rate: {monthly_rate:.6f}")
print(f"Current balance after {elapsed} months: ${current_balance:,.2f}")
print()

# Verify monthly payment calculation using standard formula
# M = P * [r(1+r)^n] / [(1+r)^n - 1]
factor = (1 + monthly_rate) ** total_loan_months
calculated_payment = original_loan_amount * (monthly_rate * factor) / (factor - 1)
print(f"=== MONTHLY PAYMENT VERIFICATION ===")
print(f"Input monthly P&I: ${monthly_pi:,.0f}")
print(f"Calculated monthly P&I: ${calculated_payment:,.2f}")
print(f"Difference: ${abs(monthly_pi - calculated_payment):,.2f}")
print()

# Calculate home value now (with appreciation from purchase)
years_owned = elapsed / 12
current_home_value = purchase_price * ((1 + home_appreciation / 100) ** years_owned)
print(f"=== HOME VALUE CHECK ===")
print(f"Purchase price: ${purchase_price:,.0f}")
print(f"Years owned: {years_owned:.2f}")
print(f"Current home value (with {home_appreciation}% annual appreciation): ${current_home_value:,.2f}")
print(f"Current equity: ${current_home_value - current_balance:,.2f}")
print()

# Monthly costs
monthly_ownership_cost = monthly_pi + monthly_taxes + monthly_insurance + monthly_hoa + monthly_maintenance
print(f"=== MONTHLY COSTS ===")
print(f"P&I: ${monthly_pi:,.0f}")
print(f"Taxes: ${monthly_taxes:,.0f}")
print(f"Insurance: ${monthly_insurance:,.0f}")
print(f"HOA: ${monthly_hoa:,.0f}")
print(f"Maintenance: ${monthly_maintenance:,.0f}")
print(f"Total monthly ownership cost: ${monthly_ownership_cost:,.0f}")
print()

# Annual depreciation
annual_depreciation = (purchase_price * 0.8) / 27.5
print(f"=== DEPRECIATION ===")
print(f"Building value (80% of purchase): ${purchase_price * 0.8:,.0f}")
print(f"Annual depreciation (27.5 years): ${annual_depreciation:,.2f}")
print()

print("=" * 60)
print("YEAR-BY-YEAR ANALYSIS")
print("=" * 60)

cumulative_rental_cash_flow = -costs_to_rent
cumulative_opportunity_cost = 0

for year in range(0, years_to_hold + 1):
    future_months = elapsed + (year * 12)
    years_from_purchase = future_months / 12
    
    # Property values
    home_value = purchase_price * ((1 + home_appreciation / 100) ** years_from_purchase)
    loan_balance = calculate_remaining_balance(original_loan_amount, monthly_rate, total_loan_months, future_months)
    equity = home_value - loan_balance
    
    # Rental scenario
    current_rent = rental_price * ((1 + annual_rent_increase / 100) ** year)
    annual_rental_income = current_rent * 12
    annual_mgmt_fee = annual_rental_income * (property_mgmt_fee / 100)
    annual_ownership_costs = monthly_ownership_cost * 12
    
    gross_rental_profit = annual_rental_income - annual_mgmt_fee - annual_ownership_costs
    taxable_rental_income = gross_rental_profit - annual_depreciation
    rental_tax = max(0, taxable_rental_income * (rental_tax_rate / 100))
    net_rental_cash_flow = gross_rental_profit - rental_tax
    
    if year == 0:
        year_cash_flow = -costs_to_rent
    else:
        cumulative_rental_cash_flow += net_rental_cash_flow
        year_cash_flow = net_rental_cash_flow
    
    # Opportunity cost
    year_opportunity_cost = 0
    if year > 0 and net_rental_cash_flow < 0:
        year_opportunity_cost = abs(net_rental_cash_flow)
    
    if year > 0:
        cumulative_opportunity_cost = cumulative_opportunity_cost * (1 + investment_return / 100) + year_opportunity_cost
    
    rental_net_worth = equity + cumulative_rental_cash_flow
    
    # Sale scenario
    sale_price = home_value
    selling_costs = sale_price * (selling_fees / 100) + costs_to_sell
    net_sale_proceeds = sale_price - loan_balance - selling_costs
    capital_gain = sale_price - purchase_price
    
    if capital_gain > 0:
        if is_primary_residence and year <= 3:
            taxable_gain = max(0, capital_gain - 500000)
        else:
            taxable_gain = capital_gain
        capital_gains_tax_owed = taxable_gain * (capital_gains_tax / 100)
    else:
        capital_gains_tax_owed = 0
    
    net_after_tax_proceeds = net_sale_proceeds - capital_gains_tax_owed
    years_to_invest = years_to_hold - year
    invested_value = net_after_tax_proceeds * ((1 + investment_return / 100) ** years_to_invest)
    
    better = "RENT" if rental_net_worth > invested_value else "SELL"
    
    print(f"\n--- YEAR {year} ---")
    print(f"Home Value: ${home_value:,.0f}")
    print(f"Loan Balance: ${loan_balance:,.0f}")
    print(f"Equity: ${equity:,.0f}")
    print(f"")
    print(f"Annual Rent: ${annual_rental_income:,.0f}")
    print(f"Annual Expenses: ${annual_ownership_costs + annual_mgmt_fee:,.0f}")
    print(f"Gross Rental Profit: ${gross_rental_profit:,.0f}")
    print(f"Net Cash Flow (this year): ${year_cash_flow:,.0f}")
    print(f"Cumulative Cash Flow: ${cumulative_rental_cash_flow:,.0f}")
    print(f"RENT Net Worth: ${rental_net_worth:,.0f}")
    print(f"")
    print(f"Sale Price: ${sale_price:,.0f}")
    print(f"Selling Costs: ${selling_costs:,.0f}")
    print(f"Net Proceeds: ${net_sale_proceeds:,.0f}")
    print(f"Capital Gain: ${capital_gain:,.0f}")
    print(f"Cap Gains Tax: ${capital_gains_tax_owed:,.0f}")
    print(f"Net After Tax: ${net_after_tax_proceeds:,.0f}")
    print(f"Invested to Year {years_to_hold}: ${invested_value:,.0f}")
    print(f"SELL Net Worth: ${invested_value:,.0f}")
    print(f"")
    print(f"Opportunity Cost (cumulative): ${cumulative_opportunity_cost:,.0f}")
    print(f">>> BETTER OPTION: {better}")

print("\n" + "=" * 60)
print("SANITY CHECKS")
print("=" * 60)

# Check 1: Loan balance should decrease over time
print("\n✓ Loan balance decreasing check:")
bal_year_0 = calculate_remaining_balance(original_loan_amount, monthly_rate, total_loan_months, elapsed)
bal_year_5 = calculate_remaining_balance(original_loan_amount, monthly_rate, total_loan_months, elapsed + 60)
bal_year_10 = calculate_remaining_balance(original_loan_amount, monthly_rate, total_loan_months, elapsed + 120)
print(f"  Year 0: ${bal_year_0:,.0f}")
print(f"  Year 5: ${bal_year_5:,.0f}")
print(f"  Year 10: ${bal_year_10:,.0f}")
print(f"  ✓ PASS" if bal_year_0 > bal_year_5 > bal_year_10 else "  ✗ FAIL")

# Check 2: Home value should increase over time
print("\n✓ Home value increasing check:")
hv_year_0 = purchase_price * ((1 + home_appreciation / 100) ** (elapsed / 12))
hv_year_5 = purchase_price * ((1 + home_appreciation / 100) ** ((elapsed + 60) / 12))
hv_year_10 = purchase_price * ((1 + home_appreciation / 100) ** ((elapsed + 120) / 12))
print(f"  Year 0: ${hv_year_0:,.0f}")
print(f"  Year 5: ${hv_year_5:,.0f}")
print(f"  Year 10: ${hv_year_10:,.0f}")
print(f"  ✓ PASS" if hv_year_0 < hv_year_5 < hv_year_10 else "  ✗ FAIL")

# Check 3: Equity should increase over time (appreciation + principal paydown)
print("\n✓ Equity increasing check:")
eq_year_0 = hv_year_0 - bal_year_0
eq_year_5 = hv_year_5 - bal_year_5
eq_year_10 = hv_year_10 - bal_year_10
print(f"  Year 0: ${eq_year_0:,.0f}")
print(f"  Year 5: ${eq_year_5:,.0f}")
print(f"  Year 10: ${eq_year_10:,.0f}")
print(f"  ✓ PASS" if eq_year_0 < eq_year_5 < eq_year_10 else "  ✗ FAIL")

# Check 4: Rent should increase over time
print("\n✓ Rent increasing check:")
rent_year_0 = rental_price
rent_year_5 = rental_price * ((1 + annual_rent_increase / 100) ** 5)
rent_year_10 = rental_price * ((1 + annual_rent_increase / 100) ** 10)
print(f"  Year 0: ${rent_year_0:,.0f}/mo")
print(f"  Year 5: ${rent_year_5:,.0f}/mo")
print(f"  Year 10: ${rent_year_10:,.0f}/mo")
print(f"  ✓ PASS" if rent_year_0 < rent_year_5 < rent_year_10 else "  ✗ FAIL")

# Check 5: With positive cash flow, renting should build wealth
print("\n✓ Positive cash flow leads to wealth accumulation:")
# Year 1 rental income vs expenses
year1_rent = rental_price * 12
year1_expenses = monthly_ownership_cost * 12 + year1_rent * (property_mgmt_fee / 100)
print(f"  Year 1 rental income: ${year1_rent:,.0f}")
print(f"  Year 1 expenses (incl mgmt): ${year1_expenses:,.0f}")
print(f"  Gross profit: ${year1_rent - year1_expenses:,.0f}")
if year1_rent > year1_expenses:
    print(f"  ✓ POSITIVE CASH FLOW - rental builds wealth")
else:
    print(f"  ℹ NEGATIVE CASH FLOW - selling may be better short-term")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
