import { useState } from 'react';

export default function ImageGallery({ images = [] }) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] min-h-[12rem] max-h-[min(70vh,28rem)] items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-gray-100 sm:aspect-video sm:min-h-[14rem] md:max-h-[32rem]">
        <svg className="w-16 h-16 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const current = images[selected];
  const src = typeof current === 'string' ? current : current?.url || current?.file_path || current?.storagePath;
  const mimeType = typeof current === 'string' ? '' : String(current?.mimeType || current?.mime_type || '');
  const isVideo = mimeType.startsWith('video/');

  return (
    <div>
      <div className="mb-3 aspect-[4/3] max-h-[min(70vh,28rem)] min-h-[12rem] w-full overflow-hidden rounded-xl bg-gray-100 sm:aspect-video sm:min-h-[14rem] md:max-h-[32rem]">
        {isVideo ? (
          <video src={src} controls className="h-full w-full object-cover" />
        ) : (
          <img src={src} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((img, i) => {
          const s = typeof img === 'string' ? img : img?.url || img?.file_path || img?.storagePath;
          const thumbMime = typeof img === 'string' ? '' : String(img?.mimeType || img?.mime_type || '');
          const thumbIsVideo = thumbMime.startsWith('video/');
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${
                i === selected ? 'border-emerald-600 ring-2 ring-emerald-500/25' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {thumbIsVideo ? (
                <div className="relative h-full w-full bg-gray-800">
                  <video src={s} className="h-full w-full object-cover opacity-90" muted />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">Video</span>
                </div>
              ) : (
                <img src={s} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
