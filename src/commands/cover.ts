import {Argv} from "yargs";
import {Cover} from "../types/cover.interface.js";
import {
    Coverage,
    describeCoverageReport,
    executeTests,
    getCoverage,
    getTestsForUncoveredFiles
} from "../tests-utils.js";
import pc from "picocolors";
import {fixTestsError, generateImprovedTests} from "../ai.js";
import {readFileSync, writeFileSync} from "fs";
import {extractTestBlocks} from "../parser.js";
import fsExtra from "fs-extra";

const command = 'cover <path>';
const describe = 'Start covering code with tests';
const aliases = ['c'];

function builder(yargs: Argv): Argv<Cover> {
    return yargs.positional('path', {
        describe: 'A path to the project',
        type: 'string',
    }).options('attempts', {
        alias: 'a',
        describe: 'Number of attempts to improve tests',
        type: 'number',
        default: 3,
    })
}

async function handler(argv: Cover) {
    const {attempts} = argv
    if (argv.path) {
        process.chdir(argv.path)
        const pathToCoverage = `coverage/coverage-final.json`
        const config = fsExtra.readJSONSync('.digger.json')
        const testExecutableCommand = config.test || 'npm test'
        console.log(`🧪 Running tests with ${pc.bold(testExecutableCommand)}...`)
        const testsPassed = await executeTests(testExecutableCommand)
        console.log(`🧪 Tests ${testsPassed ? 'passed' : 'failed'}.`)
        if (testsPassed) {
            const coverage = getCoverage(pathToCoverage)
            const testsForFiles = await getTestsForUncoveredFiles(coverage, {
                path: '.'
            })
            let i = 1;
            for (const [files, tests] of Object.entries(testsForFiles)) {
                console.log(`\n 🪭 ${pc.bold(files)}: \n${tests.join(', ')}`)
                try {
                    await runTestsImproving(files, coverage[files], tests, testExecutableCommand, attempts || 1)
                } catch (e) {
                    console.log(e)
                }
                i++;
                if (i > 3) {
                    break;
                }
            }
        }
    }
}

async function runTestsImproving(code: string, coverage: Coverage, testsFiles: string[], testExecutableCommand: string, attempts: number = 3) {
    const uncoveredSummary = describeCoverageReport(coverage)
    for (let i = 0; i < attempts; i++) {
        console.log(`🤖 Attempt ${i + 1}/${attempts} to improve tests for ${pc.bold(code)}...`)
        const result = await generateImprovedTests(
            {[code]: readFileSync(code).toString()},
            testsFiles.map(f => {
                return {[f]: readFileSync(f).toString()}
            }),
            uncoveredSummary
        )
        const resultTests = extractTestBlocks(result)
        const savedState: Record<string, string> = {}

        for (const tests of resultTests) {
            const testPath = testsFiles.find(f => f.includes(tests.path))
            if (testPath) {
                const codeOfExistingTest = readFileSync(testPath).toString()
                console.log('🥸', codeOfExistingTest.length, tests.code.length)
                savedState[testPath] = codeOfExistingTest
                writeFileSync(testPath, tests.code)
            } else {
                console.log(`😢 can't find test file for ${pc.bold(testPath)}`)
            }
        }
        try {
            const testsPassed = await executeTests(testExecutableCommand)
            if (!testsPassed) {
                console.log(`😢 tests failed, reverting changes...`)
                for (const [path, code] of Object.entries(savedState)) {
                    writeFileSync(path, code)
                }
            } else {
                console.log(`😎 tests passed!`)
                return true
            }
        } catch (e) {
            console.log(`😢 tests failed, trying to fix the errors...`)
            const res = await fixTestsError(e as string,
                {[code]: readFileSync(code).toString()},
                testsFiles.map(f => {
                    return {[f]: readFileSync(f).toString()}
                }),
            )
            console.log(res)
            const resTests = extractTestBlocks(res)
            for (const tests of resTests) {
                const testPath = testsFiles.find(f => f.includes(tests.path))
                if (testPath) {
                    writeFileSync(testPath, tests.code)
                } else {
                    console.log(`😢 can't find test file for ${pc.bold(testPath)}`)
                }
            }
            try {
                const testsPassed = await executeTests(testExecutableCommand)
                if (!testsPassed) {
                    console.log(`😢 tests failed, reverting changes...`)
                    for (const [path, code] of Object.entries(savedState)) {
                        writeFileSync(path, code)
                    }
                } else {
                    console.log(`😎 tests passed!`)
                    return true
                }
            } catch (e) {
                console.log(`😢 tests failed, reverting changes...`)
                for (const [path, code] of Object.entries(savedState)) {
                    writeFileSync(path, code)
                }
            }
        }
    }
    return false
}

export default {
    command, describe, aliases, builder, handler,
}
