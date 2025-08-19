import {
  songsCollection,
  tagsCollection,
  playlistsCollection
} from "../firebase";
import DataModel from "./DataModel";
import { songModel } from "./SongModel";

async function deserializer(
  dbPlaylist: DBPlaylist & { id: string }
): Promise<Playlist> {
  const songs = await Promise.all(
    dbPlaylist.songIds.map(async (songId) => {
      const songRef = songsCollection.doc(songId);
      const songDoc = await songRef.get();
      if (!songDoc.exists) return undefined;

      const songData = songDoc.data() as DBSong;
      const tags = await Promise.all(
        songData.tagIds.map(async (tagId) => {
          const tagDoc = await tagsCollection.doc(tagId).get();
          if (!tagDoc.exists) return null;
          const tagData = tagDoc.data() as DBTag;
          return { id: tagId, ...tagData };
        })
      );
      return {
        link: songData.link,
        tags: tags.filter((tag) => tag !== null),
        id: songId
      };
    })
  );

  return {
    name: dbPlaylist.name,
    songs: songs.filter((song) => song !== undefined),
    id: dbPlaylist.id
  };
}

async function serializer(playlist: Playlist): Promise<DBPlaylist> {
  return {
    name: playlist.name,
    songIds: await Promise.all(playlist.songs.map(async (song) => song.id))
  };
}

export default class PlaylistModel extends DataModel<Playlist, DBPlaylist> {
  constructor() {
    super(playlistsCollection, deserializer, serializer);
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return this.readAll();
  }

  async getPlaylistById(id: string): Promise<Playlist | null> {
    return this.read(id);
  }

  async createPlaylist(playlist: Playlist): Promise<Playlist> {
    return this.create(playlist);
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    const dbPlaylist = await this.dbRead(playlistId);
    if (!dbPlaylist) throw new Error("Playlist not found");
    dbPlaylist.songIds.push(songId);
    await this.dbUpdate(playlistId, dbPlaylist);
  }

  async deleteSongFromPlaylist(
    playlistId: string,
    songId: string
  ): Promise<void> {
    const dbPlaylist = await this.dbRead(playlistId);
    if (!dbPlaylist) throw new Error("Playlist not found");

    await this.dbUpdate(playlistId, {
      ...dbPlaylist,
      songIds: dbPlaylist.songIds.filter((id) => id !== songId)
    });
  }

  async updatePlaylist(id: string, playlist: Playlist): Promise<Playlist> {
    return this.update(id, playlist);
  }

  async deletePlaylist(id: string): Promise<void> {
    const dbPlaylist = await this.dbRead(id);
    dbPlaylist?.songIds.forEach(async (songId) => {
      await songModel.deleteSong(songId, id);
    });
    await this.delete(id);
  }
}

export const playlistModel = new PlaylistModel();
