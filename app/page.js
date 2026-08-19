'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeGame, setActiveGame] = useState(null);
  
  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  const iframeRef = useRef(null);
  const categories = ['All', 'Favorites', 'Recent', 'Action', 'Racing', 'Puzzle', '3D'];

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      const { data, error } = await supabase.from('games').select('*');
      if (error) {
        console.error('Error fetching games:', error);
      } else if (data) {
        const formattedData = data.map((g) => ({
          ...g,
          embedUrl: g.embed_url,
        }));
        setGames(formattedData);
      }
      setLoading(false);
    }
    fetchGames();
  }, []);

  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('multigames_favorites')) || [];
    const savedRecent = JSON.parse(localStorage.getItem('multigames_recent')) || [];
    setFavorites(savedFavorites);
    setRecentlyPlayed(savedRecent);
  }, []);

  const handleOpenGame = (game) => {
    setActiveGame(game);
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((g) => g.id !== game.id);
      const updated = [game, ...filtered].slice(0, 10);
      localStorage.setItem('multigames_recent', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (e, game) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const isFav = prev.some((g) => g.id === game.id);
      const updated = isFav ? prev.filter((g) => g.id !== game.id) : [...prev, game];
      localStorage.setItem('multigames_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const getFilteredGames = () => {
    if (selectedCategory === 'Favorites') return favorites;
    if (selectedCategory === 'Recent') return recentlyPlayed;

    return games.filter((game) => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredGames = getFilteredGames();

  const toggleFullScreen = () => {
    if (iframeRef.current && iframeRef.current.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory('All')}>
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 text-transparent bg-clip-text text-3xl font-black tracking-wider animate-pulse">
            MULTI<span className="text-purple-400">GAMES</span>
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="🔍 Search free games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 text-sm rounded-full px-5 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Categories */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
              }`}
            >
              {cat === 'Favorites' ? `❤️ Favorites (${favorites.length})` : cat === 'Recent' ? `🕒 Recent` : cat}
            </button>
          ))}
        </div>

        {/* Game Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Loading MULTIGAMES library...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <p className="text-lg font-medium">No games found in this category.</p>
              </div>
            ) : (
              filteredGames.map((game) => {
                const isFav = favorites.some((g) => g.id === game.id);
                return (
                  <div
                    key={game.id}
                    onClick={() => handleOpenGame(game)}
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-500/50 flex flex-col"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                      
                      {/* Heart Button */}
                      <button
                        onClick={(e) => toggleFavorite(e, game)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/70 hover:bg-purple-600 transition-colors duration-200 z-10 border border-slate-700/50"
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>

                      {/* Floating Category Badge */}
                      <span className="absolute top-3 left-3 text-[10px] font-extrabold text-purple-300 uppercase tracking-wider bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-purple-500/30">
                        {game.category}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col justify-between flex-1 bg-slate-900/90">
                      <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors truncate mb-3">
                        {game.title}
                      </h3>

                      {/* Play Now Button */}
                      <button className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wider uppercase shadow-md group-hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2">
                        <span>▶ Play Now</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Game Player Modal */}
      {activeGame && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex flex-col justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-purple-950/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">🎮</span> {activeGame.title}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullScreen}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3.5 py-2 rounded-lg font-semibold border border-slate-700 transition"
                >
                  Full Screen ⛶
                </button>
                <button
                  onClick={() => setActiveGame(null)}
                  className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-xs px-3.5 py-2 rounded-lg font-semibold transition"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* Game iFrame */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                ref={iframeRef}
                src={activeGame.embedUrl}
                title={activeGame.title}
                className="w-full h-full border-0"
                allow="autoplay; payment; fullscreen; microphone; camera; geolocation"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}