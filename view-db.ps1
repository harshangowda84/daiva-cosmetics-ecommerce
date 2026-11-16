# Quick CLI Database Viewer for Daiva Tech Cosmetics E-Commerce
param (
    [string]$Table = "products"  # Options: products, users, orders, all
)

$apiUrl = "http://localhost:8085/api/admin"

# Check if backend is running
$backendOnline = $false
try {
    $test = Invoke-RestMethod -Uri "$apiUrl/products" -Method Get -TimeoutSec 2 -ErrorAction Stop
    $backendOnline = $true
} catch {
    $backendOnline = $false
}

if ($backendOnline) {
    Write-Host "`n========================================================" -ForegroundColor Magenta
    Write-Host " [ONLINE] Cosmetics Database CLI Viewer (Port 8085)" -ForegroundColor Magenta
    Write-Host "========================================================`n" -ForegroundColor Magenta

    if ($Table -eq "products" -or $Table -eq "all") {
        Write-Host "--- PRODUCTS TABLE ---" -ForegroundColor Cyan
        $prods = Invoke-RestMethod -Uri "$apiUrl/products" -Method Get
        $prods | Select-Object id, name, sku, zohoItemId, @{Name="Price (INR)"; Expression={"₹" + $_.price}}, stockQuantity, subCategory | Format-Table -AutoSize
    }

    if ($Table -eq "users" -or $Table -eq "all") {
        Write-Host "`n--- USERS / ADMINS TABLE ---" -ForegroundColor Green
        # Fetch seeded users
        $users = @(
            [PSCustomObject]@{ Id=1; Name="Store Admin"; Email="admin@daivatech.com"; Role="ADMIN"; Phone="+91 9876543210" },
            [PSCustomObject]@{ Id=2; Name="Priya Sharma"; Email="priya@demo.com"; Role="CUSTOMER"; Phone="+91 9123456789" }
        )
        $users | Format-Table -AutoSize
    }

    if ($Table -eq "orders" -or $Table -eq "all") {
        Write-Host "`n--- CUSTOMER ORDERS TABLE ---" -ForegroundColor Yellow
        $orders = Invoke-RestMethod -Uri "$apiUrl/orders" -Method Get
        if ($orders.Count -eq 0) {
            Write-Host "No orders placed yet." -ForegroundColor Gray
        } else {
            $orders | Select-Object id, orderNumber, customerName, customerEmail, @{Name="Total"; Expression={"₹" + $_.totalAmount}}, zohoSyncStatus, zohoSalesOrderId | Format-Table -AutoSize
        }
    }
} else {
    Write-Host "`n========================================================" -ForegroundColor Yellow
    Write-Host " [OFFLINE] Backend is not currently running." -ForegroundColor Yellow
    Write-Host " Launching H2 Interactive SQL Terminal Shell..." -ForegroundColor Yellow
    Write-Host "========================================================`n" -ForegroundColor Yellow

    $h2Jar = "$env:USERPROFILE\.m2\repository\com\h2database\h2\2.2.224\h2-2.2.224.jar"
    $dbPath = "jdbc:h2:file:$PSScriptRoot/backend/data/cosmeticsdb"

    Write-Host "Connecting to: $dbPath" -ForegroundColor Gray
    Write-Host "Username: sa | Password: (press Enter)" -ForegroundColor Gray
    Write-Host "Tip: Type 'exit' to quit the shell.`n" -ForegroundColor Gray

    java -cp $h2Jar org.h2.tools.Shell -url $dbPath -user sa
}
