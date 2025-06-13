const ResponsiveGrid = ({ children, type = "songs" }) => {
  // Different grid configurations based on content type
  const gridClasses = {
    songs:
      "flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6",
    artists:
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6",
    albums:
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6",
    playlists: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6",
  };

  return (
    <div className={`${gridClasses[type]} px-4 sm:px-0 pb-24 sm:pb-0`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
