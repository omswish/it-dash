# User Manual: Utkal Alumina NOC Dashboard

Welcome to the **Utkal Alumina NOC Dashboard** (`it-dash`) User Manual. This guide explains how to navigate the widescreen dashboard, understand the displayed telemetry and statuses, connect live enterprise data sources, and manage local consumable levels.

---

## 1. Dashboard Layout Overview

The console is optimized for widescreen monitors located in Network Operations Centers (NOC). It is divided into three key layout sections:

```text
+--------------------------------------------------------------------------------------+
|  [H1] UTKAL ALUMINA IT DASHBOARD                                 [Config Sources]    |
|                                                                                      |
|  [ HCI Health ]                  [ Integrations Connected ]   [ System Health Status] |
+-----------------------------------------------------------------+--------------------+
|                                                                 |                    |
|  [ HINDALCO SERVICE DESK ]                                      | [ SERVER NODES ]   |
|  Displays tickets (Incidents, Requests, Orders, Changes)        | List of monitored  |
|  and Active Incident list.                                      | servers (CPU/RAM/  |
|                                                                 | Disk/Backup).      |
|                                                                 |                    |
|  [ ISP GATEWAY STATUS ]                                         |                    |
|  Tata, RailTel, Jio details side-by-side with charts.           |                    |
|                                                                 |                    |
+-----------------------------------------------------------------+--------------------+
|  [ Feed ]  [Consumables Stock Alerts]  [ HR Requests ]         [ Date, SVG Clock ]   |
+--------------------------------------------------------------------------------------+
```

---

## 2. Key Components & Telemetry Metrics

### 2.1 Corporate KPIs (Top Row)
*   **HCI Health**: Summarizes the status of the Nutanix hypervisor environment. Shows average cluster CPU, memory, and storage utilization. It also lists status dots for hypervisor nodes (`N1`, `N2`, `N3`).
*   **Integrations Connected**: Displays how many of the 3 enterprise connectors are currently streaming live data rather than running simulations.
*   **System Health Status**: A global alert state. Displays `Healthy` (green) if there are no degraded server nodes or failing backups, and `Warnings` (orange/red) otherwise.

### 2.2 Hindalco Service Desk (Left Column, Top)
Displays active tickets pulled from the IT Service Management (ITSM) platform:
*   **Categorized Panels**: Displays totals for *Open Incidents*, *Service Requests*, *Work Orders*, and *Change Requests*.
*   **Vertical Bar Charts**: Interactive micro-charts displaying breakdown distributions of ticket statuses (*New*, *Assigned*, *In Progress*, *Pending*).
*   **Critical Alerts**: If there are P1 or P2 critical tickets, the ticket counters turn red as an eye-catcher.
*   **SLA Performance Metrics**: Under ticket headings, active SLA percentages indicate whether SLA targets are being satisfied.
*   **Active Incidents Tickertape**: A horizontal card list showing the ticket IDs, priorities, callers, description symptoms, and current assignment status for major active incidents.

### 2.3 ISP Gateways (Left Column, Bottom)
Details the health of redundant WAN pathways (e.g., Tata, RJIO, RailTel):
*   **Provider Status**: Shows status tags: `operational` (green), `degraded` (orange), or `down` (red).
*   **Primary Metrics**: Latency (ms) and Uptime SLA percentages.
*   **Bandwidth Utilization Slider**: A bar demonstrating percentage capacity. Red indicates traffic overload ($\ge 80\%$).
*   **Rx/Tx Splits**: Numerical figures for current download (Rx) and upload (Tx) traffic speeds in Mbps.
*   **Bandwidth History Trend**: Displays an area chart of the network load trends for the last 20 minutes.

### 2.4 Server Nodes (Right Column)
A detailed list tracking virtualization hosts and critical server services:
*   **Status Badges**: Indicates system status (`operational`, `degraded`, or `down`).
*   **Telemetry Bars**: Visual progress indicators for real-time CPU, RAM, and Disk Space usage.
*   **Backup Monitoring**: Shows the result of the last scheduled backup task (`Success` or `Failed`).
*   **7-Day Load Tooltip**: Hovering over the small information icon (`i`) next to a server's name reveals a popover displaying a 7-day load sparkline and calculated average load.

### 2.5 Console Footer
*   **NOC Console Feed**: Summarizes active interface notifications.
*   **Consumables Stock Alerts**: Displays either "Stock Levels: Normal" (teal) or "Stock Shortages" (red). Clicking this button opens a modal showing printer toner cartridge stock distributions.
*   **HR Requests Feed**: Shows upcoming employee onboarding and offboarding requests in a rolling 7-day window. Items highlighted in thick red outlines are scheduled for **TODAY**.
*   **Analog SVG Clock**: Runs continuously on local system time.

