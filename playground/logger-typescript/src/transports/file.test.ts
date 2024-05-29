import { describe, it, beforeEach, vi } from "vitest";
import { FileTransport } from "./file";
import fs from "fs";

vi.spyOn(fs, "appendFileSync");
describe('File Transport', () => {
  let sut: FileTransport;
  let path: string;

  beforeEach(() => {
    path = 'test.log';
    sut = new FileTransport(path);
    console.log(sut)
  })

  it('should log message', () => {
  })
})
