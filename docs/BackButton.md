# BackButton コンポーネントの使用方法

## 基本的な使い方

### 1. シンプルな戻るボタン
```tsx
import { BackButton } from "@/components/backbutton";

// デフォルトの動作（router.back()）
<BackButton />
```

### 2. カスタムの戻る処理
```tsx
// 独自の戻る処理を実装
<BackButton 
  back={() => {
    // カスタムロジック
    router.push("/custom-path");
  }}
/>
```

### 3. 戻れない場合のフォールバック
```tsx
// history.length が 1 の場合（戻れない場合）の遷移先を指定
<BackButton 
  fallbackUrl="/mypage"
/>
```

### 4. 特定のパスへの戻りを制限
```tsx
// sign-in, sign-up ページに戻ることを防ぐ
<BackButton 
  restrictedPaths={["/sign-in", "/sign-up", "/auth"]}
  restrictedFallbackUrl="/mypage"
/>
```

### 5. ループ防止機能
```tsx
// ループ防止機能はデフォルトで有効
// A → B → A → B のようなループを自動検出して回避
<BackButton 
  fallbackUrl="/mypage"
  restrictedPaths={["/sign-in", "/sign-up"]}
  restrictedFallbackUrl="/mypage/dashboard"
/>

// ループ防止を無効にする場合
<BackButton 
  preventLoop={false}
/>
```

### 6. 複数の条件を組み合わせる
```tsx
<BackButton 
  fallbackUrl="/mypage"
  restrictedPaths={["/sign-in", "/sign-up", "/payment/success"]}
  restrictedFallbackUrl="/mypage/dashboard"
  preventLoop={true} // デフォルトで有効
/>
```

## 高度な使い方（BackButtonAdvanced）

履歴を追跡してより賢い戻り先制御を行う場合：

```tsx
import { BackButton } from "@/components/backButtonAdvanced";

// スマートナビゲーションを有効にする
<BackButton 
  useSmartNavigation={true}
  restrictedPaths={["/sign-in", "/sign-up", "/onboarding"]}
  restrictedFallbackUrl="/mypage"
  preventLoop={true} // 高度なループ検出機能
/>
```

## プロパティ一覧

| プロパティ | 型 | デフォルト | 説明 |
|-----------|---|---------|------|
| className | string? | - | 追加のCSSクラス |
| back | Function? | - | カスタムの戻る処理 |
| fallbackUrl | string? | - | 戻れない場合の遷移先 |
| restrictedPaths | string[]? | - | 戻ることを制限するパスのリスト |
| restrictedFallbackUrl | string? | - | 制限されたパスに戻ろうとした場合の遷移先 |
| preventLoop | boolean? | true | ループ防止機能の有効/無効 |
| useSmartNavigation | boolean? | false | 履歴追跡機能を有効にする（BackButtonAdvancedのみ） |

## ループ防止機能について

ループ防止機能は、以下のようなケースを自動的に検出して回避します：

- ページA → ページB → ページA → ページB... のような繰り返し
- 両方のページにBackButtonがある場合の無限ループ

### 動作の仕組み：

1. **基本のBackButton**: セッションストレージを使って直前のナビゲーションを記録
2. **BackButtonAdvanced**: より高度な履歴追跡で、複数ページにわたるループパターンを検出

### ループが検出された場合の動作：

1. fallbackUrlが設定されていればそこへ遷移
2. restrictedFallbackUrlが設定されていればそこへ遷移
3. どちらも設定されていない場合は/mypageへ遷移

## 具体的なユースケース

### 1. 認証フロー後の戻る制御
```tsx
// 認証完了後のページで
<BackButton 
  restrictedPaths={["/sign-in", "/sign-up", "/forgot-password"]}
  restrictedFallbackUrl="/mypage"
/>
```

### 2. 決済完了後の戻る制御
```tsx
// 決済完了ページで
<BackButton 
  restrictedPaths={["/payment", "/cart", "/checkout"]}
  restrictedFallbackUrl="/mypage/orders"
/>
```

### 3. オンボーディング後の戻る制御
```tsx
// オンボーディング完了後のページで
<BackButton 
  restrictedPaths={["/onboarding", "/welcome", "/setup"]}
  restrictedFallbackUrl="/mypage"
/>
```

### 4. 編集ページでのループ防止
```tsx
// 編集ページから詳細ページへ戻る際のループ防止
<BackButton 
  fallbackUrl="/mypage/list"
  preventLoop={true} // デフォルトで有効
/>
```
