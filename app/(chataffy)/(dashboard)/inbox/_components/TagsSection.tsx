"use client";
import { Plus, X } from "lucide-react";
import { Tag } from "./types/inbox";

interface TagsSectionProps {
  tags: Tag[];
  addTag: boolean;
  inputAddTag: string;
  onAddTag: () => void;
  onAddTagClick: () => void;
  onTagDelete: (id: string) => void;
  onInputAddTagChange: (value: string) => void;
  setAddTag: (value: boolean) => void;
}

export default function TagsSection({
  tags,
  addTag,
  inputAddTag,
  onAddTag,
  onAddTagClick,
  onTagDelete,
  onInputAddTagChange,
  setAddTag,
}: TagsSectionProps) {
  return (
    <div className="flex items-center space-x-2 mt-4">
      {tags.map((tag: Tag) => (
        <span
          key={tag._id}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {tag.name}
          <button
            onClick={() => onTagDelete(tag._id)}
            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      {addTag ? (
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Tag name"
              value={inputAddTag}
              onChange={(e) => {
                if (e.target.value.length <= 30) {
                  onInputAddTagChange(e.target.value);
                }
              }}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && onAddTagClick()}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {inputAddTag.length}/30
            </div>
          </div>
          <button
            onClick={onAddTagClick}
            disabled={tags.length >= 6}
            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={onAddTag}
          disabled={tags.length >= 6}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Tag ({tags.length}/6)
        </button>
      )}
    </div>
  );
}