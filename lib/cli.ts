import fs from 'fs';
import yargs from 'yargs';
import { GenerateTypings } from '.';
import { FetchClientFormatter } from './formatters';

/* eslint-disable no-console,@typescript-eslint/no-unsafe-assignment */
export default yargs
	.command(['generate', '$0'], 'Write generated output to a file', {
	  input: {
      demandOption: true,
      alias: 'i',
      describe: 'File to read from',
      type: 'string',
	  },
	  output: {
      alias: 'o',
      describe: 'Output name to write to',
      type: 'string',
		},
		server: {
      alias: 's',
      describe: 'Server URL to use (defaults to the first one in the OpenAPI spec)',
      type: 'string',
		},
		verbose: {
      alias: 'v',
      default: false,
      type: 'boolean',
		}
	}, (argv) => {
		const apiSchema = JSON.parse(fs.readFileSync(argv.input).toString());
		const serverUrl: string | undefined = argv.server as any;
		void GenerateTypings(apiSchema, {
			operationFormatters: [
				new FetchClientFormatter(apiSchema, {
					serverUrl,
				}),
			],
		}).then(generatedTypescript => {
			const outputFileWithoutExtension =
				`${argv.output || argv.input}`.replace(/(\.d)?\.ts$/, '');
			if (argv.output) {
				fs.writeFileSync(`${outputFileWithoutExtension}.ts`, generatedTypescript);
			} else {
				console.log(generatedTypescript);
			}
		});
	})
	.argv;
