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

  // Create a new playlist
  const handleCreatePlaylist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = await API.addPlaylist(newPlaylistName.trim());
    setPlaylists((prev) => [...prev, created]);
    setShowCreate(false);
    setNewPlaylistName("");
  };

  // Add a song to a specific playlist
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

  // Delete a song
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
              <div className={styles.playlisttitle}>{pl.name}</div>
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
                      {/* Song context menu on hover */}
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
