# CLAUDE.md

構音障害・指先の運動障害がある方向けの日本語入力支援 PWA（iPad Safari）。利用者向けの仕様は README.md を参照。

## 設計の最優先事項

- 利用者は手の震えがあり、狙った位置を正確に押すことが難しい。UI を変えるときは「狙う精度が要らない」「押し間違えても被害が出ない」ことを最優先する
- クリアなどの破壊的な操作を、確定ボタンや頻繁に使うボタンの近くに置かない
- 1画面に収め、スクロールを発生させない（iPad 縦向きと iPhone SE の画面高さで確認する）

## 構成と制約

- `index.html` 1ファイル（CSS / JS をインラインで記述）。ビルド工程・外部ライブラリ・CDN は追加しない（オフライン動作と保守性のため）
- 入力方式は2つ。`state.settings.inputMode` が `dpad`（方向キー）か `scan`（スキャン）かで、`updateUI()` が `updateDpadUI()` と `renderScan()` のどちらかを呼ぶ。`body.scan-mode` クラスで表示する画面を切り替える
- 入力内容・保存・読み上げ・削除などの処理と変換表は、両方式で共通にする。片方の方式だけを変えるときは、もう片方が壊れていないことを確認する

### 方向キー入力

- 状態は `state`（`mode` / `selectedRow` / `selectedKanaPos` / `inputText` / `settings`）に集約し、変更後に `updateUI()` で再描画する
- `mode` の遷移: `rowSelection` →（確定）→ `kanaSelection`（通常の行）または `modSelection`（゛゜小）→（確定）→ `rowSelection`
- 行・段の移動は `ROW_NAV` / `KANA_NAV`、文字は `KANA_MAP`、変換は `DAKUTEN_MAP` / `HANDAKUTEN_MAP` / `KOGAKI_MAP` で定義する

### スキャン入力（仕様: docs/scan-input-spec.md）

- 状態は `scan`（`phase`: `idle` / `row` / `rowConfirm` / `kana` / `kanaConfirm`）に集約する。遷移は `scanRun()` / `scanConfirm()` / `scanIdle()` を通し、直接 `phase` を書き換えない
- タイマーは `scan.timer` の1本だけ使う。遷移時は `scanStop()` で止める。音声のコールバックは `scan.gen` で古いものを無視する
- 候補は `SCAN_ROWS`（行）と `scanItemsFor()`（段）で定義する。段の候補を足すときは、確認音声で読みにくい文字の読み方を `SPEAK_NAME` に追加する
- 確定ボタンは `pointerdown` と keydown（Space / Enter）で受ける。click にしない（震えで指が動くと iOS では click が発火しないことがある）
- 介助者向けのパネル直接タッチは逆に click で受ける（指が動いた誤タッチを拾わないため）。段パネルのタッチは必ず音声確認を経由させ、即入力にしない
- 保存先は localStorage（`jp-access-input-text`, `jp-access-settings`）。設定項目を追加するときは `state.settings` の初期値にも追加する（保存済みの値は `Object.assign` でマージされる）
- ボタンの高さは `applyStyles()` で画面の高さから算出する（CSS 変数 `--row-cell-h`, `--action-h`）

## iOS Safari の注意点

- ズーム・パン・ダブルタップは JS（touchmove / gesture* / touchend）で抑止している。操作要素を追加するときに壊さないこと
- 音声合成（speechSynthesis）は、最初の1回をユーザー操作のイベント内で呼ぶ必要がある。touch の pointerdown はユーザー操作として扱われないため、最初の touchend / click で `unlockSpeech()` を呼んで有効にしている
- 画面の高さ（`100svh`、`innerHeight`）は実機ごとの差が大きい。レイアウトを変えたら実機で確認する

## 公開・デプロイ

- GitHub Pages（main ブランチのルート）で公開している。main への push がそのまま本番反映になるため、push 前に必ずユーザーに確認する
- `sw.js`: HTML はネットワーク優先、それ以外はキャッシュ優先。`manifest.json` や `icon.svg` などの静的アセットを変えたら `CACHE_NAME` を上げる
- ローカル確認: `python3 -m http.server 8000`（Claude の Browser pane では `.claude/launch.json` の `static` 設定で起動する）

## ドキュメント

- 仕様を変えたら README.md（利用者向けの仕様）と `docs/` を更新する
- `docs/scan-input-spec.md`: スキャン入力の仕様と決定事項
