import React from "react";

import { range, shuffle, sum, times, zip } from "lodash";

// import { Redo, Undo } from "emotion-icons/material";
import { ColorFill } from "emotion-icons/boxicons-solid";
import exampleNoDrawings from "./example-nodrawings.png";

import {
  CursorArrowIcon,
  EraserIcon,
  Pencil1Icon,
  SquareIcon,
  ArrowTopRightIcon,
  CircleIcon,
  VercelLogoIcon,
  TrashIcon,
  CopyIcon,
  RotateCounterClockwiseIcon, // TODO: this shoul;d probably be clockwise...
  // line dash icons are in tldraw itself
  // size icons are in tldraw itself too.
  ZoomInIcon,
  ZoomOutIcon,
} from "@radix-ui/react-icons";
import { EmotionIconBase } from "@emotion-icons/emotion-icon";

import {
  Redo,
  Undo,
  ColorFill as ColorNoFill,
} from "emotion-icons/boxicons-regular";

import { MenuItem, flattenMenu } from "@blainelewis1/menus";

import ConsentLetter from "./consent";
import { getAllMetadata } from "@hcikit/workflow";
import circle from "./circles.json";
import square from "./squares.json";
import triangle from "./triangles.json";

const url = new URL(window.location.href);

const instructions =
  "Add details to the shapes to make pictures out of them. Each shape should be it's own independent picture. Make the shape a part of any picture you make. Try to think of pictures no one else will think of. Add details to tell complete stories with your pictures. You have 5 minutes.";

let beginScreen = {
  task: "BeginScreen",
  content: `The next screen contains a timed task. Please do not take breaks during this task, if you need a break you can take one after completing this section.

> ${instructions}

An example of this task can be found below, but you will see a different set of starter shapes.

![Example](${exampleNoDrawings})
`,
};

const starterDocuments = shuffle([circle, square, triangle]);

let menus = decodeURIComponent(
  url.searchParams.get("MENU_ORDER") as string
).split(",");

menus =
  menus ||
  shuffle(["KeyboardShortcutsWithCheatsheet", "ToolPalette", "MarkingMenu"]);

const menuMappings: Record<string, string> = {
  KeyboardShortcutsWithCheatsheet: "keyboard shortcuts",
  ToolPalette: "tool palette",
  MarkingMenu: "marking menu",
};
// @ts-ignore
let createCircleSvg = () => (
  // <svg width={24} height={24} fill={stroke} stroke={stroke}>
  <circle cx={12} cy={12} r={10} />
  // </svg>
);

