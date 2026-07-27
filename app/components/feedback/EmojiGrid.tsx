'use client';

export default function EmojiGrid({ onSelect }: { onSelect: (feedback: any) => void }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-center mb-4">
        How are you feeling about this lecture?
      </h3>
      <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
        {['🤯', '✅', '😕', '😵', '😴'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect({ emoji, comment: '' })}
            className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 hover:scale-110 transition-all"
          >
            <span className="text-4xl">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}