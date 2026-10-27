// 英語の辞書(js/i18n-en.js)を作る: node tools/i18n-build-dict.js
//   キーは tools/_missing.json(画面から集めた文言)と tools/_strings.json(コードの文言)に実在するものだけ使える。
//   D('日本語の先頭', '英語') = その文言(先頭が同じものが1つだけなら可)。ADD = 一覧に無くても入れる。
//   新しい文言を足したら、node tools/i18n-capture.js で集め直して、ここに足す。
const fs = require('fs'), path = require('path');
const rt = require('./_keys.json').concat(require('./_missing.json'));   // _keys.json = 画面から集めた全部の文言(固定)、_missing.json = 集め直した、辞書に無いぶん
const st = require('./_strings.json').map(x => x[0]);
const keys = [...new Set(rt.concat(st))];
const dict = {}, fresh = [];
const D = (ja, en) => {
  let c = keys.filter(k => k === ja);
  if (!c.length) c = keys.filter(k => k.startsWith(ja));
  if (c.length > 1) throw new Error('キーが ' + c.length + ' 件: ' + ja + ' ' + JSON.stringify(c.slice(0, 3)));
  if (!c.length) { fresh.push(ja); dict[ja] = en; return; }   // 一覧に無い(新しい文言。綴りの間違いでないか確認)
  dict[c[0]] = en;
};
const ADD = (ja, en) => { dict[ja] = en; };

// ---- 画面の部品 ----
D('札幌トイレ・コンビニマップ', 'Sapporo Toilets & Stores');
D('トイレ', 'Toilet'); D('コンビニ', 'Convenience store'); D('すべて', 'All');
D('リスト', 'List'); D('設定', 'Settings'); D('トイレを追加', 'Add a place');
D('現在地へ', 'Go to my location'); D('現在地', 'My location');
D('地図の色を切り替え', 'Switch map colors'); D('凡例を開く', 'Show legend'); D('凡例', 'Legend');
D('シートを開閉', 'Expand or collapse the panel'); D('閉じる', 'Close'); D('切り替え', 'Toggle');
D('いま空いてる', 'Open now'); D('営業中', 'Open now'); D('営業時間外', 'Closed now');
D('{n}時間', '{n} hours');
D('無料', 'Free'); D('有料', 'Paid'); D('車いす可', 'Wheelchair OK'); D('車いす', 'Wheelchair');
D('セブンイレブン', '7-Eleven'); D('セブン', '7-Eleven'); D('ファミリーマート', 'FamilyMart'); D('ファミマ', 'FamilyMart');
D('ローソン', 'Lawson'); D('セイコーマート', 'Seicomart'); D('セーコマ', 'Seicomart'); D('その他', 'Other');
D('借りられるか不明のコンビニを地図に出す', 'Show stores where lending is unknown on the map');
D('借りられるか不明', 'Unknown if you can borrow');
D('借りられない', "Can't borrow"); D('借りられる', 'Can borrow');
D('声をかけて借りる', 'Ask staff to borrow'); D('声をかけて', 'Ask staff');
D('そのまま', 'Just use it'); D('店員さんに一言', 'Ask a staff member'); D('貼り紙あり', 'Sign posted');
D('貸出なし', 'Not lent out'); D('断られた', 'Was refused');
D('コンビニ: 借りられない', "Store: can't borrow"); D('コンビニ: 借りられる', 'Store: can borrow');
D('トイレ: ユーザ追加', 'Toilet: added by users'); D('トイレ: 公開データ', 'Toilet: public data');
D('地下にある(Bの印)', 'Underground (marked B)');
D('地下 B{n}', 'Underground B{n}'); D('地下', 'Underground');
D('地上({n}階)', 'Ground floor'); D('地上({n}F)', 'Ground floor ({n}F)'); D('{n}階以上', 'Floor {n}+');
D('{n}F〜', '{n}F+'); D('わからない', 'Not sure');
D('使える', 'Usable'); D('使えない', 'Not usable');
D('きれい', 'Clean'); D('混んでた', 'Crowded'); D('使えなかった', "Couldn't use");
D('{n}人', '×{n}');
// (旧: 追加された情報 → 確認済み/未確認の2種類に替えた)
D('「なかった」の報告があります', "Someone reported it isn't there");
D('「ここにはなかった」と報告済み', 'Reported “not here” (tap to undo)');
D('ここには、なかった', "It wasn't here");
D('この情報を削除', 'Delete this entry'); ADD('削除', 'Delete'); ADD('取り消し', 'Undo'); D('(見つかりません)', '(not found)');
D('ここへ行く', 'Directions'); D('ナビ開始', 'Navigate');
D('いちばん近いトイレ', 'Nearest toilet'); D('いちばん近いコンビニ', 'Nearest convenience store');
D('近い順', 'Nearest first'); D('リストを閉じる', 'Close list');
D('{n}m・徒歩{n}分', '{1} m · {2} min walk'); D('{n}km・徒歩{n}分', '{1} km · {2} min walk'); D('徒歩{n}分', '{n} min walk');
D('すすきのへ', 'To Susukino');
D('ちょっと遠いよ。まずはすすきの周辺だけ載ってるよ', 'This is a bit far. For now, only the Susukino area is covered.');
D('条件に合う場所がないよ', 'No places match. Try loosening the filters.');
D('どこにある?(地上か地下か)', 'Where is it? (above or below ground)');
D('まだ分かっていません。行ったことがあれば', 'Not known yet. If you’ve been there, tell us! (Underground places get a “B” mark on the map.)');
ADD('みんなの情報では、地下にあります。{n}人が教えてくれました。行ったことがあれば、教えてね', 'According to everyone, it’s underground. Shared by {n}. If you’ve been there, tell us too!');
D('{n}人が教えてくれました。行ったことがあれば', 'Shared by {n}. If you’ve been there, tell us too!');
D('{n}人が教えてくれました。借りたことがあれば', 'Shared by {n}. If you’ve borrowed it, tell us too!');
D('まだ誰も教えてくれていません', 'Nobody has said yet. If you’ve borrowed it, tell us!');
D('このコンビニのトイレ、借りられる?', 'Can you borrow this store’s toilet?');
D('いまの様子({n}時間だけ表示)', 'Condition right now (shown for {n} hours only)');
D('お店のご厚意で借りるトイレです', 'This toilet is lent as a favor by the store. Please buy something if you can, avoid busy times and keep it clean. Some stores are for customers only.');
D('ビルやお店のトイレは、お客さん専用', 'Toilets in buildings and shops are sometimes for customers only. If you can’t use one, just try somewhere else.');

