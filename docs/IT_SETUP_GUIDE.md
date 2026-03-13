# IT Administrator Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                             │
│  ┌─────────────┐      ┌──────────────┐                     │
│  │     S3      │      │  CloudFront  │                     │
│  │  (Static    │◄─────│    (CDN)     │◄──── Internet       │
│  │   Files)    │      │              │                     │
│  └─────────────┘      └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Local Network                             │
│  ┌──────────────┐     ┌──────────────┐    ┌─────────────┐ │
│  │ User Machine │     │ User Machine │    │   Zebra     │ │
│  │              │     │              │    │  Printers   │ │
│  │ ┌──────────┐ │     │ ┌──────────┐ │    │             │ │
│  │ │ Browser  │ │     │ │ Browser  │ │    │ 192.168.1.x │ │
│  │ │          │ │     │ │          │ │    │  Port 9100  │ │
│  │ └────┬─────┘ │     │ └────┬─────┘ │    └─────────────┘ │
│  │      │       │     │      │       │            ▲        │
│  │ ┌────▼─────┐ │     │ ┌────▼─────┐ │            │        │
│  │ │ Browser  │ │     │ │ Browser  │ │            │        │
│  │ │  Print   ├─┼─────┼─┤  Print   ├─┼────────────┘        │
│  │ │ :9101    │ │     │ │ :9101    │ │                     │
│  │ └──────────┘ │     │ └──────────┘ │                     │
│  └──────────────┘     └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Network Requirements

- Zebra printers accessible on local network (RFC1918 addresses)
- Ports required:
  - 9100: Printer communication (TCP)
  - 9101: Browser Print HTTPS (local only)
  - 443: CloudFront access (outbound)

### Client Requirements

- Supported browsers: Chrome, Firefox, Safari (NOT Edge)
- Browser Print installed on each client machine
- Windows 7+ or macOS 10.12+

## Deployment Steps

### 1. Configure Printer Network

1. **Static IP Assignment**

   ```
   Example configuration:
   - Shipping Printer: 192.168.1.100
   - Warehouse A: 192.168.1.101
   - Warehouse B: 192.168.1.102
   ```

2. **Firewall Rules**

   - Allow TCP 9100 from client subnet to printer subnet
   - No internet access required for printers

3. **Printer Configuration**
   - Enable network interface
   - Set static IP or DHCP reservation
   - Verify port 9100 is listening

### 2. Deploy Application to AWS

1. **Prerequisites**

   ```bash
   # Install required tools
   - Node.js 18+
   - pnpm 9.5.0+
   - AWS CLI configured
   - AWS CDK bootstrapped in target region
   ```

2. **Update Printer Configuration**

   ```bash
   # Edit frontend/src/config/printers.json
   # Add your actual printer IPs and details
   ```

3. **Deploy Infrastructure**

   ```bash
   # From project root
   pnpm install
   pnpm deploy
   ```

4. **Note CloudFront URL**
   ```
   Outputs:
   ZebraPrintingStack.CloudFrontURL = https://d1234567890.cloudfront.net
   ```

### 3. Client Machine Setup

#### Automated Deployment (Recommended)

Create PowerShell script for Windows:

```powershell
# Install-BrowserPrint.ps1
$downloadUrl = "https://www.zebra.com/browserprint/download"
$installerPath = "$env:TEMP\BrowserPrint-Installer.exe"

# Download installer
Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath

# Install silently
Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait

# Start service
Start-Service -Name "Zebra Browser Print"

# Open SSL acceptance page
Start-Process "https://localhost:9101/ssl_support"

Write-Host "Browser Print installed. Please accept the SSL certificate in your browser."
```

#### Manual Installation Process

1. **Download Browser Print**

   - Visit: https://www.zebra.com/browserprint
   - Fill out form (if required)
   - Download appropriate version

2. **Install Browser Print**

   - Run installer with admin privileges
   - Default installation path is fine
   - Service starts automatically

3. **SSL Certificate Acceptance**
   - Must be done per browser, per user
   - Navigate to https://localhost:9101/ssl_support
   - Accept security warning

### 4. Configuration Management

#### Updating Printer Configuration

