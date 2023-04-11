import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/worker/translator.worker.ts',
	output: {
		dir: 'build',
		format: 'es'
	},
	plugins: [typescript()]
};