// ---- 追加 ----
D('{n} / {n} 場所', 'Step {1}/{2} · Place'); D('{n} / {n} 情報', 'Step {1}/{2} · Details');
D('まず場所を選んでね。いまの場所に', 'First, choose the spot. I put a pin at your current location. If it’s off, move the map.');
ADD('まず場所を選んでね。ずれていたら地図を動かしてね', 'First, choose the spot. If the pin is off, move the map.');
D('やめる', 'Cancel'); D('ここにする', 'Use this spot'); D('この場所のことを教えてね', 'Tell us about this place');
D('どこのコンビニ?', 'Which store?'); D('このコンビニのトイレ、借りられた?', 'Could you borrow this store’s toilet?');
D('お店のご厚意で借りるものです', 'Stores lend their toilets as a favor. Some stores are for customers only.');
D('階(地下はB{n}・B{n})', 'Floor (basement = B{1}, B{2})');
D('店名・場所(例', 'Store name / place (e.g. ○○ branch; optional)');
D('名前・場所(例', 'Name / place (e.g. ○○ Building)');
D('料金', 'Fee'); D('使いやすさ', 'Ease of use'); D('広さ・きれいさ・入りやすさ', 'Space, cleanliness, easy to enter');
D('場所のわかりやすさ', 'Ease of finding'); D('見つけやすさ・行き方', 'Easy to spot, easy to reach');
D('メモ(営業時間', 'Note (hours, tips… optional)');
D('場所を選び直す', 'Choose the spot again'); D('登録する', 'Add');
D('どこのコンビニか選んでね', 'Please choose the store'); D('貸し出しの状況を選んでね', 'Please choose whether you could borrow it');
D('名前か場所を入れてね', 'Please enter a name or place');
ADD('ここは対象のエリア(すすきの〜札幌駅)の外です', 'This spot is outside the covered area (Susukino to Sapporo Station)');
ADD('すぐ近く({d}m)に「{name}」が登録されています。それでも登録しますか?', '“{name}” is already registered very close by ({d} m). Add anyway?');
D('登録しました。ありがとう!', 'Added. Thank you!');
ADD('登録できませんでした。間をあけるか、今日の上限({n}件)かもしれません', 'Couldn’t add. Wait a bit, or you may have reached today’s limit ({n}).');
ADD('登録できませんでした', 'Couldn’t add');
D('すこし間をあけてから', 'Please wait a moment before adding another.');
ADD('今日はたくさん登録してくれてありがとう。続きはまた明日お願いします', 'Thank you for adding so much today! Please continue tomorrow.');
ADD('サーバーにつながらないので、この端末にだけ保存します', 'Can’t reach the server, so this will be saved only on this device');

