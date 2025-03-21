import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import {
  EnvironmentAndEnvironmentStates,
  TextStepInterface,
} from "./interfaces";
import TextStep from "./TextStep";
import StepToImageSvg from "./StepToImageSvg";
import { useExperiment, useConfiguration } from "@hcikit/react";
import TaskTextOverlay from "./TaskTextOverlay";
import { highestDimensions } from "./config";

interface TextTimelineProps {
  taskName: string;
}

const TextTimeline: React.FC<TextTimelineProps> = ({ taskName }) => {
  const [envAndEnvStates, setEnvAndEnvStates] =
    useState<EnvironmentAndEnvironmentStates>({
      env: { backgrounds: {}, fixtures: {}, objects: {} },
      envStates: [],
    });

  const [textSteps, setTextSteps] = useState<TextStepInterface[]>([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null!);
  const textStepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { advance, log } = useExperiment();
  // const config = useConfiguration();

  useEffect(() => {
    // Fetch the JSON data and update the state
    fetch(`/study_tasks/${taskName}/${taskName}.json`)
      .then((response) => {
        if (response.status === 404) {
          throw new Error("File not found");
        }
        return response.json();
      })
      .then((data) => {
        const { env, envStates } = data.envAndEnvStates;
        setEnvAndEnvStates({ env, envStates });
        console.log("Loaded env:", env);
        console.log("Loaded envStates:", envStates);

        log({
          type: "initializeTask",
          env,
          envStates,
        });
      })
      .catch((error) => {
        console.error("Error loading JSON:", error);
        console.log("Selected Index:", selectedIndex);
      });
  }, [taskName]);

  useEffect(() => {
    if (selectedIndex !== null && textStepRefs.current[selectedIndex]) {
      textStepRefs.current[selectedIndex]?.focus();
    }
  }, [selectedIndex]);

  const handleAddStep = (copiedStep?: TextStepInterface, index?: number) => {
    let newTextSteps: TextStepInterface[];
    let newIndex: number;

    if (index !== undefined) {
      newTextSteps = [
        ...textSteps.slice(0, index + 1),
        copiedStep ? { ...copiedStep } : { text: "" },
        ...textSteps.slice(index + 1),
      ];
      newIndex = index + 1;
    } else if (selectedIndex !== null) {
      newTextSteps = [
        ...textSteps.slice(0, selectedIndex + 1),
        copiedStep ? { ...copiedStep } : { text: "" },
        ...textSteps.slice(selectedIndex + 1),
      ];
      newIndex = selectedIndex + 1;
    } else {
      newTextSteps = [
        ...textSteps,
        copiedStep ? { ...copiedStep } : { text: "" },
      ];
      newIndex = textSteps.length;
    }

    setTextSteps(newTextSteps);
    setSelectedIndex(newIndex);

    log({
      type: copiedStep ? "copyStep" : "addStep",
      selectedIndex: newIndex,
      oldTextSteps: textSteps,
      newTextSteps: newTextSteps,
    });
  };

  const handleCopyStep = (index: number) => {
    const copiedStep = textSteps[index];
    handleAddStep(copiedStep, index);
  };

  const handleAdvance = () => {
    log({
      type: "advance",
      allSteps: textSteps,
    });
    console.log(textSteps);
    advance();
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      timelineRef.current.scrollLeft += e.deltaY;
    };

    const timelineElement = timelineRef.current;
    timelineElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      timelineElement.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div className="flex h-full flex-col w-full">
      <div className="flex-grow p-8 w-[2000px]">
        <TaskTextOverlay taskName={taskName} />

        <div>
          <div className="grid items-center h-[800px] w-[2000px] justify-center py-16">
            {envAndEnvStates.envStates.length > 0 && (
              <div>
                <StepToImageSvg
                  env={envAndEnvStates.env}
                  envState={envAndEnvStates.envStates[0]}
                  className="mx-auto"
                  envStates={envAndEnvStates.envStates}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => handleAddStep()}
            className="mb-2 p-4 bg-blue-500 text-white rounded flex items-center gap-2 text-lg"
          >
            <FaPlus />
            Add Step
          </button>
          <div
            ref={timelineRef}
            className="flex max-w-full max-w-[1936px] min-h-[403px] w-full gap-6 p-10 mt-5 overflow-x-scroll rounded shadow bg-sky-100"
          >
            {textSteps.map((textStep, index) => (
              <TextStep
                key={`step-${index}`}
                taskName={taskName}
                index={index}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                currentTextStep={textStep}
                textSteps={textSteps}
                setTextSteps={setTextSteps}
                handleCopyStep={handleCopyStep} // Pass the function
                handleAddStep={handleAddStep} // Pass the function
                ref={(el) => (textStepRefs.current[index] = el)}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleAdvance}
          className="p-4 mt-4 ml-auto bg-green-500 text-white rounded text-lg"
        >
          Advance
        </button>
      </div>
    </div>
  );
};

export default TextTimeline;
