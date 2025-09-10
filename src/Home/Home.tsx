import { useEffect, useState } from "react";
import "./Home.css";
import bg from "../assets/image.png";

const lines = ["Hey I'm anirudh", "call me anytime baby", "projects"];
const wait = 3;
function Home() {
  const [text, setText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (text === lines[textIndex]) {
        setTimer(timer + 1);
        if (timer + 1 >= (wait * 1000) / 50) {
          setTextIndex(textIndex >= lines.length - 1 ? 0 : textIndex + 1);
          setText("");
          setTimer(0);
        }
      } else {
        setText(lines[textIndex].substring(0, text.length + 1));
      }

      setAnim(anim + 2);
    }, 50);
    return () => clearInterval(id);
  });

  return (
    <div className="bg-slate-900">
      <img
        className="absolute h-screen w-screen  
         "
        src={bg}
        alt="hi"
      />
      <div className="absolute h-[100vh] w-[100vw] backdrop-blur-2xl"></div>
      <div
        className={`absolute h-[100vh] w-[100vw] 
          bg-[url("/bg.jpg")] opacity-40 bg-repeat bg-fixed bg-size-[40%]
         mix-blend-soft-light grayscale-50 
        `}
        style={{ backgroundPosition: `${anim}px ${anim}px` }}
      ></div>

      <div
        className={`w-screen h-screen   text-white flex relative
          
        `}
        style={{
          boxShadow: "inset 0 0 50px 25px #08070a",
        }}
      >
        <div className="rounded-md backdrop-brightness-75 p-2  absolute top-1/2 -translate-y-1/2 left-20 text-6xl drop-shadow-2xl drop-shadow-slate-100">
          {text}
        </div>
      </div>
      <div className="bg-[#08070a] text-white h-100"></div>
    </div>
  );
}

export default Home;
