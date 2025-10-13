# Server diagnostic script for multiminder.duckdns.org (Windows PowerShell)
param(
    [string]$ServerIP = "multiminder.duckdns.org"
)

Write-Host "🔍 Diagnosing server issues..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if server is reachable
Write-Status "Checking server connectivity..."
try {
    $ping = Test-Connection -ComputerName $ServerIP -Count 1 -Quiet
    if ($ping) {
        Write-Success "Server is reachable via ping"
    } else {
        Write-Warning "Server is not reachable via ping"
    }
} catch {
    Write-Error "Cannot ping server: $($_.Exception.Message)"
}

# Check HTTP connectivity
Write-Status "Checking HTTP connectivity..."
try {
    $httpResponse = Invoke-WebRequest -Uri "http://$ServerIP" -TimeoutSec 10 -UseBasicParsing
    Write-Success "HTTP is working (Status: $($httpResponse.StatusCode))"
} catch {
    Write-Error "HTTP is not working: $($_.Exception.Message)"
}

# Check HTTPS connectivity
Write-Status "Checking HTTPS connectivity..."
try {
    $httpsResponse = Invoke-WebRequest -Uri "https://$ServerIP" -TimeoutSec 10 -UseBasicParsing
    Write-Success "HTTPS is working (Status: $($httpsResponse.StatusCode))"
} catch {
    Write-Warning "HTTPS is not working: $($_.Exception.Message)"
}

# Check DNS resolution
Write-Status "Checking DNS resolution..."
try {
    $dnsResult = Resolve-DnsName -Name $ServerIP -ErrorAction Stop
    Write-Success "DNS resolution works"
    $dnsResult | ForEach-Object { Write-Host "  $($_.Name) -> $($_.IPAddress)" }
} catch {
    Write-Error "DNS resolution failed: $($_.Exception.Message)"
}

# Check if ports are open
Write-Status "Checking if ports are open..."
$ports = @(80, 443)
foreach ($port in $ports) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($ServerIP, $port)
        $tcpClient.Close()
        Write-Success "Port $port is open"
    } catch {
        Write-Warning "Port $port is closed or filtered"
    }
}

# Check SSL certificate
Write-Status "Checking SSL certificate..."
try {
    $request = [System.Net.WebRequest]::Create("https://$ServerIP")
    $request.GetResponse()
    $cert = $request.ServicePoint.Certificate
    if ($cert) {
        Write-Success "SSL certificate found"
        Write-Host "  Subject: $($cert.Subject)"
        Write-Host "  Issuer: $($cert.Issuer)"
        Write-Host "  Valid from: $($cert.GetEffectiveDateString())"
        Write-Host "  Valid to: $($cert.GetExpirationDateString())"
    } else {
        Write-Warning "No SSL certificate found"
    }
} catch {
    Write-Warning "Cannot check SSL certificate: $($_.Exception.Message)"
}

Write-Host ""
Write-Status "🎯 Common solutions for ERR_CONNECTION_REFUSED:"
Write-Host "1. Check if nginx is running on server: sudo systemctl status nginx"
Write-Host "2. Start nginx if stopped: sudo systemctl start nginx"
Write-Host "3. Check nginx configuration: sudo nginx -t"
Write-Host "4. Check if site is enabled: ls -la /etc/nginx/sites-enabled/"
Write-Host "5. Enable site if needed: sudo ln -s /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/"
Write-Host "6. Check firewall: sudo ufw status"
Write-Host "7. Allow HTTP/HTTPS: sudo ufw allow 80 && sudo ufw allow 443"
Write-Host "8. Check if Apache is running: sudo systemctl status apache2"
Write-Host "9. Check port conflicts: sudo netstat -tlnp | grep -E ':(80|443)'"
Write-Host "10. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
Write-Host ""
Write-Status "🔧 Server commands to run:"
Write-Host "sudo systemctl restart nginx"
Write-Host "sudo systemctl enable nginx"
Write-Host "sudo ufw allow 80"
Write-Host "sudo ufw allow 443"
Write-Host "sudo nginx -t"
Write-Host "sudo systemctl status nginx"
