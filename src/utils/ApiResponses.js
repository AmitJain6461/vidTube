class ApiResponses {
  constructor(statusCode, message = "success", data) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
export { ApiResponses };
