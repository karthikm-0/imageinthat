import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { generateCombinedImage } from "./imageUtils";
import {
  Environment,
  EnvironmentAndEnvironmentStates,
  EnvironmentState,
} from "./interfaces";
import { generateNextStates } from "./FlaskApi";

interface LanguageInputProps {
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  env: Environment;
  envState: EnvironmentState;
  setEnvAndEnvStates: React.Dispatch<
    React.SetStateAction<EnvironmentAndEnvironmentStates>
  >;
}

const LanguageInput: React.FC<LanguageInputProps> = ({
  selectedIndex,
  setSelectedIndex,
  env,
  envState,
  setEnvAndEnvStates,
}) => {
  const [languageInput, setLanguageInput] = useState("");

  const handleLanguageInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLanguageInput(event.target.value);
  };

  const handleLanguageInputSubmit = async () => {
    if (languageInput) {
      let imageDataToSend;

      if (selectedIndex !== null) {
        imageDataToSend = await generateCombinedImage(env, envState);
        console.log("Using a state as input", imageDataToSend);
      } else {
        throw new Error("Selected index is null, but envState is required.");
      }

      const updatedEnvState = await generateNextStates(
        languageInput,
        imageDataToSend || "",
        env,
        envState
      );

      // Once we get the data back, lets set the new state
      setEnvAndEnvStates((prevEnvAndEnvStates) => {
        const currentEnvState = prevEnvAndEnvStates.envStates[
          selectedIndex!
        ] as EnvironmentState;

        if (
          selectedIndex !== null &&
          selectedIndex >= 0 &&
          selectedIndex < prevEnvAndEnvStates.envStates.length
        ) {
          setSelectedIndex(selectedIndex + 1);
          return {
            env: prevEnvAndEnvStates.env,
            envStates: [
              ...prevEnvAndEnvStates.envStates.slice(0, selectedIndex),
              currentEnvState,
              updatedEnvState,
              ...prevEnvAndEnvStates.envStates.slice(selectedIndex + 1),
            ] as EnvironmentState[],
          };
        } else {
          return {
            env: prevEnvAndEnvStates.env,
            envStates: [
              ...prevEnvAndEnvStates.envStates,
              updatedEnvState,
            ] as EnvironmentState[],
          };
        }
      });

      // Clear the input field
      setLanguageInput("");
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={languageInput}
        onChange={handleLanguageInputChange}
        placeholder="Instructions for next step..."
        className="border-gray-700 border bg-gray-50 rounded px-3 py-2 shadow w-full h-12 text-base pr-12" // Increased padding-right
      />
      {languageInput && (
        <button
          onClick={handleLanguageInputSubmit}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-full p-2 hover:bg-green-700"
        >
          <FaCheck />
        </button>
      )}
    </div>
  );
};

export default LanguageInput;
