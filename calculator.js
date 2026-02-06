/**
 * Rent vs Sell Calculator
 * All calculations are done client-side for instant updates
 */

// DOM Elements
const inputs = {
  purchasePrice: document.getElementById("purchasePrice"),
  loanOriginDate: document.getElementById("loanOriginDate"),
  originalLoanAmount: document.getElementById("originalLoanAmount"),
  interestRate: document.getElementById("interestRate"),
  mortgageTerm: document.getElementById("mortgageTerm"),
  monthlyPI: document.getElementById("monthlyPI"),
  primaryResidence: document.getElementById("primaryResidence"),
  currentHomeValue: document.getElementById("currentHomeValue"),
  monthlyHOA: document.getElementById("monthlyHOA"),
  monthlyTaxes: document.getElementById("monthlyTaxes"),
  monthlyInsurance: document.getElementById("monthlyInsurance"),
  monthlyMaintenance: document.getElementById("monthlyMaintenance"),
  rentalPrice: document.getElementById("rentalPrice"),
  annualRentIncrease: document.getElementById("annualRentIncrease"),
  propertyMgmtFee: document.getElementById("propertyMgmtFee"),
  rentalTaxRate: document.getElementById("rentalTaxRate"),
  homeAppreciation: document.getElementById("homeAppreciation"),
  sellingFees: document.getElementById("sellingFees"),
  capitalGainsTax: document.getElementById("capitalGainsTax"),
  investmentReturn: document.getElementById("investmentReturn"),
  yearsToHold: document.getElementById("yearsToHold"),
};

let chart = null;

/**
 * Calculate monthly P&I payment using standard mortgage formula
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculateMonthlyPayment(principal, annualRate, years) {
  if (annualRate === 0) {
    return principal / (years * 12);
  }
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const factor = Math.pow(1 + monthlyRate, numPayments);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Update the displayed monthly payment
 */
function updateMonthlyPaymentDisplay() {
  const loanAmount = parseFloat(inputs.originalLoanAmount.value) || 0;
  const interestRate = parseFloat(inputs.interestRate.value) || 0;
  const term = parseInt(inputs.mortgageTerm.value) || 30;
  
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, term);
  inputs.monthlyPI.value = formatCurrency(monthlyPayment);
  
  return monthlyPayment;
}

// Add event listeners to all inputs
Object.values(inputs).forEach((input) => {
  if (input && input.id !== 'monthlyPI') { // Skip the calculated field
    input.addEventListener("input", calculate);
    input.addEventListener("change", calculate);
  }
});

/**
 * Calculate remaining loan balance after N months using amortization formula
 * @param {number} principal - Original loan amount
 * @param {number} monthlyRate - Monthly interest rate (annual rate / 12 / 100)
 * @param {number} totalMonths - Total loan term in months (typically 360 for 30-year)
 * @param {number} monthsPaid - Number of months already paid
 * @returns {number} Remaining balance
 */
function calculateRemainingBalance(
  principal,
  monthlyRate,
  totalMonths,
  monthsPaid,
) {
  if (monthlyRate === 0) {
    // Edge case: 0% interest
    return principal - (principal / totalMonths) * monthsPaid;
  }

  // Standard amortization formula for remaining balance
  // B = P * [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
  // Where: P = principal, r = monthly rate, n = total months, p = months paid
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const paidFactor = Math.pow(1 + monthlyRate, monthsPaid);

  const balance = (principal * (factor - paidFactor)) / (factor - 1);
  return Math.max(0, balance);
}

/**
 * Get months elapsed since loan origination
 * @param {string} originDateStr - Loan origination date string
 * @returns {number} Months elapsed (payments made)
 * Note: First payment is typically ~45 days after origination (skips a month)
 * e.g., Loan originated 7/19/2022, first payment 9/1/2022
 */
