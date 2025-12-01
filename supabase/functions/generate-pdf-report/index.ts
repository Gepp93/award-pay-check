import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { result, shiftDetails, advancedPayslip } = await req.json();

    console.log('Generating PDF report for pay check result');

    const isUnsureMode = result.mode === 'unsure';
    const underpayment = isUnsureMode ? result.overallMaxUnderpayment : (result.underpayment || 0);
    const isUnderpaid = underpayment > 0;

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #333;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .result-box {
      background: ${isUnderpaid ? '#fee' : '#efe'};
      border: 2px solid ${isUnderpaid ? '#c33' : '#3c3'};
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .result-amount {
      font-size: 32px;
      font-weight: bold;
      color: ${isUnderpaid ? '#c33' : '#3c3'};
      margin: 10px 0;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #444;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .detail-label {
      font-weight: 600;
    }
    .detail-value {
      text-align: right;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">AwardPay - Pay Check Report</div>
    <div>Generated on ${new Date().toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}</div>
  </div>

  <div class="result-box">
    ${isUnderpaid ? `
      <h2>Potential Underpayment Detected</h2>
      <div class="result-amount">$${underpayment.toFixed(2)}</div>
      <p>${isUnsureMode ? 'Based on likely classifications for your work area' : 'For this pay period'}</p>
    ` : `
      <h2>Pay Appears Correct</h2>
      <p>Your pay looks roughly correct for this period</p>
    `}
  </div>

  <div class="section">
    <div class="section-title">Shift Details</div>
    ${shiftDetails.hoursWorked ? `<div class="detail-row"><span class="detail-label">Hours Worked:</span><span class="detail-value">${shiftDetails.hoursWorked}</span></div>` : ''}
    ${shiftDetails.hourlyRate ? `<div class="detail-row"><span class="detail-label">Hourly Rate:</span><span class="detail-value">$${shiftDetails.hourlyRate}</span></div>` : ''}
    ${shiftDetails.amountPaid ? `<div class="detail-row"><span class="detail-label">Amount Paid:</span><span class="detail-value">$${shiftDetails.amountPaid}</span></div>` : ''}
  </div>

  ${result.shouldBePaidBreakdown ? `
    <div class="section">
      <div class="section-title">Calculated Entitlements</div>
      ${result.shouldBePaidBreakdown.ordinary ? `<div class="detail-row"><span class="detail-label">Ordinary Hours:</span><span class="detail-value">$${result.shouldBePaidBreakdown.ordinary.toFixed(2)}</span></div>` : ''}
      ${result.shouldBePaidBreakdown.overtime ? `<div class="detail-row"><span class="detail-label">Overtime:</span><span class="detail-value">$${result.shouldBePaidBreakdown.overtime.toFixed(2)}</span></div>` : ''}
      ${result.shouldBePaidBreakdown.saturday ? `<div class="detail-row"><span class="detail-label">Saturday:</span><span class="detail-value">$${result.shouldBePaidBreakdown.saturday.toFixed(2)}</span></div>` : ''}
      ${result.shouldBePaidBreakdown.sunday ? `<div class="detail-row"><span class="detail-label">Sunday:</span><span class="detail-value">$${result.shouldBePaidBreakdown.sunday.toFixed(2)}</span></div>` : ''}
      ${result.shouldBePaidBreakdown.publicHoliday ? `<div class="detail-row"><span class="detail-label">Public Holiday:</span><span class="detail-value">$${result.shouldBePaidBreakdown.publicHoliday.toFixed(2)}</span></div>` : ''}
      ${result.shouldBePaidBreakdown.allowances ? `<div class="detail-row"><span class="detail-label">Allowances:</span><span class="detail-value">$${result.shouldBePaidBreakdown.allowances.toFixed(2)}</span></div>` : ''}
      <div class="detail-row" style="font-weight: bold; font-size: 16px;">
        <span class="detail-label">Total Should Be Paid:</span>
        <span class="detail-value">$${result.shouldBePaid ? result.shouldBePaid.toFixed(2) : '0.00'}</span>
      </div>
    </div>
  ` : ''}

  <div class="footer">
    <p><strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute legal or financial advice. 
    For official pay disputes or employment concerns, please consult with a qualified professional or contact the Fair Work Ombudsman.</p>
    <p>Report generated by AwardPay - www.awardpay.com.au</p>
  </div>
</body>
</html>
`;

    // For Deno, we'll use the chrome-aws-lambda package to generate PDFs
    // Import the required modules
    const chromium = await import("https://deno.land/x/chrome_aws_lambda@v1.0.0/mod.ts");
    
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    // Convert buffer to base64
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return new Response(
      JSON.stringify({ pdf: base64Pdf }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-pdf-report:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
