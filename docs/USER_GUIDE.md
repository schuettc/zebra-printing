# Zebra Printing Application - User Guide

## Overview

This application allows you to print labels to Zebra printers on your network directly from your web browser. It uses a special program called "Browser Print" that acts as a bridge between your web browser and the printers.

## How It Works

```
Your Computer                    Network
┌─────────────────┐             ┌─────────────────┐
│ Web Browser     │             │ Zebra Printer   │
│ (This App)      │             │ IP: 192.168.1.100│
│       ↓         │             └─────────────────┘
│ Browser Print   │ ─────────────────→ Port 9100
│ (Background)    │   Sends ZPL
└─────────────────┘   Commands
```

1. **Web Application**: You access this through your browser (Chrome, Firefox, or Safari)
2. **Browser Print**: A background service that must be installed on your computer
3. **Network Communication**: Browser Print sends your label designs to printers over the network
4. **Zebra Printers**: Receive and print the labels

## Prerequisites

### 1. Browser Print Installation

Browser Print must be installed on EVERY computer that needs to print labels.

#### Windows Installation:

1. Download Browser Print from: [Zebra Developer Portal](https://developer.zebra.com/)
2. Run the installer as Administrator
3. Follow the installation wizard
4. Browser Print will run automatically in the background

#### Mac Installation:

1. Download the Mac version from Zebra
2. Open the .dmg file
3. Drag Browser Print to Applications
4. You may need to allow it in System Preferences > Security & Privacy

### 2. SSL Certificate Acceptance (IMPORTANT!)

**This step is required for EACH browser on EACH computer:**

1. Open your web browser
2. Navigate to: https://localhost:9101/ssl_support
3. You'll see a security warning - this is normal
4. Click "Advanced" or "Show Details"
5. Click "Proceed to localhost" or "Accept the Risk"
6. You should see a success message

**Note**: You may need to repeat this occasionally if the certificate expires.

## Using the Application

### Step 1: Access the Application

1. Open your web browser (Chrome recommended, Edge is NOT supported)
2. Navigate to the application URL provided by your IT team
3. Wait for the page to load completely

### Step 2: Check Browser Print Status

When you first open the application:

- ✅ **Green status**: "Ready to print" - Browser Print is installed and working
- ❌ **Red warning**: "Browser Print Not Detected" - See troubleshooting below

### Step 3: Select a Printer

1. Click the "Select Printer" dropdown
2. Choose your printer from the list:
   - **Main Shipping Printer** - For shipping labels
   - **Warehouse A Printer** - For inventory labels in Warehouse A
   - **Warehouse B Printer** - For inventory labels in Warehouse B
3. The printer details will appear below your selection

### Step 4: Load Your Label Design (ZPL)

You have three options:

#### Option A: Upload a File

1. Click "Choose File"
2. Select a .zpl or .txt file containing your label design
3. The content will appear in the text area

#### Option B: Use Sample Label

1. Click "Load Sample" to see an example label
2. This is useful for testing

#### Option C: Paste ZPL Code

1. Copy your ZPL code from another source
2. Paste it directly into the text area

### Step 5: Test Connection (Optional)

Before printing, you can test if the printer is reachable:

1. Make sure a printer is selected
2. Click "Test Connection"
3. Wait for the result:
   - ✅ Green: "Successfully connected to printer"
   - ❌ Red: "Could not connect to printer"

### Step 6: Print Your Label

1. Ensure you have:
   - Selected a printer
   - Loaded ZPL content
2. Click "Print Label"
3. Watch the status messages:
   - "Connecting to printer..."
   - "Sending print job..."
   - "Print job sent successfully"

## Common ZPL Examples

### Simple Text Label

```
^XA
^FO50,50^ADN,36,20^FDProduct Name^FS
^FO50,120^ADN,18,10^FDSKU: 12345^FS
^XZ
```

### Barcode Label

```
^XA
^FO50,50^BY3^BCN,100,Y,N,N^FD123456789^FS
^FO50,180^ADN,18,10^FDItem #123456789^FS
^XZ
```

## Troubleshooting

### Browser Print Not Detected

1. **Check if Browser Print is running**:

   - Windows: Look for the Browser Print icon in the system tray
   - Mac: Check if Browser Print is in your menu bar

2. **Restart Browser Print**:

   - Windows: Right-click the tray icon > Exit, then restart from Start Menu
   - Mac: Quit from menu bar, then reopen from Applications

3. **Accept SSL Certificate**:

   - Go to https://localhost:9101/ssl_support
   - Accept the security warning

4. **Check Firewall**:
   - Ensure your firewall allows Browser Print (ports 9100 and 9101)

### Printer Not Connecting

1. **Verify printer is on and connected to network**
2. **Check printer IP address**:
   - Print a configuration label from the printer
   - Verify the IP matches what's shown in the app
3. **Test network connectivity**:
   - Ask IT to verify you can reach the printer's IP address

### Print Job Fails

1. **Check printer status**:
   - Paper loaded?
   - Printer not paused?
   - No error lights?
2. **Verify ZPL syntax**:
   - ZPL must start with ^XA and end with ^XZ
   - Test with the sample label first

### Browser Compatibility

- ✅ **Chrome**: Fully supported (recommended)
- ✅ **Firefox**: Fully supported
- ✅ **Safari**: Supported
- ❌ **Edge**: NOT supported by Browser Print

## Best Practices

1. **Test Before Production**: Always use "Test Connection" with a new printer
2. **Save Working ZPL**: Keep copies of ZPL files that work well
3. **One Computer at a Time**: Don't try to print from multiple tabs/windows
4. **Regular Checks**: Periodically verify Browser Print is running

## Getting Help

If you encounter issues:

1. **First**: Try the troubleshooting steps above
2. **Second**: Restart Browser Print and refresh the web page
3. **Third**: Contact IT support with:
   - Screenshot of any error messages
   - Which printer you're trying to use
   - What step fails

## Security Note

The security warning when accepting the SSL certificate is normal and expected. Browser Print uses a self-signed certificate to secure the connection between your browser and the local service. This is safe to accept for localhost connections.

---

_This guide is for the Zebra Printing Web Application. Keep it handy for reference._
