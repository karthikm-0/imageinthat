import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import {
  Box,
  Editor,
  TLOnMountHandler,
  Tldraw,
  createShapeId,
  exportToBlob,
  AssetRecordType,
} from "tldraw";
import "tldraw/tldraw.css";
import { StepInterface } from "./interfaces";

export interface TLDrawEditorRef {
  getImage: (callback: (blob: Blob) => void) => void;
}

export const TLDrawEditor = forwardRef<
  TLDrawEditorRef,
  {
    step: StepInterface;
    updateSteps: (masks: StepInterface["masks"]) => void;
  }
>(({ step, updateSteps }, ref) => {
  const { masks: masks } = step;
  const { boxes: boxes } = step;
  const [editor, setEditor] = useState<Editor | null>(null);
  const masksRef = useRef(masks);

  const width = 256;
  const height = 256;

  const addImagesToEditor = (
    masks: {
      name: string;
      image: string;
      height: number;
      width: number;
      x: number;
      y: number;
      category: string;
      class: string;
      state: string;
      box: [number, number, number, number];
    }[]
  ) => {
    if (!editor || masks.length === 0) return;

    masks.forEach((mask, index) => {
      console.log("Adding mask", mask);
      const assetId = AssetRecordType.createId();
      const shapeId = createShapeId();
      editor.createAssets([
        {
          id: assetId,
          type: "image",
          typeName: "asset",
          props: {
            name: `image${index}.png`,
            src: mask.image,
            w: mask.width,
            h: mask.height,
            mimeType: "image/png",
            isAnimated: false,
          },
          meta: {},
        },
      ]);

      const isLocked = mask.name.includes("background");

      editor.createShape({
        id: shapeId,
        meta: {
          id: mask.name,
        },
        type: "image",
        x: mask.x,
        y: mask.y,
        isLocked: isLocked,
        props: {
          assetId,
          w: mask.width,
          h: mask.height,
        },
      });
    });

    // Fixtures
    boxes.forEach((box) => {
      console.log("Adding box", box);
      const shapeId = createShapeId();

      editor.createShape({
        id: shapeId,
        meta: {
          id: box.name,
        },
        type: "geo",
        isLocked: true,
        x: box.x,
        y: box.y,
        opacity: 0,
        props: {
          w: box.width,
          h: box.height,
          geo: "rectangle",
          fill: "none",
        },
      });
    });

    editor.zoomToBounds(new Box(0, 0, width, height), {
      force: true,
      inset: 0,
    });
  };

  const setupEditor: TLOnMountHandler = (editor: Editor) => {
    setEditor(editor);
    if (masks && masks.length > 0) {
      addImagesToEditor(masks);
    }
    editor.setCameraOptions({ isLocked: true, wheelBehavior: "none" });
    editor.on("event", (change) => {
      if (change.name === "pointer_up") {
        console.log("Pointer up");
        updateSteps(masksRef.current);
      }
    });

    editor.on("update", () => {
      const newShapes = editor.getCurrentPageShapesSorted();
      // console.log("Shapes updated", newShapes);
      const updatedMasks = newShapes
        .map((newShape) => {
          const correspondingMask = masks.find(
            (mask) => mask.name === newShape.meta.id
          );
          if (!correspondingMask) {
            return null; // Skip shapes without a corresponding mask
          }
          return {
            name: correspondingMask.name,
            image: correspondingMask.image,
            height: newShape.props.h,
            width: newShape.props.w,
            x: newShape.x,
            y: newShape.y,
          };
        })
        .filter((mask) => mask !== null); // Filter out null values

      masksRef.current = updatedMasks as (typeof updatedMasks)[0][];
    });
  };

  useImperativeHandle(ref, () => ({
    getImage: (callback: (blob: Blob) => void) => {
      if (!editor) {
        throw new Error("Editor is not initialized");
      }
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) return alert("No shapes on the canvas");
      exportToBlob({
        editor,
        ids: [...shapeIds],
        format: "png",
        opts: { background: false },
      }).then((blob) => {
        callback(blob);
      });
    },
  }));

  return (
    <div
      className="tldraw__editor aspect-square"
      style={{ width: "256px", height: "256px" }}
    >
      <Tldraw initialState="select" onMount={setupEditor} hideUi />
    </div>
  );
});
