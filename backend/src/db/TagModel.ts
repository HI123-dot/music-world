import { tagsCollection } from "../firebase";
import DataModel from "./DataModel";

async function deserializer(dbTag: DBTag & { id: string }): Promise<Tag> {
    return {
      name: dbTag.name,
      tagColor: dbTag.tagColor,
      id: dbTag.id
    };
  }
  


async function serializer(tag: Tag): Promise<DBTag> {
  return {
    name: tag.name,
    tagColor: tag.tagColor
  };
}

export default class TagModel extends DataModel<Tag, DBTag> {
  constructor() {
    super(tagsCollection, deserializer, serializer);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.readAll();
  }

  async getTagById(id: string): Promise<Tag | null> {
    return this.read(id);
  }

  async createTag(tag: Tag): Promise<Tag> {
    return this.create(tag);
  }

  async updateTag(id: string, tag: Tag): Promise<Tag> {
    return this.update(id, tag);
  }

  async deleteTag(id: string): Promise<void> {
    return this.delete(id);
  }
}
