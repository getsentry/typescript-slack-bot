export class RequestError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message); // 'Error' breaks prototype chain here
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
