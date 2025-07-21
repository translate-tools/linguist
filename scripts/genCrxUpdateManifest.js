/* eslint-disable @cspell/spellchecker */
const { version } = require(__dirname + '/../package.json');

const appid = 'bjbijcdiadijepllfddlcbehcdhcfhkh';
const codebase = `https://github.com/translate-tools/linguist/releases/download/v${version}/linguist.crx`;

// Generate XML file
// For more info see https://developer.chrome.com/docs/apps/autoupdate/#update_manifest
const result = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${appid}'>
    <updatecheck codebase='${codebase}' version='${version}' />
  </app>
</gupdate>`;

// Output
console.log(result);
