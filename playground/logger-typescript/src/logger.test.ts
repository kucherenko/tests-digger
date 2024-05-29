import {vi, describe, it, beforeEach, expect} from "vitest";
import {Logger} from "./logger";
import {Transport} from "./transports/interface";

class MyTransport implements Transport{
    public _log = vi.fn()

    log(message: string): void {
        this._log(message)
    }
}

const myTransport = new MyTransport()
describe('Logger', () => {
    let sut: Logger;

    beforeEach(() => {

        sut = new Logger(myTransport);
    })

    it('should log error', () => {
        sut.error('error message');
        expect(myTransport._log).toHaveBeenCalledWith('🚨 error message')
    })
});
