export class CustomError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: any[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
