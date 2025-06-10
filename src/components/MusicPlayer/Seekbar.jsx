const Seekbar = ({ value, min, max, onInput, setSeekTime, appTime }) => {
  // converts the time to format 0:00
  const getTime = (time) =>
    `${Math.floor(time / 60)}:${`0${Math.floor(time % 60)}`.slice(-2)}`;

  return (
    <div className="hidden sm:flex flex-row items-center">
      <button
        type="button"
        onClick={() => setSeekTime(appTime - 5)}
        className="hidden lg:mr-4 lg:block text-gray-400 hover:text-white transition-colors"
      >
        -
      </button>
      <p className="text-gray-300 text-sm font-medium">
        {value === 0 ? "0:00" : getTime(value)}
      </p>
      <input
        type="range"
        step="any"
        value={value}
        min={min}
        max={max}
        onInput={onInput}
        className="md:block w-24 md:w-56 2xl:w-96 h-1.5 mx-4 2xl:mx-6 rounded-lg appearance-none cursor-pointer bg-white/20
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                   [&::-webkit-slider-thumb]:bg-[#14b8a6] [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#2dd4bf] 
                   [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(20,184,166,0.5)] 
                   [&::-webkit-slider-thumb]:transition-all"
        style={{
          background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
            (value / max) * 100
          }%, rgba(255,255,255,0.2) ${
            (value / max) * 100
          }%, rgba(255,255,255,0.2) 100%)`,
        }}
      />
      <p className="text-gray-300 text-sm font-medium">
        {max === 0 ? "0:00" : getTime(max)}
      </p>
      <button
        type="button"
        onClick={() => setSeekTime(appTime + 5)}
        className="hidden lg:ml-4 lg:block text-gray-400 hover:text-white transition-colors"
      >
        +
      </button>
    </div>
  );
};

export default Seekbar;
