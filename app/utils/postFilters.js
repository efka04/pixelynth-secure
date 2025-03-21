export const filterByColor = (post, selectedColor) => {
  if (!selectedColor || selectedColor === 'all') return true;
  return post?.color === selectedColor;
};

export const filterByPeople = (post, selectedPeople) => {
  if (selectedPeople === 'all') return true;
  const peopleCount = String(post?.peopleCount ?? post?.numberOfPeople ?? post?.people ?? 0);
  return peopleCount === selectedPeople;
};

export const filterByCategory = (post, selectedCategory) => {
  if (!selectedCategory) return true;
  return post?.category === selectedCategory;
};

export const filterByOrientation = (post, selectedOrientation) => {
  if (!selectedOrientation || selectedOrientation === 'all') return true;
  return post?.orientation === selectedOrientation;
};

export const getValidDate = (item) => {
  if (!item?.createdAt) return new Date(0);
  
  const date = item.createdAt;
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

export const sortPosts = (posts, sortType) => {
  if (!Array.isArray(posts)) return [];
  const safeSort = [...posts];

  switch (sortType) {
    case 'popular':
      return safeSort.sort((a, b) => (Number(b?.favoriteCount) || 0) - (Number(a?.favoriteCount) || 0));
    case 'newest':
      return safeSort.sort((a, b) => getValidDate(b).getTime() - getValidDate(a).getTime());
    default:
      return safeSort;
  }
};

export const filterPosts = (posts, filters) => {
  if (!Array.isArray(posts)) return [];
  
  return posts.filter(post => {
    if (!post) return false;
    
    return filterByColor(post, filters.selectedColor) &&
           filterByPeople(post, filters.selectedPeople) &&
           filterByCategory(post, filters.selectedCategory) &&
           filterByOrientation(post, filters.selectedOrientation);
  });
};

/**
 * Process a list of posts with filtering and sorting
 */
export const processPostsList = (posts, filters, sortType) => {
  try {
    if (!Array.isArray(posts)) return [];
    
    // Apply filters first
    const filtered = posts.filter(post => {
      if (!post) return false;

      return filterByColor(post, filters.selectedColor) &&
             filterByPeople(post, filters.selectedPeople) &&
             filterByCategory(post, filters.selectedCategory) &&
             filterByOrientation(post, filters.selectedOrientation);
    });

    // Then apply sorting
    return sortPosts(filtered, sortType);
  } catch (error) {
    console.error('Error processing posts:', error);
    return [];
  }
};