// ---- 位置情報・地図 ----
D('位置情報がオフです', 'Location is off. On iPhone: Settings → Privacy → Location Services → Safari, turn it on, then reload the page.');
ADD('現在地がとれませんでした。電波のよいところで、もう一度ためしてね', 'Couldn’t get your location. Try again where the signal is better.');
D('現在地をさがしています', 'Finding your location…');
D('取得できています', 'Location found (the blue dot on the map)');
ADD('取得中…', 'Getting…');
D('許可されていません', 'Location access is not allowed. Turn on location for this site in your device settings (iPhone: Settings → Privacy → Location Services → Safari).');
ADD('いまは取得できません。電波のよいところでためしてね', 'Not available right now. Try where the signal is better.');
ADD('地図: カラー', 'Map: Color'); ADD('地図: シンプル', 'Map: Simple');
D('さがす', 'Find');

// ---- 設定 ----
D('テーマ', 'Theme'); D('自動は、端末の設定に合わせます', 'Auto follows your device setting');
D('自動', 'Auto'); D('ライト', 'Light'); D('ダーク', 'Dark');
D('地図の色', 'Map color'); D('シンプル', 'Simple'); D('カラー', 'Color');
D('シンプルは淡い地図', 'Simple is a pale map; Color adds color to buildings and parks. You can also switch with the stacked-squares button above the map.');
D('言語 / Language', 'Language');
D('画面と地図の文字の言語です', 'Language for the screen and map labels. Even in English, places without an English name show in Japanese.');
ADD('日本語', '日本語');
D('歩く速さ', 'Walking speed'); D('「徒歩○分」の計算に使います', 'Used to calculate “N min walk”');
D('ゆっくり', 'Slow'); D('ふつう', 'Normal'); D('早足', 'Brisk');
D('振動', 'Vibration'); D('ボタンを押したとき', 'When you press buttons (Android only)');
D('最寄りにコンビニも出す', 'Include stores in “Nearest”');
D('「いちばん近いトイレ」とリストに', 'Include convenience stores you can borrow from in “Nearest toilet” and the list');
D('オフにすると、教えてもらった店だけが出ます', 'Only stores that people have told us about will show');
D('自分が追加したもの', 'Things I added'); D('自分の報告', 'My reports'); D('まだありません', 'None yet');
D('このアプリについて', 'About this app');
D('使う前に(お客さん専用', 'Before you start (customers-only toilets, being kind to stores)');
D('プライバシーとデータの出典', 'Privacy & data sources'); D('間違い・ご意見を送る', 'Report a mistake / send feedback');
D('版', 'Version'); D('この端末の設定と記録を消す', 'Clear settings and records on this device');
ADD('削除しますか?', 'Delete this?'); ADD('削除できませんでした', 'Couldn’t delete'); ADD('取り消せませんでした', 'Couldn’t undo'); ADD('送れませんでした', 'Couldn’t send');
ADD('この端末の設定と記録を消します。(ほかの人にも見えている投稿は消えません)', 'This clears settings and records on this device. (Posts that other people can see will not be removed.)');
D('Google マップを開いて、「{name}」', 'Open Google Maps and show walking directions to “{name}”. Continue?');
ADD('トイレ・B{n}', 'Toilet · B{n}'); ADD('トイレ・{n}F', 'Toilet · {n}F'); ADD('コンビニ・B{n}', 'Convenience store · B{n}'); ADD('コンビニ・{n}F', 'Convenience store · {n}F');

