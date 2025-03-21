import React, { useEffect, useRef, forwardRef, useState } from "react";
import { FaCopy, FaTrash, FaPlus } from "react-icons/fa";
import { TextStepInterface } from "./interfaces";
import { useExperiment } from "@hcikit/react";

interface TextStepProps {
  taskName: string;
  index: number;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  currentTextStep: TextStepInterface;
  textSteps: TextStepInterface[];
  setTextSteps: React.Dispatch<React.SetStateAction<TextStepInterface[]>>;
  handleCopyStep: (index: number) => void;
  handleAddStep: (copiedStep?: TextStepInterface, index?: number) => void;
}

const TextStep = forwardRef<HTMLDivElement, TextStepProps>(
  (
    {
      index,
      selectedIndex,
      setSelectedIndex,
      currentTextStep,
      textSteps,
      setTextSteps,
      handleCopyStep,
      handleAddStep,
    },
    ref
  ) => {
    const { log } = useExperiment();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [previousText, setPreviousText] = useState(currentTextStep.text);

    useEffect(() => {
      if (selectedIndex === index && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [selectedIndex, index]);

    const handleSelect = () => {
      const newIndex = selectedIndex === index ? null : index;
      setSelectedIndex(newIndex);

      if (newIndex === null) {
        log({
          type: "deselectStep",
          deselectedStepIndex: index,
          allSteps: textSteps,
        });
      } else {
        log({
          type: "selectStep",
          selectedStepIndex: newIndex,
          selectedStep: textSteps[newIndex],
          allSteps: textSteps,
        });
      }
    };

    const handleTextFocus = () => {
      // Capture the initial state when the text area gains focus
      setPreviousText(textSteps[index]?.text || "");
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      const newTextSteps = [...textSteps];
      newTextSteps[index] = { ...newTextSteps[index], text: newText };
      setTextSteps(newTextSteps);
    };

    const handleTextBlur = () => {
      const updatedText = textSteps[index]?.text || "";

      // Only log if the text has actually changed
      if (previousText !== updatedText) {
        log({
          type: "editStep",
          editedStepIndex: index,
          oldText: previousText,
          newText: updatedText,
        });

        // Update the previous text state
        setPreviousText(updatedText);
      }
    };

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const newTextSteps = textSteps.filter((_, i) => i !== index);
      setTextSteps(newTextSteps);
      setSelectedIndex(null);

      log({
        type: "deleteStep",
        deletedStepIndex: index,
        oldTextSteps: textSteps,
        newTextSteps: newTextSteps,
      });
    };

    const handleDuplicate = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      handleCopyStep(index);
    };

    const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      handleAddStep(undefined, index);
    };

    return (
      <div
        key={`step-${index}`}
        className={`rounded flex flex-col gap-2 p-3 relative group ${
          selectedIndex === index ? "ring-4 ring-blue-500 shadow-lg" : ""
        }`}
        onClick={handleSelect}
        ref={ref}
      >
        <textarea
          ref={textareaRef}
          value={textSteps[index]?.text || ""}
          onFocus={handleTextFocus}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          className="w-64 h-64 p-2 border border-gray-300 rounded resize-none"
          placeholder="Enter instruction here..."
        />
        <div className="flex-row items-center justify-center flex invisible gap-2 text-gray-800 group-hover:visible">
          <button onClick={handleAdd}>
            <FaPlus className="w-5 h-5" />
          </button>
          <button onClick={handleDuplicate}>
            <FaCopy className="w-5 h-5" />
          </button>
          <button onClick={handleDelete}>
            <FaTrash className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
);

export default TextStep;
