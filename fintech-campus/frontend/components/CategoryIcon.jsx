const MAP = {
  Food: "/icons/cat-food.svg",
  Travel: "/icons/cat-travel.svg",
  Mess: "/icons/cat-mess.svg",
  Trip: "/icons/cat-trip.svg",
  Books: "/icons/cat-books.svg",
  Other: "/icons/cat-other.svg",
};

export function CategoryIcon({ category, size = 28, alt = "" }) {
  const src = MAP[category] || MAP.Other;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt || `${category} category`}
      className="category-icon"
      loading="lazy"
      decoding="async"
    />
  );
}
