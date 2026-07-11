# Utkal Alumina IT Dashboard (NOC Widescreen Console)

An enterprise-grade IT infrastructure, network gateway, and service desk monitoring dashboard designed for widescreen Network Operations Center (NOC) consoles. The system aggregates, normalizes, and visualizes real-time metrics across crucial corporate systems.

---

## 🚀 Architecture Overview

The system uses an **Edge-Scraper Ingestion Architecture** to pull data securely from behind intranet boundaries without requiring direct database integrations or open APIs.

```mermaid
graph TD
    subgraph Client Browsers (Operator Consoles)
        SW[SolarWinds Tab] -->|Scrapes DOM| Ext1[Chrome Extension]
        NX[Nutanix HCI Tab] -->|Scrapes DOM| Ext2[Chrome Extension]
        SY[Symphony HSD Tab] -->|Scrapes DOM| Ext3[Chrome Extension]
    end
    
    subgraph Dashboard Server
        Ext1 & Ext2 & Ext3 -->|POST JSON| API[Next.js Update API: /api/update]
        API -->|Validates, Rounds & Merges| DB[(db.json Local State)]
        DB -->|Serve Data| WebUI[Next.js Widescreen Frontend]
    end
```

1. **Chrome Extension Scrapers**: Lightweight background content scripts (`content_nutanix.js`, `content_solarwinds.js`, `content_symphony.js`) run on operator browser tabs. They scrape the raw DOM of management portals, extract metrics, and post them to the dashboard API.
2. **Next.js Backend API**: The `/api/update` route receives the incoming payloads, formats values to 2 decimal places, and merges them into `db.json`. It uses null-coalescing history checks to preserve metrics across page transitions (avoiding cross-tab overwrites).
3. **NOC Frontend**: A responsive widescreen React console that visualizes the unified state and updates automatically on a 30-second interval.

---

## 🛠️ Technologies Used

- **Frontend**: Next.js (App Router), React, Lucide React, Recharts (Area/Bar Charts)
- **Styling**: Vanilla CSS (Modern glassmorphism, responsive grid layout)
- **Data Agent**: Google Chrome Extension (Manifest V3, Content Scripts)
- **Storage**: Local JSON Flat-file (`db.json`) with Next.js API Routes

---

## 🌟 Key Features & Capabilities

### 🎛️ Nutanix HCI Integration
* **Cluster Statistics**: Displays real-time Cluster CPU, Memory, and Storage metrics directly scraped from the Prism Dashboard.
* **Storage Percentage Calculations**: Parses raw text formatting (`used / total` storage capacity with units like `GiB`/`TiB`) and dynamically calculates storage utilization percentages.
* **Virtual Machine States**: Parses and displays active VM status counters (**On** vs. **Off**).
* **Dynamic Node Indicators**: Creates statuses dynamically based on active hosts (`[N1]`, `[N2]`, `[N3]`), alerting on degraded nodes.

### 📊 Hindalco Service Desk (Symphony)
* **Incident Management**: Aggregates total open incidents and groups them dynamically (New, Assigned, In Progress, Pending).
* **Service Requests**: Real-time SLA tracking (Response SLA and Resolution SLA percentages) for outstanding requests.
* **Changes & Work Orders**: Displays current status breakdown for tracking infrastructure deployments.

### 🌐 SDWAN & ISP Link Monitoring
* **Side-by-Side Gateways**: Renders link health, latency, uptime, and real-time utilization graphs for primary corporate ISP lines including **RJIO** and **RailTel**.

### 🌡️ Smart Alert Thresholds
* **Color Code Rules**: Server metrics (CPU, RAM, and Disk storage) visually change colors for both numerical readouts and progress bars to highlight resource stress:
  * 🟢 **Normal (< 80%)**: Primary dashboard theme colors.
  * 🟡 **Warning (>= 80%)**: Warning yellow text/bar highlighting.
  * 🔴 **Critical (>= 90%)**: Danger red text/bar highlighting.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- Google Chrome browser (for the scraper extension)

### 1. Start the Dashboard App
```bash
# Install dependencies
npm install

# Run the Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the widescreen NOC console.

### 2. Load the Chrome Extension Scraper
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right).
3. Click **Load unpacked** in the top-left.
4. Select the `extension` folder from the root of this project.
5. Log into the corporate portals (Symphony HSD, Nutanix Prism, SolarWinds). The extension will automatically run, inject, and begin feeding live updates to your local Next.js server!
