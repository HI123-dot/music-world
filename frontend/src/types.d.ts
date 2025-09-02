type Song = {
  name: string;
  link: string;
  tags: Tag[];
  id: string;
};

type Playlist = {
  name: string;
  songs: Song[];
  id: string;
};

type Tag = {
  name: string;
  tagColor: string;
  id: string;
};
