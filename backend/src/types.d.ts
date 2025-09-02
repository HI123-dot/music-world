type Song = {
  name: string;
  link: string;
  tags: Tag[];
  id: string;
};

type DBSong = {
  name: string;
  link: string;
  tagIds: string[];
};

type DBPlaylist = {
  name: string;
  songIds: string[];
};

type Playlist = {
  name: string;
  songs: Song[];
  id: string;
};

type Tag = {
  id: string;
  name: string;
  tagColor: string;
};

type DBTag = {
  name: string;
  tagColor: string;
};
