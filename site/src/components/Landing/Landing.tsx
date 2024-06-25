import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import {
	Button,
	HStack,
	Icon,
	Image,
	Link,
	Select,
	Text,
	VStack,
} from '@chakra-ui/react';
import { buildPathGetter } from '@site/src/utils/url';
import { languages } from '@site/supportedLanguages';

import { useAnalyticsContext } from '../Analytics/useAnalyticsContext';
import Logo from './logo.svg';

import styles from './Landing.module.css';

const getLanguageName = (lang: string) => {
	const languageName = new Intl.DisplayNames([lang], {
		type: 'language',
	}).of(lang);

	return languageName.slice(0, 1).toUpperCase() + languageName.slice(1);
};
export const Landing = ({ baseUrl }: { baseUrl: string }) => {
	const { t, i18n } = useTranslation('landing');

	const getUrl = buildPathGetter(baseUrl);

	const { trackEvent } = useAnalyticsContext();

	return (
		<VStack w="100%" spacing={0}>
			<VStack w="100%" className={clsx(styles.TopScreen)}>
				<HStack w="100%" className={clsx(styles.Head, styles.PageContainer)}>
					<Icon
						as={Logo}
						h="24px"
						w="auto"
						boxSizing="content-box"
						py="1rem"
						marginRight="auto"
					/>

					<HStack
						marginLeft="1rem"
						overflowX="auto"
						py="1rem"
						spacing={6}
						whiteSpace="nowrap"
						sx={{
							'& > a': {
								fontWeight: '500',
							},
						}}
					>
						<Select
							minWidth="max-content"
							value={i18n.language}
							onChange={({ target }) => {
								i18n.changeLanguage(target.value);
							}}
							variant="unstyled"
						>
							{languages.map((lang) => (
								<option key={lang} value={lang}>
									{getLanguageName(lang)}
								</option>
							))}
						</Select>
						<Link variant="base" href="#features">
							{t('navigation.features.content')}
						</Link>
						<Link variant="base" href="/blog">
							{t('navigation.blog.content')}
						</Link>
						<Link variant="base" href="/docs">
							{t('navigation.docs.content')}
						</Link>
						<Link
							variant="base"
							href="https://github.com/translate-tools/linguist"
						>
							{t('navigation.github.content')}
						</Link>
					</HStack>
				</HStack>
				<HStack
					spacing={10}
					py={20}
					w="100%"
					className={clsx(styles.HeroContainer, styles.PageContainer)}
				>
					<HStack
						spacing={10}
						w="100%"
						justifyContent="space-between"
						className={clsx(styles.TopScreenContent)}
					>
						<VStack alignItems="start">
							<Text as="h1" fontSize="38px">
								{t(['sections.hero.title'])}
							</Text>
							<Text fontSize="24px" maxW={750}>
								{t(['sections.hero.description'])}
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
									{t('install.chrome')}
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
									{t('install.firefox')}
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
							{t('features.title')}
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
										{t('features.items.offlineTranslation.title')}
									</Text>
									<Text variant="description">
										{t('features.items.offlineTranslation.content')}
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
										{t('features.items.fullPageTranslation.title')}
									</Text>
									<Text variant="description">
										{t('features.items.fullPageTranslation.content')}
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
										{t(
											'features.items.selectedTextTranslation.title',
										)}
									</Text>
									<Text variant="description">
										{t(
											'features.items.selectedTextTranslation.content',
										)}
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
										{t('features.items.textTranslation.title')}
									</Text>
									<Text variant="description">
										{t('features.items.textTranslation.content')}
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
										{t('features.items.knowledgeBase.title')}
									</Text>
									<Text variant="description">
										{t('features.items.knowledgeBase.content')}
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
										{t('features.items.customTranslators.title')}
									</Text>
									<Text variant="description">
										<Trans
											t={t}
											i18nKey="features.items.customTranslators.content"
											components={[
												<Link href="https://github.com/translate-tools/linguist/blob/master/docs/CustomTranslator.md" />,
											]}
										/>
									</Text>
								</VStack>
							</HStack>
						</VStack>
					</VStack>

					<VStack w="100%" alignItems="start" spacing="2rem">
						<Text as="h2" fontSize={32}>
							{t('sections.opensource.title')}
						</Text>

						<Text variant="description">
							<Trans
								t={t}
								i18nKey="sections.opensource.content"
								components={[
									<Link href="https://github.com/translate-tools/linguist" />,
									<Link href="https://github.com/translate-tools/linguist#donations" />,
								]}
							/>
						</Text>
					</VStack>

					<VStack w="100%" alignItems="start" spacing="2rem">
						<Text as="h2" fontSize={32}>
							{t('sections.support.title')}
						</Text>

						<Text variant="description">
							<Trans
								t={t}
								i18nKey="sections.support.content"
								components={[
									<Link href="mailto:support@linguister.io">
										support@linguister.io
									</Link>,
									<Link href="https://github.com/translate-tools/linguist/issues/new/choose" />,
								]}
							/>
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
					<Trans
						t={t}
						i18nKey="sections.createdBy.content"
						components={[
							<Link href="https://fluidminds.org">FluidMinds team</Link>,
						]}
					/>
				</Text>
			</HStack>
		</VStack>
	);
};