---

## 3. Configuring Integration Sources

Click the **"Configure Sources"** button in the top right to link live corporate directories.

```
+-----------------------------------------------------------+
| Configure Integration Sources                             |
+-----------------------------------------------------------+
| [ Nutanix CLI ]    |  Host IP Address / Domain            |
| [ Symphony    ]    |  [ 10.20.40.12                     ] |
| [ SolarWinds  ]    |  Authentication Method               |
| [ Excel Stock ]    |  [ SSH Key                         ] |
|                    |  Username                            |
|                    |  [ nutanix_admin                   ] |
|                    |  Secret Password / SSH Key           |
|                    |  [ *********************           ] |
+--------------------+--------------------------------------+
| [ Handshake Status ]                [ Test & Connect ]    |
+-----------------------------------------------------------+
```

### 3.1 Nutanix CLI Hypervisor Access
1. Select the **Nutanix CLI Console** tab in the config modal.
2. Enter the **Host IP Address** or domain name of the controller VM (CVM).
3. Choose the authentication method: `SSH Key` or `Password`.
4. Enter the SSH Username and upload/paste your private credentials into the Secret field.
5. Click **Test & Connect** to authenticate. The HCI health panel at the top will switch from "CLI Disconnected" to "CLI Active".

### 3.2 Symphony Summit ITSM Scraper
The dashboard relies on Chrome DevTools remote debugging to bypass complex SAML SSO authentication on hindalco portals:
1. Ensure Google Chrome is running on the dashboard host with remote debugging enabled on port `9222`:
   *   **Windows Launch Command**:
       ```cmd
       chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome_debug"
       ```
2. Log into the Summit portal (`hsd.adityabirla.com`) inside this debug instance of Chrome. Keep the browser session open.
3. Open the **Configure Sources** modal in the dashboard.
4. Select the **Symphony Summit ITSM** tab.
5. Enter the dashboard endpoint URL (`https://hsd.adityabirla.com/MDLIncidentMgmt/SDE_Dashboard.aspx`).
6. Select `SAML SSO (Chrome Session)` as the authentication method.
7. Click **Test & Connect**. The dashboard will attach to the active browser tab via WebSockets and start scraping live ticket counts automatically.

### 3.3 SolarWinds Orion API Client
1. Select the **SolarWinds Orion API** tab.
2. Enter the SolarWinds instance endpoint (e.g. `10.100.1.50:17774`).
3. Choose `Basic Authentication` as the authentication method.
4. Input the service account username (e.g., `svc_noc_dashboard`) and password.
5. Click **Test & Connect**. The background sync will initiate, replacing mock ISP interfaces and server grids with actual Orion metrics.

---

## 4. Uploading Consumable Stock (Excel)

To populate and update the cartridge inventory levels in the Consumables Inventory dialog:

1. Open the **Configure Sources** modal.
2. Select the **Cartridge Stock Excel** tab on the left.
3. Drag your spreadsheet directly onto the dashed upload target or click to browse files.
4. The system parses the spreadsheet. Ensure your sheet includes these case-insensitive headers:
    *   **Type** (e.g. `88A`, `12A`)
    *   **Current** (current inventory quantity)
    *   **Target** (ideal restock threshold level)
    *   **Label** (human-readable printer model name, e.g. `HP LaserJet 88A`)
5. If the parse succeeds, the modal displays `Inventory Updated Successfully!`.
6. Close the modal. Click the **Consumables Stock Alerts** button in the footer to review the newly imported inventory metrics.

---

## 5. Troubleshooting Common Issues

### 5.1 "Handshake Failed. Verify Credentials"
*   **Symphony Scraper**: Verify Chrome is running on port 9222 and the `hsd.adityabirla.com` dashboard is fully loaded in an active tab. Ensure you are signed in as an analyst.
*   **SolarWinds**: Ensure port `17774` is open on the SolarWinds host and whitelisted for the dashboard server. Verify the service account has read-only access.
*   **Nutanix**: Double check username spellings and the SSH Private Key format.

### 5.2 Excel File Upload Fails
*   Ensure the file has a `.xlsx` or `.xls` extension.
*   Check that your spreadsheet headers exactly match the requirements (*Type*, *Current*, *Target*, *Label*). Ensure there are no empty lines or formatting anomalies.

### 5.3 Simulated metrics are not fluctuating
*   If mock data appears frozen, verify the page is polling correctly (updates timestamp in the header every 10 seconds). Check the browser web console for network request failures (`500` errors on `/api/status`).
