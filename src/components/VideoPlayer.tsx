import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  Tv, Eye, RotateCcw, AlertTriangle, Radio, Activity, HelpCircle
} from 'lucide-react';
import { PlaylistItem } from '../types';

interface VideoPlayerProps {
  channel: PlaylistItem | null;
  autoPlay?: boolean;
  onPrevChannel?: () => void;
  onNextChannel?: () => void;
  isLargeMode?: boolean;
  onToggleLargeMode?: () => void;
}

export default function VideoPlayer({ 
  channel, 
  autoPlay = true,
  onPrevChannel,
  onNextChannel,
  isLargeMode = false,
  onToggleLargeMode
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [hasVideo, setHasVideo] = useState(true);
  const [readyToLoad, setReadyToLoad] = useState(false);
  

  
  // Custom Controls HUD Toggle timer
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mount phase delay to let DOM and layout load instantly first
  useEffect(() => {
    const timer = setTimeout(() => {
      setReadyToLoad(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Detect whether the channel is likely audio-only based on URL structure or audio extension
  useEffect(() => {
    if (!channel) return;
    const url = channel.url.toLowerCase();
    const isAudioOnly = 
      url.endsWith('.mp3') || 
      url.endsWith('.wav') || 
      url.endsWith('.aac') || 
      url.endsWith('.ogg') ||
      url.includes('/radio') ||
      url.includes('stream.mp3');
      
    setHasVideo(!isAudioOnly);
    setErrorMsg(null);
    setIsBuffering(true);
  }, [channel]);

  // Handle Hls.js logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel || !readyToLoad) {
      if (!readyToLoad && channel) {
        setIsBuffering(true);
      }
      return;
    }

    // Reset player state
    setErrorMsg(null);
    setIsBuffering(true);

    // Stop current Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = channel.url;
    
    // Check if the stream is an .m3u8 (HLS) stream
    const isHls = streamUrl.toLowerCase().includes('.m3u8') || streamUrl.includes('manifest');

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4,
          maxBufferLength: 10
        });
        hlsRef.current = hls;
        
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          if (autoPlay) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.warn('HLS.js warning/error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setErrorMsg('Error de red al cargar el stream. Revisa tu conexión u origen.');
                setIsBuffering(false);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                setErrorMsg('El canal no se pudo reproducir debido a un formato no compatible o un stream caído.');
                setIsBuffering(false);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari natively supporting HLS
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsBuffering(false);
          if (autoPlay) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        });
        
        video.addEventListener('error', () => {
          setErrorMsg('Error en el reproductor nativo al cargar el stream.');
          setIsBuffering(false);
        });
      } else {
        setErrorMsg('Tu navegador no es compatible con streams M3U8 (HLS). Intenta con Chrome o Firefox.');
        setIsBuffering(false);
      }
    } else {
      // Direct standard MP4/MP3 source
      video.src = streamUrl;
      
      const handleCanPlay = () => {
        setIsBuffering(false);
        if (autoPlay) {
          video.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      };

      const handleVideoError = () => {
        setErrorMsg('No se pudo reproducir el stream. Asegúrate de que la URL esté activa y acepte CORS.');
        setIsBuffering(false);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleVideoError);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleVideoError);
      };
    }

    // Capture play/pause state from element directly
    const handlePlayState = () => setIsPlaying(true);
    const handlePauseState = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener('play', handlePlayState);
    video.addEventListener('pause', handlePauseState);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener('play', handlePlayState);
      video.removeEventListener('pause', handlePauseState);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.src = '';
    };
  }, [channel, autoPlay, readyToLoad]);

  // Handle controls HUD fade timer
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isPlaying]);

  // Adjust volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current || errorMsg) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v > 0) setIsMuted(false);
  };

  const toggleFullscreen = () => {
    if (onToggleLargeMode) {
      onToggleLargeMode();
      return;
    }
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Keep track of document-level fullscreen changes (e.g. Esc key pressed)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  const retryPlayback = () => {
    if (!channel) return;
    const current = channel;
    // Temporarily trigger stream reload
    setErrorMsg(null);
    setIsBuffering(true);
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.src = current.url;
    }
  };

  const toggleAspectRatio = () => {
    setAspectRatio(prev => {
      if (prev === 'contain') return 'cover';
      if (prev === 'cover') return 'fill';
      return 'contain';
    });
  };

  // CSS scaling maps
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'cover': return 'object-cover';
      case 'fill': return 'object-fill';
      default: return 'object-contain';
    }
  };

  return (
    <div 
      className={isLargeMode 
        ? "fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-center items-center w-screen h-screen"
        : "relative flex flex-col w-full aspect-video bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl group/player transition-all duration-300"
      }
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      id="m3u-video-player-container"
    >
      {/* If expanded/large mode, render an explicit exit button at the top corner */}
      {isLargeMode && (
        <button
          onClick={onToggleLargeMode}
          className="absolute top-4 right-4 z-[10000] p-3 rounded-full bg-black/60 hover:bg-neutral-800 text-white border border-white/20 transition backdrop-blur-md shadow-lg"
          title="Salir de pantalla grande"
        >
          <Minimize2 size={24} />
        </button>
      )}

      {/* Video Anchor */}
      <video
        ref={videoRef}
        className={`w-full h-full bg-black transition-all ${getAspectRatioClass()} ${!hasVideo ? 'hidden' : ''}`}
        playsInline
        onClick={togglePlay}
        id="m3u-video-element"
      />

      {/* Audio Visualizer / Poster if playing audio-only */}
      {!hasVideo && channel && !errorMsg && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 select-none"
          onClick={togglePlay}
          id="audio-only-visualizer-container"
        >
          {/* Animated soundwaves bar */}
          <div className="flex items-end gap-1 h-20 mb-6">
            <span className={`w-2.5 bg-sky-500 rounded-full ${isPlaying ? 'animate-[bounce_0.8s_infinite_100ms]' : 'h-3'}`} />
            <span className={`w-2.5 bg-blue-500 rounded-full ${isPlaying ? 'animate-[bounce_0.6s_infinite_300ms]' : 'h-6'}`} />
            <span className={`w-2.5 bg-violet-500 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite_200ms]' : 'h-2'}`} />
            <span className={`w-2.5 bg-fuchsia-500 rounded-full ${isPlaying ? 'animate-[bounce_0.7s_infinite_400ms]' : 'h-8'}`} />
            <span className={`w-2.5 bg-sky-400 rounded-full ${isPlaying ? 'animate-[bounce_0.9s_infinite_150ms]' : 'h-4'}`} />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
            <Radio size={14} className="animate-pulse" /> Radio / Audio Only
          </div>

          <h3 className="text-xl font-bold text-center tracking-tight text-white line-clamp-1 max-w-lg mb-1">
            {channel.name}
          </h3>
          <p className="text-neutral-400 text-sm font-mono tracking-tight text-center line-clamp-1 max-w-sm">
            {channel.group || 'Audio Libre'}
          </p>
        </div>
      )}

      {/* Background Poster Overlay when No Channel Selected */}
      {!channel && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-neutral-400 p-8 text-center"
          id="empty-player-placeholder"
        >
          <div className="p-4 bg-neutral-800/80 rounded-full text-sky-500 mb-4 animate-pulse">
            <Tv size={48} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Ningún canal cargado</h2>
          <p className="text-sm text-neutral-400 max-w-sm">
            Selecciona un canal de la barra lateral o carga una lista M3U para comenzar a reproducir streaming en vivo.
          </p>
        </div>
      )}

      {/* Buffering Loading Spinner */}
      {isBuffering && channel && !errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white pointer-events-none">
          <div className="relative flex items-center justify-center mb-3">
            <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-sky-500 opacity-75"></span>
            <Activity className="h-8 w-8 text-sky-400 animate-pulse" />
          </div>
          <span className="text-sm font-medium tracking-wide text-neutral-300">
            Conectando con stream...
          </span>
        </div>
      )}

      {/* Error Message Screen */}
      {errorMsg && channel && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-neutral-300 p-6 text-center"
          id="playback-error-overlay"
        >
          <AlertTriangle className="text-amber-500 h-12 w-12 mb-3 animate-bounce" />
          <h3 className="text-base font-bold text-white mb-2">Fallo al conectar con el canal</h3>
          <p className="text-xs text-neutral-400 max-w-md leading-relaxed mb-4">
            {errorMsg}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={retryPlayback}
              className="px-4 py-1.5 flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <RotateCcw size={14} /> Reintentar
            </button>
            <a
              href={channel.url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <Eye size={14} /> Abrir Link Directo
            </a>
          </div>
        </div>
      )}

      {/* CUSTOM PLAYER HUD / CONTROLS (Floating Overlay) */}
      {channel && !errorMsg && (
        <div 
          className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/10 to-black/30 text-white transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          id="custom-player-hud"
        >
          {/* Top Bar (Active channel info) */}
          <div className="p-4 flex items-center justify-between w-full pointer-events-auto">
            <div className="flex items-center gap-3">
              {channel.logo ? (
                <img 
                  src={channel.logo} 
                  alt={channel.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 object-contain rounded bg-neutral-800 p-1 border border-neutral-700"
                  onError={(e) => {
                    // Hide broken image placeholder
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center rounded bg-sky-500/20 text-sky-400 font-bold border border-sky-500/20">
                  {channel.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold leading-none text-white drop-shadow-md">
                  {channel.name}
                </h4>
                <p className="text-[11px] text-neutral-300 mt-1 font-mono tracking-tight drop-shadow-sm">
                  {channel.group || 'Sin Grupo'}
                </p>
              </div>
            </div>

            {/* Live Indicator */}
            {isLive && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-[10px] font-bold text-white rounded-full uppercase tracking-wider shadow">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                EN VIVO
              </span>
            )}
          </div>

          {/* Quick Play/Pause Center Trigger if needed (empty space is click-to-play) */}
          <div className="flex-1 w-full" onClick={togglePlay} />

          {/* Bottom Controls HUD */}
          <div className="p-4 bg-gradient-to-t from-black/90 to-transparent w-full flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center justify-between gap-4">
              
              {/* Left Group: Play/Pause, prev, next, Volume */}
              <div className="flex items-center gap-3.5">
                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition"
                  title={isPlaying ? 'Pausa' : 'Reproducir'}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>

                {onPrevChannel && (
                  <button 
                    onClick={onPrevChannel}
                    className="p-1.5 text-neutral-300 hover:text-white transition"
                    title="Canal Anterior"
                  >
                    <RotateCcw size={16} className="-rotate-90" />
                  </button>
                )}

                {onNextChannel && (
                  <button 
                    onClick={onNextChannel}
                    className="p-1.5 text-neutral-300 hover:text-white transition"
                    title="Canal Siguiente"
                  >
                    <RotateCcw size={16} className="rotate-90" />
                  </button>
                )}

                {/* Volume slider */}
                <div className="flex items-center gap-2 group/volume ml-1">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 text-neutral-300 hover:text-white transition"
                    title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 md:w-20 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>

              {/* Right Group: Aspect Ratio, PiP, Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Scale/Ratio Selector */}
                {hasVideo && (
                  <button
                    onClick={toggleAspectRatio}
                    className="px-2 py-1 bg-neutral-800/80 hover:bg-neutral-700/80 text-[10px] uppercase font-bold tracking-wider rounded border border-neutral-700 transition"
                    title={`Ajuste: ${aspectRatio === 'contain' ? 'Mantener proporción' : aspectRatio === 'cover' ? 'Llenar pantalla recortando' : 'Estirar'}`}
                  >
                    Rendimiento: {aspectRatio}
                  </button>
                )}

                {/* Picture in Picture */}
                {hasVideo && document.pictureInPictureEnabled && (
                  <button
                    onClick={togglePiP}
                    className="p-1.5 text-neutral-300 hover:text-white transition"
                    title="Picture in Picture (Ventana flotante)"
                  >
                    <Tv size={18} className={isPiP ? 'text-sky-400' : ''} />
                  </button>
                )}

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-neutral-300 hover:text-white transition"
                  title={(isFullscreen || isLargeMode) ? 'Salir de pantalla completa' : 'Pantalla Completa'}
                >
                  {(isFullscreen || isLargeMode) ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
