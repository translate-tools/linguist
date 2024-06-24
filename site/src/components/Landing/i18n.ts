import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
	en: {
		translation: {
			navigation: {
				features: {
					content: 'Features',
				},
				github: {
					content: 'GitHub',
				},
			},
			install: {
				chrome: 'Install for Chrome',
				firefox: 'Install for Firefox',
			},
			sections: {
				hero: {
					title: 'Linguist is a privacy‑focused, full‑featured translation solution.',
					description:
						'Translate web pages, highlighted text, Netflix subtitles, and private messages. Speak the translated text and save important translations to your personal dictionary to learn words even offline.',
					// "title": "",
				},
				opensource: {
					title: 'Open source',
					content: `Linguist is completely free, <0>open-source</0>, and it does not collect any user data to sell. You may <1>support the project</1> with your donations to help Linguist maintain its independence and high quality. Share Linguist with your friends, to make it popular together!`,
				},
				support: {
					title: 'Support',
					content: `For support contact <0/>. If you have bug - <1>create issue</1> on GitHub.`,
				},
				createdBy: {
					content: `Created by <0/>.`,
				},
			},
			features: {
				title: 'Features',
				items: {
					offlineTranslation: {
						title: 'Offline translation and privacy',
						content: `Linguist can translate texts even without the
						internet - a feature that no other extension has.
						The offline translator allows you to translate
						texts on your device without sending any private
						messages over the internet, ensuring your privacy.
						Simply enable the feature on the options page to
						maintain your privacy while translating work
						emails and personal messages.`,
					},
					fullPageTranslation: {
						title: 'Full page translation',
						content: `Fast and high quality whole page translation in
						one click, even for a private pages that need
						login. Flexible configuration for auto translation
						based on domain name and languages. Translation is
						available by hotkey. You may see an original text
						by hover on it.`,
					},
					selectedTextTranslation: {
						title: 'Translation for selected text',
						content: `Encountering unfamiliar words while reading an
						online article? Just select text on the page and
						click the button to translate it. You can speak
						the translated and original text, and save the
						translation to your dictionary.`,
					},
					textTranslation: {
						title: 'Text translation always at hand',
						content: `If you need to translate any text - just click the
						Linguist button to open the pop-up window. No more
						tabs with translation services, just use Linguist.`,
					},
					knowledgeBase: {
						title: 'Make your own personal knowledge base',
						content: `Any translated text is saved in the history, and
						you can add your favorite translations to your
						dictionary. You can search for translations in
						both your dictionary and history, and even filter
						your translations by language. The dictionary
						feature is available even when you are offline,
						making it an ideal tool for language learners or
						travelers who require constant access to their
						word lists.`,
					},
					customTranslators: {
						title: 'Custom translators',
						content: `Unlike other browser extensions, Linguist is not
						just a wrapper over the Google Translator Widget;
						it's a complete and independent translation
						system. If you are not satisfied with embedded
						translators, you may use Linguist with your
						favorite translation service, just by add a custom
						translator. Read more about in <0>docs</0>.`,
					},
				},
			},
		},
	},
};

i18n.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources,
		lng: 'en', // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
		// you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
		// if you're using a language detector, do not define the lng option

		interpolation: {
			escapeValue: false, // react already safes from xss
		},
	});

export default i18n;
