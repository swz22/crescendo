import Searchbar from "./Searchbar";

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="w-full mb-6 mt-8">
      <div className="flex items-center justify-between gap-8 mb-4">
        <div className="min-w-0">
          <h2 className="font-bold text-3xl text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-400 text-lg mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex-1 max-w-2xl">
          <Searchbar />
        </div>
      </div>
      {children}
    </div>
  );
};

export default PageHeader;