import React, { useState, useEffect, useRef } from 'react';
import { LinkItem, ItemColor, WorkflowStatus } from '../../types';
import { getItemColorClasses, getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { WorkflowStatusBadge } from '../WorkflowStatusBadge';
import {
  fetchLinkMetadata,
  formatDisplayUrl,
  extractYouTubeVideoId,
} from '../../services/linkPreview';
import {
  Link2,
  ExternalLink,
  Trash2,
  Globe,
  RotateCw,
  Play,
  X,
  Edit2,
  Loader2,
  Palette,
  GripHorizontal,
} from 'lucide-react';

interface LinkCardProps {
  item: LinkItem;
  onUpdate: (updates: Partial<LinkItem>) => void;
  onDelete: () => void;
  isSelected?: boolean;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  item,
  onUpdate,
  onDelete,
  isSelected,
}) => {
  const [isEditingUrl, setIsEditingUrl] = useState(!item.url);
  const [urlInput, setUrlInput] = useState(item.url || '');
  const [isFetching, setIsFetching] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const initialFetchAttempted = useRef(false);
  const colorClasses = getItemColorClasses(item.color);
  const colorStyles = getItemColorStyles(item.color || 'default', item.customColor);

  // Auto-fetch preview on first render if URL exists but content is missing
  useEffect(() => {
    if (
      item.url &&
      !item.imageUrl &&
      (!item.description || item.description === 'Web resource link') &&
      !initialFetchAttempted.current
    ) {
      initialFetchAttempted.current = true;
      loadPreview(item.url);
    }
  }, [item.url]);

  // Format valid target URL with https protocol if missing
  const formattedTargetUrl = item.url
    ? /^https?:\/\//i.test(item.url.trim())
      ? item.url.trim()
      : `https://${item.url.trim()}`
    : '';

  // Reliable open link function that works in iframe / new tab
  const handleOpenLink = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!formattedTargetUrl) return;

    try {
      const win = window.open(formattedTargetUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        // Fallback for pop-up blocked environments
        const a = document.createElement('a');
        a.href = formattedTargetUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      const a = document.createElement('a');
      a.href = formattedTargetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Load preview data from URL
  const loadPreview = async (targetUrl: string) => {
    let formatted = targetUrl.trim();
    if (!formatted) return;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
    }

    setIsFetching(true);
    setImageError(false);

    try {
      const metadata = await fetchLinkMetadata(formatted);
      onUpdate({
        url: metadata.url,
        title: metadata.title || item.title || 'Untitled Link',
        description: metadata.description || item.description,
        imageUrl: metadata.imageUrl,
        favicon: metadata.favicon,
        siteName: metadata.siteName,
        mediaType: metadata.mediaType,
        videoId: metadata.videoId,
        isLoading: false,
      });
      setIsEditingUrl(false);
    } catch (err: any) {
      console.warn('Failed to fetch link preview:', err);
      try {
        const parsed = new URL(formatted);
        onUpdate({
          url: formatted,
          title: item.title || parsed.hostname.replace(/^www\./, ''),
          description: item.description || `Resource from ${parsed.hostname}`,
          favicon: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`,
          isLoading: false,
        });
      } catch {
        onUpdate({ url: formatted, title: item.title || formatted, isLoading: false });
      }
      setIsEditingUrl(false);
    } finally {
      setIsFetching(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      loadPreview(urlInput.trim());
    }
  };

  const youtubeId = item.videoId || extractYouTubeVideoId(item.url);
  const isVideo = item.mediaType === 'video' || Boolean(youtubeId);

  return (
    <div
      id={`item-${item.id}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={`group relative rounded-xl border transition-all duration-200 overflow-hidden select-none ${
        !item.customColor ? colorStyles.className : ''
      } ${
        isSelected
          ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg z-20'
          : 'shadow-xs hover:shadow-md'
      }`}
      style={{
        ...(item.customColor ? colorStyles.style : {}),
        width: item.width ? `${item.width}px` : '320px',
      }}
    >
      {/* Subtle Drag Grip Handle */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-neutral-100/90 border-b border-neutral-200/60 text-neutral-400 select-none cursor-grab active:cursor-grabbing hover:bg-neutral-200/60 transition-colors"
        title="Drag to move card anywhere on canvas"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase opacity-70">
          <GripHorizontal className="w-3.5 h-3.5" />
          <span>Link Card</span>
        </div>
        <div className="no-drag">
          <WorkflowStatusBadge
            status={item.workflowStatus}
            note={item.workflowNote}
            onUpdateStatus={(status: WorkflowStatus, note?: string) =>
              onUpdate({ workflowStatus: status, workflowNote: note })
            }
            compact
          />
        </div>
      </div>

      {/* Top Floating Control Bar on Hover / Selection */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm no-drag">
        {item.url && (
          <>
            {formattedTargetUrl && (
              <a
                href={formattedTargetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer no-drag inline-flex items-center justify-center"
                title="Open link in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadPreview(item.url);
              }}
              disabled={isFetching}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer no-drag"
              title="Refresh link preview"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUrlInput(item.url);
                setIsEditingUrl(true);
              }}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer no-drag"
              title="Edit URL"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Color Picker Toggle */}
            <div className="relative no-drag">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer no-drag"
                title="Change card color"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {showColorPicker && (
                <div
                  className="absolute right-0 top-full mt-2 z-50 no-drag"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ColorPickerPopover
                    currentColor={item.color}
                    customColor={item.customColor}
                    onChangeColor={(color: ItemColor, customHex?: string) => {
                      onUpdate({ color, customColor: customHex });
                      setShowColorPicker(false);
                    }}
                    onClose={() => setShowColorPicker(false)}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-red-300 hover:text-red-100 hover:bg-red-500/50 rounded-md transition-colors cursor-pointer no-drag"
          title="Delete link card"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* URL INPUT MODE */}
      {isEditingUrl ? (
        <div className="p-3.5 bg-white">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-700">
            <span className="p-1 rounded bg-blue-100 text-blue-600">
              <Link2 className="w-3.5 h-3.5" />
            </span>
            <span>Link Box</span>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2 no-drag">
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste URL (e.g. https://example.com)..."
                autoFocus
                disabled={isFetching}
                className="w-full text-xs bg-transparent outline-none text-neutral-800 placeholder:text-neutral-400 no-drag"
              />
              <button
                type="submit"
                disabled={isFetching || !urlInput.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer no-drag"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Fetching</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>

            {item.url && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-800 cursor-pointer no-drag"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        /* LOADED PREVIEW MODE */
        <div className="flex flex-col">
          {/* Top Media: Video player or Preview Hero Image */}
          {isPlayingVideo && youtubeId ? (
            <div className="relative w-full aspect-video bg-black rounded-t-xl overflow-hidden shadow-inner no-drag">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
              <button
                type="button"
                onClick={() => setIsPlayingVideo(false)}
                className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-1 bg-black/70 hover:bg-black text-white text-[11px] rounded-md shadow-md backdrop-blur-xs cursor-pointer transition-colors no-drag"
                title="Exit video player"
              >
                <X className="w-3 h-3" />
                <span>Close video</span>
              </button>
            </div>
          ) : item.imageUrl && !imageError ? (
            <div
              className="relative w-full aspect-video max-h-56 bg-neutral-900 overflow-hidden group/thumb select-none"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover select-none"
              />

              {/* Video Play Button Overlay if Video */}
              {isVideo && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (youtubeId) {
                      setIsPlayingVideo(true);
                    } else {
                      handleOpenLink(e);
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors cursor-pointer no-drag"
                  title="Play video"
                >
                  <div className="w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 border border-white/20">
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          ) : isFetching ? (
            /* Loading shimmer */
            <div className="w-full aspect-video bg-neutral-100 animate-pulse flex flex-col items-center justify-center text-neutral-400 gap-2 border-b border-neutral-200/60">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-[11px] font-medium text-neutral-500">
                Fetching preview from link...
              </span>
            </div>
          ) : null}

          {/* Card Details Body */}
          <div className="p-3.5 flex flex-col gap-2.5 bg-white">
            {/* Favicon, Display URL & Dedicated Open Action */}
            <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500 font-mono min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {item.favicon ? (
                  <img
                    src={item.favicon}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                )}
                <span
                  className="truncate text-neutral-500 select-text cursor-default font-mono"
                  title={item.url}
                >
                  {formatDisplayUrl(item.url, 32)}
                </span>
              </div>

              {/* Dedicated open link button - sole way to navigate out */}
              {formattedTargetUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenLink(e);
                  }}
                  className="no-drag shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200/90 hover:border-indigo-600 rounded-md transition-all group/openbtn cursor-pointer shadow-2xs"
                  title="Open link in new tab"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 group-hover/openbtn:text-white transition-colors" />
                </button>
              )}
            </div>

            {/* Title (Text is non-clickable, double-click to edit) */}
            <div>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="w-full text-sm font-semibold text-neutral-900 border-b border-indigo-500 bg-transparent outline-none py-0.5 no-drag"
                />
              ) : (
                <div
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="group/title text-neutral-900 font-semibold text-sm leading-snug line-clamp-2 select-text cursor-text"
                  title="Double-click to edit title"
                >
                  <span>{item.title || 'Untitled Link'}</span>
                </div>
              )}
            </div>

            {/* Description Snippet */}
            {isEditingDesc ? (
              <textarea
                value={item.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                onBlur={() => setIsEditingDesc(false)}
                rows={3}
                autoFocus
                className="w-full text-xs text-neutral-700 border border-neutral-200 rounded-md p-1.5 bg-neutral-50 outline-none resize-none no-drag"
              />
            ) : item.description ? (
              <p
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingDesc(true);
                }}
                className="text-xs text-neutral-600 leading-relaxed line-clamp-3 font-normal select-text cursor-text"
                title="Double-click to edit description"
              >
                {item.description}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDesc(true)}
                className="text-[11px] text-neutral-400 hover:text-neutral-600 text-left italic cursor-pointer no-drag"
              >
                + Add link note/description...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
