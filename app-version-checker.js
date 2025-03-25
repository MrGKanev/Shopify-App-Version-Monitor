const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

// Popular Shopify apps to monitor - expand this list as needed
const POPULAR_APPS = [
  "shopify-flow",
  "shopify-email",
  "klaviyo",
  "omnisend",
  "recharge",
  "smile-io",
  "judge-me",
  "privy",
  "loox",
  "stamped-io",
];

// Shopify Admin API setup
const shopDomain = process.env.SHOPIFY_STORE;
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;

async function getAppVersions() {
  // Load previous versions if available
  let previousVersions = {};
  const versionsPath = path.join(__dirname, "app-versions.json");

  if (fs.existsSync(versionsPath)) {
    try {
      previousVersions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));
    } catch (error) {
      console.error("Error reading previous versions:", error.message);
    }
  }

  // Use Shopify API to get installed apps
  const currentVersions = {};
  const updatedApps = [];

  try {
    // Get access token (simplified - in production, use proper OAuth flow)
    const authResponse = await axios.post(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        client_id: apiKey,
        client_secret: apiSecret,
        grant_type: "client_credentials",
      }
    );

    const accessToken = authResponse.data.access_token;

    // Query the Admin API for installed apps
    const appsResponse = await axios.get(
      `https://${shopDomain}/admin/api/2024-04/applications.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const installedApps = appsResponse.data.applications || [];

    // Process each app
    for (const app of installedApps) {
      // Only track popular apps from our list
      const appNameNormalized = app.name.toLowerCase().replace(/\s+/g, "-");

      if (POPULAR_APPS.includes(appNameNormalized)) {
        currentVersions[app.name] = {
          version: app.version || "unknown",
          updated_at: app.updated_at || new Date().toISOString(),
          app_id: app.id,
        };

        // Check if version has changed
        if (
          previousVersions[app.name]?.version !==
          currentVersions[app.name].version
        ) {
          updatedApps.push({
            name: app.name,
            oldVersion: previousVersions[app.name]?.version || "not tracked",
            newVersion: currentVersions[app.name].version,
            updated_at: currentVersions[app.name].updated_at,
          });
        }
      }
    }

    // Save current versions to file
    fs.writeFileSync(versionsPath, JSON.stringify(currentVersions, null, 2));

    // Output results
    console.log("Apps monitored:", Object.keys(currentVersions).length);
    console.log("Updated apps:", updatedApps.length);

    if (updatedApps.length > 0) {
      console.log("Updated apps details:");
      console.table(updatedApps);
    }

    // Create a markdown report for GitHub
    const reportContent = generateMarkdownReport(currentVersions, updatedApps);
    fs.writeFileSync(path.join(__dirname, "VERSION_REPORT.md"), reportContent);
  } catch (error) {
    console.error("Error fetching app versions:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

function generateMarkdownReport(versions, updatedApps) {
  const now = new Date().toISOString().split("T")[0];

  let report = `# Shopify App Version Report\n\n`;
  report += `Generated on: ${now}\n\n`;

  if (updatedApps.length > 0) {
    report += `## Recently Updated Apps\n\n`;
    report += `| App | Old Version | New Version | Updated At |\n`;
    report += `|-----|-------------|------------|------------|\n`;

    updatedApps.forEach((app) => {
      report += `| ${app.name} | ${app.oldVersion} | ${app.newVersion} | ${app.updated_at} |\n`;
    });

    report += `\n`;
  }

  report += `## All Monitored Apps\n\n`;
  report += `| App | Current Version | Last Updated |\n`;
  report += `|-----|----------------|-------------|\n`;

  Object.entries(versions).forEach(([name, info]) => {
    report += `| ${name} | ${info.version} | ${info.updated_at} |\n`;
  });

  return report;
}

// Run the script
getAppVersions().catch(console.error);
