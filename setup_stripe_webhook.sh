#!/bin/bash

echo "🚀 Stripe Webhook Setup"
echo "======================"

echo -e "\n📌 Stripe CLI Webhookの起動"
echo "以下のコマンドでStripe CLIを起動してください:"
echo ""
echo "stripe listen --forward-to localhost:3000/api/webhook"
echo ""

echo -e "\n📌 環境変数の設定"
echo "Stripe CLIが表示するWebhook signing secretを.envファイルに設定:"
echo "STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
echo ""

echo -e "\n📌 現在の.env設定:"
grep "STRIPE_WEBHOOK_SECRET" .env

echo -e "\n💡 トラブルシューティング:"
echo "1. Stripe CLIが最新バージョンか確認"
echo "   stripe version"
echo ""
echo "2. アップデートが必要な場合"
echo "   brew upgrade stripe/stripe-cli/stripe"
echo ""
echo "3. テストイベントの送信"
echo "   stripe trigger checkout.session.completed"
