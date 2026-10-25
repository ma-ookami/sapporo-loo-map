// ../sapporo-loo-map/data/toilets.json → data/toilets.js(script タグで読めるようにする)
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../../sapporo-loo-map/data/toilets.json', 'utf8');
fs.writeFileSync(__dirname + '/../data/toilets.js', '/* 生成: node tools/to-js.js */\nconst TOILETS=' + src + ';\n');
