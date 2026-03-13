# Printer Configuration Guide

## Overview

This application supports two methods for finding printers:

1. **Configured Printers** (📋) - Pre-configured network printers from `printers.json`
2. **Discovered Printers** (🔍) - Automatically found by Browser Print

## Configuration Approaches

### Option 1: Hard-Coded Configuration (Recommended for Production)

**Pros:**

- Predictable and consistent printer list
- Works immediately without discovery
- Can include helpful descriptions and locations
- No need for users to search for printers
- IT can control which printers are available

**Cons:**

- Requires maintenance when printer IPs change
- Need to redeploy when adding/removing printers

**Example `printers.json`:**

```json
{
  "printers": [
    {
      "id": "shipping-main",
      "name": "Main Shipping Printer",
      "ip": "192.168.1.100",
      "port": 9100,
      "location": "Shipping Department",
      "description": "Primary shipping label printer"
    }
  ]
}
```

### Option 2: Dynamic Discovery

**Pros:**

- Finds all available printers automatically
- No configuration needed
- Adapts to network changes
- Finds both USB and network printers

**Cons:**

- Takes time to discover (user must click button)
- May find printers users shouldn't use
- Names might not be user-friendly
- Requires Browser Print to have network access

### Option 3: Hybrid Approach (Best of Both)

Combine both methods:

1. Pre-configure known production printers
2. Allow discovery for flexibility

Users see configured printers immediately and can discover more if needed.

## Browser Print Discovery Limitations

Browser Print discovers printers by:

1. Checking local USB connections
2. Scanning the local network subnet
3. Using Windows/macOS printer APIs

**Important Notes:**

- Discovery only works on the same subnet
- Some network configurations block discovery
- VPNs may interfere with discovery
- Discovery requires Browser Print v3.0+

## Recommendations

### For Production Environments:

Use hard-coded configuration:

- Predictable user experience
- IT maintains control
- Faster startup (no discovery needed)
- Clear printer descriptions

### For Development/Testing:

Use discovery:

- Flexible for different environments
- Good for finding test printers
- No configuration needed

### For Mixed Environments:

Use hybrid approach:

- Configure main printers
- Allow discovery for special cases
- Use "Show configured only" checkbox

## Maintaining Printer Configuration

### When to Update `printers.json`:

- Printer IP addresses change
- New printer added to network
- Printer replaced or renamed
- Department reorganization

### Update Process:

1. Edit `frontend/src/config/printers.json`
2. Test locally with `pnpm dev`
3. Deploy with `pnpm deploy`
4. CloudFront cache clears automatically

### Getting Printer Information:

```bash
# From printer's network settings menu:
- IP Address: 192.168.1.100
- Port: 9100 (standard for Zebra)

# Or print configuration label:
- Hold feed button while powering on
- Check network section of printout
```

## Network Considerations

### Static vs DHCP:

- **Static IP**: Recommended for configured printers
- **DHCP Reservation**: Good alternative
- **Dynamic DHCP**: Use discovery only

### Firewall Rules:

```
Source: Client Subnet
Destination: Printer Subnet
Port: TCP 9100
Direction: Outbound
```

## Troubleshooting Discovery

If discovery doesn't find printers:

1. **Check Browser Print version** (needs 3.0+)
2. **Verify network connectivity** to printer subnet
3. **Check firewall** isn't blocking port 9100
4. **Try manual configuration** as fallback
5. **Verify printer** is network-enabled

## Example Deployment Scenarios

### Warehouse with Fixed Printers:

```json
{
  "printers": [
    {"id": "dock-1", "name": "Loading Dock 1", "ip": "10.0.1.51", ...},
    {"id": "dock-2", "name": "Loading Dock 2", "ip": "10.0.1.52", ...},
    {"id": "office", "name": "Warehouse Office", "ip": "10.0.1.60", ...}
  ]
}
```

### Lab with Changing Equipment:

- Configure one reliable printer
- Use discovery for test printers
- Enable "Show configured only" by default

### Multi-Site Deployment:

- Use environment-specific configs
- `printers.site-a.json`, `printers.site-b.json`
- Build process selects correct file
