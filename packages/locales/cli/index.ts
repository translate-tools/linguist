import 'dotenv/config';

import { Command } from 'commander';

import proofread from './commands/proofread';
import sync from './commands/sync';

const program = new Command();
program.addCommand(sync);
program.addCommand(proofread);
program.parse();
