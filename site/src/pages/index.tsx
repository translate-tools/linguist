// import { Button } from 'react-elegant-ui/components/Button/Button.bundle/desktop';
// import { theme } from 'react-elegant-ui/theme/presets/default/index';
import React from 'react';
import { clsx } from 'clsx';
import {
	Button,
	ChakraBaseProvider,
	HStack,
	Icon,
	Image,
	Link,
	Text,
	VStack,
} from '@chakra-ui/react';
// @ts-ignore
import chrome from '@site/static/icons/chrome.png';
// @ts-ignore
import firefox from '@site/static/icons/firefox.png';

import Logo from '../components/logo.svg';
import theme from '../components/theme';

// import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

// const theme = extendBaseTheme({
// 	components: {
// 		Button: chakraTheme.components.Button,
// 	},
// });

export default function Home(): JSX.Element {
	// const { siteConfig } = useDocusaurusContext();
	return (
		<main>
			<ChakraBaseProvider theme={theme}>
				<div className={clsx(styles.Head)}></div>
				<div className={clsx(styles.Page)}>
					<VStack paddingBottom={10}>
						<HStack w="100%" px={10}>
							<Icon
								as={Logo}
								h="24px"
								w="auto"
								boxSizing="content-box"
								padding="1rem"
							/>
							<HStack
								marginLeft="auto"
								p="1rem"
								spacing={6}
								sx={{
									'& > a': {
										fontWeight: '500',
									},
								}}
							>
								<Link href="#">Features</Link>
								{/* <Link href="#">Docs</Link> */}
								{/* <Link href="#">Blog</Link> */}
								<Link href="https://github.com/translate-tools/linguist">
									GitHub
								</Link>
							</HStack>
						</HStack>
						<HStack spacing={10} px={10} py={20}>
							<HStack spacing={10}>
								<VStack>
									{/* <Text as="h1" fontSize="xxl">Linguist is a privacy focused translation</Text> */}
									<Text as="h1" fontSize="xxl">
										Linguist is a privacy focused, full‑featured
										translation solution
									</Text>
									<Text fontSize="xl" maxW={750}>
										Translate web pages, highlighted text, Netflix
										subtitles and private messages. Speak the
										translated text, and save important translations
										to your personal dictionary to learn words even
										offline.
									</Text>

									<HStack w="100%">
										<Button
											leftIcon={
												<Image src={chrome} boxSize="2em" />
											}
											variant="action"
											size="lg"
											as={Link}
											target="_blank"
											href="https://chrome.google.com/webstore/detail/gbefmodhlophhakmoecijeppjblibmie"
											px={4}
										>
											Install for Chrome
										</Button>
										<Button
											leftIcon={
												<Image src={firefox} boxSize="2em" />
											}
											variant="action"
											size="lg"
											as={Link}
											target="_blank"
											href="https://addons.mozilla.org/addon/linguist-translator/"
											px={4}
										>
											Install for Firefox
										</Button>
									</HStack>
								</VStack>

								<Image
									src="/screenshots/text-translation-popup.png"
									maxW={600}
								/>
							</HStack>
						</HStack>
						<VStack w="100%" alignItems="start" spacing="10rem">
							<VStack w="100%" alignItems="start">
								<Text as="h2" fontSize={32}>
									Features
								</Text>

								<VStack w="100%" alignItems="start" spacing={20}>
									<HStack
										alignItems="start"
										spacing={8}
										className={styles.Feature}
									>
										<div className={clsx(styles.FeatureImage)}>
											<img src="/screenshots/settings.png" />
										</div>
										<VStack
											className={clsx(styles.FeatureDescription)}
											alignItems="start"
											spacing={6}
										>
											<Text as="h2" fontSize={26}>
												Offline translation and privacy
											</Text>
											<Text>
												Linguist can translate texts even without
												the internet - a feature that no other
												extension has. The offline translator
												allows you to translate texts on your
												device without sending any private
												messages over the internet, ensuring your
												privacy. Simply enable the feature on the
												options page to maintain your privacy
												while translating work emails and personal
												messages.
											</Text>
										</VStack>
									</HStack>

									<HStack
										alignItems="start"
										spacing={8}
										className={styles.Feature}
									>
										<div className={clsx(styles.FeatureImage)}>
											<img src="/screenshots/page-translation.png" />
										</div>
										<VStack
											className={clsx(styles.FeatureDescription)}
											alignItems="start"
											spacing={6}
										>
											<Text as="h2" fontSize={26}>
												Full page translation
											</Text>
											<Text>
												Fast and high quality whole page
												translation in one click, even for a
												private pages that need login. Flexible
												configuration for auto translation based
												on domain name and languages. Translation
												is available by hotkey. You may see an
												original text by hover on it.
											</Text>
										</VStack>
									</HStack>

									<HStack
										alignItems="start"
										spacing={8}
										className={styles.Feature}
									>
										<div className={clsx(styles.FeatureImage)}>
											<img src="/screenshots/selected-text-translation.png" />
										</div>
										<VStack
											className={clsx(styles.FeatureDescription)}
											alignItems="start"
											spacing={6}
										>
											<Text as="h2" fontSize={26}>
												Translation for selected text
											</Text>
											<Text>
												Encountering unfamiliar words while
												reading an online article? Just select
												text on the page and click the button to
												translate it. You can speak the translated
												and original text, and save the
												translation to your dictionary.
											</Text>
										</VStack>
									</HStack>

									<HStack
										alignItems="start"
										spacing={8}
										className={styles.Feature}
									>
										<div className={clsx(styles.FeatureImage)}>
											<img src="/screenshots/text-translation.png" />
										</div>
										<VStack
											className={clsx(styles.FeatureDescription)}
											alignItems="start"
											spacing={6}
										>
											<Text as="h2" fontSize={26}>
												Text translation always at hand
											</Text>
											<Text>
												If you need to translate any text - just
												click the Linguist button to open the
												pop-up window. No more tabs with
												translation services, just use Linguist.
											</Text>
										</VStack>
									</HStack>

									<HStack
										alignItems="start"
										spacing={8}
										className={styles.Feature}
									>
										<div className={clsx(styles.FeatureImage)}>
											<img src="/screenshots/dictionary.png" />
										</div>
										<VStack
											className={clsx(styles.FeatureDescription)}
											alignItems="start"
											spacing={6}
										>
											<Text as="h2" fontSize={26}>
												Make your own personal knowledge base
											</Text>
											<Text>
												Any translated text is saved in the
												history, and you can add your favorite
												translations to your dictionary. You can
												search for translations in both your
												dictionary and history, and even filter
												your translations by language. The
												dictionary feature is available even when
												you are offline, making it an ideal tool
												for language learners or travelers who
												require constant access to their word
												lists.
											</Text>
										</VStack>
									</HStack>

									<HStack
										alignItems="start"
										spacing={8}
										className={styles.Feature}
									>
										<div className={clsx(styles.FeatureImage)}>
											<img src="/screenshots/custom-translators.png" />
										</div>
										<VStack
											className={clsx(styles.FeatureDescription)}
											alignItems="start"
											spacing={6}
										>
											<Text as="h2" fontSize={26}>
												Custom translators
											</Text>
											<Text>
												Unlike other browser extensions, Linguist
												is not just a wrapper over the Google
												Translator Widget; it's a complete and
												independent translation system. If you are
												not satisfied with embedded translators,
												you may use Linguist with your favorite
												translation service, just by add a custom
												translator. Read more about in{' '}
												<Link href="https://github.com/translate-tools/linguist/blob/master/docs/CustomTranslator.md">
													docs
												</Link>
												.
											</Text>
										</VStack>
									</HStack>
								</VStack>
							</VStack>

							<VStack w="100%" alignItems="start">
								<Text as="h2" fontSize={32}>
									Open source
								</Text>

								<Text>
									Linguist is completely free,{' '}
									<Link href="https://github.com/translate-tools/linguist">
										open-source
									</Link>
									, and it does not collect any user data to sell. You
									may{' '}
									<Link href="https://github.com/translate-tools/linguist#donations">
										support the project
									</Link>{' '}
									with your donations to help Linguist maintain its
									independence and high quality. Share Linguist with
									your friends, to make it popular together!
								</Text>
							</VStack>
						</VStack>
					</VStack>

					<div className={clsx(styles.Gallery)}>
						<img src="/screenshots/Dictionary.png" />
					</div>
					<div className={clsx(styles.Description)}></div>
					<div className={clsx(styles.Features)} style={{ display: 'none' }}>
						<div className={clsx(styles.Feature)}>
							<div className={clsx(styles.FeatureImage)}>
								<img src="/screenshots/page-translation.png" />
							</div>
							<div className={clsx(styles.FeatureDescription)}>
								<h2>Offline translation</h2>
								Feature description here
							</div>
						</div>
						<div className={clsx(styles.Feature)}>
							<div className={clsx(styles.FeatureImage)}>
								<img src="/screenshots/Dictionary.png" />
							</div>
							<div className={clsx(styles.FeatureDescription)}>
								<h2>Offline translation</h2>
								Feature description here
							</div>
						</div>
						<div className={clsx(styles.Feature)}>
							<div className={clsx(styles.FeatureImage)}>
								<img src="/screenshots/Dictionary.png" />
							</div>
							<div className={clsx(styles.FeatureDescription)}>
								<h2>Offline translation</h2>
								Feature description here
							</div>
						</div>
					</div>
				</div>
				<div className={clsx(styles.Footer)}></div>
			</ChakraBaseProvider>
		</main>
	);
}
