type Song = {
  link: string;
  tags: Tag[];
  id: string;
};

type DBSong = {
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
  name: string;
  tagColor: string;
};
