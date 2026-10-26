# 札幌トイレマップ(Web 版)— 引き継ぎ README

すすきの周辺の **トイレとコンビニ** を地図で探す PWA(スマホ向け)。マスコットはヒグマの「くまトイ」。
ビルドなし(HTML + CSS + JS)、GitHub Pages 向け。リポジトリ: `ma-ookami/sapporo-loo-map`(`main`)。
英語名 Sapporo Loo Map / 日本語名 札幌トイレマップ。iOS ネイティブ版(Expo)は `../sapporo-loo-map`(下の「Expo 版」)。

## 0. いまの状態(最初に読む)
- **Git:** `origin/main` は `2b98526`。手元の `main` は **12 コミット先行(未 push)**、先頭は `c54494c`。**push はユーザーが「送って」と言ったときだけ**。
- **GitHub Pages:** 有効化したかは未確認(Settings → Pages → `main` / root)。公開 URL 想定: `https://ma-ookami.github.io/sapporo-loo-map/`
- **Firebase(playground)にルールを足したか未確認。** 足すまでは、公開サイトで追加・報告が保存に失敗する(手順は §6)。
- **未確認:** iPhone 実機(位置情報・ホーム画面追加・すりガラス・ダーク・スワイプ)、Firestore につないだ状態の動作(Java が無くエミュレータが使えない)。
- 自動テストは全部ローカルモード(`?local=1`)で通っている(§7)。
- 反映されないときは強制再読み込み(iPhone のホーム画面アイコンは削除して追加し直す)。`?v=` スタンプ(§8)導入前の古い `index.html` が残っていると混ざる。

## 1. 次にやること(優先順)
1. ユーザーの指示で push → Pages 有効化 → Firebase にルールを足す → iPhone 実機で確認
2. データを増やす(名前のあるトイレが 6/26 件のみ。コンビニの貸し出しは全部「不明」。最初は手入力で見本を作る)
3. オフライン対応(Service Worker でアプリ本体 + `data/toilets.js` をキャッシュ。すすきのの地下は圏外になりやすい)
4. ユーザーが検討中のもの: 初回だけ凡例を開いた状態で見せる(折衷案)/ 詳細の「ここへ行く」も小さくするか / 最寄りカードを一時的に隠す操作 / ブランドの文字バッジ(自作の「7」「F」「L」「S」。**公式ロゴは使わない**。商標・App Store 審査の問題)
5. アイデア(未着手): 近く(20m)に登録済みがあれば警告 / OSM 既存情報の修正提案 / ピンのクラスタ表示 / 共有ボタン / アプリ全体の英語表示 / 精度の円 / 連続投稿の制限 / 通報
6. App Store に出すなら、Expo 版を育てるより **Web 版を Capacitor で包む**ほうが現実的(Apple Developer 登録済み)。決定はまだ

## 2. 機能(画面)
- **下のシート:** 最寄りカード(1行: くま・名前と距離・「ナビ開始」)→ リスト(広がる)/ 詳細。つまみのタップ・上下スワイプで開閉。地図の何もない所をタップで詳細・リストが閉じる(追加中は無効)
- **フッター:** リスト(押すと開閉)・＋追加・設定。「地図」タブは無い(リストを閉じれば地図)
- **上部:** ブランド名、地図の色の切り替え(重なった四角)、現在地(◎)、絞り込みチップ(横スクロール)
- **左下:** 「凡例」ボタン(4行: トイレ=データ/ユーザー追加、コンビニ=借りられる/借りられない)。下のシートに追従、リスト表示中・追加中は隠す
- **絞り込み**(`st.filters`): 上段=種類の切替(すべて / トイレ / コンビニ。`tonly`/`conly`)+「いま空いてる」。2段目は種類に応じて出る: トイレ=無料・車いす・24時間 / コンビニ=借りられる(`conv`)・ブランド(セブン/ファミマ/ローソン/セイコマ)。種類を替えると、前の種類専用の絞り込みは外れる(`syncFilterUi` in settings.js)。初期は「すべて」
  - **コンビニ探しのモード**(コンビニ選択中 / ブランド選択中): 最寄りが「いちばん近いコンビニ」。借りられるか不明・借りられないの店も最寄り/リストに出し、引いた地図(zoom<15)でも不明の店を出す
  - 設定の「画面に出す絞り込みボタン」は廃止(`chips` 設定も無し)
