// TagsInput.jsx
import React from 'react';

const TagsInput = ({ tags, currentTag, onChange, onAdd, onRemove, disabled }) => {
  return (
    <div className="flex flex-col gap-1 my-1 md:my-2">
      <h3 className="font-semibold text-xs md:text-sm">Tags (max 20)</h3>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs flex items-center gap-1">
            {tag}
            <button onClick={() => onRemove(tag)} className="text-gray-500 hover:text-gray-700 text-xs">
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={onAdd} className="flex gap-1 mt-1">
        <input
          type="text"
          value={currentTag}
          onChange={onChange}
          placeholder="Add a tag"
          className="flex-1 px-2 md:px-3 py-1 border rounded-md outline-none text-xs md:text-sm"
          disabled={disabled}
        />
        <button
          type="submit"
          className="px-2 md:px-3 py-1 bg-black text-white rounded-md disabled:bg-gray-300 text-xs"
          disabled={!currentTag.trim() || disabled}
        >
          Add
        </button>
      </form>
    </div>
  );
};

export default TagsInput;
