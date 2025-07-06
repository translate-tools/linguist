import 'dotenv/config';

import { Command } from 'commander';

import sync from './commands/sync';

const program = new Command();
program.addCommand(sync);
program.parse();
