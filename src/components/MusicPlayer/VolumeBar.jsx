import {
  BsFillVolumeUpFill,
  BsVolumeDownFill,
  BsFillVolumeMuteFill,
} from "react-icons/bs";

const VolumeBar = ({ value, min, max, onChange, setVolume }) => (
  <div className="hidden lg:flex flex-1 items-center justify-end">
    {value <= 1 && value > 0.5 && (
      <BsFillVolumeUpFill
        size={25}
        color="#FFF"
        className="cursor-pointer hover:text-[#14b8a6] transition-colors"
        onClick={() => setVolume(0)}
      />
    )}
    {value <= 0.5 && value > 0 && (
      <BsVolumeDownFill
        size={25}
        color="#FFF"
        className="cursor-pointer hover:text-[#14b8a6] transition-colors"
        onClick={() => setVolume(0)}
      />
    )}
    {value === 0 && (
      <BsFillVolumeMuteFill
        size={25}
        color="#FFF"
        className="cursor-pointer hover:text-[#14b8a6] transition-colors"
        onClick={() => setVolume(1)}
      />
    )}
    <input
      type="range"
      step="any"
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      className="2xl:w-40 lg:w-32 md:w-32 h-1.5 ml-2 appearance-none cursor-pointer bg-white/20 rounded-lg
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                 [&::-webkit-slider-thumb]:bg-[#14b8a6] [&::-webkit-slider-thumb]:rounded-full 
                 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#2dd4bf]
                 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(20,184,166,0.5)]
                 [&::-webkit-slider-thumb]:transition-all"
      style={{
        background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
          value * 100
        }%, rgba(255,255,255,0.2) ${value * 100}%, rgba(255,255,255,0.2) 100%)`,
      }}
    />
  </div>
);

export default VolumeBar;
