import { Sidebar, Searchbar } from "./components";
import { Home } from "./pages";

const App = () => (
  <div className="flex">
    <Sidebar />
    <div className="flex-1 flex flex-col bg-gradient-to-br from-black to-[#121286]">
      <Searchbar />
      <div className="p-6 h-[93vh] overflow-y-scroll hide-scrollbar">
        <Home />
      </div>
    </div>
  </div>
);

export default App;
