import APIWrapper from "./APIWrapper";

const backendURL =
  process.env.ENVIRONMENT === "production"
    ? "/.netlify/functions/api"
    : "http://localhost:9000";

export default class API {
  static async getSongs(): Promise<Array<Song>> {
    return APIWrapper.get(`${backendURL}/getSongs`).then(
      (response) => response.data
    );
  }

  static async getPlaylists(): Promise<Array<Playlist>> {
    return APIWrapper.get(`${backendURL}/getPlaylists`).then(
      (response) => response.data
    );
  }

  static async addPlaylist(name: string): Promise<Playlist> {
    return APIWrapper.post(`${backendURL}/addPlaylist`, {
      name: name
    }).then((response) => response.data);
  }

  static async addSong(link: string, playlistId: string): Promise<Song> {
    return APIWrapper.post(`${backendURL}/addSong`, {
      link: link,
      playlistId: playlistId
    }).then((response) => response.data);
  }
}
