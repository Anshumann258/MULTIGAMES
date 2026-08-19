'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeGame, setActiveGame] = useState(null);
  
  // LocalStorage state
  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  const iframeRef = useRef(null);
  const categories = ['All', 'Favorites', 'Recent', 'Action', 'Racing', 'Puzzle', '3D'];

  // 1. Fetch Games from Supabase on mount
  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      const { data, error } = await supabase.from('games').select('*');
      if (error) {
        console.error('Error fetching games:', error);
      } else {
        // Map database column names (embed_url -> embedUrl)
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

  // 2. Load LocalStorage items for Favorites and Recently Played
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('multigames_favorites')) || [];
    const savedRecent = JSON.parse(localStorage.getItem('multigames_recent')) || [];
    setFavorites(savedFavorites);
    setRecentlyPlayed(savedRecent);
  }, []);

  // 3. Open Game & Save to Recently Played
  const handleOpenGame = (game) => {
    setActiveGame(game);

    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((g) => g.id !== game.id);
      const updated = [game, ...filtered].slice(0, 10); // Keep top 10
      localStorage.setItem('multigames_recent', JSON.stringify(updated));
      return updated;
    });
  };

  // 4. Toggle Favorites
  const toggleFavorite = (e, game) => {
    e.stopPropagation(); // Prevents opening the game modal when clicking heart icon

    setFavorites((prev) => {
      const isFav = prev.some((g) => g.id === game.id);
      let updated;
      if (isFav) {
        updated = prev.filter((g) => g.id !== game.id);
      } else {
        updated = [...prev, game];
      }
      localStorage.setItem('multigames_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // 5. Filter logic (Category, Search, Favorites, Recent)
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
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory('All')}>
          <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-transparent bg-clip-text text-2xl font-black tracking-wider">
            MULTI<span className="text-purple-400">GAMES</span>
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search free games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-full px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat === 'Favorites' ? `❤️ Favorites (${favorites.length})` : cat === 'Recent' ? `🕒 Recent` : cat}
            </button>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium">Loading MULTIGAMES library...</div>
        ) : (
          /* Poki-Style Masonry Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredGames.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                No games found in this section.
              </div>
            ) : (
              filteredGames.map((game) => {
                const isFav = favorites.some((g) => g.id === game.id);
                return (
                  <div
                    key={game.id}
                    onClick={() => handleOpenGame(game)}
                    className={`group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer transform hover:-translate-y-1 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-purple-500/20 ${
                      game.featured && selectedCategory === 'All' ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover min-h-[140px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />
                    
                    {/* Favorite Heart Button */}
                    <button
                      onClick={(e) => toggleFavorite(e, game)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 transition text-sm z-10"
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                        {game.category}
                      </span>
                      <h3 className="text-sm font-bold text-white truncate">{game.title}</h3>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Game Modal Player */}
      {activeGame && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">{activeGame.title}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullScreen}
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Full Screen ⛶
                </button>
                <button
                  onClick={() => setActiveGame(null)}
                  className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* iFrame Game Screen */}
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