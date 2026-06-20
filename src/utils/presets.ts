import { PlaylistItem } from '../types';
import { parseM3U } from './m3uParser';

const defaultM3uText = `#EXTM3U
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/8/87/Emblema_de_Chilevisi%C3%B3n.svg" group-title="general",Chilevisión [CL]
https://redirector.rudo.video/hls-video/10b92cafdf3646cbc1e727f3dc76863621a327fd/chv/chv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://s.t13.cl/sites/default/files/t13/componentes/field-componente-logo/deportes13_1.png" group-title="sports",13 Deportes [CL]
https://origin.dpsgo.com/ssai/event/uFiYkh4CQPCPgbs7WPKhXw/master.m3u8
#EXTINF:-1 tvg-logo="https://static.wikia.nocookie.net/logopedia/images/4/4a/FutGo.svg" group-title="sports",13 FutGO [CL]
https://origin.dpsgo.com/ssai/event/Jxo4ZkwHQr-9XqguRcdsSg/master.m3u8
#EXTINF:-1 tvg-logo="https://static.wikia.nocookie.net/logopedia/images/5/5c/13pop.svg" group-title="entertainment",13 Pop (1) [CL]
https://origin.dpsgo.com/ssai/event/WKlE4m31TOijQS05TZmhqw/master.m3u8
#EXTINF:-1 tvg-logo="https://i.imgur.com/m0SuwMU.png" group-title="Chile",13 Realidades (Nacional)
https://origin.dpsgo.com/ssai/event/g7_JOM0ORki9SR5RKHe-Kw/master.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/6/6b/Logotipo_del_Canal_24_Horas.png" group-title="news",24 horas [CL]
https://mdstrm.com/live-stream-playlist/689ba606ecfe7915e1f8f741.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/RadioAgricultura/picture?width=800&height=800" group-title="music",AGRICULTURA TV (1) [CL]
https://redirector.rudo.video/hls-video/ey6283je82983je9823je8jowowiekldk9838274/921tv/921tv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/AntofagastaTelevision/picture?width=800&height=800" group-title="general",Antofagasta TV (2) [CL]
https://unlimited1-cl-isp.dps.live/atv/atv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Logo_de_Arica_TV.png/240px-Logo_de_Arica_TV.png" group-title="general",Arica TV [CL]
https://envivo.arica.tv/hls/Live2025AricaTV.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Logotipo_Ays%C3%A9n_Televisi%C3%B3n.svg/320px-Logotipo_Ays%C3%A9n_Televisi%C3%B3n.svg.png" group-title="general",Aysen TV (1) [CL]
https://v1.tustreaming.cl/aysentv/index.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/cc/Emblema_de_la_C%C3%A1mara_de_Diputados_de_Chile.png" group-title="legislative",Cámara Diputados (1) [CL]
https://wowlive.grupoz.cl/camara/live/chunklist_w1358283897_DVR.m3u8
#EXTINF:-1 tvg-logo="https://images.squarespace-cdn.com/content/v1/670e696722c95f04171e0924/c9b5d2ac-2f70-40e1-beed-78d39108f657/_Canal+Uno_.png" group-title="general",Canal 1 Ñuble [CL]
https://tls-cl.cdnz.cl/canal21tv/live/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/4/4f/Emblema_del_Canal_13_Chile.svg" group-title="general",Canal 13 (1) [CL]
https://redirector.dps.live/hls/13cl/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/13i_2018.png/500px-13i_2018.png" group-title="Chile",13 Internacional (Nacional)
https://redirector.dps.live/hls/13intav/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/canal2quellon/picture?width=800&height=800" group-title="general",Canal 2 Quellón (1) [CL]
https://unlimited2-cl-isp.dps.live/tvquellon/tvquellon.smil/tvquellon/livestream1/chunks.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/canal2quellon/picture?width=800&height=800" group-title="general",Canal 2 Quellón (5) [CL]
https://unlimited1-cl-isp.dps.live/tvquellon/tvquellon.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/canal2tvsanantonio/picture?width=800&height=800" group-title="general",Canal 2 San Antonio (1) [CL]
https://unlimited1-us.dps.live/canal2/canal2.smil/canal2/livestream1/chunks.m3u8
#EXTINF:-1 tvg-logo="https://canal5.cl/wp/wp-content/uploads/2025/06/canal5-300x169.png" group-title="general",Canal 5 Pto. Montt (1) [CL]
https://5ff3d9babae13.streamlock.net/aufymdjpjf/aufymdjpjf/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/BioBioTV/picture?width=800&height=800" group-title="general",Canal 9 (1) [CL]
https://unlimited6-cl.dps.live/c9/c9.smil/c9/livestream1/chunks.m3u8
#EXTINF:-1 tvg-logo="https://canallocal.cl/wp-content/uploads/2020/04/cropped-CANALLOCAL-2.png" group-title="general",Canal Local Quillota (1) [CL]
https://v2.tustreaming.cl/canallocalcl/index.m3u8
#EXTINF:-1 tvg-logo="https://www.canalsurpatagonia.cl/wp-content/uploads/2024/07/Canal-Sur-Patagonia-272x90-2-jpg.avif" group-title="general",Canal Sur Patagonia (1) [CL]
https://v2.tustreaming.cl/fmarcoirirs/index.m3u8
#EXTINF:-1 tvg-logo="https://www.caracolatv.cl/wp-content/uploads/2022/11/cropped-LOGO-CARACOLA-05-1-300x169.png" group-title="general",Caracola TV La Florida [CL]
https://wifispeed.trapemn.tv:1936/comunales/caracola-tv/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/b/b8/Logo_Radio_Carolina_2020.png" group-title="music",Radio Carolina TV [CL]
https://mdstrm.com/live-stream-playlist/63a06468117f42713374addd.m3u8
#EXTINF:-1 tvg-logo="https://i.imgur.com/F1it6fh.png" group-title="Chile",Chile Channel TV (Nacional)
https://v2.tustreaming.cl/chilechannel/index.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/chiloered25/picture?width=800&height=800" group-title="general",Chiloé Red 25 [CL]
https://v2.tustreaming.cl/chiloered/index.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/clicktvchile/picture?width=800&height=800" group-title="general",ClickTv Chile (Coronel) (1) [CL]
https://v2.tustreaming.cl/clicktv/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/clubtvcanal/picture?width=800&height=800" group-title="general",Club TV Santa Juana [CL]
https://cloudpro.servidoresdestream.com:8081/8010/index.m3u8
#EXTINF:-1 tvg-logo="https://concepciontv.cl/wp-content/uploads/2024/04/logopaginaweb-1-1024x272-1-150x40.png" group-title="general",Concepcion TV [CL]
https://stream.blserver.cl/hls/ctv/index.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/TVContivision/picture?width=800&height=800" group-title="general",Contivision (1) [CL]
https://unlimited6-cl.dps.live/cm/cm.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/ed/Radio_Cooperativa_Logo.svg" group-title="music",Radio Cooperativa [CL]
https://unlimited1-cl-isp.dps.live/coopetv/coopetv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://cronicasdelsur.cl/wp-content/uploads/2023/07/cropped-LOGO-TV-transparente-180x180.png" group-title="general",Cronicas del Sur TV [CL]
https://s1.tvdatta.com:3384/live/canal20tvlive.m3u8
#EXTINF:-1 tvg-logo="https://dancefm.es/wp-content/uploads/2020/04/logo-web-png-1024x169.png" group-title="Música",Dance FM (España)
https://5eaccbab48461.streamlock.net:1936/dancefm_1/dancefm_1/playlist.m3u8
#EXTINF:-1 tvg-logo="https://s3-mspro.nyc3.cdn.digitaloceanspaces.com/tenant/5f3fda92cc107f13d88c21de/mediaLibrary/photo/91011544-ecd3-4f95-b79d-f814987d51e8-extra-large-standard-q100.webp" group-title="general",Décima TV (Ancud) (1) [CL]
https://unlimited2-cl-isp.dps.live/decimatv/decimatv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://neotv.energeek.cl/assets/img/channels/eg-fan-2.png" group-title="Anime",EnerGeek Fan (América Latina)
https://backend.energeek.cl/webtv/egfanweb/index.m3u8?token=ZZDemoIPTVGH
#EXTINF:-1 tvg-logo="https://cdn.energeek.cl/logos/EG-Radio-2025_brand.png" group-title="music",EnerGeek Radio (1) [CL]
https://backend.energeek.cl/webtv/egradioweb/index.m3u8?token=ZZDemoIPTVGH
#EXTINF:-1 tvg-logo="https://cdn.energeek.cl/logos/EG-Retro-2025_brand.png" group-title="animation",EnerGeek Retro (1) [CL]
https://backend.energeek.cl/webtv/egretroweb/index.m3u8?token=dEmoweBeneRGEek2025
#EXTINF:-1 tvg-logo="https://www.frecuencia7tv.cl/logo-f7.png" group-title="general",Frecuencia 7 (1) [CL]
https://v2.tustreaming.cl/frecuencia7/index.m3u8
#EXTINF:-1 tvg-logo="https://www.girovisual.cl/Girovisual%20logo.png" group-title="general",Girovisual Televisión (Valparaíso) (1) [CL]
https://pantera1-100gb-cl-movistar.dps.live/girovisual2/girovisual2.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/0/07/HolvoetTV.jpg" group-title="general",Holvoet TV (1) [CL]
https://unlimited1-cl-isp.dps.live/holvoettv/holvoettv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.interradiotv.cl/wp-content/uploads/2024/03/Logoa-medida.jpg" group-title="general",Inter Radio TV Frutillar [CL]
https://tv.arkeo.cl:1936/8002/8002/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.canalisb.cl/imagenes/logo_isb.png" group-title="religious",Canal ISB (Iglesia San Bernardo) (1) [CL]
https://unlimited1-cl-isp.dps.live/isb/isb.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/ITVPatagonia/picture?width=800&height=800" group-title="general",ITV Patagonia (1) [CL]
https://unlimited1-cl-isp.dps.live/itv/itv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.lagranja.tv/gallery_gen/a54e5683a51ffc503a0587669bceebc4_440x444.png" group-title="general",La Granja TV [CL]
https://oracle.streaminghd.cl/8126/8126/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.populartv.cl/wp-content/uploads/elementor/thumbs/Logo-en-PNG-con-tipografia-polbioybcx24gunnadhprzcqp2wqxwbpofdcvojex8.png" group-title="music",La Popular TV [CL]
https://tv.arkeo.cl:1936/enlacetv1/enlacetv1/playlist.m3u8
#EXTINF:-1 tvg-logo="https://lametrofm.cl/wp-content/uploads/2025/03/LOGO_2025_fm-removebg-preview1.png" group-title="music",La MetroFM (1) [CL]
https://jireh-3-hls-video-cl-movistar.dps.live/hls-video/931b584451fa6dd1313ee66efbfd5802e3f3bcea/metropolitanatv/metropolitanatv.smil/metropolitanatv/livestream1/chunks.m3u8
#EXTINF:-1 tvg-logo="https://margamargatv.cl/wp-content/uploads/2024/12/cropped-identidad_favicon-192x192.png" group-title="general",Marga Marga TV (1) [CL]
https://v1.tustreaming.cl/margamargatv/index.m3u8
#EXTINF:-1 tvg-logo="https://www.mediabanco.com/wp-content/uploads/2021/11/senal-logo2-1.png" group-title="outdoor",Mediabanco Chile (1) [CL]
https://scl.edge.grupoz.cl/mediabanco_prueba/live/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/9/93/Logotipo_de_Mega_%282015-2020%29.svg" group-title="general",Mega (2) [CL]
https://unlimited2-cl-isp.dps.live/mega/mega.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.miradiols.cl/wp-content/uploads/2018/02/logo-ok-footer.png" group-title="general",Mi Radio TV [CL]
https://tls-cl.cdnz.cl/miradio2/live/playlist.m3u8
#EXTINF:-1 tvg-logo="https://nctv.cl/wp-content/uploads/2022/05/LOGO-NCTV-VECTOR-final.png" group-title="religious",NCTV (Centro Cristiano Internacional CCINT - San Joaquín) [CL]
https://pantera1-100gb-cl-movistar.dps.live/nctv/nctv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/ninaladiferente/picture?width=800&height=800" group-title="music",Nina FM [CL]
https://tv1.ninatv.cl/web/stream.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/RTVNUBLE/picture?width=800&height=800" group-title="general",Ñuble RVT (1) [CL]
https://tv.arkeo.cl:1936/canalrtv/canalrtv/playlist.m3u8
#EXTINF:-1 tvg-logo="https://static.wixstatic.com/media/b1376e_8599f9a1a489454bb69a8b52a6d6e7bd%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/b1376e_8599f9a1a489454bb69a8b52a6d6e7bd%7Emv2.png" group-title="general",Panoramica Informativa (1) [CL]
https://v2.tustreaming.cl/alingeproducciones/index.m3u8
#EXTINF:-1 tvg-logo="https://pichilemutv.org/wp-content/uploads/2020/06/cropped-Logo-Color-Blanco-Solo-32x32.png" group-title="general",Pichilemu TV (1) [CL]
https://5ff3d9babae13.streamlock.net/8028/8028/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/7/7c/Pinguino_TV.png" group-title="general",Pingüino TV (2) [CL]
https://redirector.rudo.video/hls-video/339f69c6122f6d8f4574732c235f09b7683e31a5/pinguinotv/pinguinotv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://i.imgur.com/ZEBOeGe.png" group-title="Música",PortalFoxMix (Chile)
https://panel.tvstream.cl:1936/8040/8040/playlist.m3u8
#EXTINF:-1 tvg-logo="https://s3-mspro.nyc3.cdn.digitaloceanspaces.com/tenant/5f4535460ac66b5dfa35c13f/mediaLibrary/photo/3639d184-7fb1-4658-8239-dc5c1ee334c1-extra-large-standard-q100.webp" group-title="general",Pucón TV (1) [CL]
https://redirector.dps.live/hls/pucontv/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/puranoticiachile/picture?width=800&height=800" group-title="general",Puranoticia TV (1) [CL]
https://pnt.janusmedia.tv/hls/pnt.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c2/ADN_Radio_Chile.svg" group-title="music",Radio ADN [CL]
https://redirector.rudo.video/hls-video/931b584451fa6dd1313ee66efbfd5802e3f3bcea/adntv/adntv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://i.imgur.com/425dj2i.jpeg" group-title="Música",AE Radio TV (Chile)
https://tls-cl.cdnz.cl/aeradio/live/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/a/a8/Biobio_TV_logo.jpg" group-title="music",Radio Biobio TV (1) [CL]
https://redirector.rudo.video/hls-video/339f69c6122f6d8f4574732c235f09b7683e31a5/bbtv/bbtv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/4/48/Radio_El_Conquistador_91.3_FM.jpg" group-title="music",Radio El Conquistador FM (1) [CL]
https://redirector.rudo.video/hls-video/931b584451fa6dd1313ee66efbfd5802e3f3bcea/elconquistadortv/elconquistadortv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.radiograneros.cl/imagen/logoradiograneros.jpg" group-title="music",Radio Graneros TV (1) [CL]
https://5ff3d9babae13.streamlock.net/rravdcnywy/rravdcnywy/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/3/36/Logo_La_Clave_2019.png" group-title="music",Radio La Clave (1) [CL]
https://unlimited1-cl-isp.dps.live/laclavetv/laclavetv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/LaNuestra.cl/picture?width=800&height=800" group-title="music",La nuestra [CL]
https://redirector.rudo.video/hls-video/339f69c6122f6d8f4574732c235f09b7683e31a5/ln/ln.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/pauta.cl/picture?width=800&height=800" group-title="music",Pauta [CL]
https://redirector.rudo.video/hls-video/ey6283je82983je9823je8jowowiekldk9838274/pautatv/pautatv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.radiopresidenteibanez.cl/web/wp-content/uploads/2024/01/LOGO-IBANEZ_2.png" group-title="general",Radio Presidente Ibañez [CL]
https://ibanez.servercl.com/hls/live.m3u8
#EXTINF:-1 tvg-logo="https://www.rtctelevision.cl/images/logortc.png" group-title="general",RTC Television (2) [CL]
https://scl.edge.grupoz.cl/rtcstreaming/live/playlist.m3u8
#EXTINF:-1 tvg-logo="https://sextavision.cl/wp-content/uploads/2024/06/cropped-ojo-SV-32x32.png" group-title="general",Sextavision (1) [CL]
https://5ff3d9babae13.streamlock.net/8020/8020/playlist.m3u8
#EXTINF:-1 tvg-logo="https://sextavision.cl/wp-content/uploads/2024/06/cropped-ojo-SV-32x32.png" group-title="general",Sextavision (2) [CL]
https://5ff3d9babae13.streamlock.net:443/fzkqsdfray/fzkqsdfray/playlist.m3u8
#EXTINF:-1 tvg-logo="https://stream.making.cl/logo-solotv.png" group-title="general",SoloTV (Valparaíso) [CL]
https://stream.making.cl/memfs/ee909361-73e9-4e74-8391-5f1b0b8006c2.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/stgotvchile/picture?width=800&height=800" group-title="general",Stgo.TV [CL]
https://stv4.janus.cl/playlist/stream.m3u8
#EXTINF:-1 tvg-logo="https://www.surtv.cl/imagenes/logo.png" group-title="general",Sur TV [CL]
https://redirector.rudo.video/hls-video/ey6283je82983je9823je8jowowiekldk9838274/surtv/surtv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/0/09/Logotipo_de_Teletrece.svg" group-title="news",T13 - Teletrece (1) [CL]
https://redirector.rudo.video/hls-video/10b92cafdf3646cbc1e727f3dc76863621a327fd/t13/t13.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://graph.facebook.com/Tele13Radio/picture?width=800&height=800" group-title="music",Tele13 Radio (2) [CL]
https://unlimited1-cl-isp.dps.live/t13radio/t13radio.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://s3-mspro.nyc3.digitaloceanspaces.com/tenant/5f4534e60ac66b5dfa35c13a/settings/logos/9c6f4044-9744-4ed5-94ee-9ae72d742367.png" group-title="general",TeleAngol (1) [CL]
https://unlimited1-cl-isp.dps.live/teleangol/teleangol.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://temucotelevision.cl/web/wp-content/uploads/2019/01/logo-2.jpg" group-title="general",Temuco Television [CL]
https://mediacp.nnw.cl:19360/temucotelevision/temucotelevision.m3u8
#EXTINF:-1 tvg-logo="https://tevex.cl/wp-content/uploads/2021/01/logo_tevex_formato_3.svg" group-title="general",Tevex Oficial [CL]
https://v4.tustreaming.cl:443/tevexinter/index.m3u8
#EXTINF:-1 tvg-logo="https://tvcosta.cl/wp-content/uploads/2022/12/TV-Costa.jpg" group-title="general",TV Costa [CL]
https://tvcosta.gleeze.com/memfs/39cef946-1aac-4418-8df8-6d8ff6d0a680.m3u8
#EXTINF:-1 tvg-logo="https://tvinet.cl/site/wp-content/uploads/cropped-channels4_profile-192x192.jpg" group-title="general",T-Vinet Digital (1) [CL]
https://pantera1-100gb-cl-movistar.dps.live/inet2/inet2.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://tvuct.cl/wp-content/uploads/2023/08/logo-white.png" group-title="general",TV UCT (U. Católica de Temuco) (1) [CL]
https://unlimited1-cl-isp.dps.live/uct/uct.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://s3-mspro.nyc3.cdn.digitaloceanspaces.com/tenant/5f47d1b0c6169d337c4d532e/mediaLibrary/photo/dfc35dae-1ef2-41dc-a0b5-79e0522be723-extra-large-standard-q100.webp" group-title="general",TV5 Linares (1) [CL]
https://v1.tustreaming.cl/tv5linares/index.m3u8
#EXTINF:-1 tvg-logo="https://i.imgur.com/3FKZHL4.png" group-title="Chile",TVN3 (Nacional)
https://mdstrm.com/live-stream-playlist/5653641561b4eba30a7e4929.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/2/23/Logotipo_TVO_San_Vicente.png" group-title="general",TVO San Vicente (1) [CL]
https://5ff3d9babae13.streamlock.net/8014/8014/playlist.m3u8
#EXTINF:-1 tvg-logo="https://i.postimg.cc/prDRDZw3/TVR-Logo.png" group-title="Chile",TVR Televisión Regional (Santiago / Nacional)
https://unlimited1-us.dps.live/tvr/tvr.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/0/0f/Logo_tvu.png" group-title="general",TVU (1) [CL]
https://unlimited6-cl.dps.live/tvu/tvu.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e9/UChile_TV_logo_2020.png" group-title="general",U de Chile TV (2) [CL]
https://pantera1-100gb-cl-movistar.dps.live/uchiletv/uchiletv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://tv.utalca.cl/wp-content/uploads/2023/10/cropped-Isologo-UTalcaTV-3-32x32.png" group-title="general",UTalcaTV (U. de Talca) - Campus TV (1) [CL]
https://unlimited1-cl-isp.dps.live/campustv/campustv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://i.postimg.cc/jjGpZf4T/UCV-Logo.png" group-title="Chile",UCV TV Valparaíso (Valparaíso)
https://unlimited2-cl-isp.dps.live/ucvtv2/ucvtv2.smil/playlist.m3u8
#EXTINF:-1 group-title="general",UCV TV Eventos (1) [CL]
https://pantera1-100gb-cl-movistar.dps.live/ucvtveventos/ucvtveventos.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://www.ufromedios.cl/wp-content/uploads/2021/02/UFROMEDIOS-VISION-LOW-VERT.png" group-title="general",UfroMedios [CL]
https://mdstrm.com/live-stream-playlist/580a80b827de0ae2086ea6d8.m3u8
#EXTINF:-1 tvg-logo="https://www.uestv.cl//wp-content/uploads/2023/12/LOGOS-CANALES-UESTV-6.png" group-title="general",ULagosTV (U. de los Lagos) [CL]
https://tv.ulagos.cl/web/live.m3u8
#EXTINF:-1 tvg-logo="https://static.wixstatic.com/media/2daf50_a8f34b3a9e16488ea92343158572f5e4%7Emv2.jpg/v1/fill/w_180%2Ch_180%2Clg_1%2Cusm_0.66_1.00_0.01/2daf50_a8f34b3a9e16488ea92343158572f5e4%7Emv2.jpg" group-title="general",UMAG TV (U. de Magallanes) [CL]
https://tls-cl.cdnz.cl/umag1/ngrp:live_all/playlist.m3u8
#EXTINF:-1 tvg-logo="https://visionplustv.cl/wp-content/uploads/2024/06/VP017.png" group-title="general",Vision Plus TV Melipilla (1) [CL]
https://5ff3d9babae13.streamlock.net/jwagpqxehu/jwagpqxehu/playlist.m3u8
#EXTINF:-1 tvg-logo="https://s3-mspro.nyc3.cdn.digitaloceanspaces.com/tenant/5f45357a0ac66b5dfa35c13f/mediaLibrary/photo/6ffc1997-59e5-48d2-83a5-a1392ae981b8-extra-large-standard-q100.webp" group-title="general",VTV Quillota (2) [CL]
https://unlimited6-cl.dps.live/vtv/vtv.smil/playlist.m3u8
#EXTINF:-1 tvg-logo="https://s3-mspro.nyc3.cdn.digitaloceanspaces.com/tenant/5f45357a0ac66b5dfa35c13f/mediaLibrary/photo/6ffc1997-59e5-48d2-83a5-a1392ae981b8-extra-large-standard-q100.webp" group-title="general",VTV Quillota (1) [CL]
https://pantera1-100gb-cl-movistar.dps.live/vtvquillota/vtvquillota.smil/playlist.m3u8`;

export const CHANNELS_DEMO: PlaylistItem[] = parseM3U(defaultM3uText);

export const PRESET_PLAYLISTS = [
  {
    id: 'default-demos',
    name: '📺 Lista de Canales Predeterminada',
    items: CHANNELS_DEMO,
    sourceType: 'preset' as const,
    sourceValue: 'Canales Favoritos Preconfigurados',
    createdAt: Date.now()
  }
];
