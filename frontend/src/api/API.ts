import APIWrapper from "./APIWrapper";

const backendURL =
  process.env.ENVIRONMENT === "production"
    ? "/.netlify/functions/api"
    : "http://localhost:9000/.netlify/functions/api";

export default class API {
  static async getSongs(): Promise<Array<Song>> {
    return APIWrapper.get(`${backendURL}/getSongs`).then(
      (response) => response.data
    );
  }
}