function getMonthsElapsed(originDateStr) {
  const originDate = new Date(originDateStr);
  const now = new Date();
  const months =
    (now.getFullYear() - originDate.getFullYear()) * 12 +
    (now.getMonth() - originDate.getMonth());
  // Subtract 1 because first payment skips a month after origination
  return Math.max(0, months - 1);
}

/**
 * Format number as currency
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Silently clamp a numeric input to a valid range.
 * Writes the clamped value back to the input element.
 * @param {HTMLInputElement} input - The input element
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {boolean} isInt - Whether to parse as integer
 * @returns {number} The clamped value
 */
function clampInput(input, min, max, isInt = false) {
  let val = isInt ? parseInt(input.value) : parseFloat(input.value);
  if (isNaN(val)) val = min;
  val = Math.min(max, Math.max(min, val));
  if (input.value !== "" && parseFloat(input.value) !== val) {
    input.value = val;
  }
  return val;
}

/**
 * Validate and clamp all inputs to sensible ranges.
 * Called at the start of each calculation cycle.
 */
function validateInputs() {
  clampInput(inputs.purchasePrice, 0, Infinity);
  clampInput(inputs.originalLoanAmount, 0, Infinity);
  clampInput(inputs.interestRate, 0, 30);
  clampInput(inputs.currentHomeValue, 0, Infinity);
  clampInput(inputs.monthlyHOA, 0, Infinity);
  clampInput(inputs.monthlyTaxes, 0, Infinity);
  clampInput(inputs.monthlyInsurance, 0, Infinity);
  clampInput(inputs.monthlyMaintenance, 0, Infinity);
  clampInput(inputs.rentalPrice, 0, Infinity);
  clampInput(inputs.annualRentIncrease, 0, 20);
  clampInput(inputs.propertyMgmtFee, 0, 100);
  clampInput(inputs.rentalTaxRate, 0, 100);
  clampInput(inputs.homeAppreciation, -20, 30);
  clampInput(inputs.sellingFees, 0, 100);
  clampInput(inputs.capitalGainsTax, 0, 100);
  clampInput(inputs.investmentReturn, -50, 50);
  clampInput(inputs.yearsToHold, 1, 30, true);

  // Validate loan origination date: must be a valid date not in the future
  const dateVal = inputs.loanOriginDate.value;
  const parsed = new Date(dateVal);
  if (!dateVal || isNaN(parsed.getTime()) || parsed > new Date()) {
    inputs.loanOriginDate.value = new Date().toISOString().split("T")[0];
  }
}

/**
 * Main calculation function
 */