// TODO: add shortcuts.
const items = [
  {
    label: "Tools",
    unselectable: true,
    angle: (Math.PI * 3) / 2,
    items: [
      {
        icon: CursorArrowIcon,
        label: "Select",
        angle: (Math.PI * 3) / 4,
        shortcut: "1",
      },
      {
        icon: Pencil1Icon,
        label: "Draw",
        angle: (Math.PI * 4) / 4,
        shortcut: "2",
      },

      {
        icon: EraserIcon,
        label: "Erase",
        angle: (Math.PI * 5) / 4,
        shortcut: "3",
      },

      {
        icon: SquareIcon,
        label: "Rectangle",
        angle: (Math.PI * 7) / 4,
        shortcut: "4",
      },
      // TODO: Line icon doesnt exit
      // { icon: ArrowTopRightIcon, label: "line", angle: 0, shortcut: "5" },
      { icon: CircleIcon, label: "Ellipse", angle: 0, shortcut: "5" },
      {
        icon: VercelLogoIcon,
        label: "Triangle",
        angle: (Math.PI * 1) / 4,

        shortcut: "6",
      },
    ],
  },

  { icon: Undo, label: "Undo", angle: Math.PI, shortcut: "alt+z" },
  { icon: Redo, label: "Redo", angle: 0, shortcut: "alt+y" },

  {
    label: "Actions",
    unselectable: true,
    angle: (Math.PI * 1) / 2,
    items: [
      {
        icon: TrashIcon,
        label: "Delete",
        angle: (Math.PI * 3) / 4,

        shortcut: "backspace",
      },

      {
        icon: CopyIcon,
        label: "Duplicate",
        angle: (Math.PI * 4) / 4,
        shortcut: "alt+d",
      },

      {
        icon: RotateCounterClockwiseIcon,
        label: "Rotate",
        angle: (Math.PI * 5) / 4,
        shortcut: "alt+e",
      },
      {
        icon: ZoomInIcon,
        label: "Zoom In",
        angle: (Math.PI * 7) / 4,
        shortcut: "alt+=",
      },
      {
        icon: ZoomOutIcon,
        label: "Zoom Out",
        angle: (Math.PI * 1) / 4,
        shortcut: "alt+-",
      },
    ],
  },

  {
    icon: ColorFill,
    label: "Fill",
    angle: (Math.PI * 7) / 4,
    shortcut: "alt+f",
  },

  {
    icon: ColorNoFill,
    label: "No Fill",
    angle: (Math.PI * 3) / 4,

    shortcut: "alt+shift+f",
  },

  {
    label: "Colors",
    unselectable: true,
    angle: (Math.PI * 1) / 4,
    items: [
      // {
      //   icon: createIcon(createCircleSvg(), {
      //     className: "text-[#f0f1f3]",
      //   }),
      //   label: "white",
      //   angle: 0,
      //   shortcut: "alt+1",
      // },

      // {
      //   icon: createIcon(createCircleSvg(), {
      //     className: "text-[#c6cbd1]",
      //   }),
      //   label: "lightgray",
      //   angle: 0,
      //   shortcut: "alt+1",
      // },
      // {
      //   icon: createIcon(createCircleSvg(), {
      //     className: "text-[#788492]",
      //   }),
      //   label: "gray",
      //   angle: 0,
      //   shortcut: "alt+1",
      // },

      {
        icon: createIcon(createCircleSvg(), {
          className: "text-[#1d1d1d]",
        }),
        label: "Black",
        angle: (Math.PI * 3) / 4,
        shortcut: "alt+1",
      },
      {
        icon: createIcon(createCircleSvg(), {
          className: "text-[#36b24d]",
        }),
        label: "Green",
        angle: (Math.PI * 4) / 4,
        shortcut: "alt+2",
      },
      // {
      //   icon: createIcon(createCircleSvg(), {
      //     className: "text-[#0e98ad]",
      //   }),
      //   label: "cyan",
      //   angle: 0,
      //   shortcut: "alt+5",
      // },
      {
        icon: createIcon(createCircleSvg(), {
          className: "text-[#1c7ed6]",
        }),
        label: "Blue",
        angle: (Math.PI * 5) / 4,
        shortcut: "alt+3",
      },
      // {
      //   icon: createIcon(createCircleSvg(), {
      //     className: "text-[#4263eb]",
      //   }),
      //   label: "indigo",
      //   angle: 0,
      //   shortcut: "alt+7",
      // },
      {
        icon: createIcon(createCircleSvg(), {
          className: "text-[#7746f1]",
        }),
        label: "Violet",
        angle: (Math.PI * 7) / 4,
        shortcut: "alt+4",
      },
      {
        icon: createIcon(createCircleSvg(), {
          className: "text-[#ff2133]",
        }),
        label: "Red",
        angle: 0,
        shortcut: "alt+5",
      },
      {
        icon: createIcon(createCircleSvg(), {
          className: "text-[#ff9433]",
        }),
        label: "Orange",
        angle: (Math.PI * 1) / 4,
        shortcut: "alt+6",
      },
    ],
  },
  // {
  //   icon: createIcon(createCircleSvg(), {
  //     className: "text-[#ffc936]",
  //   }),
  //   label: "yellow",
  //   angle: 0,
  //   shortcut: "alt+-",
  // },
  // [ColorStyle.White]: '#f0f1f3',
  // [ColorStyle.LightGray]: '#c6cbd1',
  // [ColorStyle.Gray]: '#788492',
  // [ColorStyle.Black]: '#1d1d1d',
  // [ColorStyle.Green]: '#36b24d',
  // [ColorStyle.Cyan]: '#0e98ad',
  // [ColorStyle.Blue]: '#1c7ed6',
  // [ColorStyle.Indigo]: '#4263eb',
  // [ColorStyle.Violet]: '#7746f1',
  // [ColorStyle.Red]: '#ff2133',
  // [ColorStyle.Orange]: '#ff9433',
  // [ColorStyle.Yellow]: '#ffc936',
];

