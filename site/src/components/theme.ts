import { extendTheme, StyleFunctionProps, theme as chakraTheme } from '@chakra-ui/react';

const theme = extendTheme({
	styles: {
		global: {
			body: {
				fontFamily:
					'-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
			},
		},
	},
	components: {
		Button: {
			...chakraTheme.components.Button,
			variants: {
				action: (props: StyleFunctionProps) => ({
					bg: '#4f113f',
					color: '#ffedfa',
					transition: 'all 0s',
					'&:hover': {
						bg: '#842d6e',
						color: '#ffedfa',
						textDecoration: 'none',
					},
				}),
			},
		},
		Link: {
			variants: {
				accent: {
					color: '#a2006a',
					textDecoration: 'underline dotted',
					'&:hover': {
						color: '#a2006a',
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
