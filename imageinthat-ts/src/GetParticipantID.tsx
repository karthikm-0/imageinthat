import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";

interface GetParticipantIDProps {
  onPIDChange: (pid: string) => void;
}

const GetParticipantID: React.FC<GetParticipantIDProps> = ({ onPIDChange }) => {
  const [pid, setPID] = useState("");
  const [showSubmitButton, setShowSubmitButton] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPID = event.target.value;
    setPID(newPID);
    setShowSubmitButton(newPID.length > 0);
  };

  const handlePIDSubmit = () => {
    onPIDChange(pid);
    console.log("Participant ID submitted:", pid);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-80">
        <label
          htmlFor="pid"
          className="block text-lg font-medium text-gray-700 mb-2"
        >
          Participant ID:
        </label>
        <div className="relative">
          <input
            type="text"
            id="pid"
            value={pid}
            onChange={handleChange}
            className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSubmitButton && (
            <button
              onClick={handlePIDSubmit}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-full p-2 hover:bg-green-700"
            >
              <FaCheck />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetParticipantID;
