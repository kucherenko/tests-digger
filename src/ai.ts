import {ChatOpenAI} from "langchain/chat_models/openai";
import {PromptTemplate} from "langchain/prompts";
import {StringOutputParser} from "langchain/schema/output_parser";
import {RunnableSequence} from "langchain/schema/runnable";


export async function generateImprovedTests(code: Record<string, string>, tests: Record<string, string>[], coverage: Record<string, object>) {

    const model = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo-16k'
    })

    const promptTemplate = PromptTemplate.fromTemplate(`
Act as software developer. Improve unit  tests for the following code. 
Fix uncovered parts of code and write tests for them.

Uncovered parts of code: 
{coverage}

Code: 
{code}

Tests: 
{tests}

Return improved tests in following format: 
---<path to test>---
<test code>
---end---
`)
    const outputParser = new StringOutputParser({})

    const chain = RunnableSequence.from([
        promptTemplate,
        model,
        outputParser
    ])
    const testsString = JSON.stringify(tests, null, 2)
    const codeString = JSON.stringify(code, null, 2)
    return await chain.invoke({
        code: codeString,
        tests: testsString,
        coverage: JSON.stringify(coverage, null, 2)
    })
}

export async function fixTestsError(error: string, code: Record<string, string>, tests: Record<string, string>[]) {

    const model = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo-16k'
    })

    const promptTemplate = PromptTemplate.fromTemplate(`
Act as software developer. 
Improve unit tests for the following code. 
Fix tests errors.

Code: 
{code}

Tests: 
{tests}

Tests failed with the following error:
{error}

Return improved tests in following format: 
---<path to test>---
<test code>
---end---
`)
    const outputParser = new StringOutputParser({})

    const chain = RunnableSequence.from([
        promptTemplate,
        model,
        outputParser
    ])
    const testsString = JSON.stringify(tests, null, 2)
    const codeString = JSON.stringify(code, null, 2)
    console.log()
    return await chain.invoke({
        error,
        code: codeString,
        tests: testsString,
    })
}