function calculate() {
  // Validate all inputs first (silent clamping)
  validateInputs();

  // Update the displayed monthly payment first
  const monthlyPI = updateMonthlyPaymentDisplay();
  
  // Get all input values (now guaranteed to be valid after validation)
  const purchasePrice = parseFloat(inputs.purchasePrice.value) || 0;
  const loanOriginDate = inputs.loanOriginDate.value;
  const originalLoanAmount = parseFloat(inputs.originalLoanAmount.value) || 0;
  const interestRate = parseFloat(inputs.interestRate.value) || 0;
  const mortgageTerm = parseInt(inputs.mortgageTerm.value) || 30;
  const currentHomeValue = parseFloat(inputs.currentHomeValue.value) || 0;
  const monthlyHOA = parseFloat(inputs.monthlyHOA.value) || 0;
  const monthlyTaxes = parseFloat(inputs.monthlyTaxes.value) || 0;
  const monthlyInsurance = parseFloat(inputs.monthlyInsurance.value) || 0;
  const monthlyMaintenance = parseFloat(inputs.monthlyMaintenance.value) || 0;
  const rentalPrice = parseFloat(inputs.rentalPrice.value) || 0;
  const annualRentIncrease = parseFloat(inputs.annualRentIncrease.value) || 0;
  const propertyMgmtFee = parseFloat(inputs.propertyMgmtFee.value) || 0;
  const rentalTaxRate = parseFloat(inputs.rentalTaxRate.value) || 0;
  const homeAppreciation = parseFloat(inputs.homeAppreciation.value) || 0;
  const sellingFees = parseFloat(inputs.sellingFees.value) || 0;
  const capitalGainsTax = parseFloat(inputs.capitalGainsTax.value) || 0;
  const investmentReturn = parseFloat(inputs.investmentReturn.value) || 0;
  const yearsToHold = parseInt(inputs.yearsToHold.value) || 10;
  const isPrimaryResidence = inputs.primaryResidence.value === "yes";

  // Derived values
  const monthlyRate = interestRate / 100 / 12;
  const totalLoanMonths = mortgageTerm * 12; // Use selected mortgage term
  const monthsElapsed = getMonthsElapsed(loanOriginDate);

  // Monthly PITI + HOA (total monthly ownership cost)
  const monthlyPITI = monthlyPI + monthlyTaxes + monthlyInsurance;
  const monthlyOwnershipCost = monthlyPITI + monthlyHOA + monthlyMaintenance;

  // Results storage
  const yearlyData = [];

  // Cumulative tracking for rental scenario
  let cumulativeRentalCashFlow = 0; // Startup costs handled in Year 0 loop
  let cumulativeInvestedCashFlow = 0; // Tracks growth of cash flows (time value of money)
  let cumulativeOpportunityCost = 0;

  // Calculate for each year
  let sellYear0Baseline = 0;
  for (let year = 0; year <= yearsToHold; year++) {
    const futureMonthsElapsed = monthsElapsed + year * 12;

    // --- PROPERTY VALUES ---
    // Home value: Year 0 uses user-provided current value, future years apply appreciation
    const homeValue =
      currentHomeValue * Math.pow(1 + homeAppreciation / 100, year);

    // Loan balance at this year
    const loanBalance = calculateRemainingBalance(
      originalLoanAmount,
      monthlyRate,
      totalLoanMonths,
      futureMonthsElapsed,
    );

    // Equity
    const equity = homeValue - loanBalance;

    // --- RENTAL SCENARIO (for this specific year) ---
    // Rent at this year (with annual increases from now)
    // Delay rent increase by 1 year (Year 1 is same as input rent, Year 2 is +increase)
    const rentGrowthExponent = Math.max(0, year - 1);
    const currentRent =
      rentalPrice * Math.pow(1 + annualRentIncrease / 100, rentGrowthExponent);
    const annualRentalIncome = currentRent * 12;

    // Property management fee
    const annualMgmtFee = annualRentalIncome * (propertyMgmtFee / 100);

    // Annual expenses (PITI + HOA + maintenance)
    const annualOwnershipCosts = monthlyOwnershipCost * 12;

    // Gross rental profit before tax
    const grossRentalProfit =
      annualRentalIncome - annualMgmtFee - annualOwnershipCosts;

    // Tax on rental profit (only if positive)
    const rentalTax =
      grossRentalProfit > 0 ? grossRentalProfit * (rentalTaxRate / 100) : 0;

    // Net cash flow from rental this year
    const netRentalCashFlow = grossRentalProfit - rentalTax;

    // For year 0, as per user request, we do not count any cash flow 
    // because that is the starting point/decision point
    let yearCashFlow = year === 0 ? 0 : netRentalCashFlow;

    // Calculate principal paid this year (equity building through mortgage paydown)
    let principalPaidThisYear = 0;
    if (year > 0) {
      const prevBalance = calculateRemainingBalance(
        originalLoanAmount,
        monthlyRate,
        totalLoanMonths,
        futureMonthsElapsed - 12,
      );
      principalPaidThisYear = prevBalance - loanBalance;
    }

    // Update cumulative cash flow (add this year's total cash flow)
    cumulativeRentalCashFlow += yearCashFlow;

    // Opportunity cost: if monthly cash flow is negative, that's money we're losing
    // that could have been invested elsewhere
    // Rental Cash Flow Invested Calculation (Accumulated Value method)
    // As per user request: Show the value as it grows.
    // Logic: Previous Total * (1 + rate) + Current Year Absolute Cash Flow.
    
    // 1. Grow the existing pot from previous years
    if (year > 0) {
        cumulativeOpportunityCost = cumulativeOpportunityCost * (1 + investmentReturn / 100);
    }
    
    // 2. Add this year's contribution (Absolute value of cash flow, whether loss or profit)
    // We assume this is added at the end of the year, so it doesn't grow THIS year.
    const yearInvestedValue = Math.abs(yearCashFlow);
    cumulativeOpportunityCost += yearInvestedValue;

    // Track "Invested Cash Flow" - what our cash pile would be if we invested all net cash flows
    // (both positive and negative) at the investment return rate.
    // This allows Fair comparison to Sell Scenario which assumes investment of proceeds.
    if (year > 0) {
      cumulativeInvestedCashFlow = cumulativeInvestedCashFlow * (1 + investmentReturn / 100);
    }
    cumulativeInvestedCashFlow += yearCashFlow;

    // --- SALE SCENARIO ---
    // Home value at time of sale
    const salePrice = homeValue;

    // Selling costs (Removed prep costs per user request)
    const sellingCosts = salePrice * (sellingFees / 100);

    // Net proceeds before capital gains
    const netSaleProceeds = salePrice - loanBalance - sellingCosts;

    // Capital gains calculation
    const capitalGain = salePrice - purchasePrice; // Simplified: not accounting for improvements

    // Capital gains tax exemption for primary residence (2 of 5 years)
    // If primary residence and within 3 years of holding (still qualify), exempt up to $500k
    // Capital gains tax exemption based on user specific rules:
    // 1. If underwater (Home Value - Loan - Fees < 0), no gain to tax (simplified assumption, really it's based on basis but this proxies "no cash to pay")
    // 2. OR If Primary Residence AND owned <= 3 years (Exclusion applies)
    // 3. Otherwise, tax the full gain.
    let capitalGainsTaxOwed = 0;
    
    // Check if underwater on the sale transaction itself
    const isUnderwater = netSaleProceeds < 0; // proceeds = Sale - Loan - Fees

    if (capitalGain > 0) {
      if (isUnderwater) {
         capitalGainsTaxOwed = 0;
      } else if (isPrimaryResidence && year <= 3) {
        // Exempt (Primary Residence Exclusion assumption for short hold)
        capitalGainsTaxOwed = 0;
      } else {
        // Full capital gains tax
        capitalGainsTaxOwed = capitalGain * (capitalGainsTax / 100);
      }
    }
    // Net after-tax sale proceeds
    const netAfterTaxProceeds = netSaleProceeds - capitalGainsTaxOwed;

    // If we sell now and invest the proceeds, how much do we have at end of analysis period?
    // Only apply investment growth if proceeds are positive (can't invest a loss)
    const yearsToInvest = yearsToHold - year;
    const investedValue = netAfterTaxProceeds > 0
      ? netAfterTaxProceeds * Math.pow(1 + investmentReturn / 100, yearsToInvest)
      : netAfterTaxProceeds; // Keep the loss as-is, no "growth"

    // Capture Year 0 Baseline for Chart Comparison
    if (year === 0) {
        sellYear0Baseline = netAfterTaxProceeds;
    }

    // Calculate "Sell Year 0 Invested" for Chart
    // User Rule: If Year 0 Proceeds (Baseline) is positive, grow it by investment return.
    // If negative, show that negative value forever (no growth/debt interest).
    const sellYear0Total = sellYear0Baseline > 0 
        ? sellYear0Baseline * Math.pow(1 + investmentReturn / 100, year) 
        : sellYear0Baseline;

    // Total rental scenario net worth at this year:
    // Net Proceeds (liquidatable equity) + Invested Value of Cash Flows (which tracks opportunity cost of losses)
    // Updated per user request to use Net Proceeds instead of Equity
    const rentalNetWorth = netAfterTaxProceeds + cumulativeInvestedCashFlow;

    // Simple Net Worth (Net Proceeds + Actual Cash Flow) - requested by user for table
    // Also use Net Proceeds here to be consistent (Liquidatable Value)
    // Simple Net Worth (Net Proceeds + Actual Cash Flow) - requested by user for table
    // Also use Net Proceeds here to be consistent (Liquidatable Value)
    // User Update (Feb 2026): If Year 0 and we have positive proceeds, show $0 (don't show the cash out value).
    // If Year 0 and negative (underwater), show the negative value.
    let simpleRentalNetWorth = netAfterTaxProceeds + cumulativeRentalCashFlow;
    if (year === 0 && netAfterTaxProceeds > 0) {
        simpleRentalNetWorth = 0;
    }

    // For the SELL scenario, we want to compare apples to apples
    // The "sell now" value should show what you'd have at the END of the analysis period
    // if you sold at year X and invested the proceeds

    // Also need to account for positive rental cash flow that could have been invested
    // if you chose to rent for these years first then sell

    // Store year data
    yearlyData.push({
      year,
      homeValue,
      loanBalance,
      equity,
      // Rental scenario
      annualRent: year === 0 ? 0 : currentRent * 12,
      annualExpenses: year === 0 ? 0 : annualOwnershipCosts + annualMgmtFee,
      grossRentalProfit: year === 0 ? 0 : grossRentalProfit,
      rentalTax: year === 0 ? 0 : rentalTax,
      netRentalCashFlow: yearCashFlow,
      cumulativeRentalCashFlow: year === 0 ? 0 : cumulativeRentalCashFlow,
      cumulativeInvestedCashFlow: year === 0 ? 0 : cumulativeInvestedCashFlow,
      principalPaidThisYear,
      opportunityCost: year === 0 ? 0 : yearInvestedValue,
      cumulativeOpportunityCost: year === 0 ? 0 : cumulativeOpportunityCost,
      rentalNetWorth,
      simpleRentalNetWorth,
      // Sale scenario
      salePrice,
      sellingCosts,
      netSaleProceeds,
      capitalGain,
      capitalGainsTaxOwed,
      netAfterTaxProceeds,
      investedValue: year === 0 ? 0 : investedValue,
      sellYear0Total, // For chart
      // Comparison
      betterOption: rentalNetWorth > investedValue ? "rent" : "sell",
      monthlyBreakdown: {
        rent: year === 0 ? 0 : currentRent,
        expenses: year === 0 ? 0 : monthlyOwnershipCost + (annualMgmtFee / 12)
      }
    });
  }

  // Update UI
  updateChart(yearlyData);
  updateTable(yearlyData);
  updateSummary(yearlyData);
  // updateDetailedBreakdown(yearlyData); // Removed from UI

  // Persist current inputs to URL
  saveToURL();
}

