import { useExperiment } from "@hcikit/react";
import React from "react";

const StudyTutorial: React.FC<{ videoUrl: string }> = ({ videoUrl }) => {
  // const videoUrl = "/tutorial.mp4";
  const { advance } = useExperiment();
  return (
    <div
      // style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}
      className="max-w-[1800px] mx-auto grid items-center justify-center w-full h-full"
    >
      <video
        src={videoUrl}
        // style={{
        //   position: "absolute",
        //   top: 0,
        //   left: 0,
        //   width: "100%",
        //   height: "100%",
        // }}
        controls
      ></video>
      <button
        onClick={() => advance()}
        className="p-2 bg-green-500 text-white rounded"
      >
        Advance
      </button>
    </div>
  );
};

export default StudyTutorial;
