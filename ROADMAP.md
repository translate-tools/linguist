List with main plans

## Platforms

- [x] Publish in firefox addons store
- [x] Publish in chrome addons store
- [ ] Publish in [edge](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension) addons store
- [x] Add smartphones support
  - [ ] Add popup in content script containing UI for controlling page translation for mobile devices (detect it by the UserAgent on the first run)
  - [x] Use markup which looks good on phones
- [ ] Try an electron application

## Features

- [x] User defined translation modules
- [ ] Local translator
- [ ] Translate text in images
- [x] Text to speech
- [ ] Optional voice recognition, speech to text
- [ ] Open text translation in separate page (with unpin as standalone window)
- [ ] Translate history page (it may be implemented as a tab in dictionary)

### Dictionary

- [ ] Allow using tags or directories for translations
- [ ] Allow editing translations
  - [ ] Add a history for each translation
- [ ] Add translation sources - link on page which contains entry text
  - [ ] Button for removing all sources. It is important for privacy

### Select translation

- [ ] Instantly translate using hotkeys/modifiers even if translation button is enabled

### Little things

- [x] Add translation button in page context menu
- [ ] Add popup for translation page in omnibox for firefox (`page_action` key in manifest)

### Low priority

- [ ] Select translator for each use unit
- [ ] Add more languages

## Architecture

- [ ] Use CSS modules

### Low priority

- [x] Use `browser.storage` instead `localStorage` to store config
- [ ] Keep rules for translation tags as cssQuery (like uBlock)
- [ ] Picker of nodes to enable/disable translation (like uBlock)

## Optimizations

### Translate scheduler

- [ ] Implement aborting unnecessary tasks. Return abort hook for each task
  - It needs a while to abort page translation, to economy traffic
- [ ] Optionally postpone translating similar tasks and resolve all by translating one of it
