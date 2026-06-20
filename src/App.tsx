import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Tv, List, Star, Clock, Search, FolderPlus, Upload, 
  Link, FileText, Info, HelpCircle, Check, Copy, Trash2, 
  ChevronLeft, ChevronRight, ArrowRight, Video, Wifi, RefreshCw, AlertCircle, X, Menu, Download, SkipBack, SkipForward,
  Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Playlist, PlaylistItem, PlaybackHistoryItem } from './types';
import { PRESET_PLAYLISTS } from './utils/presets';
import { parseM3U } from './utils/m3uParser';
import VideoPlayer from './components/VideoPlayer';

export default function App() {
  // Playlist Storage
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('m3u_playlists');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove deleted external presets: iptv-es, iptv-global-news, iptv-music
          let filtered = parsed.filter(p => p && Array.isArray(p.items) && (p.id === 'default-demos' || (p.id !== 'iptv-es' && p.id !== 'iptv-global-news' && p.id !== 'iptv-music')));
          
          // Ensure default-demos is present
          if (!filtered.some(p => p.id === 'default-demos')) {
            const defaultDemo = PRESET_PLAYLISTS.find(p => p.id === 'default-demos');
            if (defaultDemo) {
              filtered.unshift(defaultDemo as Playlist);
            }
          }

          // Always overwrite default-demos with the latest items to ensure they load properly
          filtered = filtered.map(p => {
            if (p.id === 'default-demos') {
              const freshDemo = PRESET_PLAYLISTS.find(d => d.id === 'default-demos');
              if (freshDemo) {
                return {
                  ...p,
                  name: freshDemo.name,
                  items: freshDemo.items,
                  sourceValue: freshDemo.sourceValue
                };
              }
            }
            return p;
          });

          return filtered;
        }
      } catch {
        // Fall back
      }
    }
    return PRESET_PLAYLISTS.filter(p => p && Array.isArray(p.items)) as Playlist[];
  });

  const [currentPlaylistId, setCurrentPlaylistId] = useState<string>(() => {
    return playlists[0]?.id || 'default-demos';
  });

  // Active channel
  const [activeChannel, setActiveChannel] = useState<PlaylistItem | null>(() => {
    const mainList = playlists.find(p => p.id === currentPlaylistId) || playlists[0];
    return mainList?.items?.[0] || null;
  });

  // Playback history
  const [history, setHistory] = useState<PlaybackHistoryItem[]>(() => {
    const saved = localStorage.getItem('m3u_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Favorite channel IDs
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('m3u_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back
      }
    }
    // Default to empty array so favorites start at 0 on clean start or reset
    return [];
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('TODOS');
  const [currentTab, setCurrentTab] = useState<'channels' | 'favorites' | 'history'>('channels');
  
  // Importer drawer / overlay
  const [showImporter, setShowImporter] = useState(false);
  const [importTab, setImportTab] = useState<'url' | 'file' | 'text' | 'preset'>('url');
  
  // Importer Forms state
  const [importUrl, setImportUrl] = useState('');
  const [importUrlName, setImportUrlName] = useState('');
  const [importText, setImportText] = useState('');
  const [importTextName, setImportTextName] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Success Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Listbox states for Channel selector (keeps the player visible)
  const [isListboxOpen, setIsListboxOpen] = useState(false);
  const [listboxSearch, setListboxSearch] = useState('');
  const [listboxGroup, setListboxGroup] = useState('TODOS');

  // CORS playback proxy toggle state
  const [useCorsProxy, setUseCorsProxy] = useState(false);

  // Responsive / Layout UI
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isLargeMode, setIsLargeMode] = useState(false);
  const [isIrTransmitting, setIsIrTransmitting] = useState(false);

  const triggerIrPulse = () => {
    setIsIrTransmitting(true);
    const timeout = setTimeout(() => setIsIrTransmitting(false), 300);
  };



  // App Reset dialog trigger
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sidebar channel list pagination state
  const [sidebarPage, setSidebarPage] = useState(1);
  const itemsPerPage = 7; // 7 channels per page

  // Modern Dark Preloader States
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadText, setPreloadText] = useState('Iniciando Streamflow...');

  // Simulate premium loading phase
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 6;
      if (progress >= 100) {
        progress = 100;
        setPreloadProgress(100);
        setPreloadText('Sintonización lista. Cargando reproductor...');
        clearInterval(interval);
        const timeout = setTimeout(() => {
          setIsPreloading(false);
        }, 600);
        return;
      }
      
      if (progress > 85) {
        setPreloadText('Sincronizando biblioteca de canales...');
      } else if (progress > 60) {
        setPreloadText('Cargando listas preestablecidas...');
      } else if (progress > 35) {
        setPreloadText('Estableciendo conexión multimedia segura...');
      } else if (progress > 15) {
        setPreloadText('Preparando interfaz de usuario...');
      }
      setPreloadProgress(progress);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Restart/Reset Application action
  const handleResetApp = () => {
    localStorage.removeItem('m3u_playlists');
    localStorage.removeItem('m3u_favorites');
    localStorage.removeItem('m3u_history');
    localStorage.clear();
    window.location.reload();
  };

  // Refs to skip expensive stringify/save operations on initial mount
  const isInitialPlaylists = useRef(true);
  const isInitialFavorites = useRef(true);
  const isInitialHistory = useRef(true);

  // Save playlists, favorites, and history to localStorage only when actively updated
  useEffect(() => {
    if (isInitialPlaylists.current) {
      isInitialPlaylists.current = false;
      return;
    }
    localStorage.setItem('m3u_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    if (isInitialFavorites.current) {
      isInitialFavorites.current = false;
      return;
    }
    localStorage.setItem('m3u_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (isInitialHistory.current) {
      isInitialHistory.current = false;
      return;
    }
    localStorage.setItem('m3u_history', JSON.stringify(history));
  }, [history]);

  // Autohide Toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Get current selected playlist object
  const activePlaylist = useMemo(() => {
    return playlists.find(p => p.id === currentPlaylistId) || playlists[0] || null;
  }, [playlists, currentPlaylistId]);

  // Reset selected category to "TODOS" when playlist changes
  useEffect(() => {
    setSelectedGroup('TODOS');
    // Auto-select first channel of the new playlist if there are channels
    if (activePlaylist && Array.isArray(activePlaylist.items) && activePlaylist.items.length > 0) {
      setActiveChannel(activePlaylist.items[0]);
    } else {
      setActiveChannel(null);
    }
  }, [currentPlaylistId, activePlaylist]);

  // Reset pagination on filter change
  useEffect(() => {
    setSidebarPage(1);
  }, [currentPlaylistId, currentTab, selectedGroup, searchQuery]);

  // Extract all unique group-titles / categories of current playlist
  const uniqueGroups = useMemo(() => {
    if (!activePlaylist || !Array.isArray(activePlaylist.items)) return [];
    const groups = new Set<string>();
    activePlaylist.items.forEach(item => {
      if (item.group) {
        groups.add(item.group);
      }
    });
    return Array.from(groups).sort();
  }, [activePlaylist]);

  // Register channel play in history
  const handleSelectChannel = (channel: PlaylistItem) => {
    setActiveChannel(channel);
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    // Update history
    const newItem: PlaybackHistoryItem = {
      channelId: channel.id,
      channelName: channel.name,
      channelUrl: channel.url,
      channelGroup: channel.group,
      logo: channel.logo,
      playedAt: Date.now()
    };

    // Filter out previous entry if existed, and prepend top
    setHistory(prev => {
      const filtered = prev.filter(item => item.channelId !== channel.id);
      return [newItem, ...filtered].slice(0, 50); // maximum 50 history logs
    });

    // On mobile, auto collapse sidebar on play to focus on screen
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Channel navigation bindings
  const handleNextChannel = () => {
    triggerIrPulse();
    if (!filteredChannels.length || !activeChannel) return;
    const currentIndex = filteredChannels.findIndex(item => item.id === activeChannel.id);
    if (currentIndex !== -1 && currentIndex < filteredChannels.length - 1) {
      handleSelectChannel(filteredChannels[currentIndex + 1]);
    } else {
      // wrap around to top
      handleSelectChannel(filteredChannels[0]);
    }
  };

  const handlePrevChannel = () => {
    triggerIrPulse();
    if (!filteredChannels.length || !activeChannel) return;
    const currentIndex = filteredChannels.findIndex(item => item.id === activeChannel.id);
    if (currentIndex > 0) {
      handleSelectChannel(filteredChannels[currentIndex - 1]);
    } else {
      // wrap around to bottom
      handleSelectChannel(filteredChannels[filteredChannels.length - 1]);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    triggerIrPulse();
    setFavorites(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      } else {
        return [...prev, channelId];
      }
    });
  };

  // Download favorites as M3U playlist file
  const handleDownloadFavoritesM3U = () => {
    // Collect all items across all playlists whose ids are in favorites
    const favoriteItemsMap = new Map<string, PlaylistItem>();
    
    // Scan all playlists to get full info for each favorited channel ID
    playlists.forEach(pl => {
      if (pl && Array.isArray(pl.items)) {
        pl.items.forEach(item => {
          if (favorites.includes(item.id)) {
            favoriteItemsMap.set(item.id, item);
          }
        });
      }
    });

    const favoriteItems = Array.from(favoriteItemsMap.values());

    if (favoriteItems.length === 0) {
      setToastMessage("No tienes ningún canal guardado en tus favoritos.");
      return;
    }

    // Build the M3U content conforming to specification
    let m3uContent = "#EXTM3U\n";
    favoriteItems.forEach(item => {
      let extinf = "#EXTINF:-1";
      if (item.tvgId) {
        extinf += ` tvg-id="${item.tvgId}"`;
      }
      if (item.logo) {
        extinf += ` tvg-logo="${item.logo}"`;
      }
      if (item.group) {
        extinf += ` group-title="${item.group}"`;
      }
      m3uContent += `${extinf},${item.name}\n${item.url}\n`;
    });

    try {
      const blob = new Blob([m3uContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "canales_favoritos.m3u";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage("¡Lista M3U de favoritos descargada con éxito!");
    } catch (err) {
      console.error(err);
      setToastMessage("Error al intentar exportar los canales favoritos.");
    }
  };

  // Tab Filtering logic
  const filteredChannels = useMemo(() => {
    if (!activePlaylist || !Array.isArray(activePlaylist.items)) return [];

    let list: PlaylistItem[] = [];

    if (currentTab === 'channels') {
      list = activePlaylist.items;
      // category grouping filter
      if (selectedGroup !== 'TODOS') {
        list = list.filter(item => item.group === selectedGroup);
      }
    } else if (currentTab === 'favorites') {
      // For favorites, look across all channels in current playlist of overall channels
      // since the lists are linked. Let's filter active playlist elements that are marked favorite.
      list = activePlaylist.items.filter(item => favorites.includes(item.id));
    } else {
      // History tab
      const currentListUrls = new Set(activePlaylist.items.map(i => i.url));
      list = history
        .filter(hist => currentListUrls.has(hist.channelUrl))
        .map(hist => ({
          id: hist.channelId,
          name: hist.channelName,
          url: hist.channelUrl,
          group: hist.channelGroup,
          logo: hist.logo
        }));
    }

    // Direct text search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.group && item.group.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activePlaylist, currentTab, selectedGroup, history, favorites, searchQuery]);

  // Paginated channels for sidebar listing
  const paginatedChannels = useMemo(() => {
    const startIndex = (sidebarPage - 1) * itemsPerPage;
    return filteredChannels.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChannels, sidebarPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredChannels.length / itemsPerPage) || 1;
  }, [filteredChannels]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include page 1
      pages.push(1);
      
      const start = Math.max(2, sidebarPage - 1);
      const end = Math.min(totalPages - 1, sidebarPage + 1);
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    return pages;
  };

  // Wrap active channel with CORS proxy url if toggle is active
  const proxiedChannel = useMemo(() => {
    if (!activeChannel) return null;
    if (!useCorsProxy) return activeChannel;

    // Detect if the application is running as a static deployment (e.g., GitHub Pages)
    const isStaticDeploy = typeof window !== 'undefined' && (
      window.location.hostname.endsWith('github.io') ||
      (window.location.hostname !== 'localhost' && 
       window.location.hostname !== '127.0.0.1' && 
       window.location.hostname !== '0.0.0.0' && 
       !window.location.hostname.endsWith('.run.app'))
    );

    const proxyUrl = isStaticDeploy
      ? `https://corsproxy.io/?${encodeURIComponent(activeChannel.url)}`
      : `/api/proxy?url=${encodeURIComponent(activeChannel.url)}`;

    return {
      ...activeChannel,
      url: proxyUrl
    };
  }, [activeChannel, useCorsProxy]);

  // Listbox filtering logic for Quick Channel selector
  const listboxFilteredChannels = useMemo(() => {
    if (!activePlaylist || !Array.isArray(activePlaylist.items)) return [];

    let list = activePlaylist.items;

    // Filter by group selected inside the listbox
    if (listboxGroup !== 'TODOS') {
      list = list.filter(item => item.group === listboxGroup);
    }

    // Filter by the search queries inside the listbox
    if (listboxSearch.trim() !== '') {
      const q = listboxSearch.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.group && item.group.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activePlaylist, listboxGroup, listboxSearch]);

  // Parse file contents when dropped / uploaded
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportTextName(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportFileContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleImportPlaylist = async () => {
    setImportError(null);
    setIsImporting(true);

    try {
      let rawContent = '';
      let listName = '';

      if (importTab === 'url') {
        if (!importUrl) {
          throw new Error('Por favor ingresa una URL válida.');
        }
        listName = importUrlName.trim() || `Lista: ${new URL(importUrl).hostname}`;

        // Attempt direct download first, if it fails due to CORS, use public proxy CORS secondary backup
        try {
          const directRes = await fetch(importUrl);
          if (!directRes.ok) throw new Error('CORS o Servidor no responde');
          rawContent = await directRes.text();
        } catch {
          // CORS Fallback proxy
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(importUrl)}`;
          const proxyRes = await fetch(proxyUrl);
          if (!proxyRes.ok) {
            throw new Error('No se pudo descargar la lista de este enlace. Comprueba si el enlace es correcto y tiene formato de texto plano.');
          }
          rawContent = await proxyRes.text();
        }
      } else if (importTab === 'file') {
        if (!importFileContent) {
          throw new Error('Por favor selecciona un archivo .M3U en tu dispositivo.');
        }
        listName = importTextName.trim() || importFileName || 'Lista Importada';
        rawContent = importFileContent;
      } else if (importTab === 'text') {
        if (!importText.trim()) {
          throw new Error('Pega el contenido raw del archivo M3U en el apartado de texto.');
        }
        listName = importTextName.trim() || `Mi Lista Manual ${playlists.length + 1}`;
        rawContent = importText;
      }

      // Check if file seems valid
      if (!rawContent.includes('#EXTM3U') && !rawContent.includes('#EXTINF')) {
        // Fallback: parse whatever strings look like URLs
        if (!rawContent.includes('http')) {
          throw new Error('El archivo no parece ser un formato playlist M3U válido ni contiene URLs de streaming.');
        }
      }

      const parsedItems = parseM3U(rawContent);
      if (parsedItems.length === 0) {
        throw new Error('No se encontraron canales válidos dentro del formato playlist provisto.');
      }

      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        name: listName,
        items: parsedItems,
        sourceType: importTab === 'file' ? 'file' : importTab === 'text' ? 'text' : 'url',
        sourceValue: importTab === 'url' ? importUrl : listName,
        createdAt: Date.now()
      };

      setPlaylists(prev => [newPlaylist, ...prev]);
      setCurrentPlaylistId(newPlaylist.id);
      
      // Select the first channel automatically
      setActiveChannel(newPlaylist.items[0]);
      
      setToastMessage(`¡Éxito! Cargada list '${listName}' con ${parsedItems.length} canales.`);
      
      // Reset Form State
      setImportUrl('');
      setImportUrlName('');
      setImportText('');
      setImportTextName('');
      setImportFileName('');
      setImportFileContent('');
      setShowImporter(false);
    } catch (err: any) {
      setImportError(err.message || 'Error desconocido al procesar la lista.');
    } finally {
      setIsImporting(false);
    }
  };

  // Quick Preset Importer
  const handleLoadIPTVOrgPreset = async (presetId: string) => {
    // Check if preset is already loaded
    const exists = playlists.some(p => p.id === presetId);
    if (exists) {
      if (presetId === 'default-demos') {
        const freshDemo = PRESET_PLAYLISTS.find(d => d.id === 'default-demos');
        if (freshDemo) {
          setPlaylists(prev => prev.map(p => {
            if (p.id === 'default-demos') {
              return {
                ...p,
                name: freshDemo.name,
                items: freshDemo.items,
                sourceValue: freshDemo.sourceValue
              };
            }
            return p;
          }));
          // Make sure we set the active channel to the first item if there was none
          if (freshDemo.items && freshDemo.items.length > 0 && !activeChannel) {
            setActiveChannel(freshDemo.items[0]);
          }
        }
      }
      setCurrentPlaylistId(presetId);
      setToastMessage('Lista de canales cargada con éxito.');
      setShowImporter(false);
      return;
    }

    setImportError(null);
    setIsImporting(true);

    const presetOption = PRESET_PLAYLISTS.find(p => p.id === presetId);
    if (!presetOption) return;

    try {
      let items: PlaylistItem[] = [];

      // Demos are already preloaded client-side
      if (presetOption.sourceType === 'preset') {
        items = presetOption.items;
      } else {
        // Fetch via allorigins proxy to bypass strict github raw CORS on client
        const fileUrl = (presetOption as any).url;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fileUrl)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Error al conectar con la red de GitHub');
        const text = await res.text();
        items = parseM3U(text);
      }

      if (!items.length) throw new Error('No pudimos analizar canales del origen externo.');

      const newPlaylist: Playlist = {
        id: presetOption.id,
        name: presetOption.name,
        items: items,
        sourceType: presetOption.sourceType as any,
        sourceValue: presetOption.sourceValue,
        createdAt: Date.now()
      };

      setPlaylists(prev => [newPlaylist, ...prev]);
      setCurrentPlaylistId(newPlaylist.id);
      setToastMessage(`¡Éxito! Importados ${items.length} canales públicos en vivo.`);
      setShowImporter(false);
    } catch (err: any) {
      setImportError('No se pudo cargar la lista debido a bloqueo CORS o red saturada. Inténtalo más tarde.');
    } finally {
      setIsImporting(false);
    }
  };

  // Remove custom user playlist (Builtin playlist CANNOT be deleted, only hidden/reset)
  const handleDeletePlaylist = (playlistId: string) => {
    if (playlistId === 'default-demos') {
      setToastMessage('La lista de demostración integrada no puede ser eliminada.');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta lista del reproductor?')) {
      const remaining = playlists.filter(p => p.id !== playlistId);
      setPlaylists(remaining);
      
      if (currentPlaylistId === playlistId) {
        setCurrentPlaylistId(remaining[0]?.id || 'default-demos');
      }
      setToastMessage('Lista eliminada del sistema.');
    }
  };

  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2500);
  };



  return (
    <div className="min-h-screen bg-dark-bg font-sans text-gray-300 flex flex-col selection:bg-indigo-500/30 selection:text-white" id="m3u-app-root">
      
      {/* MODERN MINIMALIST DARK LOADING SPLASH SCREEN */}
      <AnimatePresence>
        {isPreloading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-[#07080c] flex flex-col items-center justify-center ss-overlay overflow-hidden text-white"
            id="modern-preloader"
          >
            {/* Soft, beautiful ambient glowing backdrops (very dark and moody) */}
            <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative max-w-lg w-full px-6 flex flex-col items-center z-10 text-center">
              {/* Logo / Title animation */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-8"
              >
                <div className="relative flex flex-col items-center bg-dark-card border border-dark-border p-10 rounded-2xl shadow-2xl max-w-sm">
                  {/* Modern circular loader wheel design */}
                  <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-2 border-white/5"></span>
                    <span className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin"></span>
                    <Tv className="w-7 h-7 text-indigo-400 relative z-10" />
                  </div>
                  
                  <h2 className="text-2xl font-black tracking-[0.25em] text-white select-none">
                    STREAMFLOW
                  </h2>
                  <div className="h-[1px] w-20 bg-white/10 my-3"></div>
                  <span className="text-[10px] tracking-[0.25em] text-white/50 uppercase font-medium">
                    Sintonizador de IPTV Moderno
                  </span>
                </div>
              </motion.div>

              {/* Elegant Progress bar container */}
              <div className="w-full bg-dark-card/90 border border-dark-border rounded-xl p-6 backdrop-blur-xl shadow-lg">
                <div className="flex justify-between items-center mb-2.5 text-xs text-white/70">
                  <span className="font-semibold text-white/40 uppercase tracking-widest text-[9px]">Sintonizando</span>
                  <span className="font-semibold text-indigo-400 text-sm font-mono">{preloadProgress}%</span>
                </div>
 
                {/* Modern subtle loading bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${preloadProgress}%` }}
                    transition={{ ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                  />
                </div>
 
                {/* Description status subtext */}
                <div className="mt-3.5 flex items-center gap-2 justify-center text-[11px] text-white/50 font-sans tracking-normal lowercase first-letter:uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="truncate max-w-[280px] font-medium">{preloadText}</span>
                </div>
              </div>
 
              {/* Hub specs footer info */}
              <div className="mt-12 text-[10px] text-white/20 tracking-[0.15em] uppercase font-mono flex gap-4">
                <span>Multi-codec</span>
                <span>•</span>
                <span>HLS / M3U</span>
                <span>•</span>
                <span>Bajo Latencia</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
         {/* ELGEGANT HEADER BAR */}
      <header className={`sticky top-0 z-40 bg-dark-card/90 border-b border-white/5 shadow-xl backdrop-blur-md px-6 py-4 ${isLargeMode ? 'hidden lg:flex' : 'flex'} items-center justify-between`} id="app-header-navigation">
        <div className="flex items-center gap-4">
          {/* Mobile Menu trigger */}
          <button 
            className="lg:hidden p-2 hover:bg-white/5 hover:border-white/15 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
  
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white shadow-md">
              <Tv size={18} className="shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-wider text-white leading-none">
                  STREAMFLOW
                </h1>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-semibold px-1.5 py-0.5 rounded">
                  PLAYER
                </span>
              </div>
              <p className="text-[10px] text-white/40 leading-none tracking-wider mt-1.5 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                CONEXIÓN ESTABLE
              </p>
            </div>
          </div>
        </div>
  
        {/* Global actions */}
        <div className="flex items-center gap-3">
          {/* Restart/Reset App Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="group px-3 py-2 flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/70 hover:text-white text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer"
            id="reset-app-header-trigger"
            title="Reiniciar Aplicación (Valores de fábrica)"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span className="inline-block text-[11px]">Reiniciar</span>
          </button>
  
          <button
            onClick={() => setShowImporter(true)}
            className="px-4 py-2 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/10 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-indigo-500/15 transition-all duration-150 active:scale-95 cursor-pointer"
            id="import-playlist-top-trigger"
          >
            <FolderPlus size={14} className="shrink-0" />
            <span className="hidden sm:inline">Importar Lista</span>
          </button>
        </div>
      </header>

      {/* PRIMARY CONSOLE LAYOUT */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative" id="primary-console">
        
        {/* MOBILE SIDEBAR OVERLAY */}
        {sidebarOpen && !isLargeMode && (
          <div 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-all duration-300"
            id="mobile-sidebar-backdrop-overlay"
          />
        )}

        {/* SIDEBAR NAVIGATION (PLAYLISTS & CHANNELS DIRECTORY) */}
        <aside 
          className={`fixed inset-y-0 left-0 h-full z-50 lg:relative lg:inset-auto lg:h-full bg-dark-card flex flex-col transition-all duration-300 border-r border-white/5 lg:border-r ${
            isLargeMode ? 'hidden lg:flex' : ''
          } ${
            sidebarOpen 
              ? 'w-[85vw] sm:w-80 lg:w-96 translate-x-0 opacity-100 shrink-0' 
              : 'w-[85vw] sm:w-80 lg:w-0 -translate-x-full lg:translate-x-0 lg:opacity-0 lg:overflow-hidden lg:pointer-events-none lg:border-none'
          }`}
          id="channels-sidebar-navigation"
        >
          {/* Playlist selector block */}
          <div className="p-4 border-b border-white/5 bg-dark-card sticky top-0 z-10">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 text-white/50 hover:text-white transition rounded-lg hover:bg-white/5"
                  title="Cerrar menú"
                >
                  <X size={15} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold font-sans">Listas de Canales</span>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2.5 py-0.5 rounded font-sans tracking-wide font-extrabold uppercase">{activePlaylist?.items.length || 0} CANALES</span>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={currentPlaylistId}
                  onChange={(e) => setCurrentPlaylistId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white/95 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer transition-colors"
                >
                  {playlists.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0e0f14] text-white">
                      {p.name} ({p.items.length})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/45">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>

              {currentPlaylistId !== 'default-demos' && (
                <button
                  onClick={() => handleDeletePlaylist(currentPlaylistId)}
                  className="p-2 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 rounded-lg border border-red-500/15 transition-all cursor-pointer"
                  title="Eliminar Playlist de la Base"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Directory Tabs */}
          <div className="px-4 py-2 flex border-b border-white/5 bg-dark-card/90 gap-1.5 text-[11px]">
            <button
              onClick={() => { setCurrentTab('channels'); setSelectedGroup('TODOS'); }}
              className={`flex-1 py-1.5 px-1 flex items-center justify-center gap-1 my-1 rounded-md font-bold tracking-wide transition cursor-pointer ${
                currentTab === 'channels' 
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <List size={13} /> SINTONIZAR
            </button>
            <button
              onClick={() => setCurrentTab('favorites')}
              className={`flex-1 py-1.5 px-1 flex items-center justify-center gap-1 my-1 rounded-md font-bold tracking-wide transition cursor-pointer ${
                currentTab === 'favorites' 
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Star size={13} /> FAVORITOS
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`flex-1 py-1.5 px-1 flex items-center justify-center gap-1 my-1 rounded-md font-bold tracking-wide transition cursor-pointer ${
                currentTab === 'history' 
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock size={13} /> HISTORIAL
            </button>
          </div>

          {/* Real-time search filter */}
          <div className="p-4 border-b border-white/5 bg-[#0e1017]">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Buscar canal o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9.5 pr-8 py-2 text-xs text-white placeholder-white/30 font-sans focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Category Pill Filter (Only on Channel list mode) */}
          {currentTab === 'channels' && uniqueGroups.length > 0 && (
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar bg-[#090b10]">
              <button
                onClick={() => setSelectedGroup('TODOS')}
                className={`text-[10px] shrink-0 font-bold uppercase tracking-wider px-3 py-1.5 rounded transition cursor-pointer ${
                  selectedGroup === 'TODOS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                TODOS ({activePlaylist?.items.length || 0})
              </button>
              {uniqueGroups.map(grp => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`text-[10px] shrink-0 font-bold uppercase tracking-wider px-3 py-1.5 rounded transition cursor-pointer ${
                    selectedGroup === grp
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable channels result list */}
          <div className="flex-1 overflow-y-auto bg-dark-card/30" id="channels-list">
            {currentTab === 'favorites' && favorites.length > 0 && (
              <div className="p-3.5 bg-indigo-500/5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 bg-[#0e1017]/95 backdrop-blur z-10 self-stretch">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
                    <Star size={14} className="fill-indigo-500/10" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight uppercase tracking-wider">M3U DE FAVORITOS</h4>
                    <p className="text-[10px] font-medium text-white/40 leading-none mt-1">{favorites.length} CANALES EN MEMORIA</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadFavoritesM3U}
                  className="w-full sm:w-auto px-4 py-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none"
                >
                  <Download size={14} />
                  <span>Exportar (.m3u)</span>
                </button>
              </div>
            )}

            {filteredChannels.length === 0 ? (
              <div className="p-12 text-center text-white/30 select-none flex flex-col items-center">
                <Video size={36} className="text-white/10 mb-2" />
                <p className="text-sm font-semibold text-white/40">No se encontraron canales</p>
                <p className="text-[11px] text-white/30 mt-1 max-w-[200px] mb-4">
                  {currentTab === 'favorites' 
                    ? 'Marca estrellas en tus canales preferidos para verlos guardados aquí.' 
                    : 'Prueba modificando los criterios de búsqueda o cargando otra lista.'}
                </p>
                {currentTab === 'favorites' && (
                  <button
                    onClick={() => {
                      const defaultDemo = PRESET_PLAYLISTS.find(p => p.id === 'default-demos');
                      if (defaultDemo) {
                        setFavorites(defaultDemo.items.map(c => c.id));
                        setToastMessage('Lista de canales predeterminada agregada a tus favoritos.');
                      }
                    }}
                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer mt-2"
                  >
                    ⭐ Cargar Canales Predeterminados
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5 bg-[#090a0f]">
                {paginatedChannels.map((item, index) => {
                  const isPlaying = activeChannel?.id === item.id;
                  const isFav = favorites.includes(item.id);

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      onClick={() => handleSelectChannel(item)}
                      className={`group/item flex items-center justify-between p-3.5 cursor-pointer border-b border-white/[0.02] transition-all duration-150 ${
                        isPlaying 
                          ? 'bg-indigo-600/10 border-l-2 border-indigo-500' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden mr-2">
                        {/* Stream Logo */}
                        <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded bg-[#10121a] border border-white/5 relative overflow-hidden">
                          {item.logo ? (
                            <img 
                              src={item.logo} 
                              alt=""
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-contain p-0.5 z-10"
                              onError={(e) => {
                                // Fallback
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          {/* Fallback Initials */}
                          <div className="absolute inset-0 flex items-center justify-center bg-[#07080f] text-[10px] tracking-wider font-extrabold text-white/30 uppercase select-none font-sans">
                            {item.name.slice(0, 2).toUpperCase()}
                          </div>
                        </div>

                        {/* Text Metadata */}
                        <div className="overflow-hidden">
                          <h4 className={`text-[13px] font-sans font-medium tracking-tight truncate transition-colors duration-150 ${isPlaying ? 'text-indigo-400 font-bold' : 'text-white/80 group-hover/item:text-indigo-400'}`}>
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-white/40 block truncate uppercase tracking-widest mt-0.5 font-sans">
                            {item.group || 'SIN GRUPO'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons on hover */}
                      <div className="flex items-center shrink-0 gap-1 opacity-45 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleToggleFavorite(e, item.id)}
                          className={`p-1.5 rounded hover:bg-white/5 transition cursor-pointer ${isFav ? 'text-indigo-400 opacity-100' : 'text-white/40 hover:text-indigo-400'}`}
                        >
                          <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar channel directory dynamic pagination */}
          {filteredChannels.length > itemsPerPage && (
            <div className="p-4 bg-dark-card/95 border-t border-white/5 flex flex-col gap-3 shrink-0 font-sans select-none">
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>
                  Canales <strong className="text-white/75 font-semibold">
                    {Math.min(filteredChannels.length, (sidebarPage - 1) * itemsPerPage + 1)}-{Math.min(filteredChannels.length, sidebarPage * itemsPerPage)}
                  </strong> de <strong className="text-white/75 font-semibold">{filteredChannels.length}</strong>
                </span>
                <span className="font-mono text-[10px]">
                  Filtro: {sidebarPage} / {totalPages}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 mt-0.5">
                {/* Previous page button */}
                <button
                  onClick={() => setSidebarPage(prev => Math.max(1, prev - 1))}
                  disabled={sidebarPage === 1}
                  className="p-2 rounded-lg border border-white/5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                  title="Página Anterior"
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Numbered selector page pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {getPageNumbers().map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellip-aside-${idx}`} className="px-2.5 py-1 text-xs text-white/30 select-none">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={`page-aside-${p}`}
                        onClick={() => setSidebarPage(Number(p))}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-100 cursor-pointer ${
                          sidebarPage === p
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Next page button */}
                <button
                  onClick={() => setSidebarPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={sidebarPage === totalPages}
                  className="p-2 rounded-lg border border-white/5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                  title="Página Siguiente"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* CINEMA SCREEN & STREAM CONTROL CENTER CONTAINER */}
        <section className="order-1 lg:order-2 flex-1 flex flex-col overflow-y-auto p-4 md:p-6 min-h-0" id="cinema-board">
          
          {/* Collapse channel menu trigger */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              <List size={14} />
              {sidebarOpen ? 'Ocultar Canales' : 'Mostrar Canales'}
            </button>

            {/* Quick status text */}
            <div className="flex items-center gap-2.5 text-[11px] text-white/40 tracking-wide font-sans">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Lista: <strong className="text-white/80 font-semibold">{activePlaylist?.name}</strong></span>
              <span className="text-white/10">|</span>
              <span>Canales: <strong className="text-white/80 font-semibold font-mono">{activePlaylist?.items.length || 0}</strong></span>
            </div>
          </div>

          {/* Dynamic Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Stage Column (Media Player & Meta details) - Keeps player fixed while page scrolls */}
            <div className="xl:col-span-2 flex flex-col gap-5 sticky top-0 xl:sticky xl:top-[16px] z-20 bg-dark-bg pb-2">
              
              {/* Media Player wrapper */}
              <VideoPlayer 
                channel={proxiedChannel}
                autoPlay={true}
                onPrevChannel={handlePrevChannel}
                onNextChannel={handleNextChannel}
                isLargeMode={isLargeMode}
                onToggleLargeMode={() => setIsLargeMode(!isLargeMode)}
              />

              {/* CONTROL REMOTO VIRTUAL PREMIUM (Mando de Smart TV) */}
              <div className="flex flex-col items-center justify-center py-4 px-5 bg-zinc-950 border border-zinc-850 rounded-3xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.8)] select-none relative overflow-visible mx-auto w-full max-w-[340px]" id="tv-remote-floating-control">
                {/* Infrared Glass emitter at the top bezel */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-3 bg-zinc-900 rounded-b-lg border-b border-x border-zinc-750 flex justify-center items-center overflow-hidden">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    isIrTransmitting 
                      ? 'bg-red-500 shadow-[0_0_12px_#ef4444,0_0_15px_rgba(239,68,68,1)]' 
                      : 'bg-red-950'
                  }`} />
                </div>

                {/* Decorative Brand */}
                <span className="text-[9px] font-sans tracking-[0.25em] text-zinc-500 font-extrabold uppercase mb-3">
                  STREAMFLOW CONTROLLER
                </span>

                {/* The Remote D-Pad & volume toggles */}
                <div className="flex items-center justify-center gap-5 w-full">
                  {/* Left rocker: Volume control */}
                  <div className="flex flex-col items-center justify-center bg-zinc-900/60 border border-zinc-800/80 px-2.5 py-2.5 rounded-2xl shadow-inner shrink-0">
                    <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider mb-2">VOL</span>
                    <button 
                      onClick={() => triggerIrPulse()}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-90 p-1.5 rounded-lg font-black transition text-xs cursor-pointer"
                    >
                      ＋
                    </button>
                    <div className="h-[1px] w-4 bg-zinc-850 my-1" />
                    <button 
                      onClick={() => triggerIrPulse()}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-90 p-1.5 rounded-lg font-black transition text-xs cursor-pointer"
                    >
                      －
                    </button>
                  </div>

                  {/* Center Wheel: Circular tact-switch D-pad */}
                  <div className="relative w-32 h-32 rounded-full bg-zinc-900 border-4 border-zinc-850 shadow-[inset_0_4px_10px_rgba(0,0,0,0.87)] flex items-center justify-center scale-100 sm:scale-105">
                    {/* Top direction button */}
                    <button 
                      onClick={() => triggerIrPulse()}
                      className="absolute top-1.5 text-zinc-500 hover:text-indigo-400 active:scale-90 transition text-xs font-bold leading-none cursor-pointer"
                    >
                      ▲
                    </button>

                    {/* Bottom direction button */}
                    <button 
                      onClick={() => triggerIrPulse()}
                      className="absolute bottom-1.5 text-zinc-500 hover:text-indigo-400 active:scale-95 transition text-xs font-bold leading-none cursor-pointer"
                    >
                      ▼
                    </button>

                    {/* Left: Previous Channel button (CH -) */}
                    <button 
                      onClick={handlePrevChannel}
                      className="absolute left-1.5 flex flex-col items-center justify-center text-zinc-400 hover:text-indigo-400 active:scale-90 transition cursor-pointer"
                      title="Canal Anterior"
                    >
                      <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-tighter">CH</span>
                      <span className="text-[10px] font-bold">◀</span>
                    </button>

                    {/* Right: Next Channel button (CH +) */}
                    <button 
                      onClick={handleNextChannel}
                      className="absolute right-1.5 flex flex-col items-center justify-center text-zinc-400 hover:text-indigo-400 active:scale-90 transition cursor-pointer"
                      title="Canal Siguiente"
                    >
                      <span className="text-[8px] font-bold uppercase text-zinc-505 tracking-tighter">CH</span>
                      <span className="text-[10px] font-bold">▶</span>
                    </button>

                    {/* Center Click: STAR FAVORITE toggle */}
                    <button 
                      onClick={(e) => activeChannel && handleToggleFavorite(e, activeChannel.id)}
                      disabled={!activeChannel}
                      className={`w-14 h-14 rounded-full border border-zinc-805 shadow-[0_5px_8px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center gap-0.5 transition duration-150 active:scale-90 disabled:opacity-25 disabled:pointer-events-none cursor-pointer ${
                        activeChannel && favorites.includes(activeChannel.id)
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300'
                      }`}
                      title="Favorito (OK)"
                    >
                      <Star size={13} fill={activeChannel && favorites.includes(activeChannel.id) ? 'currentColor' : 'none'} className={activeChannel && favorites.includes(activeChannel.id) ? 'text-amber-400 animate-pulse' : 'text-zinc-400'} />
                      <span className="text-[7.5px] font-black uppercase tracking-wider">OK</span>
                    </button>
                  </div>

                  {/* Right rocker: Channel Selector / Mute shortcuts */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        triggerIrPulse();
                        setIsListboxOpen(prev => !prev);
                      }}
                      className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/30 active:scale-90 transition shadow-inner flex items-center justify-center cursor-pointer"
                      title="Lista de Canales"
                    >
                      <List size={13} />
                    </button>
                    <button 
                      onClick={() => triggerIrPulse()}
                      className="py-2.5 px-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-[8px] font-black text-zinc-500 hover:text-zinc-250 hover:border-zinc-750 active:scale-90 transition shadow-inner cursor-pointer"
                      title="Mute"
                    >
                      MUTE
                    </button>
                  </div>
                </div>

                {/* Simulated IR Indicator flash visual helper */}
                {isIrTransmitting && (
                  <div className="absolute inset-x-0 -bottom-5 flex justify-center animate-fade-in">
                    <span className="text-[8px] font-bold text-red-500 tracking-widest uppercase animate-pulse">
                      ⚡ SEÑAL IR ENVIADA ⚡
                    </span>
                  </div>
                )}
              </div>

              {/* Botón premium para móviles: Ver en grande o expandir */}
              {proxiedChannel && (
                <button
                  onClick={() => setIsLargeMode(true)}
                  className="lg:hidden flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  id="mobile-expand-player-btn"
                >
                  <Maximize2 size={16} />
                  <span>Ver en Pantalla Grande</span>
                </button>
              )}

              {/* Panel de Control Sintonizador Moderno (Acoplado bajo el reproductor) */}
              <div className="bg-dark-card border border-white/5 rounded-2xl p-5 select-none flex flex-col gap-3.5 shadow-2xl relative overflow-hidden" id="led-console-controls">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-white/40 uppercase">
                  <span>SINTONIZADOR DE ACCIONES</span>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeChannel ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${activeChannel ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    </span>
                    <span className={activeChannel ? "text-emerald-400 font-bold" : "text-amber-400 font-semibold"}>
                      {activeChannel ? "ONLINE" : "STANDBY"}
                    </span>
                  </div>
                </div>

                {/* Bezel Screen display */}
                <div className="bg-[#0b0c10] rounded-xl border border-white/5 p-4 flex items-center justify-between relative overflow-hidden shadow-inner font-mono">
                  <div className="flex flex-col gap-1 z-10 overflow-hidden pr-2">
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Canal Actual</span>
                    <span className="text-xs sm:text-sm text-indigo-300 font-bold tracking-wide truncate uppercase">
                      {activeChannel ? activeChannel.name : 'SELECCIONAR CANAL'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 z-10 shrink-0">
                    {/* Simulated visualizer bars */}
                    <div className="flex gap-0.5 h-3 items-end">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <span 
                          key={`led-bar-${bar}`} 
                          className={`w-1 rounded transition-all duration-300 ${
                            activeChannel 
                              ? 'bg-indigo-400 animate-pulse' 
                              : 'bg-white/10'
                          }`}
                          style={{ 
                            height: activeChannel ? `${Math.floor(Math.random() * 10) + 6}px` : '4px',
                            animationDelay: `${bar * 150}ms`
                          }}
                        />
                      ))}
                    </div>

                    {/* Channel counter badge */}
                    <div className="bg-[#14151a] px-3 py-1 rounded border border-white/5 flex items-center justify-center gap-1.5">
                      <span className="text-[10px] font-bold text-white/30 font-sans">Nº</span>
                      <span className="text-xs sm:text-sm font-bold text-white tracking-widest">
                        {activeChannel && filteredChannels.length > 0 
                          ? String(filteredChannels.findIndex(item => item.id === activeChannel.id) + 1).padStart(3, '0')
                          : '000'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Canal Listbox Selector (Siempre Visible al lado/bajo del reproductor) */}
              <div className="relative mt-2 px-1" id="channel-selector-listbox">
                <div className="relative">
                  <button
                    onClick={() => setIsListboxOpen(!isListboxOpen)}
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-5 py-3 bg-dark-card hover:bg-white/[0.04] border border-white/5 rounded-xl text-left text-xs font-semibold text-white transition shadow-lg backdrop-blur-md cursor-pointer select-none font-sans"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-7 h-7 flex items-center justify-center shrink-0 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                        <Tv size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold leading-none">Selector de Canales (Listbox)</span>
                        <span className="truncate mt-1 text-xs sm:text-sm font-semibold text-white leading-tight">
                          {activeChannel ? activeChannel.name : 'Selecciona un canal...'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2.5 py-0.5 rounded font-bold uppercase">
                        {listboxFilteredChannels.length} disponibles
                      </span>
                      <ChevronRight size={15} className={`text-white/45 transition-transform duration-300 ${isListboxOpen ? 'rotate-90 scale-y-[-1]' : 'rotate-90'}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isListboxOpen && (
                      <>
                        {/* Backdrop overlay to handle dismiss clicking outside */}
                        <div 
                          className="fixed inset-0 z-40 bg-transparent cursor-default" 
                          onClick={() => setIsListboxOpen(false)} 
                        />
                        
                        <motion.div 
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 mt-2 bg-dark-card border border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80"
                        >
                          {/* Search controller INSIDE Listbox */}
                          <div className="p-3 border-b border-white/5 bg-[#0e1017] flex items-center gap-2.5">
                            <Search size={14} className="text-white/30 shrink-0 ml-1.5" />
                            <input
                              type="text"
                              value={listboxSearch}
                              onChange={(e) => setListboxSearch(e.target.value)}
                              placeholder="Filtro rápido de canales..."
                              className="w-full bg-transparent border-none text-xs text-white placeholder-white/20 focus:outline-none focus:ring-0 leading-tight py-1 font-semibold font-sans"
                              autoFocus
                            />
                            {listboxSearch && (
                              <button 
                                onClick={() => setListboxSearch('')}
                                className="text-white/40 hover:text-white transition p-1 shrink-0 cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          {/* Group-titles horizontal category tabs */}
                          {uniqueGroups.length > 0 && (
                            <div className="flex gap-1.5 p-2 bg-[#090b10] overflow-x-auto border-b border-white/5 scrollbar-thin shrink-0 select-none no-scrollbar">
                              <button
                                onClick={() => setListboxGroup('TODOS')}
                                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition shrink-0 cursor-pointer ${
                                  listboxGroup === 'TODOS'
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                Todos ({activePlaylist?.items.length || 0})
                              </button>
                              {uniqueGroups.map(grp => (
                                <button
                                  key={`listbox-grp-${grp}`}
                                  onClick={() => setListboxGroup(grp)}
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition shrink-0 cursor-pointer ${
                                    listboxGroup === grp
                                      ? 'bg-indigo-600 text-white font-bold'
                                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  {grp}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Value choices lists */}
                          <div className="overflow-y-auto max-h-[200px] divide-y divide-white/5 scrollbar-thin bg-dark-card">
                            {listboxFilteredChannels.length === 0 ? (
                              <div className="p-8 text-center text-white/30 select-none flex flex-col items-center justify-center">
                                <Video size={24} className="text-white/10 mb-2 animate-pulse" />
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Ningún canal coincide</span>
                              </div>
                            ) : (
                              listboxFilteredChannels.map((item, index) => {
                                const isSelected = activeChannel?.id === item.id;
                                return (
                                  <button
                                    key={`listbox-item-${item.id}-${index}`}
                                    onClick={() => {
                                      handleSelectChannel(item);
                                      setIsListboxOpen(false);
                                    }}
                                    type="button"
                                    className={`w-full flex items-center justify-between p-3 px-4.5 text-left transition duration-150 cursor-pointer ${
                                      isSelected 
                                        ? 'bg-indigo-600/10 text-indigo-400 font-bold border-l-2 border-indigo-500'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      {/* Logo / fallback placeholder */}
                                      <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded bg-[#10121a] border border-white/5 overflow-hidden text-[9px] font-bold">
                                        {item.logo ? (
                                          <img 
                                            src={item.logo} 
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                            className="w-full h-full object-contain p-0.5"
                                            onError={(e) => {
                                              (e.target as HTMLElement).style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          item.name.slice(0, 2).toUpperCase()
                                        )}
                                      </div>
                                      <div className="truncate">
                                        <p className="text-xs truncate font-medium text-white/95">{item.name}</p>
                                        <p className="text-[9.5px] text-white/40 tracking-wide truncate uppercase mt-0.5 font-sans">{item.group || 'SIN GRUPO'}</p>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <Check size={14} className="text-indigo-400 shrink-0 ml-3" />
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Connected Track Details Panel */}
              {activeChannel && (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-lg flex flex-col gap-5 divide-y divide-white/5">
                  
                  {/* Info and Actions Row */}
                  <div className="flex flex-col md:flex-row gap-5 items-start justify-between w-full">
                    <div className="flex gap-4 items-start">
                      <div className="h-12 w-12 rounded-xl bg-[#151515] border border-white/5 text-[#e0e0e0] flex items-center justify-center font-bold text-base p-1.5 shrink-0">
                        {activeChannel.logo ? (
                          <img 
                            src={activeChannel.logo} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-contain rounded" 
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{activeChannel.name.slice(0,2).toUpperCase()}</span>
                        )}
                      </div>

                      <div>
                        <h2 className="text-base font-semibold text-white tracking-tight">{activeChannel.name}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="px-3 py-0.5 bg-white/5 text-[10px] text-white/60 font-medium uppercase rounded-full tracking-wider border border-white/5">
                            {activeChannel.group || 'Sin Grupo'}
                          </span>
                          
                          <span className="text-white/10">•</span>

                          <span className="text-xs text-white/40 font-mono tracking-tight line-clamp-1 break-all select-all">
                            {activeChannel.url}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions for Channel */}
                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end pt-2.5 md:pt-0 border-t border-white/5 md:border-none">
                      <button
                        onClick={() => handleCopyClipboard(activeChannel.url)}
                        className="px-3.5 py-1.5 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-medium text-white/80 hover:text-white transition cursor-pointer"
                        title="Copiar URL del canal multimedia"
                      >
                        {copiedUrl === activeChannel.url ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span className="text-emerald-400">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copiar URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Anti-blocking Proxy Assistant row */}
                  <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-3 items-start max-w-xl">
                      <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                        <AlertCircle size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">Asistente de Reproducción / Proxy Antiprotección (CORS)</h4>
                        <p className="text-[10.5px] text-white/45 mt-1 leading-normal">
                          ¿El canal no se reproduce o genera errores de conexión? Activa esta opción para encauzar el stream a través del proxy de la aplicación, evadiendo restricciones de origen cruzado (CORS) de forma directa y fluida.
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setUseCorsProxy(!useCorsProxy)}
                      className={`w-full md:w-auto px-4.5 py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-extrabold cursor-pointer transition select-none active:scale-95 ${
                        useCorsProxy
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/20 border-none'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      <Wifi size={14} className={useCorsProxy ? 'animate-pulse' : ''} />
                      <span>{useCorsProxy ? 'Proxy CORS Activado' : 'Activar Proxy CORS'}</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Side column: Importer & Help Guide */}
            <div className="flex flex-col gap-6">
              
              {/* Box 1: Pre-set Lists / Quick Presets loader */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col">
                <div className="flex items-center gap-2 text-cyan-400 mb-3">
                  <Wifi size={18} />
                  <h3 className="font-semibold text-sm tracking-tight text-white">Lista por Defecto</h3>
                </div>
                
                <p className="text-xs text-white/40 leading-relaxed mb-4">
                  Vuelve a cargar en cualquier momento la lista integrada y estable de canales públicos:
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleLoadIPTVOrgPreset('default-demos')}
                    className="w-full px-3.5 py-2.5 text-left bg-cyan-600/10 hover:bg-cyan-600/15 border border-cyan-500/20 active:scale-95 rounded-xl flex items-center justify-between text-xs font-bold text-cyan-400 transition cursor-pointer"
                  >
                    <span>📺 Canales de El Salvador (IPTVSV)</span>
                    <ChevronRight size={14} className="text-cyan-400" />
                  </button>
                </div>
              </div>

              {/* Box 2: Quick FAQ/Help accordion guide */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col">
                <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <HelpCircle size={18} />
                  <h3 className="font-semibold text-sm tracking-tight text-white uppercase tracking-wider">Preguntas Frecuentes</h3>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-white/80">¿Qué es un archivo M3U o Player?</h4>
                    <p className="text-white/40 leading-relaxed mt-1 text-[11px]">
                      M3U representa un índice de texto plano formateado que reúne direcciones de streams IPTV. Este reproductor procesa esa lista de difusión para brindarle control de reproducción inmediata.
                    </p>
                  </div>
                  
                  <div className="border-t border-white/5 pt-3">
                    <h4 className="font-semibold text-white/80">¿Por qué algunos canales no cargan?</h4>
                    <p className="text-white/40 leading-relaxed mt-1 text-[11px]">
                      Las cadenas pueden estar caídas temporalmente o bloquear conexiones web externas debido a políticas CORS del navegador. Use el botón de <strong className="text-white/60">"Copiar URL"</strong> para abrirlos de forma nativa si es necesario.
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <h4 className="font-semibold text-white/80">¿Cómo añado mi lista M3U?</h4>
                    <p className="text-white/40 leading-relaxed mt-1 text-[11px]">
                      Haga clic en <strong className="text-white/60">"Importar Playlist"</strong> arriba a la derecha. Puede subir un .m3u local, pegar su contenido o adjuntar la URL en la nube.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      <footer className="h-9 bg-[#0a0a0a] border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-white/30 uppercase tracking-[0.1em] shrink-0" id="sophisticated-footer">
        <div className="flex gap-4">
          <span>Conexión de stream: Segura</span>
          <span className="text-emerald-500 font-medium">Bajo Retardo HLS Activo</span>
        </div>
        <div>StreamFlow Engine • m3u v2.4.0</div>
      </footer>

      {/* POPUP: COMPREHENSIVE PLAYLIST IMPORTER DIALOG */}
      <AnimatePresence>
        {showImporter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs" id="importer-modal-wrapper">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
              id="importer-modal-content"
            >
              
              {/* Modal header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <FolderPlus className="text-blue-400" />
                  <h3 className="text-base font-semibold text-white">Importar Lista Multimedia (M3U)</h3>
                </div>
                <button
                  onClick={() => { setShowImporter(false); setImportError(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Resource Tabs selection */}
              <div className="p-1.5 flex gap-1 bg-black/20 border-b border-white/5 text-xs font-semibold">
                <button
                  onClick={() => { setImportTab('url'); setImportError(null); }}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                    importTab === 'url' ? 'bg-white/5 text-white shadow-sm' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Link size={14} /> URL de Enlace
                </button>

                <button
                  onClick={() => { setImportTab('file'); setImportError(null); }}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                    importTab === 'file' ? 'bg-white/5 text-white shadow-sm' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Upload size={14} /> Archivo .M3U
                </button>

                <button
                  onClick={() => { setImportTab('text'); setImportError(null); }}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                    importTab === 'text' ? 'bg-white/5 text-white shadow-sm' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <FileText size={14} /> Texto Plano (Raw)
                </button>
              </div>

              {/* Form Content body */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[60vh] space-y-4">
                
                {importError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="font-semibold leading-relaxed">{importError}</p>
                  </div>
                )}

                {/* Form URL Tab */}
                {importTab === 'url' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                      Escribe la URL del feed XML/TXT o canal M3U público o premium de tu proveedor. El reproductor buscará e indexará cada flujo.
                    </p>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">Nombre de la lista</label>
                      <input
                        type="text"
                        placeholder="Ej. Mis Canales Deportivos"
                        value={importUrlName}
                        onChange={(e) => setImportUrlName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">URL del Playlist M3U</label>
                      <input
                        type="url"
                        placeholder="https://servidor.com/mi_lista.m3u"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {/* Form File Tab */}
                {importTab === 'file' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                      Selecciona un archivo <strong>.m3u</strong>, <strong>.m3u8</strong> o de texto plano estructurado desde el disco de tu dispositivo.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">Nombre de la lista</label>
                      <input
                        type="text"
                        placeholder="Ej. Playlist Local Familiar"
                        value={importTextName}
                        onChange={(e) => setImportTextName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20"
                      />
                    </div>

                    {/* Drag n Drop upload file box */}
                    <div className="relative border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl p-8 text-center bg-black/10 transition-colors flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept=".m3u,.m3u8,.txt"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="text-white/30 group-hover:text-blue-400 h-8 w-8 mb-3" />
                      <span className="text-xs font-semibold text-white/70">
                        {importFileName ? (
                          <span className="text-blue-400">{importFileName}</span>
                        ) : (
                          <span>Haz clic para seleccionar o arrastra el archivo aquí</span>
                        )}
                      </span>
                      <span className="text-[10px] text-white/30 mt-1 uppercase tracking-wide">
                        Soporta .m3u, .m3u8, .txt
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Text Tab */}
                {importTab === 'text' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                      Pega directamente las líneas que definen la playlist M3U comenzando con la cabecera <code>#EXTM3U</code>.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">Nombre de la lista</label>
                      <input
                        type="text"
                        placeholder="Ej. Copia Portapapeles"
                        value={importTextName}
                        onChange={(e) => setImportTextName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">Contenido M3U Raw</label>
                      <textarea
                        rows={6}
                        placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="http://logo.png",Mi Canal Favorito HD\nhttps://miservidor.com/canal.m3u8`}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        className="w-full px-3.5 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 font-mono text-[10px] leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal footer with actions */}
              <div className="p-5 border-t border-white/5 bg-black/30 flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => { setShowImporter(false); setImportError(null); }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportPlaylist}
                  disabled={isImporting}
                  className="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 active:scale-95 shadow-md cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Cargar Playlist</span>
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: COMPREHENSIVE APPLICATION RESET CONFIRMATION */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="reset-modal-wrapper">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0b0c] border border-red-500/15 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col"
              id="reset-modal-content"
            >
              
              {/* Modal header with warning LED */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-red-950/20">
                <div className="flex items-center gap-2.5 text-red-500">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </div>
                  <h3 className="text-sm font-extrabold tracking-widest text-[#ff4d4d] uppercase font-sans">SISTEMA: CONTROL DE PURGA</h3>
                </div>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal content body */}
              <div className="p-6 space-y-4">
                <div className="flex justify-center py-2">
                  <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shadow-inner">
                    <RefreshCw size={28} className="animate-spin [animation-duration:6s]" />
                  </div>
                </div>
                
                <h4 className="text-center font-bold text-sm text-white">¿Restaurar valores de fábrica?</h4>
                <p className="text-xs text-white/50 text-center leading-relaxed">
                  Esta acción restablecerá por completo toda la consola de StreamFlow a su estado base original. Se eliminarán permanentemente las listas de canales importadas, el historial del reproductor y tus favoritos.
                </p>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10.5px] text-white/45 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>SECTOR ACCIÓN:</span>
                    <span className="text-red-400 font-bold">RESET_STATE_RESET_M3U</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Listas a purgar:</span>
                    <span className="text-white font-bold">{playlists.filter(p => p.id !== 'default-demos').length} externas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Favoritos actuales:</span>
                    <span className="text-white font-bold">{favorites.length} guardados</span>
                  </div>
                </div>
              </div>

              {/* Modal footer with actions */}
              <div className="p-5 border-t border-white/5 bg-black/40 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition cursor-pointer border border-white/5 select-none active:scale-95 text-center uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetApp}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-650 to-orange-600 hover:from-red-600 hover:to-orange-500 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-red-500/10 cursor-pointer uppercase tracking-wider"
                >
                  <RefreshCw size={14} className="animate-spin [animation-duration:2s]" />
                  <span>Sí, Reiniciar</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SYSTEM TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4.5 py-3.5 bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-2xl flex items-center gap-3.5 text-xs text-white max-w-sm"
            id="system-notification-toast"
          >
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Info size={16} />
            </div>
            <p className="font-semibold text-white/90 leading-relaxed pr-2">
              {toastMessage}
            </p>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-white/40 hover:text-white transition cursor-pointer ml-auto shrink-0 animate-pulse"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
