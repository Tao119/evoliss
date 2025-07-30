#!/bin/bash

echo "Installing AWS SDK v3 SES Client..."
npm install @aws-sdk/client-ses

echo "Removing nodemailer (no longer needed)..."
npm uninstall nodemailer

echo "Installation complete!"