// theme.ts (tsx file with usage of StyleFunctions, see 4.)
import { extendTheme, StyleFunctionProps, theme as chakraTheme } from '@chakra-ui/react';

const theme = extendTheme({
	styles: {
		global: {
			body: {
				bg: '#fff4fe',
				fontFamily:
					'-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
			},
		},
	},
	components: {
		Button: {
			...chakraTheme.components.Button,
			baseStyle: {
				// fontWeight: 'bold', // Normally, it is "semibold"
			},
			variants: {
				// 'with-shadow': {
				// 	bg: 'red.400',
				// 	boxShadow: '0 0 2px 2px #efdfde',
				// },
				action: (props: StyleFunctionProps) => ({
					// bg: '#ffdef7',
					bg: '#4f113f',
					color: '#ffedfa',
					transition: 'all 0s',
					'&:hover': {
						bg: '#842d6e',
						// color: "#53013f",
						color: '#ffedfa',
						textDecoration: 'none',
					},
				}),
			},
			defaultProps: {
				// size: 'lg', // default is md
				// variant: 'sm', // default is solid
				// colorScheme: 'green', // default is gray
			},
		},
		Link: {
			variants: {
				accent: {
					color: '#a2006a',
					textDecoration: 'underline dotted',
					'&:hover': {
						textDecoration: 'underline',
					},
				},
			},
			defaultProps: {
				variant: 'accent',
			},
		},
		Text: {
			variants: {
				description: {
					fontSize: '20px',
				},
			},
		},
	},
});

export default theme;