1. **Modify Configuration File**

   ```json
   // frontend/src/config/printers.json
   {
     "printers": [
       {
         "id": "unique-id",
         "name": "Display Name",
         "ip": "192.168.1.100",
         "port": 9100,
         "location": "Physical Location",
         "description": "Usage description",
         "model": "ZD421CN"
       }
     ]
   }
   ```

2. **Redeploy Application**
   ```bash
   pnpm deploy
   ```

#### Environment-Specific Configs

For multiple environments:

```bash
# Create environment-specific config files
frontend/src/config/printers.dev.json
frontend/src/config/printers.prod.json

# Use build-time substitution
cp frontend/src/config/printers.${ENV}.json frontend/src/config/printers.json
pnpm build
```

## Monitoring & Maintenance

### Health Checks

1. **Application Health**

   - CloudFront metrics in AWS Console
   - Check origin response times

2. **Client-Side Checks**

   ```javascript
   // Browser console test
   BrowserPrint.getLocalDevices(console.log, console.error);
   ```

3. **Printer Connectivity**
   ```bash
   # From client machine
   telnet 192.168.1.100 9100
   # Send: ~HS
   # Expect: Status response
   ```

### Common Issues & Solutions

| Issue                      | Symptoms                  | Solution                                                                  |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| Browser Print not detected | App shows warning         | 1. Verify service running<br>2. Check firewall<br>3. Re-accept SSL cert   |
| Printer connection fails   | "Failed to connect" error | 1. Verify printer IP<br>2. Check network route<br>3. Test port 9100       |
| SSL certificate expired    | HTTPS errors              | Browser Print regenerates cert<br>Users must re-accept                    |
| Print jobs fail silently   | No error, no output       | 1. Check printer status<br>2. Verify ZPL syntax<br>3. Check printer queue |

### Log Locations

**Windows Browser Print Logs:**

```
C:\ProgramData\Zebra Technologies\Zebra Browser Print\logs\
```

**macOS Browser Print Logs:**

```
~/Library/Logs/Zebra Browser Print/
```

### Security Considerations

1. **Network Isolation**

   - Printers should be on isolated VLAN
   - No direct internet access for printers
   - Client machines need local network access only

2. **Browser Print Security**

   - Binds to localhost only (no remote access)
   - Uses self-signed SSL certificate
   - No authentication mechanism (relies on network security)

3. **Application Security**
   - Static site with no backend
   - No user data stored
   - Printer IPs visible in client-side config

### Backup & Recovery

1. **Configuration Backup**

   ```bash
   # Backup printer config
   cp frontend/src/config/printers.json printers.json.backup
   ```

2. **Quick Recovery**
   - CloudFront serves from S3
   - Automatic failover across regions
   - Cache invalidation: `aws cloudfront create-invalidation`

## Rollout Strategy

### Pilot Phase

1. Deploy to single department
2. Train power users
3. Document specific workflows
4. Gather feedback

### Full Deployment

1. Schedule training sessions
2. Distribute quick-start guides
3. Set up help desk procedures
4. Monitor adoption metrics

### Success Metrics

- Browser Print installation rate
- Daily active users
- Print success rate
- Support ticket volume

## Support Procedures

### Tier 1 Support Script

1. Is Browser Print installed? Check system tray/menu bar
2. Can you access https://localhost:9101/ssl_support?
3. Which printer are you trying to use?
4. What error message do you see?

### Tier 2 Escalation

1. Check Browser Print logs
2. Verify network connectivity to printer
3. Test with sample ZPL
4. Remote session if needed

### Printer-Specific Issues

- Partner with facilities team
- Maintain printer status dashboard
- Regular maintenance schedule

---

## Appendix: Useful Commands

### Test Printer Connectivity

```bash
# Windows PowerShell
Test-NetConnection -ComputerName 192.168.1.100 -Port 9100

# Linux/Mac
nc -zv 192.168.1.100 9100
```

### Browser Print Service Control

```bash
# Windows
net stop "Zebra Browser Print"
net start "Zebra Browser Print"

# macOS
killall "Browser Print"
open -a "Browser Print"
```

### CloudFront Cache Invalidation

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```
