import { songsCollection, tagsCollection } from "../firebase";
import DataModel from "./DataModel";


async function deserializer(dbSong: DBSong & { id: string }): Promise<Song> {
    // Type guard to narrow out null values
    function isTag(tag: Tag | null): tag is Tag {
      return tag !== null;
    }
  
    // Fetch tags by their ids, resolve to Tag[] with id included
    const tags = await Promise.all(
      dbSong.tagIds.map(async (tagId) => {
        const tagDoc = await tagsCollection.doc(tagId).get();
        if (!tagDoc.exists) return null; // return null if tag missing
        const tagData = tagDoc.data() as Omit<Tag, 'id'>;
        return { id: tagId, ...tagData };
      })
    );
  
    // Filter out nulls to get a Tag[]
    const filteredTags = tags.filter(isTag);
  
    // Return object compliant with Song type
    return {
      id: dbSong.id,
      link: dbSong.link,
      tags: filteredTags,
    };
  }
  

async function serializer(song: Song): Promise<DBSong> {
  return {
    link: song.link,
    tagIds: song.tags.map(tag => tag.id),
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

  async createSong(song: Song): Promise<Song> {
    return this.create(song);
  }

  async updateSong(id: string, song: Song): Promise<Song> {
    return this.update(id, song);
  }

  async deleteSong(id: string): Promise<void> {
    return this.delete(id);
  }
}
