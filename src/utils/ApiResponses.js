class ApiResponses {
  constructor(statusCode, data, message = "success") {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
export { ApiResponses };