// ---- 初回の案内 ----
D('使う前に、ちょっとだけ', 'Before you start');
D('お客さん専用のトイレもあるよ', 'Some toilets are for customers only');
D('お店や商業施設のトイレは', 'Toilets in shops and commercial buildings may be for customers only. If you can’t use one, just try another place.');
D('できるだけ、お店で買い物を', 'Please shop at the store if you can');
D('コンビニなどはお店のご厚意で', 'Convenience stores lend their toilets as a favor. Buy something if you can, avoid busy times and keep it clean. When asking, try “May I use your restroom?”');
D('情報はみんなの投稿です', 'Information comes from everyone');
D('古い・違うこともあります', 'Information may be old or wrong. If you notice, tell us with a report or by adding a place.');
D('地図とトイレ・コンビニの位置は', 'The map and the locations of toilets and stores are © OpenStreetMap contributors data. Your location is used only on your device and is never sent.');
D('くわしく', 'Details'); D('わかった', 'Got it');
D('お客さん専用のトイレもあるよ', 'Some toilets are for customers only');

// ---- 個室の数・確認済み・ユーザー追加 ----
ADD('{n}以上', '{n}+'); ADD('個室 {n}', 'Stalls: {n}'); ADD('個室 {n}以上', 'Stalls: {n}+'); ADD('個室はいくつ?', 'How many stalls?'); ADD('5以上', '5+');
ADD('個室の数(男女別なら、合わせて)', 'Number of stalls (men’s and women’s combined)');
ADD('{n}人が教えてくれました。数えたことがあれば、あなたも教えてね', 'Shared by {n}. If you’ve counted them, tell us too!');
ADD('まだ分かっていません。数えたことがあれば、教えてね', 'Not known yet. If you’ve counted them, tell us!');
ADD('追加された情報(確認済み)', 'Added by a user (confirmed)'); ADD('追加された情報(未確認)', 'Added by a user (unconfirmed)');
ADD('トイレ: ユーザー追加(点線は未確認)', 'Toilet: added by users (dashed = unconfirmed)');
ADD('地上', 'Ground'); ADD('2階以上', 'Floor 2+');

// ---- 確認: 辞書に入った件数と、足りないもの ----
if (fresh.length) console.log('一覧に無かったので新しく入れた:', fresh.length, '件', JSON.stringify(fresh).slice(0, 600));
const need = keys.filter(k => dict[k] === undefined && !k.startsWith('&nbsp;') && !k.startsWith('"') && k !== 'トイレ(' && k !== '付近)' && k !== '・' && k !== '徒歩' && k !== '分' && k !== '人' && k !== '・徒歩' && !k.startsWith('firebase') && !k.includes('Toilet (near'));
if (need.length) { console.log('まだ辞書に無い:', need.length); need.forEach(k => console.log('  ' + JSON.stringify(k))); }
const sorted = Object.fromEntries(Object.entries(dict).sort((a, b) => a[0].localeCompare(b[0], 'ja')));
fs.writeFileSync(path.join(__dirname, '../js/i18n-en.js'), '/* 英語の辞書。キー=日本語の文言(数字は {n})、値=英語。js/i18n.js の説明を参照。\n   作り方: tools/i18n-build-dict.js(文言を足したら tools/i18n-capture.js で集め直す) */\nI18N.en=' + JSON.stringify(sorted, null, 1) + ';\n');
console.log('辞書', Object.keys(sorted).length, '件を js/i18n-en.js に書いた');
