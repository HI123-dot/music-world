import { songsCollection, tagsCollection } from "../firebase";
import DataModel from "./DataModel";
import { playlistModel } from "./PlaylistModel";

async function deserializer(dbSong: DBSong & { id: string }): Promise<Song> {
  const tags = (
    await Promise.all(
      dbSong.tagIds.map(async (tagId) => {
        const tagDoc = await tagsCollection.doc(tagId).get();
        if (!tagDoc.exists) return null;
        const tagData = tagDoc.data() as DBTag;
        return { id: tagId, ...tagData } as Tag;
      })
    )
  ).filter((tag) => tag !== null);

  return {
    id: dbSong.id,
    link: dbSong.link,
    tags: tags as Tag[]
  };
}

async function serializer(song: Song): Promise<DBSong> {
  return {
    link: song.link,
    tagIds: song.tags.map((tag) => tag.id)
  };
}

export default class SongModel extends DataModel<Song, DBSong> {
  constructor() {
    super(songsCollection, deserializer, serializer);
  }

  async getAllSongs(): Promise<Song[]> {
    return this.readAll();
  }

  async getSongById(id: string): Promise<Song | null> {
    return this.read(id);
  }

  async createSong(playlistId: string, song: Song): Promise<Song> {
    const newSong = await this.create(song);
    playlistModel.addSongToPlaylist(playlistId, newSong.id);
    return newSong;
  }

  async updateSong(id: string, song: Song): Promise<Song> {
    return this.update(id, song);
  }

  async deleteSong(playlistId: string, songId: string): Promise<void> {
    await this.delete(songId);
    await playlistModel.deleteSongFromPlaylist(playlistId, songId);
  }
}

export const songModel = new SongModel();