/**
 * Update the comparison chart
 */
function updateChart(data) {
  const ctx = document.getElementById("comparisonChart").getContext("2d");

  const labels = data.map((d) => `Year ${d.year}`);
  const rentalData = data.map((d) => d.simpleRentalNetWorth);
  const saleData = data.map((d) => d.sellYear0Total);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Cash Out + Rent P/L",
          data: rentalData,
          borderColor: "#4ade80",
          backgroundColor: "rgba(74, 222, 128, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Sell Now + Invest Proceeds",
          data: saleData,
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96, 165, 250, 0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: "#e4e4e4",
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += formatCurrency(context.parsed.y);
              }
              
              // Add monthly breakdown for the Rent scenario
              if (context.datasetIndex === 0) { // Rent Line
                const yearIndex = context.dataIndex;
                const dataPoint = data[yearIndex];
                if (dataPoint && dataPoint.monthlyBreakdown) {
                  const rent = formatCurrency(dataPoint.monthlyBreakdown.rent);
                  const exp = formatCurrency(dataPoint.monthlyBreakdown.expenses);
                  return [
                    label,
                    `   Monthly Rent: ${rent}`,
                    `   Monthly Expenses: ${exp}`
                  ];
                }
              }
              return label;
            }
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#888" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        y: {
          ticks: {
            color: "#888",
            callback: function (value) {
              return formatCurrency(value);
            },
          },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    },
  });
}