function createIcon(icon: React.ReactNode, restProps?: any): React.FC {
  return (props: any) => (
    // @ts-ignore
    <EmotionIconBase
      iconViewBox="0 0 24 24"
      {...restProps}
      {...props}
      className={`stroke-current stroke-[4] fill-none ${
        props?.className || ""
      } ${restProps?.className || ""}`}
    >
      {icon}
      {/* {console.log(restProps)} */}
    </EmotionIconBase>
  );
}

export function iterateMenu(items: Array<MenuItem>) {
  let toReturn: Array<MenuItem> = [];
  let queue = items;

  while (queue.length > 0) {
    const next = queue.pop() as MenuItem;

    if (!next.unselectable && !next.items?.length) {
      toReturn.push(next);
    }

    if (next.items) {
      queue = queue.concat(next.items);
    }
  }

  return toReturn;
}

const distributedItems = flattenMenu(items)
  .filter(({ unselectable }) => !unselectable)
  .map(({ label }) => [label, label])
  .flat();

const metadata = getAllMetadata();

const participant_id =
  url.searchParams.get("participant_id") ||
  url.searchParams.get("PROLIFIC_PID") ||
  metadata.participant;

const study_id = url.searchParams.get("STUDY_ID") || "unknown";
const session_id = url.searchParams.get("SESSION_ID") || "unknown";

// http://creativity-experiment-1-websitebucket-y1wyp6druyor.s3-website.us-east-2.amazonaws.com/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}

const conditions = zip(starterDocuments, menus).map(
  ([starterDocument, menu]) => {
    return {
      menu,
      items,
      children: [
        { task: "Tutorial" },
        {
          task: "CommandSelection",
          children: shuffle(distributedItems).flatMap((item) => [
            // {
            //   task: "MousePositioning",
            //   y: Math.random() * 400 - 200,
            //   x: Math.random() * 400 - 200,
            // },
            // {
            //   task: "TypingTask",
            //   prompt: item,
            //   command: item,
            // },

            {
              command: item,
            },
          ]),
        },
        beginScreen,
        {
          tasks: ["ProgressBar", "ResolutionChecker"],
          content: instructions,
          task: "TLDrawTask",
          starterDocument,
          timeLimit: 60 * 1000 * 5,
        },
        // {
        //   task: "DivergentTest",
        //   question: `Write down all of the original and creative
        //   uses for a ${object} that you can think of. There are common,
        //   unoriginal ways to use a ${object}; for this task, write down all of the
        //   unusual, creative, and uncommon uses you can think of.`,
        //   object,
        //   // timeLimit: 60 * 1000 * 0.5,
        //   timeLimit: 60 * 1000 * 3,
        // },
        {
          task: "Questionnaire",
          questions: [
            // {
            //   label: "I felt creative while I was selecting commands.",
            //   key: "felt",
            // },
            {
              label: `I felt creative while creating the drawings.`,
              key: "felt",
            },
            {
              label: `Using ${
                menu === "KeyboardShortcutsWithCheatsheet" ? "" : "a "
              }${
                menuMappings[menu as string]
              } contributed to the creativity of my drawings.`,
              key: "contribute",
            },
          ],
        },
        { task: "NasaTlx" },
        // { task: "CreativitySupportIndex" },
      ],
    };
  }
);

