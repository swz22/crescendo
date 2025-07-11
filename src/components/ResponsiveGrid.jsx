const ResponsiveGrid = ({ children, type = "songs" }) => {
  const gridClasses = {
    songs:
      "grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6",
    artists:
      "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 xs:gap-3 sm:gap-6",
    albums:
      "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-6",
    playlists:
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-6",
  };

  return (
    <div className={`${gridClasses[type]} px-3 xs:px-4 md:px-0 pb-24 md:pb-0`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
