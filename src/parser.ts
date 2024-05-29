type TestBlock = {
    path: string;
    code: string;
};

export function extractTestBlocks(input: string): TestBlock[] {
    const blocks: TestBlock[] = [];
    const blockStartRegex = /---(.+?)---/;
    const blockEndRegex = /---end---/;

    const lines = input.split('\n');
    let isInsideBlock = false;
    let currentPath = "";
    let currentCode = "";

    for (const line of lines) {
        if (!isInsideBlock) {
            // Check if the line contains path
            const match = line.match(blockStartRegex);
            if (match && match[1]) {
                isInsideBlock = true;
                currentPath = match[1].trim();
                currentCode = "";
            }
        } else {
            // Check for the end of the block
            if (blockEndRegex.test(line)) {
                blocks.push({path: currentPath, code: currentCode.trim()});
                isInsideBlock = false;
            } else {
                currentCode += line + "\n";
            }
        }
    }

    return blocks;
}