const configuration = {
  order: menus,
  participant_id,
  metadata: {
    ...metadata,
    git_commit: process.env.REACT_APP_GIT_HASH,
    package_version: process.env.REACT_APP_PACKAGE_VERSION,
    build_time: process.env.REACT_APP_BUILD_TIME,
    session_id,
    study_id,
    participant_id,
  },

  version: "alpha@0.1",
  tasks: ["ProgressBar", "ResolutionChecker", "DevTools"],
  ResolutionChecker: {
    minXResolution: 900,
    minYResolution: 700,
  },

  DevTools: { showInProduction: true },
  children: [
    // { task: "TLDrawTask", starterDocument },
    // ...menus.map((menu) => ({ task: "TLDrawTask", starterDocument, menu })),

    {
      task: "ConsentForm",

      content: ConsentLetter,
      questions: [
        {
          label: "I understand and consent to the above.",
          required: true,
        },
        // {
        //   label:
        //     "Yes: Video and audio recordings or frame grabs of the session may be used.",
        //   required: false,
        // },
        // {
        //   label:
        //     "No: Video and audio recordings or frame grabs of the session may not be used.",
        //   required: false,
        // },
      ],
    },
    {
      task: "Questionnaire",
      questions: [
        {
          label: `I use creative drawing software often (e.g. Adobe Illustrator, Adobe Photoshop, Sketch, Figma, etc.).`,
          key: "software",
        },
        // {
        //   label: "I felt creative while I was selecting commands.",
        //   key: "felt",
        // },
        {
          label: `I often engage in creative tasks.`,
          key: "creative",
        },
      ],
    },
    {
      task: "BeginScreen",
      content: `
# Menu Creativity Experiment

This experiment will test your creativity while using different computer menus. You will be asked to complete a series of tasks:

1. A short tutorial using the menu.
2. Complete a drawing using the menu.
4. A questionnaire about your experience.

You will repeat this process for 3 different menus. Each menu should take approximately 10 minutes, with the entire experiment taking less than 30 minutes.

We ask that you please maximise the experiment and perform the task in a quiet room without any music or distractions.`,
    },
    // {
    //   task: "FormTask",
    //   label: "demographics",
    //   schema: {
    //     type: "object",
    //     properties: {
    //       age: {
    //         type: "integer",
    //       },
    //       gender: {
    //         type: "string",
    //         enum: [
    //           "woman",
    //           "man",
    //           "non-binary",
    //           "prefer not to disclose",
    //           "prefer to self-describe",
    //         ],
    //       },
    //       selfDescribe: {
    //         type: "string",
    //       },
    //     },
    //     required: ["age", "gender"],
    //   },
    //   uischema: {
    //     type: "VerticalLayout",
    //     elements: [
    //       {
    //         type: "Control",
    //         label: "Age",
    //         scope: "#/properties/age",
    //       },

    //       {
    //         type: "Control",
    //         label: "Gender",
    //         scope: "#/properties/gender",
    //       },
    //       {
    //         type: "Control",
    //         label: "Gender",
    //         scope: "#/properties/selfDescribe",
    //         rule: {
    //           effect: "SHOW",
    //           condition: {
    //             scope: "#/properties/gender",
    //             schema: {
    //               const: "prefer to self-describe",
    //             },
    //           },
    //         },
    //       },
    //     ],
    //   },
    // },
    ...conditions,
    // {
    //   defaultState: true,
    //   task: "FormTask",
    //   label: "problems",
    //   schema: {
    //     type: "object",
    //     properties: {
    //       DidYouEncounterAnyIssues: {
    //         type: "string",
    //       },
    //     },
    //   },
    // },
    {
      task: "AdditionalComments",
    },
    {
      task: "S3Upload",
      filename: `${participant_id}.json`,
      experimenter: "blaine@dgp.toronto.edu",
    },
    {
      task: "RedirectTask",
      url: "https://app.prolific.co/submissions/complete?cc=C6S70LIF",
    },
    // {
    //   task: "InformationScreen",
    //   content: `Your data has successfully been uploaded. Thank you for completing our experiment!`,
    //   withContinue: false,
    // },
  ],
};

console.log(configuration);

export default configuration;
