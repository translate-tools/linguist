const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const sharp = require('sharp');
const { merge } = require('lodash');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

console.log('Webpack run');

const package = require('./package.json');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isProduction = mode === 'production';

const target = process.env.EXT_TARGET;
const devtool = isProduction ? undefined : 'inline-source-map';
const isFastBuild = !isProduction && process.env.FAST_BUILD === 'on';
const isBundleAnalyzingEnabled = Boolean(process.env.DEBUG) || !isProduction;

const targetsList = ['firefox', 'chromium', 'chrome'];
if (targetsList.indexOf(target) === -1) {
	throw new Error(`Invalid target "${target}" in EXT_TARGET`);
}

const devPrefix = isProduction ? '' : 'dev/';
const outDir = `build/${devPrefix}${target}`;
const outputPath = path.join(__dirname, outDir);

console.log('WebpackConfig', {
	mode,
	target,
	outputPath,
});

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
		background: './src/background.ts',
		contentscript: './src/contentscript.tsx',
		['pages/popup/popup']: './src/pages/popup/popup.tsx',
		['pages/options/options']: './src/pages/options/options.tsx',
		['pages/dictionary/dictionary']: './src/pages/dictionary/dictionary.tsx',
		['pages/history/history']: './src/pages/history/history.tsx',
	},
	output: {
		path: outputPath,
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					name: 'common',
					chunks: 'all',
					minChunks: 2,
					enforce: true,
					// TODO: replace me to predicate which prevent split css files from pages to common chunk
					// it must prevent split CHUNKS, but not modules, cuz if one module from chunk split - all other will join
					test: /[\\/](node_modules|core|themes|lib|modules|requests|polyfills|components|layers)[\\/]/,
				},
			},
		},
	},
	plugins: [
		new MiniCssExtractPlugin({}),
		...(isBundleAnalyzingEnabled ? [new BundleAnalyzerPlugin()] : []),
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
							manifest = merge(manifest, targetManifest);
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
					'pages/popup/popup.html',
					'pages/options/options.html',
					'pages/dictionary/dictionary.html',
					'pages/history/history.html',
				].map((file) => ({
					from: './src/' + file,
					to: path.join(outputPath, file),
				})),

				// Resources & locales
				{
					from: './src/_locales',
					to: path.join(outputPath, '_locales'),
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
						return sharp(content).resize(512, 512).toBuffer();
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
