# Shopify App Version Monitor

An open-source tool to automatically track version changes in popular Shopify apps using GitHub Actions. This project allows you to monitor when your Shopify apps are updated, helping you stay informed about potential changes that might affect your store.

## Features

- Daily monitoring of popular Shopify app versions
- Historical version tracking in JSON format
- Automated reports in Markdown
- Email notifications for app updates (optional)
- Self-hosted and privacy-focused

## Setup Instructions

### 1. Create a new GitHub repository

Fork or create a new repository using this template.

### 2. Configure Shopify API credentials

Add the following secrets to your GitHub repository:

- `SHOPIFY_STORE`: Your store domain (e.g., your-store.myshopify.com)
- `SHOPIFY_API_KEY`: Your API key from a custom app
- `SHOPIFY_API_SECRET`: Your API secret from a custom app

### 3. Customize app monitoring

Edit the `POPULAR_APPS` array in `app-version-checker.js` to include the apps you want to monitor.

### 4. Enable GitHub Actions

Make sure GitHub Actions are enabled for your repository.

## How It Works

1. The GitHub Action runs daily at midnight (configurable)
2. The script connects to your Shopify store via the Admin API
3. It retrieves information about installed apps
4. The script compares versions with previously stored data
5. Updated versions are recorded and a report is generated
6. Changes are committed back to the repository

## Extending the Tool

### Add Email Notifications

To receive email notifications when apps are updated, add the following step to the GitHub Action workflow:

```yaml
- name: Send email notification
  if: steps.check-versions.outputs.updates_found == 'true'
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: ${{ secrets.MAIL_SERVER }}
    server_port: ${{ secrets.MAIL_PORT }}
    username: ${{ secrets.MAIL_USERNAME }}
    password: ${{ secrets.MAIL_PASSWORD }}
    subject: Shopify App Updates Detected
    body: file://VERSION_REPORT.md
    to: your-email@example.com
    from: GitHub Actions
```

### Track More Apps

Add more apps to the `POPULAR_APPS` array in the script to monitor additional apps.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