- **詳細:** 階・料金・車いす・営業中タグ・星(使いやすさ/場所のわかりやすさ)・メモ・一言報告(トイレ: きれい/混んでた/使えなかった、24時間だけ集計。コンビニ: 借りられる/声をかけて/借りられない=多数決、同数は声かけ)・お客さん専用等の注意書き・「ここへ行く」(Google マップ徒歩)・自分の追加は削除
- **＋追加:** 現在地にピンを置いた状態で始まる → 動かして「ここにする」→ トイレ/コンビニを選び、名前・階(B1〜10F〜)・料金・車いす / ブランド・貸し出し(借りられる・声をかけて借りる・借りられない)・星・メモ → 登録
- **ピンと色:** 青赤の半々=データのトイレ / **紫=ユーザー追加のトイレ**(ユーザー追加のコンビニは右上に紫の点)/ 白丸+店アイコン、縁 緑=借りられる・橙=声かけ・灰=×・薄い=不明 / 黒=選択中 / 最寄りは広がる輪 / 現在地は青い点。ボタン類の橙(`#c4521f`)は「操作」の色
- **「いま空いてる」:** `js/hours.js` が OSM の opening_hours(曜日・時間帯・日またぎ・off)を日本時間で判定。**営業時間が不明なものは出す**(営業時間外と分かるものだけ隠す)
- **設定**(localStorage `loo-settings`): テーマ(自動/ライト/ダーク)・地図の色(シンプル/カラー)・地図の文字(日本語/English)・歩く速さ・振動・最寄りにコンビニも出す・不明のコンビニを地図に出す・絞り込みボタンの出し入れ・自分が追加したもの/報告の一覧と削除・使う前に/プライバシー/連絡/版/この端末の記録を消す
- **地図:** OpenFreeMap。シンプル=`positron`(暗い時 `dark`)/ カラー=`bright`(暗い時 `fiord`)。地名は1言語だけ(日本語=name:ja→name、English=name_en→name:latin→name)。店アイコン・道路標識・住所番号は消す(`tidyStyle`)
- **現在地:** 許可がないとき◎でトーストに理由(iPhone の設定の場所)。最初に取れたとき、地図を動かしておらずすすきの 3km 以内なら寄る。遠い(最寄り 1.5km 超)ときは「すすきのへ」ボタン
- **初回の案内「使う前に」:** お客さん専用のトイレもある / できるだけ買い物を・混雑時は遠慮・声かけの言い方 / 情報は投稿。出典(© OpenStreetMap contributors)と位置情報の説明、`privacy.html` へのリンク付き。**文言は私(エージェント)の案なので、ユーザーに確認してもらうこと**
- **名前のないトイレ:** 「トイレ(○○ 付近)」(近くの施設・通りの名前)。26 件中 20 件が名前なし、16 件に目印が付く

## 3. ファイル構成
- `index.html`(スクリプトは順に読み込み: firebase-config, data/toilets.js, geo, hours, icons, bear, cloud, map, settings, ui, add, main)
- `js/geo.js` 距離・整形・ブランド/貸し出しの名前、`PACE`(徒歩速度)/ `hours.js` 営業時間の判定 / `icons.js` 細線アイコンと星 / `bear.js` くまトイ SVG(4表情・ゆれ・まばたき)/ `cloud.js` 保存(Firestore か localStorage)/ `map.js` 状態 `st`・地図・ピン・現在地・絞り込み(`passes`/`usable`/`convMode`)/ `settings.js` 設定画面 / `ui.js` シート・詳細・フッター・チップ・凡例・案内 / `add.js` 追加 / `main.js` 起動
- `css/style.css` 全部(CSS 変数 → ダーク。ダークは `@media` と `html[data-theme=dark]` の2か所に同じ規則がある。設定追加時に `data-theme` 版も忘れない)
- `data/toilets.js` 生成物(§4)/ `privacy.html` / `manifest.webmanifest` / アイコン `icon-192/512.png`・`apple-touch-icon.png`(`node tools/make-icons.js` で bear.js から生成)
- `firebase-config.js`(playground の設定。`?local=1` でローカルモード)/ `firestore.rules`(単独版)/ `firestore.playground-snippet.rules` / `firestore.playground.rules`(PaP との合体版)
- `tools/`: `stamp.js`、`to-js.js`、`make-icons.js`、`shot.js`、`test-*.js`

## 4. データ(パイプラインは `../sapporo-loo-map/` にある)
- 取得(OSM / Overpass、範囲 `43.046,141.335,43.078,141.364`(すすきの〜札幌駅。`../sapporo-loo-map/tools/fetch-osm.js` で取得)): トイレ `amenity=toilets` → `data/osm-raw.json`、コンビニ `shop=convenience` → `data/osm-conv-raw.json`。**User-Agent 必須(無いと 406)。502/429 が出るので、サーバーを替えて再試行**
- 名前なしトイレの目印: `tools/fetch-areas.js` → `data/areas.json`。手入力: `data/manual.json`
- `node tools/build-data.js`(`../sapporo-loo-map`)→ `data/toilets.json` → このリポジトリで `node tools/to-js.js` → `data/toilets.js`(`<script>` で読むので `index.html` を直接開いても動く)
- 件数: トイレ 40/ コンビニ 201。型は `{id,name,lat,lng,fee,wheelchair,floor,hours,note,type:'toilet'|'conv',brand,loan,area?,source}`
- いずれこのパイプラインを Web 版のリポジトリに移したほうがよい(Expo 版を止めるなら)

## 5. 色・デザインの決まり(ユーザーの方針)
- ミニマル・フロスト(すりガラス・アクセント1色・細線アイコン)。1画面1メインアクション、マスコットは残す、1色1意味
- くまトイ: 丸い体 + 頭の寝ぐせ風の毛(向きと長さがばらばらな3本)+ クリーム色のお腹。**お腹のトイレマークは不要(消した)**。卵型からすらっとした形に変えたこともあるが、丸いほうに戻した

