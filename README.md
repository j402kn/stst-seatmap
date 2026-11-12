# STST座席マップ 202611

チケット情報（タブ区切り / JSON / 予約メール本文）を貼り付けると、座席マップとカレンダーに反映する静的Webページです。非公式のファンツールです。

- ビルド不要。`index.html` を静的ホスティング（GitHub Pages など）に置くだけで動きます。
- 入力内容はブラウザの localStorage にのみ保存され、外部へは送信されません。
- ローカル確認: `python -m http.server` を実行し、`http://localhost:8000/` を開く。

## 構成

| パス | 内容 |
| --- | --- |
| `index.html` | 画面の骨組み。CSP を `<meta>` で指定。免責ダイアログと下部の注意書きを含む |
| `css/style.css` | スタイル（JS生成HTML用のクラスも含む） |
| `js/config.js` | 画像パス、配色、パレット、パレット用CSS変数 |
| `js/seatmap.js` | 座席SVG生成、ズーム、ページ切替、凡例 |
| `js/parser.js` | 日付・座席・チーム、TSV/JSON/メールの解析 |
| `js/data.js` | 日程・誕生週・出演者などの固定データ |
| `js/schedule.js` | 日程の組み立て、警告、重複チェック |
| `js/calendar.js` | カレンダー描画 |
| `js/render.js` | 表・マップ・モーダルの描画 |
| `js/main.js` | 入力処理、初期化、初回の免責ダイアログ |
| `assets/` | チームアイコン（SVG） |

`js/` のファイルは通常の `<script defer>` で、この順に読み込みます（順序を変えると動きません）。

## CSP

`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'` です。`style="..."` 属性は使わず、色は次の方法で当てています。

- 所持枚数・パレットの色: CSS変数 `--pal0-bg` 〜 `--pal4-fg` を `applyPalVars()` で設定し、`.pc0`〜`.pc4` で参照
- メンバーカラー: `.mk.m0`〜（`MEM` の順）
- 誕生週の段差: `.bwgap.g1`〜`g12`

`MEM` の人数や誕生週の重なりを増やしたときは、`style.css` のクラスも足してください。

## 免責ダイアログ

初回訪問時のみ表示します（localStorage の `stst202611_disclaimer_v1`）。文面を変えたときは、キー末尾の版番号を上げると全員に再表示できます。同じ文面は、ページ最下部の折りたたみにも置いてあります（`#noticeBody` が元で、ダイアログへは複製）。

## 注意

- 日程は 2026-10-29〜2027-03-31 専用です（`data.js`、`calendar.js` の `CAL_MIN` / `CAL_MAX`）。
- 作品名・キャラクター名・チーム名などの権利は各権利者に帰属します。
- ライセンスは未設定です。公開時に追加してください。
