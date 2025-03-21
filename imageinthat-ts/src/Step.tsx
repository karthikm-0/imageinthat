import React, { useState } from "react";
import { FaCopy, FaTrash, FaLink, FaUnlink } from "react-icons/fa";
import {
  EnvironmentAndEnvironmentStates,
  EnvironmentState,
  Environment,
} from "./interfaces";
import { generateCombinedImage } from "./imageUtils";

import { StepToImageSvg } from "./StepToImageSvg";
import { AnimateBetweenSteps } from "./Animate";
import { generateNextStates } from "./FlaskApi";
import { useExperiment } from "@hcikit/react";

interface StepProps {
  env: Environment;
  envState: EnvironmentState;
  index: number;
  selectedIndex: number | null;
  hoveredIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setEnvAndEnvStates: React.Dispatch<
    React.SetStateAction<EnvironmentAndEnvironmentStates>
  >;
  setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>;
  envAndEnvStates: EnvironmentAndEnvironmentStates;
  isCaptioningEnabled: boolean; // New prop for captioning enabled state
  isLinkingEnabled: boolean; // New prop for linking enabled state
}

const Step: React.FC<StepProps> = ({
  env,
  envState,
  index,
  selectedIndex,
  hoveredIndex,
  setSelectedIndex,
  setEnvAndEnvStates,
  setHoveredIndex,
  envAndEnvStates,
  isCaptioningEnabled,
  isLinkingEnabled,
}) => {
  const isFirstStep = envAndEnvStates.envStates[0] === envState;
  const [caption, setCaption] = useState(envState.caption ?? "");
  const [isCaptionHovered, setIsCaptionHovered] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [isLinked, setIsLinked] = useState(true); // New state for link status
  const { log } = useExperiment();

  const constructNewEnvAndEnvStates = (
    env: Environment,
    envStates: EnvironmentState[],
    index1: number,
    index2: number
  ): EnvironmentAndEnvironmentStates => {
    const earlier = Math.min(index1, index2);
    const later = Math.max(index1, index2);
    const newEnvStates = [envStates[earlier], envStates[later]];
    return { env, envStates: newEnvStates };
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCaption = e.target.value;
    setCaption(newCaption);
    setEnvAndEnvStates((prevEnvAndEnvStates) => {
      const newEnvStates = prevEnvAndEnvStates.envStates.map((state, i) =>
        i === index ? { ...state, caption: newCaption } : state
      );
      return { ...prevEnvAndEnvStates, envStates: newEnvStates };
    });
  };

  const handleCaptionStepChange = async () => {
    try {
      console.log("Caption changed, updating state...");

      // Get data from the previous state because we are updating the current state with the new caption but only if it exists
      const previousState =
        index > 0 ? envAndEnvStates.envStates[index - 1] : undefined;
      if (!previousState) {
        console.error("Previous state not found, cannot update captions.");
        return;
      }

      const imageDataToSend = await generateCombinedImage(env, previousState);

      const updateCurrentEnvState = await generateNextStates(
        caption,
        imageDataToSend || "",
        env,
        previousState
      );

      // Just update the existing state without creating a new one
      setEnvAndEnvStates((prevEnvAndEnvStates) => {
        const newEnvStates = prevEnvAndEnvStates.envStates.map((state, i) =>
          i === index ? updateCurrentEnvState : state
        );
        return {
          ...prevEnvAndEnvStates,
          envStates: newEnvStates as EnvironmentState[],
        };
      });

      // Lock the caption to the current state now that we have updated it
      setIsLinked(true);
    } catch (error) {
      console.error("Error updating caption:", error);
    }
  };

  return (
    <div
      key={`step-${index}`}
      className={`group rounded flex flex-col gap-2 p-3 ${
        isLinked ? "bg-gray-200" : "bg-red-200"
      } ${selectedIndex === index ? "ring-4 ring-blue-500 shadow-lg" : ""}`}
      onClick={() => {
        const newIndex = selectedIndex === index ? null : index;

        // Only update state and log if there is a change
        if (newIndex !== selectedIndex) {
          setSelectedIndex(newIndex);

          // Log the state change
          log({
            type: newIndex === null ? "stepDeselected" : "stepSelected",
            selectedIndex: newIndex,
            selectedEnvState:
              newIndex !== null ? envAndEnvStates.envStates[newIndex] : null,
            // envStates: envAndEnvStates,
          });
        }
      }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {hoveredIndex === index &&
      selectedIndex !== null &&
      selectedIndex !== index ? (
        <AnimateBetweenSteps
          envAndEnvStates={constructNewEnvAndEnvStates(
            env,
            envAndEnvStates.envStates,
            hoveredIndex,
            selectedIndex
          )}
        />
      ) : (
        <StepToImageSvg
          env={env}
          envState={envState}
          prevEnvState={
            index > 0 ? envAndEnvStates.envStates[index - 1] : undefined
          }
          envStates={envAndEnvStates.envStates}
        />
      )}
      {!isFirstStep && isCaptioningEnabled && (
        <div
          className={`text-left font-semibold text-gray-800 mt-1 max-w-64 flex-1 w-full overflow-hidden whitespace-normal break-words ${
            isCaptionHovered ? "bg-gray-300 cursor-pointer" : ""
          }`}
          onMouseEnter={() => setIsCaptionHovered(true)}
          onMouseLeave={() => setIsCaptionHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingCaption(true);
          }}
        >
          {isEditingCaption ? (
            <input
              type="text"
              value={caption}
              onChange={handleCaptionChange}
              onBlur={async () => {
                setIsEditingCaption(false);
                if (isLinked) {
                  await handleCaptionStepChange();
                }
              }}
              className="w-full p-1 border border-gray-300 rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            envState.caption ?? "Waiting for caption..."
          )}
        </div>
      )}
      <div className="flex flex-row items-center justify-center gap-2 text-gray-800 invisible group-hover:visible">
        {index !== 0 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Copy all the previous state's properties
                const newEnvState = {
                  ...envState,
                  //caption: null,
                };
                setEnvAndEnvStates((prevEnvAndEnvStates) => {
                  const newEnvStates = [
                    ...prevEnvAndEnvStates.envStates.slice(0, index + 1),
                    newEnvState,
                    ...prevEnvAndEnvStates.envStates.slice(index + 1),
                  ];
                  setSelectedIndex(index + 1);

                  log({
                    type: "stepCopied",
                    copiedEnvState: newEnvState,
                    oldEnvStates: prevEnvAndEnvStates.envStates,
                    newEnvStates: newEnvStates,
                  });

                  return { ...prevEnvAndEnvStates, envStates: newEnvStates };
                });
              }}
            >
              <FaCopy className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(null);
                setEnvAndEnvStates((prevEnvAndEnvStates) => {
                  const newEnvStates = prevEnvAndEnvStates.envStates.filter(
                    (_, i) => i !== index
                  );

                  // Log the state change
                  log({
                    type: "stepDeleted",
                    deletedEnvState: prevEnvAndEnvStates.envStates[index],
                    oldEnvStates: prevEnvAndEnvStates.envStates,
                    newEnvStates: newEnvStates,
                  });

                  return { ...prevEnvAndEnvStates, envStates: newEnvStates };
                });
                return false;
              }}
            >
              <FaTrash className="w-5 h-5" />
            </button>
            {isLinkingEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLinked((prevIsLinked) => !prevIsLinked);
                }}
              >
                {isLinked ? (
                  <FaLink className="w-5 h-5" />
                ) : (
                  <FaUnlink className="w-5 h-5" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Step;
