Package with scripts to maintain locales.

To sync localizations with source language (English) run `npm run sync`.

This command will find all changes in source locale on current branch, and will copy this changes to all other localization files with translation.

To make code work, create `.env` file. You may copy content of `.env.example` and fill values.