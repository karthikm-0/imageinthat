import React, { useState, useEffect } from "react";
import Timeline from "./Timeline";
import TextTimeline from "./TextTimeline";
import Experiment, {
  DevTools,
  DisplayText,
  InformationScreen,
  WizardProgress,
  createUpload,
} from "@hcikit/react";
import { __INDEX__ } from "@hcikit/workflow";
import GetParticipantID from "./GetParticipantID";
import { fetchConfiguration } from "./configurationStudy";
import { configuration } from "./configuration";
import { DownloadLogs } from "./DownloadLogs";
import GoogleFormQuestionnaire from "./GoogleFormQuestionnaire";
import VideoTutorial from "./studyTutorial";
import { PreventReload } from "./PreventReload";

const DownloadUpload = createUpload((filename, config) => {
  // create download link and click it.
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(
    new Blob([JSON.stringify(config)], { type: "application/json" })
  );

  console.log(config);
  console.log(config[__INDEX__]);
  downloadLink.download = filename;
  downloadLink.click();

  return Promise.resolve();
});

const NewInformationScreen = (props: any) => {
  return (
    <div className="prose w-full mx-auto">
      <InformationScreen {...props} />
    </div>
  );
};

const tasks = {
  InformationScreen: NewInformationScreen,
  WizardProgress,
  VideoTutorial,
  Timeline,
  TextTimeline,
  DownloadLogs,
  DevTools,
  GoogleFormQuestionnaire,
  DisplayText,
  PreventReload,
  DownloadUpload,
};

// Study
// function App() {
//   const [pid, setPID] = useState<string>("");
//   const [configuration, setConfiguration] = useState<any>(null);

//   useEffect(() => {
//     if (pid) {
//       const config = fetchConfiguration(parseInt(pid, 10));
//       setConfiguration(config);
//     }
//   }, [pid]);

//   if (!pid) {
//     return <GetParticipantID onPIDChange={setPID} />;
//   }

//   if (!configuration) {
//     return <div>Loading configuration...</div>;
//   }

//   return (
//     <div className="max-w-[2000px] mx-auto">
//       <Experiment
//         loadState={() => ({})}
//         saveState={() => {}}
//         tasks={tasks}
//         configuration={configuration}
//       />
//     </div>
//   );
// }

// Original;
function App() {
  return <Experiment tasks={tasks} configuration={configuration} />;
}

export default App;

// // Placeholder Hello World
// function App() {
//   return <h1>Hello World</h1>;
// }

// export default App;
