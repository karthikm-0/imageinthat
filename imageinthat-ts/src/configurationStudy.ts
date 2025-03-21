import { cond } from "lodash";
import task_1 from "./study_tasks/task_1/task_1_requirements.json";
import task_2 from "./study_tasks/task_2/task_2_requirements.json";
import task_3 from "./study_tasks/task_3/task_3_requirements.json";
import task_4 from "./study_tasks/task_4/task_4_requirements.json";

const requirements = {
  task_1,
  task_2,
  task_3,
  task_4,
};

// import { } from "@hcikit/workflow";
// Define the Latin square
const latinSquare = [
  ["Timeline", "TextTimeline"],
  ["TextTimeline", "Timeline"],
];

// Function to shuffle an array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Define the tutorial tasks
const tutorialTask = "tutorial";

// Define the tasks
const tasks = ["task_1", "task_2", "task_3", "task_4"];

// Function to get the starting row based on participant ID
function getStartingRow(participantId: number, latinSquare: string[][]) {
  return participantId % latinSquare.length;
}

// Function to fetch the configuration based on participant ID
export function fetchConfiguration(pid: number) {
  // Determine the starting row
  const startingRow = getStartingRow(pid, latinSquare);

  // Generate 8 instances with each condition having 4 tasks in random order
  const assignedTasks = [];
  const conditions = [];
  for (let i = 0; i < 2; i++) {
    const condition = latinSquare[startingRow][i];
    conditions.push(condition);
    const shuffledTasks = shuffleArray([...tasks]);
    for (let j = 0; j < tasks.length; j++) {
      assignedTasks.push({
        taskName: shuffledTasks[j],
        condition: condition,
      });
    }
  }

  // Determine the midpoint of the assignedTasks array
  const midpoint = Math.floor(assignedTasks.length / 2);

  // Define the new Google Form questionnaire
  function createQuestionnaire(condition: string, taskNumber: string) {
    return {
      task: "GoogleFormQuestionnaire",
      formId: "1FAIpQLSe2KKBjYgb7QYdBQs2LRD_gBiX5IBvdnI9jQJrsjFQQjmz7ag",
      prefilledFields: {
        "entry.1698330305": pid,
        "entry.1766612445": condition, // Add the first condition name here
        "entry.529338417": taskNumber,
      },
      // label: "",
      skip: true,
    };
  }

  // Function to interleave tasks with the new questionnaire
  function interleaveTasksWithQuestionnaire(tasks, condition) {
    const interleaved = [];
    for (let i = 0; i < tasks.length; i++) {
      const taskName = tasks[i].children[0].taskName;
      const requirement = requirements[taskName];

      interleaved.push({
        task: "InformationScreen",
        content: `
# Experiment Task
${requirement.description}


${requirement.requirements.map((r) => ` - ${r}`).join("\n")}

*Below is an image that is __similar__ to the task you will be performing.*

![Task Image](/study_tasks/${taskName}/start.png)
`,
      });

      interleaved.push(tasks[i]);
      interleaved.push({
        task: "DownloadUpload",
        fireAndForget: true,
        filename: `participant-${pid}-condition-${condition}-task-${i}.json`,
      });
      // if (i < tasks.length - 1) {
      interleaved.push(createQuestionnaire(conditions[condition], taskName));

      // }
    }
    return interleaved;
  }

  // Interleave the tasks with the new questionnaire
  const firstHalfTasks = interleaveTasksWithQuestionnaire(
    assignedTasks.slice(0, midpoint).map(({ taskName, condition }) => ({
      task: condition,
      children: [{ taskName: taskName }],
      label: "Task",
    })),
    0
  );

  const secondHalfTasks = interleaveTasksWithQuestionnaire(
    assignedTasks.slice(midpoint).map(({ taskName, condition }) => ({
      task: condition,
      children: [{ taskName: taskName }],
      label: "Task",
    })),
    1
  );

  // Define the post-condition questionnaires mega task

  function getPostConditionQuestionnaire(condition_num: number) {
    const postConditionQuestionnaires = {
      task: "PostConditionQuestionnaires",
      children: [
        {
          task: "GoogleFormQuestionnaire",
          formId: "1FAIpQLSci-fGxfKBvraCtE4N1gpFFCEe6EWnzGq7uVliF-EGfTZyLlw",
          prefilledFields: {
            "entry.1471932342": pid,
            "entry.434990746": conditions[condition_num], // Add the first condition name here
          },
          label: "TLX",
        },
        {
          task: "GoogleFormQuestionnaire",
          formId: "1FAIpQLSdOJ3f0l1gJZ2ONXg6QqUuT7_17KZaknHCTSJncDaQ0e-gnWQ",
          prefilledFields: {
            "entry.1471932342": pid,
            "entry.434990746": conditions[condition_num], // Add the second condition name here
          },
          label: "SUS",
        },
        // {
        //   task: "GoogleFormQuestionnaire",
        //   formId: "1FAIpQLSfTM0nIq5uWhv5YCeBzsChhsat4stNz0gliKzoksHRjaGM2TA",
        //   prefilledFields: {
        //     "entry.276050497": pid,
        //     "entry.55392234": conditions[condition_num], // Add the second condition name here
        //   },
        //   sections: 5,
        //   label: "USE",
        // },
      ],
      label: "Post-Condition",
    };
    return postConditionQuestionnaires;
  }

  const information = `You will be enacting the persona of Taylor, a person who likes to keep their home organized. Throughout the day, you will perform various tasks in your kitchen.`;

  // Create tutorial tasks based on the order of conditions
  const tutorialTasksConfig = conditions.map((condition) => ({
    task: condition,
    children: [{ taskName: tutorialTask }],
    label: `Tutorial ${condition}`,
  }));

  // Update the configuration object
  const configuration = {
    pid,
    assignedTasks,
    conditionOrder: conditions,
    tasks: ["WizardProgress", "DevTools", "PreventReload"],
    children: [
      {
        task: "GoogleFormQuestionnaire",
        formId: "1FAIpQLScvH55z3cIdfZ6lqJ9cN2zQv_MqHc9-t4mzAtnbikntuHJsNA",
        prefilledFields: { "entry.106169689": pid },
        label: "Pre-Study",
        skip: true,
      },
      {
        task: "InformationScreen",
        content: information,
        label: "Welcome",
      },
      {
        task: "Tutorial",
        label: "Tutorial",
        children: [
          {
            task: "VideoTutorial",
            label: "Tutorial",
            videoUrl: `/${conditions[0]}.mp4`,
          },
          {
            task: "VideoTutorial",
            label: "Tutorial",
            videoUrl: `/${conditions[1]}.mp4`,
          },
          ...tutorialTasksConfig,
        ],
      },
      {
        label: "Condition 1",
        children: [...firstHalfTasks, getPostConditionQuestionnaire(0)],
      },
      {
        label: "Break",
        task: "DisplayText",
        content: "Please take a short break before continuing.",
      },
      {
        label: "Condition 2",
        children: [...secondHalfTasks, getPostConditionQuestionnaire(1)],
      },
      // Post-study questionnaire
      {
        task: "GoogleFormQuestionnaire",
        formId: "1FAIpQLSf9stWrFJyZm6bsCBDxBipkknhWiWEvLl2l7CI0p4MAVxD8AA",
        prefilledFields: { "entry.1030190683": pid },
        label: "Post-Study",
        skip: true,
      },
      {
        label: "Freeform",
        task: "Timeline",
        isExperimentEnabled: false,
        taskName: "freeform", // Add the taskName property
      },
      // { task: "DownloadLogs", label: "Download", skip: true },
      {
        task: "DownloadUpload",
        fireAndForget: false,
        label: "Download",
        filename: `participant-${pid}.json`,
      },
    ],
  };

  return configuration;
}
