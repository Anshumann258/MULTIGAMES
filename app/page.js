'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeGame, setActiveGame] = useState(null);
  
  // Navigation & Drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('cyberpunk'); // 'cyberpunk' | 'neon' | 'midnight'

  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  const iframeRef = useRef(null);
  const categories = ['All', 'Action', 'Racing', 'Puzzle', '3D'];

  // Theme configuration
  const themes = {
    cyberpunk: {
      bg: 'bg-slate-950',
      header: 'bg-slate-900/90 border-purple-500/30',
      accent: 'from-purple-600 to-indigo-600',
      glow: 'shadow-purple-500/20',
      cardBorder: 'hover:border-purple-500/50',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
    },
    neon: {
      bg: 'bg-zinc-950',
      header: 'bg-zinc-900/90 border-cyan-500/30',
      accent: 'from-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/20',
      cardBorder: 'hover:border-cyan-500/50',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
    },
    midnight: {
      bg: 'bg-gray-950',
      header: 'bg-gray-900/90 border-emerald-500/30',
      accent: 'from-emerald-600 to-teal-600',
      glow: 'shadow-emerald-500/20',
      cardBorder: 'hover:border-emerald-500/50',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    },
  };

  const theme = themes[activeTheme] || themes.cyberpunk;

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
    <div className={`min-h-screen ${theme.bg} text-white font-sans antialiased transition-colors duration-500 relative`}>
      {/* Sidebar Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 z-50 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              MENU
            </h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => { setSelectedCategory('All'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                selectedCategory === 'All' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <span>🎮</span> All Games
            </button>
            <button
              onClick={() => { setSelectedCategory('Favorites'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${
                selectedCategory === 'Favorites' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-3">❤️ Favorites</span>
              <span className="bg-purple-900/60 text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">{favorites.length}</span>
            </button>
            <button
              onClick={() => { setSelectedCategory('Recent'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${
                selectedCategory === 'Recent' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-3">🕒 Recently Played</span>
              <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-bold">{recentlyPlayed.length}</span>
            </button>
          </nav>

          <hr className="border-slate-800" />

          {/* Theme Selector */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Color Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTheme('cyberpunk')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  activeTheme === 'cyberpunk' ? 'border-purple-500 bg-purple-950/40 text-purple-300' : 'border-slate-800 bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                Cyber
              </button>
              <button
                onClick={() => setActiveTheme('neon')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  activeTheme === 'neon' ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-slate-800 bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                Neon
              </button>
              <button
                onClick={() => setActiveTheme('midnight')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  activeTheme === 'midnight' ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300' : 'border-slate-800 bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                Emerald
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
          MULTIGAMES Hub v2.0
        </div>
      </aside>

      {/* Header */}
      <header className={`sticky top-0 z-40 ${theme.header} backdrop-blur-md border-b px-6 py-4 flex items-center justify-between gap-4 shadow-lg`}>
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Icon */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition active:scale-95 flex flex-col gap-1 justify-center items-center w-10 h-10"
            aria-label="Open Navigation"
          >
            <span className="w-5 h-0.5 bg-slate-200 rounded-full" />
            <span className="w-5 h-0.5 bg-slate-200 rounded-full" />
            <span className="w-5 h-0.5 bg-slate-200 rounded-full" />
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory('All')}>
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 text-transparent bg-clip-text text-2xl sm:text-3xl font-black tracking-wider hover:opacity-90 transition">
              MULTI<span className="text-purple-400">GAMES</span>
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-xs sm:max-w-md">
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
        {/* Category Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                selectedCategory === cat
                  ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg ring-2 ring-purple-400`
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
              }`}
            >
              {cat}
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
                    className={`group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 shadow-xl hover:${theme.glow} ${theme.cardBorder} flex flex-col`}
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

                      {/* Category Badge */}
                      <span className={`absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md px-2.5 py-1 rounded-md border ${theme.badge}`}>
                        {game.category}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col justify-between flex-1 bg-slate-900/90">
                      <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors truncate mb-3">
                        {game.title}
                      </h3>

                      <button className={`w-full py-2.5 px-4 rounded-xl bg-gradient-to-r ${theme.accent} text-white text-xs font-bold tracking-wider uppercase shadow-md transition-all duration-300 flex items-center justify-center gap-2 group-hover:brightness-110`}>
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
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
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