/**
 * Update the results table
 */
function updateTable(data) {
  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";

  data.forEach((d) => {
    const row = document.createElement("tr");
    row.className = d.betterOption === "rent" ? "rent-better" : "sell-better";

    row.innerHTML = `
            <td><strong>Year ${d.year}</strong></td>
            <td>${formatCurrency(d.homeValue)}</td>
            <td>${formatCurrency(d.loanBalance)}</td>
            <td>${formatCurrency(d.equity)}</td>
            <td>${formatCurrency(d.sellingCosts)}</td>
            <td>${formatCurrency(d.capitalGainsTaxOwed)}</td>
            <td class="${d.netAfterTaxProceeds >= 0 ? "positive" : "negative"}">${formatCurrency(d.netAfterTaxProceeds)}</td>
            <td class="${d.netRentalCashFlow >= 0 ? "positive" : "negative"}">${formatCurrency(d.netRentalCashFlow)}</td>
            <td class="${d.cumulativeRentalCashFlow >= 0 ? "positive" : "negative"}">${formatCurrency(d.cumulativeRentalCashFlow)}</td>
            <td class="${d.simpleRentalNetWorth >= 0 ? "positive" : "negative"}">${formatCurrency(d.simpleRentalNetWorth)}</td>
            <td class="${d.sellYear0Total >= 0 ? "positive" : "negative"}">${formatCurrency(d.sellYear0Total)}</td>
        `;

    tbody.appendChild(row);
  });
}

