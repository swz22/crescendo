import { Sidebar, Searchbar } from "./components";

const App = () => (
  <div className="flex">
    <Sidebar />
    <div className="flex-1 flex flex-col bg-gradient-to-br from-black to-[#121286]">
      <Searchbar />
      Placeholder
    </div>
  </div>
);

export default App;
