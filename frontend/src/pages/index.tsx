import React, { useState, FormEvent, useEffect } from "react";
import styles from "../styles/Playlist.module.css";
import API from "../api/API";

type Song = {
  link: string;
  id: string;
};

type Playlist = {
  name: string;
  songs: Song[];
  id: string;
};

const Playlist: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [openMenuSongId, setOpenMenuSongId] = useState<string | null>(null);

  useEffect(() => {
    API.getPlaylists().then((data) => setPlaylists(data));
  }, []);

  const handleCreatePlaylist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = await API.addPlaylist(newPlaylistName.trim());
    setPlaylists((prev) => [...prev, created]);
    setShowCreate(false);
    setNewPlaylistName("");
  };

  const handleAddMusic = async (
    e: FormEvent,
    playlistId: string
  ) => {
    e.preventDefault();
    const link = linkInputs[playlistId]?.trim();
    if (!link) return;
    const newSong = await API.addSong(link, playlistId);

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, songs: [...p.songs, newSong] }
          : p
      )
    );
    setLinkInputs((inputs) => ({ ...inputs, [playlistId]: "" }));
  };

  const handleDeleteSong = async (playlistId: string, songId: string) => {
    await API.deleteSong(songId);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
          : p
      )
    );
    setOpenMenuSongId(null);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await API.deletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Music Sharing Program</h1>
      {!showCreate ? (
        <button onClick={() => setShowCreate(true)}>
          Create Playlist
        </button>
      ) : (
        <form onSubmit={handleCreatePlaylist} className={styles.formaddmusic}>
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
            required
            className={styles.inputlink}
          />
          <button type="submit" className={styles.btnadd}>
            Add Playlist
          </button>
        </form>
      )}

      <div className={styles.playlistSelector}>
        <h2>Your Playlists</h2>
        {playlists.length === 0 && <div>No playlists yet.</div>}
        <ul className={styles.playlistlist}>
          {playlists.map(pl => (
            <li key={pl.id} className={styles.playlistbox}>
              <div className={styles.playlistTitleRow}>
                <div className={styles.playlisttitle}>{pl.name}</div>
                <button
                  className={styles.playlistDeleteBtn}
                  onClick={() => handleDeletePlaylist(pl.id)}
                  aria-label="Delete playlist"
                  title="Delete playlist"
                >
                  {/* Trash icon SVG */}
                  <svg height="20" width="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 7V15C6 15.55 6.45 16 7 16H13C13.55 16 14 15.55 14 15V7M3 7H17M8 7V15M12 7V15M4 7V17C4 17.55 4.45 18 5 18H15C15.55 18 16 17.55 16 17V7" stroke="#f06c7a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="8" y="2" width="4" height="2" rx="1" stroke="#f06c7a" strokeWidth="1.3"/>
                  </svg>
                </button>
              </div>
              <form
                onSubmit={(e) => handleAddMusic(e, pl.id)}
                className={styles.formaddmusic}
              >
                <input
                  type="url"
                  placeholder="Paste music link"
                  value={linkInputs[pl.id] || ""}
                  onChange={e =>
                    setLinkInputs(inputs => ({
                      ...inputs,
                      [pl.id]: e.target.value,
                    }))
                  }
                  required
                  className={styles.inputlink}
                />
                <button type="submit" className={styles.btnadd}>
                  Add
                </button>
              </form>
              <ul className={styles.playlistlist}>
                {pl.songs.length === 0 ? (
                  <li className={styles.emptytext}>No music added yet.</li>
                ) : (
                  pl.songs.map(song => (
                    <li
                      key={song.id}
                      className={styles.playlistitem}
                      style={{ position: "relative" }}
                      onMouseEnter={() => setOpenMenuSongId(song.id)}
                      onMouseLeave={() => setOpenMenuSongId((curr) => (curr === song.id ? null : curr))}
                    >
                      <a
                        href={song.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.playlistlink}
                      >
                        {song.link}
                      </a>
                      {openMenuSongId === song.id && (
                        <div className={styles.songMenu}>
                          <button
                            className={styles.songMenuBtn}
                            onClick={() => handleDeleteSong(pl.id, song.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Playlist;
