import { PlaylistItem } from '../types';

export function parseM3U(rawContent: string): PlaylistItem[] {
  const items: PlaylistItem[] = [];
  const lines = rawContent.split(/\r?\n/);
  
  let currentItem: Partial<PlaylistItem> | null = null;
  let idCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;

    // Check if line defines stream info
    if (line.startsWith('#EXTINF:')) {
      currentItem = {};
      
      // Parse tvg-id
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);
      if (tvgIdMatch) {
        currentItem.tvgId = tvgIdMatch[1];
      }

      // Parse tvg-logo or logo
      const logoMatch = line.match(/(?:tvg-logo|logo)="([^"]+)"/i);
      if (logoMatch) {
        currentItem.logo = logoMatch[1];
      }

      // Parse group-title (category)
      const groupMatch = line.match(/(?:group-title|group)="([^"]+)"/i);
      currentItem.group = groupMatch ? groupMatch[1] : 'Otros';

      // Parse channel title (everything after the last comma of the #EXTINF line)
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentItem.name = line.substring(commaIndex + 1).trim();
      } else {
        currentItem.name = `Canal ${idCounter}`;
      }
    } else if (line.startsWith('#')) {
      // Ignore other tag headers for now
      continue;
    } else {
      // This is likely a URL representing the channel
      if (currentItem) {
        currentItem.url = line;
        currentItem.id = currentItem.url || `channel-${idCounter}`;
        
        // Final fallback name if still empty
        if (!currentItem.name) {
          try {
            const urlObj = new URL(line);
            currentItem.name = urlObj.pathname.split('/').pop() || `Canal ${idCounter}`;
          } catch {
            currentItem.name = `Canal ${idCounter}`;
          }
        }
        
        items.push(currentItem as PlaylistItem);
        currentItem = null;
        idCounter++;
      } else {
        // Bare URL without EXTINF metadata
        try {
          const urlObj = new URL(line);
          const name = urlObj.pathname.split('/').pop() || `Canal ${idCounter}`;
          items.push({
            id: line,
            name: name,
            url: line,
            group: 'Sin Categoría'
          });
          idCounter++;
        } catch {
          // Not a valid URL, skip
        }
      }
    }
  }

  return items;
}
