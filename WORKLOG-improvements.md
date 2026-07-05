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

## 完了した改善
(実装ごとに追記)

## 残タスク(ユーザー復帰時)
(セッション終了時に記入)
