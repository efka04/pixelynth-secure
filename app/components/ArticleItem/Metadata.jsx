const ArticleMetadata = ({ title, category, color }) => (
  <div className="p-2">
    <h2 className="text-sm font-medium truncate">{title}</h2>
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {category && <span>{category}</span>}
      {color && <span>{color}</span>}
    </div>
  </div>
);

export default ArticleMetadata;
