#!/bin/bash

echo "🔍 Bull Queue問題の診断"
echo "======================"

echo -e "\n📌 現在のBullバージョン:"
npm list bull

echo -e "\n📌 node_modules内のLuaファイル確認:"
find node_modules/bull -name "*.lua" 2>/dev/null | head -10

echo -e "\n📌 Bull Queueのディレクトリ構造:"
ls -la node_modules/bull/lib/commands/ 2>/dev/null

echo -e "\n💡 推奨アクション:"
echo "1. Bull Queueを再インストール:"
echo "   npm uninstall bull @types/bull"
echo "   npm install bull@4.10.4 @types/bull@4.10.0"
echo ""
echo "2. node_modulesを完全にクリーンアップ:"
echo "   rm -rf node_modules package-lock.json"
echo "   npm install"
echo ""
echo "3. 代替案: BullMQへの移行を検討"
echo "   npm install bullmq"
