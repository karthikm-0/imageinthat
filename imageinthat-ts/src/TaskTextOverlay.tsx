import React, { useEffect, useState } from "react";

interface TaskTextOverlayProps {
  taskName: string;
}

const TaskTextOverlay: React.FC<TaskTextOverlayProps> = ({ taskName }) => {
  const [requirements, setRequirements] = useState<string[]>([]);

  useEffect(() => {
    const loadTaskData = async () => {
      try {
        console.log("Loading JSON for task:", taskName);
        const response = await fetch(
          `/study_tasks/${taskName}/${taskName}_requirements.json`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log("Loaded JSON:", data);
        setRequirements(data.requirements);
      } catch (error) {
        console.error("Error loading JSON:", error);
      }
    };

    loadTaskData();
  }, [taskName]);

  return (
    <div className="p-6 pl-10 bg-red-100 mx-auto rounded shadow break-words whitespace-normal max-w-6xl">
      <details className="text-lg list-none" open>
        <summary>
          <h2 className="font-bold inline-block">Task Requirements:</h2>
        </summary>
        <ul className="list-disc pl-6">
          {requirements.map((requirement, index) => (
            <li>{requirement}</li>
          ))}
        </ul>
      </details>
    </div>
  );
};

export default TaskTextOverlay;
