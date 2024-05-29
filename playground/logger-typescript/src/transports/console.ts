import {Transport} from "./interface";

export class ConsoleTransport implements Transport {
    log(message: string): void {
        console.log(message)
    }
}
