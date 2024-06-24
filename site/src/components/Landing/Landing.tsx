import React from 'react';
import { clsx } from 'clsx';
import { Button, HStack, Icon, Image, Link, Text, VStack } from '@chakra-ui/react';
import { buildPathGetter } from '@site/src/utils/url';

import { useAnalyticsContext } from '../Analytics/useAnalyticsContext';
import Logo from './logo.svg';

import styles from './Landing.module.css';

export const Landing = ({ baseUrl }: { baseUrl: string }) => {
	const getUrl = buildPathGetter(baseUrl);

	const { trackEvent } = useAnalyticsContext();

	return (
		<VStack w="100%" spacing={0}>
			<VStack w="100%" className={clsx(styles.TopScreen)}>
				<HStack w="100%" className={clsx(styles.Head, styles.PageContainer)}>
					<Icon as={Logo} h="24px" w="auto" boxSizing="content-box" py="1rem" />

					<HStack
						marginLeft="auto"
						py="1rem"
						spacing={6}
						sx={{
							'& > a': {
								fontWeight: '500',
							},
						}}
					>
						<Link variant="base" href="#features">
							Features
						</Link>
						<Link
							variant="base"
							href="https://github.com/translate-tools/linguist"
						>
							GitHub
						</Link>
					</HStack>
				</HStack>
				<HStack
					spacing={10}
					py={20}
					className={clsx(styles.HeroContainer, styles.PageContainer)}
				>
					<HStack spacing={10} className={clsx(styles.TopScreenContent)}>
						<VStack alignItems="start">
							<Text as="h1" fontSize="38px">
								Linguist is a privacy focused, full‑featured translation
								solution
							</Text>
							<Text fontSize="24px" maxW={750}>
								Translate web pages, highlighted text, Netflix subtitles
								and private messages. Speak the translated text, and save
								important translations to your personal dictionary to
								learn words even offline.
							</Text>

							<HStack w="100%" className={clsx(styles.ButtonsGroup)}>
								<Button
									leftIcon={
										<Image
											src={getUrl('icons/chrome.png')}
											boxSize="2em"
										/>
									}
									variant="action"
									size="lg"
									as="a"
									target="_blank"
									href="https://chrome.google.com/webstore/detail/gbefmodhlophhakmoecijeppjblibmie"
									px={4}
									onClick={() => {
										trackEvent('Download link: Click', {
											target: 'chrome',
										});
									}}
								>
									Install for Chrome
								</Button>
								<Button
									leftIcon={
										<Image
											src={getUrl('icons/firefox.png')}
											boxSize="2em"
										/>
									}
									variant="action"
									size="lg"
									as="a"
									target="_blank"
									href="https://addons.mozilla.org/addon/linguist-translator/"
									px={4}
									onClick={() => {
										trackEvent('Download link: Click', {
											target: 'firefox',
										});
									}}
								>
									Install for Firefox
								</Button>
							</HStack>
						</VStack>

						<Image
							className={clsx(styles.TopScreenImage)}
							src={getUrl('screenshots/text-translation-popup.png')}
							maxW={600}
							minW={400}
						/>
					</HStack>
				</HStack>
			</VStack>

			<VStack
				w="100%"
				alignItems="center"
				spacing={0}
				py="3rem"
				className={clsx(styles.Features)}
			>
				<VStack
					w="100%"
					alignItems="start"
					spacing="8rem"
					className={clsx(styles.PageContainer)}
				>
					<VStack w="100%" alignItems="start" spacing="2rem">
						<Text id="features" as="h2" fontSize={32}>
							Features
						</Text>

						<VStack w="100%" alignItems="start" spacing="2rem">
							<HStack
								alignItems="start"
								spacing={8}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image src={getUrl('screenshots/settings.png')} />
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h2" fontSize={26}>
										Offline translation and privacy
									</Text>
									<Text variant="description">
										Linguist can translate texts even without the
										internet - a feature that no other extension has.
										The offline translator allows you to translate
										texts on your device without sending any private
										messages over the internet, ensuring your privacy.
										Simply enable the feature on the options page to
										maintain your privacy while translating work
										emails and personal messages.
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={8}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={getUrl('screenshots/page-translation.png')}
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h2" fontSize={26}>
										Full page translation
									</Text>
									<Text variant="description">
										Fast and high quality whole page translation in
										one click, even for a private pages that need
										login. Flexible configuration for auto translation
										based on domain name and languages. Translation is
										available by hotkey. You may see an original text
										by hover on it.
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={8}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={getUrl(
											'screenshots/selected-text-translation.png',
										)}
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h2" fontSize={26}>
										Translation for selected text
									</Text>
									<Text variant="description">
										Encountering unfamiliar words while reading an
										online article? Just select text on the page and
										click the button to translate it. You can speak
										the translated and original text, and save the
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
									<Image
										src={getUrl('screenshots/text-translation.png')}
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h2" fontSize={26}>
										Text translation always at hand
									</Text>
									<Text variant="description">
										If you need to translate any text - just click the
										Linguist button to open the pop-up window. No more
										tabs with translation services, just use Linguist.
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={8}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image src={getUrl('screenshots/dictionary.png')} />
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h2" fontSize={26}>
										Make your own personal knowledge base
									</Text>
									<Text variant="description">
										Any translated text is saved in the history, and
										you can add your favorite translations to your
										dictionary. You can search for translations in
										both your dictionary and history, and even filter
										your translations by language. The dictionary
										feature is available even when you are offline,
										making it an ideal tool for language learners or
										travelers who require constant access to their
										word lists.
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={8}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={getUrl('screenshots/custom-translators.png')}
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h2" fontSize={26}>
										Custom translators
									</Text>
									<Text variant="description">
										Unlike other browser extensions, Linguist is not
										just a wrapper over the Google Translator Widget;
										it's a complete and independent translation
										system. If you are not satisfied with embedded
										translators, you may use Linguist with your
										favorite translation service, just by add a custom
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

					<VStack w="100%" alignItems="start" spacing="2rem">
						<Text as="h2" fontSize={32}>
							Open source
						</Text>

						<Text variant="description">
							Linguist is completely free,{' '}
							<Link href="https://github.com/translate-tools/linguist">
								open-source
							</Link>
							, and it does not collect any user data to sell. You may{' '}
							<Link href="https://github.com/translate-tools/linguist#donations">
								support the project
							</Link>{' '}
							with your donations to help Linguist maintain its independence
							and high quality. Share Linguist with your friends, to make it
							popular together!
						</Text>
					</VStack>

					<VStack w="100%" alignItems="start" spacing="2rem">
						<Text as="h2" fontSize={32}>
							Support
						</Text>

						<Text variant="description">
							For support contact{' '}
							<Link href="mailto:support@linguister.io">
								support@linguister.io
							</Link>
							. If you have bug -{' '}
							<Link href="https://github.com/translate-tools/linguist/issues/new/choose">
								create issue
							</Link>{' '}
							on GitHub.
						</Text>
					</VStack>
				</VStack>
			</VStack>
			<HStack
				py="3rem"
				sx={{
					'& p': {
						margin: 'unset',
					},
				}}
			>
				<Text>
					Created by <Link href="https://fluidminds.org">FluidMinds team</Link>.
				</Text>
			</HStack>
		</VStack>
	);
};
