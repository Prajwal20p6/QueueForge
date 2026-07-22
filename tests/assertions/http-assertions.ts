/**
 * HTTP response assertions helper.
 */
export class HttpAssertions {
  public static assertResponseStatus(response: any, expectedStatus: number): void {
    if (response?.status !== expectedStatus) {
      throw new Error(`Expected HTTP status ${expectedStatus}, got ${response?.status}`);
    }
  }

  public static assertResponseBodyHasProperty(response: any, propertyPath: string): void {
    const body = response?.body || response?.data;
    if (!body || body[propertyPath] === undefined) {
      throw new Error(`Expected response body to have property "${propertyPath}"`);
    }
  }
}
