import {vi, describe, it, beforeEach, expect} from "vitest";
import {ConsoleTransport} from "./console";


describe('Console Transport', () => {
    let sut: ConsoleTransport;

    beforeEach(() => {
        sut = new ConsoleTransport();
        vi.spyOn(console, 'log')
    })

    it('should log message', () => {
        sut.log('message');
        expect(console.log).toHaveBeenCalledWith('message')
    })
})