/**
 * Update summary section
 */
function updateSummary(data) {
  const finalYear = data[data.length - 1];
  // Update: User requested "Rent Now + Sell Later" (Cash Out + Rent P/L)
  const endRentalValue = finalYear.simpleRentalNetWorth;

  // Update: User requested "Sell Now + Invest Proceeds" (Sell Year 0 + Invest)
  const endSellValue = finalYear.sellYear0Total;
  
  const difference = endRentalValue - endSellValue;

  // Find crossover point
  let crossoverYear = null;
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    if (
      (prev.simpleRentalNetWorth < prev.sellYear0Total &&
        curr.simpleRentalNetWorth >= curr.sellYear0Total) ||
      (prev.simpleRentalNetWorth > prev.sellYear0Total &&
        curr.simpleRentalNetWorth <= curr.sellYear0Total)
    ) {
      crossoverYear = i;
      break;
    }
  }

  const summary = document.getElementById("summary");
  const summaryInline = document.getElementById("summaryInline");
  
  const summaryHTML = `
        <h3>📊 Summary at Year ${finalYear.year}</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Rent Now + Sell Later</div>
                <div class="value ${endRentalValue >= 0 ? "positive" : "negative"}">${formatCurrency(endRentalValue)}</div>
            </div>
            <div class="summary-item">
                <div class="label">Sell Now + Invest Proceeds</div>
                <div class="value ${endSellValue >= 0 ? "positive" : "negative"}">${formatCurrency(endSellValue)}</div>
            </div>
            <div class="summary-item">
                <div class="label">Difference (Rent - Sell)</div>
                <div class="value ${difference >= 0 ? "positive" : "negative"}">${formatCurrency(difference)}</div>
            </div>
            <div class="summary-item">
                <div class="label">Better Option</div>
                <div class="value neutral">${difference >= 0 ? "🏠 Rent" : "💰 Sell"}</div>
            </div>
            ${
              crossoverYear !== null
                ? `
            <div class="summary-item">
                <div class="label">Crossover Point</div>
                <div class="value neutral">Year ${crossoverYear}</div>
            </div>
            `
                : ""
            }
        </div>
    `;
  
  summary.innerHTML = summaryHTML;
  if (summaryInline) {
    summaryInline.innerHTML = summaryHTML;
  }
}

