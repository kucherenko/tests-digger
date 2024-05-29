import {ConsoleTransport} from "./transports/console";
import {Transport} from "./transports/interface";

export const consoleTransport = new ConsoleTransport()

export class Logger {
    constructor(private transport: Transport = consoleTransport) {
    }

    error(message: string) {
        this.log(`🚨 ${message}`)
    }

    warn(message: string) {
        this.log(`⚠️ ${message}`)
    }

    info(message: string) {
        this.log(`ℹ️ ${message}`)
    }

    success(message: string) {
        this.log(`✅ ${message}`)
    }

    debug(message: string) {
        this.log(`🐛 ${message}`)
    }

    log(message: string) {
        this.transport.log(message)
    }
}
