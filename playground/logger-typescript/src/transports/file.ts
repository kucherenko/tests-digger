import fs from "fs";

import {Transport} from "./interface";

export class FileTransport implements Transport {
    constructor(private path: string) {
    }

    log(message: string): void {
        fs.appendFileSync(this.path, message)
    }
}