/**
 * Update detailed breakdown
 */
function updateDetailedBreakdown(data) {
  const container = document.getElementById("detailedBreakdown");
  container.innerHTML = "";

  data.forEach((d) => {
    const detail = document.createElement("div");
    detail.className = "year-detail";

    detail.innerHTML = `
            <h4>Year ${d.year}</h4>
            <div class="detail-grid">
                <div class="detail-section">
                    <h5>Property</h5>
                    <p>Home Value: ${formatCurrency(d.homeValue)}</p>
                    <p>Loan Balance: ${formatCurrency(d.loanBalance)}</p>
                    <p>Equity: ${formatCurrency(d.equity)}</p>
                    <p>Principal Paid This Year: ${formatCurrency(d.principalPaidThisYear)}</p>
                </div>
                <div class="detail-section">
                    <h5>Rental Scenario</h5>
                    <p>Annual Rent: ${formatCurrency(d.annualRent)}</p>
                    <p>Annual Expenses: ${formatCurrency(d.annualExpenses)}</p>
                    <p>Gross Profit: ${formatCurrency(d.grossRentalProfit)}</p>
                    <p>Tax on Rental Income: ${formatCurrency(d.rentalTax)}</p>
                    <p>Net Cash Flow (this year): ${formatCurrency(d.netRentalCashFlow)}</p>
                    <p><strong>Cumulative Cash Flow: ${formatCurrency(d.cumulativeRentalCashFlow)}</strong></p>
                </div>
                <div class="detail-section">
                    <h5>Sale Scenario</h5>
                    <p>Sale Price: ${formatCurrency(d.salePrice)}</p>
                    <p>Selling Costs: ${formatCurrency(d.sellingCosts)}</p>
                    <p>Net Proceeds (before tax): ${formatCurrency(d.netSaleProceeds)}</p>
                    <p>Capital Gain: ${formatCurrency(d.capitalGain)}</p>
                    <p>Capital Gains Tax: ${formatCurrency(d.capitalGainsTaxOwed)}</p>
                    <p><strong>Net After Tax: ${formatCurrency(d.netAfterTaxProceeds)}</strong></p>
                    <p><strong>Invested Value at End: ${formatCurrency(d.investedValue)}</strong></p>
                </div>
                <div class="detail-section">
                    <h5>Comparison</h5>
                    <p>Rent Net Worth: ${formatCurrency(d.rentalNetWorth)}</p>
                    <p>Sell Net Worth: ${formatCurrency(d.investedValue)}</p>
                    <p>Opportunity Cost (cumulative): ${formatCurrency(d.cumulativeOpportunityCost)}</p>
                    <p><strong>Better: ${d.betterOption === "rent" ? "🏠 Rent" : "💰 Sell"}</strong></p>
                </div>
            </div>
        `;

    container.appendChild(detail);
  });
}

/**
 * Save all current input values to URL search parameters.
 * Uses history.replaceState to avoid polluting browser history.
 */
function saveToURL() {
  const params = new URLSearchParams();

  Object.entries(inputs).forEach(([key, el]) => {
    if (!el || key === "monthlyPI") return; // Skip calculated field
    params.set(key, el.value);
  });

  const newURL = `${window.location.pathname}?${params.toString()}`;
  history.replaceState(null, "", newURL);
}

/**
 * Load input values from URL search parameters.
 * If a parameter exists in the URL, it overwrites the HTML default.
 * Called once before the initial calculation.
 */
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.size === 0) return; // No params, use HTML defaults

  Object.entries(inputs).forEach(([key, el]) => {
    if (!el || key === "monthlyPI") return; // Skip calculated field
    if (params.has(key)) {
      el.value = params.get(key);
    }
  });
}

// Load saved state from URL, then run initial calculation
loadFromURL();
calculate();
