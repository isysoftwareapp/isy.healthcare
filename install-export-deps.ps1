# Install PDF and Excel Export Dependencies

Write-Host "Installing export dependencies..." -ForegroundColor Green

# Install jsPDF for PDF generation
npm install jspdf jspdf-autotable

# Install xlsx for Excel generation  
npm install xlsx

# Install TypeScript types
npm install --save-dev @types/jspdf

Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
Write-Host "`nInstalled packages:" -ForegroundColor Cyan
Write-Host "  - jspdf: PDF generation library" -ForegroundColor White
Write-Host "  - jspdf-autotable: Table plugin for jsPDF" -ForegroundColor White
Write-Host "  - xlsx: Excel file generation" -ForegroundColor White
Write-Host "  - @types/jspdf: TypeScript definitions" -ForegroundColor White
Write-Host "`nYou can now use PDF and Excel export features!" -ForegroundColor Green
