This section provides instructions for debugging Linguist on Android:

- Install and configure [ADB](https://developer.android.com/tools/adb)
- Run the command `adb devices` and copy your device identifier
- Create a file named `.ADB_DEVICE` in the repository root and add your device identifier to it
- Run the command `npm run run:mobile-firefox` to start the Firefox for Android instance with the Linguist add-on installed

Additionally, you may find the following resources helpful for debugging Firefox add-ons on Android:

- [Debug Firefox add-ons on Android](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/)
- StackOverflow answer on [insufficient permissions for device in Android Studio workspace running in OpenSUSE](https://stackoverflow.com/questions/28704636/insufficient-permissions-for-device-in-android-studio-workspace-running-in-opens)
- AskUbuntu answer on [user in plugdev group are your udev rules wrong or error insufficient permissions for device](https://askubuntu.com/questions/1169509/user-in-plugdev-group-are-your-udev-rules-wrong-or-error-insufficient-permissi)