# How to debug on android?

- Install and configure ADB
- Run `adb devices` and copy your device identifier
- Make the file `.ADB_DEVICE` in the root of the repository and write the device identifier to there
- Run `npm run run:mobile-firefox`

# Related links

- [Debug firefox addons on android](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/)

ADB:

- https://stackoverflow.com/questions/28704636/insufficient-permissions-for-device-in-android-studio-workspace-running-in-opens
- https://askubuntu.com/questions/1169509/user-in-plugdev-group-are-your-udev-rules-wrong-or-error-insufficient-permissi
