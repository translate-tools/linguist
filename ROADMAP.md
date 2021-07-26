List with main plans

## Platforms

- [x] Publish in firefox addons store
- [ ] Publish in chrome addons store
- [ ] Publish in [edge](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension) addons store
- [ ] Add smartphones support
  - [ ] Add popup in content script contains UI for control page translation for mobiles (detect it by UserAgent while first run)
  - [ ] Use markup which looks good on phones
- [ ] Try electron application

## Features

- [ ] User defined translate modules
- [ ] Local translator
- [ ] Translate text on images
- [ ] Text speaking
- [ ] Optional voice recognition, input text with voice
- [ ] Open text translation in separate page (with unpin as standalone window)
- [ ] Translates history page (it may be implement as tab in dictionary)

### Dictionary

- [ ] Allow use tags or directories for translations
- [ ] Allow edit translations
  - [ ] Add history for each translation
- [ ] Add translate sources - link on page which contains entry text
  - [ ] Button for remove all sources. It important for privacy

### Select translation

- [ ] Instant translate by hotkeys/modifiers even if enable translate button

### Little things

- [ ] Add translate button in page context menu
- [ ] Add popup for translate page in omnibox for firefox (`page_action` key in manifest)

### Low priority

- [ ] Select translator for each use unit
- [ ] Add more languages

## Architecture

- [ ] Use CSS modules

### Low priority

- [ ] Use `browser.storage` instead `localStorage` for store config
- [ ] Keep rules for translate tags as cssQuery (like uBlock)
- [ ] Picker of nodes for enable/disable translate (like uBlock)

## Optimizations

### Translate scheduler

- [ ] Implement abort unnecessary tasks. Return abort hook for each task
  - It need while abort page translation, to economy traffic
- [ ] Optionally postpone translate similar tasks and resolve all by translate one of it
