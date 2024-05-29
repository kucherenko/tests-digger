import { hideBin } from "yargs/helpers";
import Yargs from "yargs";
import { config } from "dotenv";
import * as commands from '../src/commands/index.js'

config();

const yargs = Yargs(hideBin(process.argv))
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
Object.values(commands).forEach((command) => {
    yargs.command(command)
})


yargs.argv
