import {$} from "execa";
import which from "which";
import fsExtra from "fs-extra";
import {glob} from "glob";
import dependencyTree from "dependency-tree";

export const executeTests = async (command: string) => {
    const [commandName, ...args] = command.split(' ')
    if (commandName) {
        try {
            const resolvedCommand = await which(commandName);
            const result = await $`${resolvedCommand} ${args.join(' ')}`;
            return result.exitCode === 0
        } catch (e) {
            const err = (e as any).stderr
            throw err
        }

    }
    return false
}

export function getCoverage(path: string) {
    if (fsExtra.existsSync(path)) {
        return fsExtra.readJSONSync(path)
    }
    return null
}

interface Location {
    start: Position,
    end: Position
}

interface Func {
    name: string,
    decl: Location,
    loc: Location,
    line: number,
}

interface Position {
    line: number,
    column: number
}

export interface Coverage {
    path: string,
    all: boolean
    s: Record<string, number>
    statementMap: Record<string, Location>
    b: Record<string, number[]>
    branchMap: Record<string, { line: number, type: string, loc: Location, locations: Location[] }>
    f: Record<string, number>
    fnMap: Record<string, Func>
}

export function getUncoveredFiles(coverage: Record<string, Coverage>): Coverage[] {
    return Object.values(coverage).filter((fileCoverage: Coverage) => {
        return Object.values(fileCoverage.s).some((statement: number) => statement === 0) || Object.values(fileCoverage.b).some((branches: number[]) => branches.some((branch: number) => branch === 0)) || Object.values(fileCoverage.f).some((functionCoverage: number) => functionCoverage === 0)
    })
}

interface TestOptions {
    path: string
    include?: string[]
    ignore?: string[]
}
export async function getTestsForUncoveredFiles(coverage: Record<string, Coverage>, options: TestOptions): Promise<Record<string, string[]>> {
    const {
        path,
        include = ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        ignore = ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*']
    } = options
    const uncovered = getUncoveredFiles(coverage)
    const uncoveredFiles = uncovered.map((e) => {
        return e.path
    })
    const tests = await glob(include, {
        cwd: path,
        absolute: true,
        ignore
    })

    const result: Record<string, string[]> = {}
    for (const file of tests) {
        const dependencies = dependencyTree.toList({
            filename: file,
            directory: path,
            filter: p => p.indexOf('node_modules') === -1,
        })
        console.log(file, dependencies)
        for (const uncoveredFile of uncoveredFiles) {
            if (dependencies.includes(uncoveredFile)) {
                result[uncoveredFile] = result[uncoveredFile] as string[] || []
                if (!(result[uncoveredFile] as string[]).includes(file)) {
                    (result[uncoveredFile] as string[]).push(file)
                }
            }
        }
    }
    return result
}

export function describeCoverageReport(coverage: Coverage) {
    const uncoveredStatements = Object.entries(coverage.s).filter(([, statement]) => statement === 0).map(([statement]) => statement)
    const uncoveredBranches = Object.entries(coverage.b)
        .filter(([, branches]) => branches.some((branch: number) => branch === 0))
        .map(([branch]) => {
            const cov = coverage.branchMap[branch]
            return cov ? {
                line: cov.line,
                locations: cov.locations,
            } : {}
        })
    const uncoveredFunctions = Object.entries(coverage.f)
        .filter(([, functionCoverage]) => functionCoverage === 0)
        .map(([funct]) => {
            const cov = coverage.fnMap[funct]
            return cov ? {
                name: cov.name,
                location: cov.loc,
            } : {}
        })
    return {
        lines: uncoveredStatements,
        branches: uncoveredBranches,
        functions: uncoveredFunctions
    }
}
