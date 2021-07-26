const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const devtool = mode === 'production' ? undefined : 'inline-source-map';
const target = process.env.EXT_TARGET;
const isFastBuild =
	process.env.NODE_ENV !== 'production' && process.env.FAST_BUILD === 'on';

const targetsList = ['firefox', 'chromium'];
if (targetsList.indexOf(target) === -1) {
	throw new Error(`Invalid target "${target}" in EXT_TARGET`);
}

const devPrefix = mode !== 'production' ? 'dev/' : '';
const outDir = `build/${devPrefix}${target}`;
const outputPath = path.join(__dirname, outDir);

module.exports = {
	mode,
	devtool,
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
	},
	entry: {
		background: './src/background.ts',
		contentscript: './src/contentscript.tsx',
		['pages/popup/popup']: './src/pages/popup/popup.tsx',
		['pages/options/options']: './src/pages/options/options.tsx',
		['pages/dictionary/dictionary']: './src/pages/dictionary/dictionary.tsx',
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
		new CopyPlugin({
			patterns: [
				// Manifest
				{
					from: `./manifest.${target}.json`,
					to: path.join(outputPath, 'manifest.json'),
				},

				// HTML pages
				...[
					'pages/popup/popup.html',
					'pages/options/options.html',
					'pages/dictionary/dictionary.html',
				].map((file) => ({
					from: './src/' + file,
					to: path.join(outputPath, file),
				})),

				// Resources & locales
				{
					from: './src/_locales',
					to: path.join(outputPath, '_locales'),
				},
				{
					from: './src/res',
					to: path.join(outputPath, 'res'),
				},
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
				test: /\.svg$/,
				use: ['@svgr/webpack'],
			},
			// {
			// 	test: /\.(woff(2)?|ttf|eot)$/,
			// 	use: [
			// 		{
			// 			loader: 'file-loader',
			// 			options: {
			// 				name: '[name].[contenthash].[ext]',
			// 				outputPath: 'fonts/',
			// 			},
			// 		},
			// 	],
			// },
		],
	},
};
