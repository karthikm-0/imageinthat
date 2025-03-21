import React, { useState, useEffect, useRef } from "react";
import { firstProgramStep } from "./firstProgramStep";
import {
  StepInterface,
  EnvironmentAndEnvironmentStates,
  Environment,
  EnvironmentState,
} from "./interfaces";
import LanguageInput from "./LanguageInput";
import { v4 as uuidv4 } from "uuid";
import Step from "./Step";
import Autocomplete from "./Autocomplete";
import { getCaptionForStates } from "./captioning";
import { SVGEditor } from "./SVGEditor";
import { withGridItem } from "@hcikit/react";
import { useExperiment, useConfiguration } from "@hcikit/react";
import { generateCombinedImage } from "./imageUtils";

import TaskTextOverlay from "./TaskTextOverlay";

import { highestDimensions } from "./config";

interface TimelineProps {
  taskName: string;
  isExperimentEnabled?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  taskName,
  isExperimentEnabled = true,
}) => {
  const [envAndEnvStates, setEnvAndEnvStates] =
    useState<EnvironmentAndEnvironmentStates>({
      env: { backgrounds: {}, fixtures: {}, objects: {} },
      envStates: [],
    });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [lastObjectMoved, setLastObjectMoved] =
    useState<StepInterface["masks"][0]["name"]>();

  const selectedIndexRef = useRef(selectedIndex);
  const lastObjectMovedRef = useRef(lastObjectMoved);

  const timelineRef = useRef<HTMLDivElement>(null!);

  const [captionQueue, setCaptionQueue] = useState<number[]>([]);
  const [isCaptioning, setIsCaptioning] = useState(false);

  const { advance, log } = useExperiment();
  const config = useConfiguration();
  window.config = config;

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
        console.log("Loaded JSON:", data);
        setEnvAndEnvStates({ env, envStates });
        console.log("Loaded env:", env);
        console.log("Loaded envStates:", envStates);

        // Dynamically update the shared config
        if (data.envAndEnvStates?.HIGHEST_WIDTH) {
          highestDimensions.HIGHEST_WIDTH = data.envAndEnvStates.HIGHEST_WIDTH;
        }
        if (data.envAndEnvStates?.HIGHEST_HEIGHT) {
          highestDimensions.HIGHEST_HEIGHT =
            data.envAndEnvStates.HIGHEST_HEIGHT;
        }

        log({
          type: "initializeTask",
          env,
          envStates,
        });
      })
      .catch((error) => {
        // console.error("Error loading JSON:", error);
        console.log("Selected Index:", selectedIndex);
        console.log("Last Object Moved:", lastObjectMoved);

        const initializeStep = async () => {
          console.log(
            "liveImageData is not null, proceeding to create new step"
          );
          const envAndEnvStates = await firstProgramStep("/start.png");
          console.log(envAndEnvStates.env);
          console.log(envAndEnvStates.envStates);
          setEnvAndEnvStates((prevEnvAndEnvStates) => ({
            env: envAndEnvStates.env,
            envStates: [
              ...prevEnvAndEnvStates.envStates, // Append new envStates to the existing list
              ...envAndEnvStates.envStates,
            ],
          }));
        };

        initializeStep();
      });
  }, []);

  const handleAdvance = () => {
    // Log all the environment states
    log({
      type: "advance",
      envStates: envAndEnvStates.envStates,
    });
    // console.log(config);
    advance();
  };

  const handleSaveImage = async () => {
    if (selectedIndex !== null) {
      const currentState = envAndEnvStates.envStates[selectedIndex];
      const imageDataUrl = await generateCombinedImage(
        envAndEnvStates.env,
        currentState
      );
      const link = document.createElement("a");
      link.href = imageDataUrl;
      link.download = `env_state_${selectedIndex}.png`;
      link.click();
    }
  };

  const handleSaveJSON = () => {
    const data = {
      envAndEnvStates: {
        env: envAndEnvStates.env,
        envStates: envAndEnvStates.envStates,
      },
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `env_and_envStates.json`;
    link.click();
  };

  const generateCaption = async (
    currentState: EnvironmentState,
    previousState: EnvironmentState | undefined,
    currentIndex: number
  ) => {
    try {
      const statesToCaption = previousState
        ? [previousState, currentState]
        : [currentState];

      const envAndEnvStatesToCaption: EnvironmentAndEnvironmentStates = {
        env: envAndEnvStates.env,
        envStates: statesToCaption,
      };

      const caption = await getCaptionForStates(envAndEnvStatesToCaption);
      setEnvAndEnvStates((prevEnvAndEnvStates) => ({
        env: prevEnvAndEnvStates.env,
        envStates: prevEnvAndEnvStates.envStates.map((envState, idx) =>
          idx === currentIndex ? { ...envState, caption } : envState
        ),
      }));
      console.log("Caption generated:", caption);
    } catch (error) {
      console.error("Error getting caption:", error);
    }
  };

  useEffect(() => {
    const processCaptionQueue = async () => {
      if (captionQueue.length > 0 && !isCaptioning && !isExperimentEnabled) {
        setIsCaptioning(true);
        const currentIndex = captionQueue[0];
        setCaptionQueue((prevQueue) => prevQueue.slice(1));
        const currentState = envAndEnvStates.envStates[currentIndex];
        const previousState =
          currentIndex > 0
            ? envAndEnvStates.envStates[currentIndex - 1]
            : undefined;
        await generateCaption(currentState, previousState, currentIndex);
        setIsCaptioning(false);
      }
    };

    processCaptionQueue();
  }, [captionQueue, isCaptioning, !isExperimentEnabled]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    lastObjectMovedRef.current = lastObjectMoved;
  }, [lastObjectMoved]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0) {
        event.preventDefault();
        timelineRef.current.scrollLeft += event.deltaY;
      }
    };

    const timelineElement = timelineRef.current;
    timelineElement?.addEventListener("wheel", handleWheel);

    return () => {
      timelineElement.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = timelineRef.current.scrollWidth;
    }
  }, [envAndEnvStates.envStates.length]);

  const handleUserManipulationUpdateEnvStates = (
    env: Environment,
    envState: EnvironmentState
  ) => {
    console.log("Updating envState with user manipulation. ", envState);
    setEnvAndEnvStates((prevEnvAndEnvStates) => {
      let changedObject = null;

      if (selectedIndex === null) {
        console.error("Something's wrong.");
        return prevEnvAndEnvStates;
      }

      const currentEnvState = prevEnvAndEnvStates.envStates[selectedIndex];
      const updatedEnvState = {
        ...currentEnvState,
        objects: envState.objects,
        caption: null,
      };
      console.log("Updated EnvState:", updatedEnvState);

      for (const [name, updatedObject] of Object.entries(
        updatedEnvState.objects
      )) {
        const correspondingObject = currentEnvState.objects[name];

        if (!correspondingObject) continue;

        const distance = Math.sqrt(
          Math.abs(updatedObject.x - correspondingObject.x) ** 2 +
            Math.abs(updatedObject.y - correspondingObject.y) ** 2
        );

        if (distance > 5) {
          changedObject = name;
          console.log("Distance:", distance);
          console.log("Object:", name);

          log({
            type: "objectMoved",

            objectName: name,
            oldPosition: correspondingObject,
            newPosition: updatedObject,
            distance: distance,
          });

          break;
        }
      }

      if (changedObject === null) {
        console.log("No objects changed");
        return prevEnvAndEnvStates;
      }

      if (lastObjectMovedRef.current !== changedObject || selectedIndex === 0) {
        console.log("Creating a new envState.");
        const oldEnvState = {
          ...currentEnvState,
          image_id: uuidv4(),
        };

        setSelectedIndex(selectedIndex + 1);
        setLastObjectMoved(changedObject);

        const newEnvStates = [
          ...prevEnvAndEnvStates.envStates.slice(0, selectedIndex),
          oldEnvState,
          updatedEnvState,
          ...prevEnvAndEnvStates.envStates.slice(selectedIndex + 1),
        ];

        log({
          type: "newEnvStateCreated",
          action: "objectMoved",
          objectName: changedObject,
          oldPosition: currentEnvState.objects[changedObject],
          newPosition: updatedEnvState.objects[changedObject],
          oldEnvState: currentEnvState,
          newEnvState: updatedEnvState,
          oldEnvStates: prevEnvAndEnvStates.envStates,
          newEnvStates: newEnvStates,
        });

        setCaptionQueue((prevQueue) => [...prevQueue, selectedIndex! + 1]);
        console.log("Added to caption queue:", selectedIndex! + 1);

        return {
          ...prevEnvAndEnvStates,
          envStates: newEnvStates,
        };
      } else {
        setLastObjectMoved(changedObject);

        const newEnvStates = [
          ...prevEnvAndEnvStates.envStates.slice(0, selectedIndex),
          updatedEnvState,
          ...prevEnvAndEnvStates.envStates.slice(selectedIndex + 1),
        ];

        log({
          type: "currentEnvStateUpdated",
          action: "objectPositionUpdated",
          objectName: changedObject,
          oldPosition: currentEnvState.objects[changedObject],
          newPosition: updatedEnvState.objects[changedObject],
          oldEnvState: currentEnvState,
          newEnvState: updatedEnvState,
          oldEnvStates: prevEnvAndEnvStates.envStates,
          newEnvStates: newEnvStates,
        });

        setCaptionQueue((prevQueue) => [...prevQueue, selectedIndex]);
        console.log("Added to caption queue:", selectedIndex);

        return {
          ...prevEnvAndEnvStates,
          envStates: newEnvStates,
        };
      }
    });
  };

  return (
    <div className="flex h-full flex-col w-full">
      <div className="flex-grow p-8 w-[2000px]">
        {/* <TaskTextOverlay taskName={taskName} /> */}
        <div>
          <div className="grid items-center w-full justify-center py-4">
            <div className="h-64 flex flex-col gap-2 mb-32">
              {selectedIndex !== null && (
                <>
                  <SVGEditor
                    env={envAndEnvStates.env}
                    envState={envAndEnvStates.envStates[selectedIndex]}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                    setEnvAndEnvStates={setEnvAndEnvStates}
                    updateEnvAndEnvStates={
                      handleUserManipulationUpdateEnvStates
                    }
                    setLastObjectMoved={setLastObjectMoved}
                    showPossibleManipulations={!isExperimentEnabled}
                  />
                  {!isExperimentEnabled && (
                    <div
                      className={`relative w-[${highestDimensions.HIGHEST_HEIGHT}px] flex justify-between`}
                    >
                      <div className="flex-grow mr-4">
                        <LanguageInput
                          selectedIndex={selectedIndex}
                          setSelectedIndex={setSelectedIndex}
                          env={envAndEnvStates.env}
                          envState={envAndEnvStates.envStates[selectedIndex]}
                          setEnvAndEnvStates={setEnvAndEnvStates}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <Autocomplete
                          env={envAndEnvStates.env}
                          envStates={envAndEnvStates.envStates}
                          setEnvAndEnvStates={setEnvAndEnvStates}
                          setSelectedIndex={setSelectedIndex}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div
            ref={timelineRef}
            onWheel={(e) => {
              e.currentTarget.scrollLeft += e.deltaY;
            }}
            className="flex w-full max-w-full max-w-[1936px] gap-6 p-10 mt-96 overflow-x-scroll rounded shadow bg-sky-100"
          >
            {envAndEnvStates.envStates.map((envState, index) => (
              <Step
                key={`step-${index}`}
                env={envAndEnvStates.env}
                envState={envState}
                index={index}
                selectedIndex={selectedIndex}
                hoveredIndex={hoveredIndex}
                setSelectedIndex={setSelectedIndex}
                setEnvAndEnvStates={setEnvAndEnvStates}
                setHoveredIndex={setHoveredIndex}
                envAndEnvStates={envAndEnvStates}
                isCaptioningEnabled={!isExperimentEnabled} // Pass the state to Step component
                isLinkingEnabled={!isExperimentEnabled} // Pass the state to Step component
              />
            ))}
          </div>
        </div>
        {/* <button
          onClick={handleAdvance}
          className="p-4 mt-4 ml-auto bg-green-500 text-white rounded text-lg"
        >
          Advance
        </button> */}
        {/* <button
          onClick={handleSaveImage}
          className="p-4 mt-4 ml-auto bg-green-500 text-white rounded text-lg"
        >
          Save Image
        </button> */}
        {/* <button
          onClick={handleSaveJSON}
          className="p-4 mt-4 ml-auto bg-blue-500 text-white rounded text-lg"
        >
          Save JSON
        </button> */}
      </div>
    </div>
  );
};

export default Timeline;