## 6. 保存先(Firebase playground)
- PaP と同じ `playground-d8897`。コレクション `loo-toilets`(追加されたトイレ。項目: name,lat,lng,fee,wheelchair,floor,ease,find,type,brand,loan,note,uid,createdAt)と `loo-reports`(一言報告。ID=`<toiletId>_<uid>`、kind: clean/crowded/closed/loan-yes/loan-ask/loan-no)。匿名ログインで書く。読むのは誰でも、削除・取り消しは本人だけ。他のアプリと衝突しないよう `loo-` を付けている
- **ルールの足し方:** Firebase コンソール → Firestore → ルール →「`documents` の中」に `firestore.playground-snippet.rules` の match 2つを足して公開。**他のアプリのルールが入っているなら完全版は貼らない**(消える)。匿名ログインの有効化と承認済みドメイン `ma-ookami.github.io` も確認
- 荒らし対策は簡易(項目・長さ・札幌周辺の座標の制限)。連続投稿の制限・App Check は未実装

## 7. 開発・確認
- 動かす: `index.html` を直接開く(`file://` では位置情報は取れない。公開 URL か localhost で)
- テスト: `node tools/test-xxx.js`。playwright-core は `../taskline/node_modules` を借りる。Edge(`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`)を GPU 無しで動かすため **1本が 1〜5 分かかる**。バックグラウンドで実行して完了を待つ。**Edge を全部終了させるコマンドは使わない**(ユーザーのブラウザが落ちる)
  - `test-add`(絞り込み・リスト・追加・詳細・報告・削除)/ `test-conv` / `test-loan`(コンビニの取り込みと貸し出し報告)/ `test-convmode`(コンビニ探し)/ `test-settings` / `test-filters`(種類の切替・2段目、速い)/ `test-legend` / `test-guide` / `test-hours`(営業時間・単体)/ `test-dark` / `test-lang` / `test-mapcolor` / `test-style-switch`(スタイル入れ替え後も日本語のみ)/ `test-mapclose` / `test-locate`
  - 見た目の確認: `node tools/shot.js out.png`。画像は確認後に消す
- 各テストは `localStorage` の `loo-guide` を立てて案内を飛ばし、`?local=1` でローカルモードにする

## 8. はまりどころ(同じ失敗をしないように)
- **地図スタイルの入れ替えは `reloadStyle()`(`setStyle(url,{diff:false})`)。** 差分更新だと `style.load` が来ず `tidyStyle` が動かず、日英併記・店アイコン・標識が戻る
- **MapLibre のマーカー外側の要素に CSS の `transform` を付けない**(位置指定に使われる)。動きは内側の `.pi` に付ける
- **`index.html` の `?v=` スタンプ:** `node tools/stamp.js` が各ファイルのハッシュを付ける。`.git/hooks/pre-commit` で自動実行(**フックは git に入らない**。別 PC は `node tools/stamp.js && git add index.html` を置く)。パッチで `<script src="js/ui.js"></script>` のように完全一致で探すと外れる(先頭だけで探す)
- **シェルのヒアドキュメントはバックスラッシュを壊す。** 長いコードはファイルツール(Write)で書く。改行は `String.fromCharCode(10)`、正規表現のエスケープは避ける
- **Node の `/tmp` と bash の `/tmp` は別の場所**(Node は `C:\tmp`)。一時ファイルはプロジェクト内に置くか、プロジェクト外のスクラッチパッドを使う
- ヘッドレスでは、地図を拡大(zoom 16 以上)すると描画が数十秒かかる。テストは zoom 15.5 前後で
- iOS Safari は `navigator.vibrate` 非対応(振動は Android のみ)。位置情報は https 必須、`file://` 不可
- git の「LF will be replaced by CRLF」の警告は無害
- `st.filters` のキーを増やすときは、`index.html` のボタン(2段目は `data-g=t|c`)と `map.js` の `st.filters`・`passes` をそろえる

## 9. コミットと報告のルール
- 親フォルダの `CLAUDE.md` に従う: 日本語・報告は短く(結果・要対応・未確認だけ)、小さな変更は Edit、構文チェックしてからコミット
- コミットメッセージの末尾: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`。コミットは作業ごとにしてよいが、**push はユーザーの指示があったときだけ**
- `firestore.rules` を変えたら、ユーザーに「コンソールに貼り直す」と必ず伝える(今回の playground では、snippet を足す)

## 10. Expo 版(`../sapporo-loo-map`)
- 地図 + ピン + 詳細 + リスト + 最寄りの最小版(MapLibre RN)。`eas init` 済み(`@roku_north/sapporo-loo-map`)。ビルドは未実行(dev client が必要。Expo Go では動かない。Windows では iOS ビルド不可 → EAS Build)
- **Web 版より大きく遅れている**(設定・営業時間・報告・コンビニ探しなし)。アプリ内の `Bear.tsx` も旧デザイン。アイコン画像だけ Web 版と同期済み
- 方針は未決定(§1-6)。データ取得・生成のツールはここにある(§4)
