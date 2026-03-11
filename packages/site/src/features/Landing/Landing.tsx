import React, { Fragment, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import {
	Accordion,
	AccordionButton,
	AccordionIcon,
	AccordionItem,
	AccordionPanel,
	Box,
	Button,
	Divider,
	HStack,
	Icon,
	Image,
	Link,
	Text,
	VStack,
} from '@chakra-ui/react';

import { useAnalyticsContext } from '../../components/Analytics/useAnalyticsContext';
import { useAltPageVersions } from '../../components/useAltPageVersions';
import { useElementAttentionTracker } from '../../components/useElementAttentionTracker';

import chromeIcon from './icons/chrome.png';
import firefoxIcon from './icons/firefox.png';
import Logo from './logo.svg';
import screenshotCustomTranslators from './screenshots/custom-translators.png';
import screenshotDictionary from './screenshots/dictionary.png';
import screenshotPageTranslation from './screenshots/page-translation.png';
import screenshotSelectedTextTranslation from './screenshots/selected-text-translation.png';
import screenshotSettings from './screenshots/settings.png';
import screenshotTextTranslation from './screenshots/text-translation.png';
import screenshotAppPreview from './screenshots/text-translation-popup.png';

import styles from './Landing.module.css';

export const Landing = () => {
	const { t } = useTranslation('landing');

	const { trackEvent } = useAnalyticsContext();
	const altVersions = useAltPageVersions();

	const faqWhyRef = useRef<HTMLDivElement>(null);
	useElementAttentionTracker({
		ref: faqWhyRef,
		minTime: 8000,
		onEngagement() {
			trackEvent('Engagement: Reading', { target: 'FAQ: Why Linguist' });
		},
	});

	const faqBabelTowerRef = useRef<HTMLDivElement>(null);
	useElementAttentionTracker({
		ref: faqBabelTowerRef,
		minTime: 5000,
		onEngagement() {
			trackEvent('Engagement: Reading', { target: 'FAQ: The Babel Tower story' });
		},
	});

	const faqImagesRef = useRef<HTMLDivElement>(null);
	useElementAttentionTracker({
		ref: faqImagesRef,
		minTime: 5000,
		onEngagement() {
			trackEvent('Engagement: Reading', {
				target: "FAQ: Why doesn't translate images",
			});
		},
	});

	const faq = [
		{
			ref: faqWhyRef,
			title: t('faq.items.whyLinguist.title'),
			content: <Trans t={t} i18nKey={'faq.items.whyLinguist.content'} />,
		},
		{
			ref: faqBabelTowerRef,
			title: t('faq.items.theLinguistLogo.title'),
			content: (
				<Trans
					t={t}
					i18nKey={'faq.items.theLinguistLogo.content'}
					components={{
						wiki: (
							<Link
								key="3"
								href="https://en.wikipedia.org/wiki/Tower_of_Babel"
								target="_blank"
							/>
						),
					}}
				/>
			),
		},
		{
			ref: faqImagesRef,
			title: t('faq.items.imageTranslation.title'),
			content: <Trans t={t} i18nKey={'faq.items.imageTranslation.content'} />,
		},
		{
			title: t('faq.items.howTranslatePages.title'),
			content: <Trans t={t} i18nKey={'faq.items.howTranslatePages.content'} />,
		},
		{
			title: t('faq.items.offlineTranslation.title'),
			content: <Trans t={t} i18nKey={'faq.items.offlineTranslation.content'} />,
		},
		{
			title: t('faq.items.privacy.title'),
			content: (
				<Trans
					t={t}
					i18nKey={'faq.items.privacy.content'}
					components={{
						'offline-translator': (
							<Link href={'/docs/manuals/OfflineTranslation'} />
						),
					}}
				/>
			),
		},
		{
			title: t('faq.items.supportedBrowsers.title'),
			content: <Trans t={t} i18nKey={'faq.items.supportedBrowsers.content'} />,
		},
		{
			title: t('faq.items.selectedText.title'),
			content: <Trans t={t} i18nKey={'faq.items.selectedText.content'} />,
		},
		{
			title: t('faq.items.customTranslators.title'),
			content: (
				<Trans
					t={t}
					i18nKey={'faq.items.customTranslators.content'}
					components={{
						'custom-translator': <Link href={'/docs/CustomTranslator'} />,
						'libre-translate': (
							<Link href="https://libretranslate.com/" target="_blank" />
						),
						ollama: (
							<Link key="3" href="https://ollama.com/" target="_blank" />
						),
					}}
				/>
			),
		},
		{
			title: t('faq.items.isFree.title'),
			content: (
				<Trans
					t={t}
					i18nKey={'faq.items.isFree.content'}
					components={{
						linguist: (
							<Link
								href="https://github.com/translate-tools/linguist"
								target="_blank"
							/>
						),
						donations: (
							<Link
								href="https://github.com/translate-tools/linguist#donations"
								target="_blank"
							/>
						),
					}}
				/>
			),
		},
		{
			title: t('faq.items.whatIsLinguist.title'),
			content: <Trans t={t} i18nKey={'faq.items.whatIsLinguist.content'} />,
		},
	];

	return (
		<VStack w="100%" spacing={0}>
			<VStack w="100%" className={clsx(styles.TopScreen)}>
				<HStack
					w="100%"
					className={clsx(styles.Head, styles.PageContainer)}
					paddingTop={'1rem'}
				>
					<Icon
						as={Logo}
						h="2rem"
						w="auto"
						boxSizing="content-box"
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
						<VStack alignItems="start" maxWidth={'100%'}>
							<Text
								as="h1"
								fontSize={{ base: '1.8rem', md: '2.6rem' }}
								maxWidth={'100%'}
							>
								{t(['sections.hero.title'])}
							</Text>
							<Text
								as="div"
								fontSize="24px"
								maxW={750}
								whiteSpace={'pre-line'}
							>
								<Trans
									t={t}
									i18nKey={['sections.hero.description']}
								></Trans>
							</Text>

							<HStack w="100%" className={clsx(styles.ButtonsGroup)}>
								<Button
									leftIcon={
										<Image
											src={chromeIcon}
											boxSize="2em"
											alt="Chrome Browser logo"
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
											src={firefoxIcon}
											boxSize="2em"
											alt="Firefox Browser logo"
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
							src={screenshotAppPreview}
							maxW={600}
							minW={400}
							alt="The Linguist in-Browser Popup screenshot"
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

						<VStack
							w="100%"
							alignItems="start"
							spacing="8rem"
							className={styles.FeaturesList}
						>
							<HStack
								alignItems="start"
								spacing={'3rem'}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={screenshotSettings}
										alt="Linguist settings screen. User choose a Bergamot - offline translator"
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h3" fontSize={26}>
										{t('features.items.offlineTranslation.title')}
									</Text>
									<Text as="div" variant="description">
										{t('features.items.offlineTranslation.content')}
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={'3rem'}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={screenshotPageTranslation}
										alt="The wikipedia page European honey buzzard translated via Linguist"
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h3" fontSize={26}>
										{t('features.items.fullPageTranslation.title')}
									</Text>
									<Text as="div" variant="description">
										{t('features.items.fullPageTranslation.content')}
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={'3rem'}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={screenshotSelectedTextTranslation}
										alt="The Linguist translation popup for selected text on Wikipedia page about European honey buzzard"
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h3" fontSize={26}>
										{t(
											'features.items.selectedTextTranslation.title',
										)}
									</Text>
									<Text as="div" variant="description">
										{t(
											'features.items.selectedTextTranslation.content',
										)}
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={'3rem'}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={screenshotTextTranslation}
										alt="Linguist popup where user input text and translate it from English to German language"
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h3" fontSize={26}>
										{t('features.items.textTranslation.title')}
									</Text>
									<Text as="div" variant="description">
										{t('features.items.textTranslation.content')}
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={'3rem'}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={screenshotDictionary}
										alt="Linguist dictionary page"
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h3" fontSize={26}>
										{t('features.items.knowledgeBase.title')}
									</Text>
									<Text as="div" variant="description">
										{t('features.items.knowledgeBase.content')}
									</Text>
								</VStack>
							</HStack>

							<HStack
								alignItems="start"
								spacing={'3rem'}
								className={styles.Feature}
							>
								<div className={clsx(styles.FeatureImage)}>
									<Image
										src={screenshotCustomTranslators}
										alt="Linguist settings screen with opened modal window to select custom translator"
									/>
								</div>
								<VStack
									className={clsx(styles.FeatureDescription)}
									alignItems="start"
									spacing={6}
								>
									<Text as="h3" fontSize={26}>
										{t('features.items.customTranslators.title')}
									</Text>
									<Text as="div" variant="description">
										<Trans
											t={t}
											i18nKey="features.items.customTranslators.content"
											components={[
												<Link
													key="link"
													href="https://github.com/translate-tools/linguist/blob/master/docs/CustomTranslator.md"
												/>,
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

						<Text as="div" variant="description" whiteSpace={'pre-line'}>
							<Trans
								t={t}
								i18nKey="sections.opensource.content"
								components={[
									<Link
										key="github"
										href="https://github.com/translate-tools/linguist"
									/>,
									<Link
										key="donations"
										href="https://github.com/translate-tools/linguist#donations"
									/>,
								]}
							/>
						</Text>
					</VStack>

					<VStack w="100%" alignItems="start" spacing="2rem">
						<Text as="h2" fontSize={32}>
							{t('sections.support.title')}
						</Text>

						<Text as="div" variant="description" whiteSpace={'pre-line'}>
							<Trans
								t={t}
								i18nKey="sections.support.content"
								components={[
									<Link key="email" href="mailto:support@linguister.io">
										support@linguister.io
									</Link>,
									<Link
										key="issue"
										href="https://github.com/translate-tools/linguist/issues/new/choose"
									/>,
								]}
							/>
						</Text>
					</VStack>
				</VStack>
			</VStack>

			<VStack
				className={clsx(styles.PageContainer)}
				marginBlock={'5rem'}
				width={'100%'}
				align={'start'}
				spacing={'2rem'}
			>
				<Text as="h2" fontSize={'1.8rem'} paddingInline={'1rem'}>
					{t('faq.title')}
				</Text>

				<Accordion
					defaultIndex={[0, 1]}
					allowMultiple
					fontSize={'1.2rem'}
					width={'100%'}
				>
					{faq.map((question) => (
						<AccordionItem key={question.title}>
							<Text as="h2" margin={0}>
								<AccordionButton
									paddingBlock={'1.5rem'}
									onClick={() => {
										trackEvent('FAQ click', {
											title: question.title,
										});
									}}
								>
									<Box
										as="span"
										flex="1"
										textAlign="left"
										fontSize={'1.2rem'}
										fontWeight={'bold'}
									>
										{question.title}
									</Box>
									<AccordionIcon />
								</AccordionButton>
							</Text>
							<AccordionPanel
								ref={question.ref}
								paddingTop={'1rem'}
								paddingBottom={'5rem'}
								whiteSpace={'pre-line'}
							>
								{question.content}
							</AccordionPanel>
						</AccordionItem>
					))}
				</Accordion>
			</VStack>

			<Divider />

			<HStack
				width={'100%'}
				className={clsx(styles.PageContainer)}
				padding="3rem 1rem"
				gap={'2rem'}
				flexDirection={{ base: 'column-reverse', md: 'row' }}
			>
				<Link href="https://primebits.org">
					<Image
						src="https://primebits.org/badges/built-by.svg"
						maxWidth="100px"
						alt="Created by PrimeBits"
					/>
				</Link>

				<HStack
					align={'center'}
					justifyContent={'center'}
					marginInlineStart={'auto'}
					flexWrap={'wrap'}
				>
					{altVersions.map((version, index) => (
						<Fragment key={version.langCode}>
							{index > 0 && ' | '}
							<Link
								href={version.url}
								hrefLang={version.langCode}
								onClick={() => {
									trackEvent('Alt page version click', {
										language: version.langCode,
									});
								}}
							>
								{version.langName}
							</Link>
						</Fragment>
					))}
				</HStack>
			</HStack>
		</VStack>
	);
};
