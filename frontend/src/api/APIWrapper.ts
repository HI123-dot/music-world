import axios, { AxiosError, AxiosResponse } from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type APIProcessedResponse = { data: any };

export default class APIWrapper {
  public static async post(
    url: string,
    body: unknown
  ): Promise<APIProcessedResponse> {
    return axios
      .post(url, body)
      .catch((err: AxiosError) => err)
      .then((resOrErr) => this.responseMiddleware(resOrErr));
  }

  public static async get(url: string): Promise<APIProcessedResponse> {
    return axios
      .get(url)
      .catch((err: AxiosError) => err)
      .then((resOrErr) => this.responseMiddleware(resOrErr));
  }

  public static async delete(url: string): Promise<APIProcessedResponse> {
    return axios
      .delete(url)
      .catch((err: AxiosError) => err)
      .then((resOrErr) => this.responseMiddleware(resOrErr));
  }

  public static async put(
    url: string,
    body: unknown
  ): Promise<APIProcessedResponse> {
    return axios
      .put(url, body)
      .catch((err: AxiosError) => err)
      .then((resOrErr) => this.responseMiddleware(resOrErr));
  }

  private static responseMiddleware(
    resOrErr: AxiosResponse<unknown> | AxiosError
  ): APIProcessedResponse {
    // No default, return the response
    if (resOrErr instanceof Error) return resOrErr.response ?? { data: null };
    return resOrErr;
  }
}
