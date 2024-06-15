const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const sharp = require('sharp');
const { mergeWith } = require('lodash');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

console.log('Webpack started');

const package = require('./package.json');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isProduction = mode === 'production';

const target = process.env.EXT_TARGET;
const devtool = isProduction ? undefined : 'inline-source-map';
const isFastBuild = !isProduction && process.env.FAST_BUILD === 'on';
const isBundleAnalyzingEnabled = !isProduction || Boolean(process.env.DEBUG);

const targetsList = ['firefox', 'firefox-standalone', 'chromium', 'chrome'];
if (targetsList.indexOf(target) === -1) {
	throw new Error(`Invalid target "${target}" in EXT_TARGET`);
}

const devPrefix = isProduction ? '' : 'dev/';
const outDir = `build/${devPrefix}${target}`;
const outputPath = path.join(__dirname, outDir);

// https://lodash.com/docs/4.17.15#mergeWith
function mergeCustomizer(objValue, srcValue) {
	if (Array.isArray(objValue) && Array.isArray(srcValue)) {
		return objValue.concat(srcValue);
	}
}

console.log('WebpackConfig', {
	mode,
	target,
	outputPath,
});

const offscreenDocuments = ['main', 'worker', 'translator'];
const pages = ['popup', 'options', 'dictionary', 'history'];

module.exports = {
	mode,
	devtool,
	target: 'web',
	stats: {
		colors: true,
		reasons: true,
		hash: true,
		version: true,
		timings: true,
		chunks: true,
		chunkModules: true,
		cached: true,
		cachedAssets: true,
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
	},
	entry: {
		'background-script': './src/background-script.ts',
		contentscript: './src/contentscript.tsx',
		...Object.fromEntries(
			offscreenDocuments.map((name) => [
				`offscreen-documents/${name}/${name}`,
				`./src/offscreen-documents/${name}/${name}.ts`,
			]),
		),
		...Object.fromEntries(
			pages.map((name) => [
				`pages/${name}/${name}`,
				`./src/pages/${name}/${name}.tsx`,
			]),
		),
	},
	output: {
		path: outputPath,
	},
	plugins: [
		new MiniCssExtractPlugin({}),
		...(isBundleAnalyzingEnabled
			? [
				new BundleAnalyzerPlugin({
					analyzerPort: 8888 + 10 + targetsList.indexOf(target),
				}),
			  ]
			: []),
		new CopyPlugin({
			patterns: [
				// Manifest
				{
					from: `./manifests/manifest.json`,
					to: path.join(outputPath, 'manifest.json'),
					transform(content, absoluteFrom) {
						const rawManifest = content.toString();
						let manifest = JSON.parse(rawManifest);

						// Patch manifest with data from target manifest
						const targetManifestPath = path.join(
							__dirname,
							'manifests',
							target + '.json',
						);
						if (
							target &&
							fs.existsSync(targetManifestPath) &&
							fs.lstatSync(targetManifestPath).isFile()
						) {
							const rawTargetManifest = fs
								.readFileSync(targetManifestPath)
								.toString();
							const targetManifest = JSON.parse(rawTargetManifest);
							manifest = mergeWith(
								manifest,
								targetManifest,
								mergeCustomizer,
							);
						}

						// Patch manifest with production overrides
						const productionOverridesMap = {
							'firefox-standalone': {
								// eslint-disable-next-line camelcase
								browser_specific_settings: {
									gecko: {
										id: '{e3fc2d33-09fc-4fe8-9331-d0a464698035}',
									},
								},
							},
						};
						if (isProduction && target in productionOverridesMap) {
							const productionOverrides = productionOverridesMap[target];
							manifest = mergeWith(
								manifest,
								productionOverrides,
								mergeCustomizer,
							);
						}

						// Set version
						manifest.version = package.version;

						// Stringify with prettifying and convert to buffer
						const modifiedManifest = JSON.stringify(manifest, null, '\t');
						return Buffer.from(modifiedManifest);
					},
				},

				// HTML pages
				...[
					...offscreenDocuments.map(
						(name) => `offscreen-documents/${name}/${name}.html`,
					),
					...pages.map((name) => `pages/${name}/${name}.html`),
				].map((file) => ({
					from: './src/' + file,
					to: path.join(outputPath, file),
				})),

				// Resources & locales
				{
					from: './src/_locales',
					to: path.join(outputPath, '_locales'),
				},

				// Offline translator
				{
					from: 'thirdparty/bergamot/build/*.{js,wasm}',
					to: path.join(outputPath, 'thirdparty/bergamot/[name].[ext]'),
				},

				// Serve static files
				...[
					'logo-icon.svg',
					'logo-icon-simple-dark.svg',
					'logo-icon-simple-light.svg',
				].map((filename) => ({
					from: './src/res/' + filename,
					to: path.join(outputPath, 'static', filename),
				})),

				//  Convert svg to png files for use as addon logotypes (chromium is not support svg logotypes)
				...[
					'logo-icon.svg',
					'logo-icon-simple-dark.svg',
					'logo-icon-simple-light.svg',
				].map((file) => ({
					from: './src/res/' + file,
					to: path.join(
						outputPath,
						'static',
						'logo',
						file.replace(/\.svg$/, '.png'),
					),
					transform(content) {
						return sharp(content).resize(128, 128).toBuffer();
					},
				})),
			],
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: {
					loader: 'ts-loader',
					options: {
						allowTsInNodeModules: true,
						transpileOnly: isFastBuild,
					},
				},
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react'],
					},
				},
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									[
										'postcss-rem-to-pixel',
										{
											rootValue: 16,
											unitPrecision: 5,
											propList: ['*'],
											selectorBlackList: [],
											replace: true,
											mediaQuery: false,
											minUnitValue: 0,
										},
									],
								],
							},
						},
					},
				],
			},
			{
				test: /\.ttf$/,
				loader: 'file-loader',
				options: {
					publicPath: '/',
				},
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack'],
			},
		],
	},
};
