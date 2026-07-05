# 競合強化 WORKLOG

**開始**: 2026-07-05 / モデル: Opus 4.8 / モード: 自走(ユーザー10時間離席)

## ゴール
宝塚百景 + くらしの便利帳 を主要競合に対して弱い点を特定し、制約(匿名/¥0/オリジナルSVGのみ/UGCなし)内で競合を上回るまで強化する。

## 制約(不可侵)
- 匿名運営維持 / コスト¥0 / オリジナルSVGのみ(写真なし) / UGCなし / AI透明性維持

## 進捗ログ
- [開始] WORKLOG作成、競合ギャップ調査を並列起動(観光/生活/技術の3体)
- [自己監査] 確定した技術ギャップ:
  - Organization schema に sameAs 無し
  - トップページに BreadcrumbList 無し(guideにはある)
  - Speakable schema 無し
  - hreflang 無し / guide記事は日本語のみ
  - フォントは display=swap + preconnect 済(良好)

## 競合ギャップ表(3体調査 統合)
### 観光: 多言語(競合5-6言語)/季節更新/テーマ別ルート/所要時間明記/姉妹都市トリビア
### 生活: ゴミ逆引き検索/粗大ごみ料金表/ライフイベント別手続き/防災マップ解説/多言語リーフレット導線
### 技術(致命的2件含む):
- **[致命/要ユーザー操作] robots.txt が GPTBot/Google-Extended/ClaudeBot/CCBot 等を全ブロック** (Cloudflare Managed robots.txt / AI Crawl Control)。llms.txt戦略が根本無効化。→ Cloudflareダッシュボードで解除が必要
- **[致命/コード修正可] canonical/og/sitemap が .html を指すが実URLは .html なし(308redirect)** → GSC「リダイレクトがあります」の真因
- Event に location/offers 欠如 / HowTo に image 無し / Organization等に sameAs 無し / トップに BreadcrumbList 無し / Speakable 無し / フォント render-blocking / hreflang 無し / sitemap lastmod 全同一 / dark mode 無し

## 実装バックログ(優先度順)
- T1.1 [ESCALATION] robots.txt AIブロック → Cloudflareダッシュボード(コード不可・報告)
- T1.2 [DONE予定] canonical/og/sitemap を clean URL 化(.html除去)
- T2.1 Event に location+isAccessibleForFree
- T2.2 Organization/WebSite/TouristDestination に sameAs+knowsAbout
- T2.3 トップに BreadcrumbList
- T2.4 FAQPage に Speakable
- T2.5 HowTo に image
- T3.1 フォント非同期読み込み
- T3.2 hreflang 自己参照(ja/en/x-default)
- T4 コンテンツ: 粗大ごみ料金表/ゴミ逆引き/ライフイベント手続き/防災マップ解説/季節の見どころ
- DEFER: dark mode, 百景個別URL化, SVG→ImageObject, 英語ガイド全訳, CSP nonce

## 完了した改善(全てデプロイ+本番検証+git push 済み)
- **[致命バグ修正] canonical/og/sitemap/内部リンクを clean URL 化** (.html除去)。GSC「ページにリダイレクトがあります」の真因を解消。全ページ canonical==実URL(308なし)を本番確認。(commit a78c957)
- **schema完全化**: TouristDestination sameAs(Wikipedia/市/観光協会)、Organization sameAs(GitHub project+mirror)+knowsAbout、Event に location/isAccessibleForFree/organizer/image、HowTo に image、8記事に Speakable。(commit 23a50f1)
- **hreflang** 自己参照(ja/en/x-default)をトップに追加。(commit 23a50f1)
- **新ガイド① 武庫川渓谷 廃線敷ハイキング** (Article+HowTo+FAQ+Speakable、出典付き)。(commit 57c09d9)
- **新ガイド② 手塚治虫記念館 完全ガイド** (Museum schema: openingHours+offers、出典付き)。(commit 1df6ec4)
- guide 記事数 6→8。全11主要URL 200 / 全35 JSON-LDブロック valid を本番確認。

## 残タスク(ユーザー復帰時 / 次セッション)
### 最優先: ユーザー操作が必要(コード不可)
- **[致命] Cloudflare の AI Crawl Control / Managed robots.txt を解除**。現在 GPTBot/Google-Extended/ClaudeBot/CCBot/Bytespider 等が edge で Disallow: / されており、llms.txt/AEO戦略が無効化されている。Cloudflareダッシュボード → 該当ゾーンの「AI Crawlers / robots.txt管理」でAIボットを許可に変更。これが最大のインパクト。
### 中〜高(コードで対応可・未着手)
- 生活側コンテンツ(life/生成物のためprerender-life.mjs経由が必要): 防災ハザードマップ活用ガイド / ライフイベント別手続きチェックリスト / 粗大ごみ料金・申込ガイド / ゴミ分別逆引き早見表
- 観光側: 追加テーマ別ルート(西谷ダリア園、桜の園など)、季節の見どころ(要更新運用)
### 低(要検討・大きめ)
- フォント非同期化(現CSPが inline onload をブロックするため、preload方式 or CSP調整が前提)
- ダークモード(prefers-color-scheme)
- 百景100件の個別URL化(AI引用先の強化)
- SVGの ImageObject 化 + EN表示時の aria-label 英語化
- sitemap lastmod をファイル別実更新日に

## セッション要約
- 競合3軸調査(観光/生活/技術)→ 致命バグ2件を含むギャップ特定 → 優先度順に実装。
- 最大の成果: (1)GSCリダイレクト問題の根本修正、(2)AIクローラー遮断という戦略矛盾の発見(要ユーザー操作)、(3)schema完全化、(4)ガイド2本追加。
- 各改善は逐次 デプロイ→本番検証→git push でリモート同期を維持(bot週次と衝突しない状態)。
