Scripts to maintain a locales files.

# Prerequisites
- Install [nvm](https://github.com/nvm-sh/nvm)
- Install LTS node version with `nvm install --lts` (version will automatically changed)
- Use LTS node release, to run npm scripts with `nvm use --lts`
	- Otherwise you can run scripts manually `nvm run --lts ./syncLocalizationsFilesWithSource.js`

## Optional: ChatGPT token

To use locales texts auto generation, you have to get ChatGPT token.

You may use access token or your API key.

### API key

With API key limits are higher that with use access token, limits depends on your account type.

To use API key, you should generate token on page https://platform.openai.com/account/api-keys and then set this secret key to env variable `OPENAI_API_KEY`: `export OPENAI_API_KEY='your secret key here'`.

### Access token

You can manually get an accessToken by logging in to the ChatGPT webapp and then opening https://chat.openai.com/api/auth/session, which will return a JSON object containing your accessToken string.

Access tokens last for days.

Note: using a reverse proxy will expose your access token to a third-party. There shouldn't be any adverse effects possible from this, but please consider the risks before using this method.

When you get access token, set environment variable `OPENAI_ACCESS_TOKEN`: `export OPENAI_ACCESS_TOKEN='your secret key here'`

# Commands

Run commands with `npm run`
- `locales:sync` sync all locales files with source locale (english)
	- It remove messages that does not exists in source locale
	- It create messages that does not exists in target locale. Texts will automatically translated, but it need to be reviewed
	- Locales will sorted
- `locales:sort` sort all locales files
- `locales:fixTypos` fix typos in a changed messages (related to a master branch)
