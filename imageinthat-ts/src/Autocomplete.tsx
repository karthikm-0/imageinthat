import React, { useState } from "react";
import { FaTimes, FaRobot } from "react-icons/fa"; // Import the robot icon
import {
  Environment,
  EnvironmentState,
  EnvironmentAndEnvironmentStates,
} from "./interfaces";
import { StepToImageSvg } from "./StepToImageSvg";
import { generateCombinedImage } from "./imageUtils";
import { sendEnvAndEnvStatesData } from "./FlaskApi";

interface AutocompleteProps {
  env: Environment;
  envStates: EnvironmentState[];
  setEnvAndEnvStates: React.Dispatch<
    React.SetStateAction<EnvironmentAndEnvironmentStates>
  >;
  setSelectedIndex: (index: number) => void; // Add setSelectedIndex prop
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  env,
  envStates,
  setEnvAndEnvStates,
  setSelectedIndex, // Destructure setSelectedIndex prop
}) => {
  const [autocompleteBuffer, setAutocompleteBuffer] = useState<
    EnvironmentState[]
  >([]);
  const [isCaptionHovered, setIsCaptionHovered] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState("");

  const generateAndSendImages = async () => {
    console.log("Generate and Send Images function called");

    // Generate images
    const generatedImages = await Promise.all(
      envStates.map((envState: EnvironmentState) =>
        generateCombinedImage(env, envState)
      )
    );

    // Call the multimodal API with the generated images
    const newEnvStates: EnvironmentState[] = (await sendEnvAndEnvStatesData(
      "/api/generate_autocomplete",
      {
        env: env,
        envStates: envStates,
        text: "",
        images: generatedImages,
      }
    )) as EnvironmentState[];

    handleAutocompleteSteps(newEnvStates);
  };

  const handleAutocompleteSteps = (newSteps: EnvironmentState[]) => {
    // Add a distinct look to the new steps by noting that they were autocompleted
    const formattedSteps = newSteps.map((step) => ({
      ...step,
      isAutocomplete: true, // Note that the step was autocompleted
    }));

    setAutocompleteBuffer(formattedSteps);
  };

  const acceptAutocompleteStep = (index: number) => {
    setEnvAndEnvStates((prevEnvAndEnvStates) => ({
      ...prevEnvAndEnvStates,
      envStates: [...prevEnvAndEnvStates.envStates, autocompleteBuffer[index]],
    }));
    setSelectedIndex(index); // Update the selected index
    setAutocompleteBuffer([]); // Clear the buffer after accepting a step
  };

  const rejectAutocompleteStep = (index: number) => {
    setAutocompleteBuffer((prevBuffer) =>
      prevBuffer.filter((_, i) => i !== index)
    );
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

  return (
    <>
      <div className="flex justify-center items-center">
        <button
          onClick={generateAndSendImages}
          className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-700 transition-colors"
        >
          <FaRobot />
        </button>
      </div>
      <div className="absolute top-[-15px] -right-10 shadow-lg rounded bg-gray-50 p-3 -translate-y-full translate-x-full flex flex-col gap-4">
        {autocompleteBuffer.map((envState, index) => (
          <div
            key={`autocomplete-step-${index}`} // Ensure unique key for steps
            className="rounded flex flex-col p-3 bg-gray-200 bg-opacity-75 cursor-pointer hover:bg-opacity-100 transition-opacity"
            onClick={() => acceptAutocompleteStep(index)} // Make the entire div clickable for selection
          >
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the click event from bubbling up to the parent div
                  rejectAutocompleteStep(index);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-700 z-10"
              >
                <FaTimes />
              </button>
              <StepToImageSvg
                prevEnvState={envStates[envStates.length - 1]}
                env={env}
                envState={envState}
                className=" hover:opacity-100 transition-opacity"
                envStates={envStates}
              />
            </div>
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
                  onBlur={() => setIsEditingCaption(false)}
                  className="w-full p-1 border border-gray-300 rounded"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                envState.caption ?? "Waiting for caption..."
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Autocomplete;
