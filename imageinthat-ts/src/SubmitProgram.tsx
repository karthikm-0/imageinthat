import React from "react";
import { sendMultimodal } from "./FlaskApi";

interface SubmitProgramProps {
  stepRefs: React.MutableRefObject<(ImageEditorRef | null)[]>;
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
}

const SubmitProgram: React.FC<SubmitProgramProps> = ({
  stepRefs,
  setImages,
}) => {
  const handleSubmit = async () => {
    const imageBlobs: Blob[] = [];
    let processedCount = 0;

    stepRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.getImage(async (blob) => {
          imageBlobs.push(blob);
          processedCount++;
          if (processedCount === stepRefs.current.length) {
            console.log("All images retrieved:", imageBlobs);

            // Convert blobs to base64 strings
            const imagePromises = imageBlobs.map((blob) => {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            });

            try {
              const imageBase64Strings = await Promise.all(imagePromises);
              await sendMultimodal("/api/update_robot_goals", {
                images: imageBase64Strings, // Send images as a list
              });
              console.log("Images sent successfully");
              setImages([]); // Example of handling submission
            } catch (error) {
              console.error("Error sending images:", error);
            }
          }
        });
      }
    });
  };

  return (
    <button
      onClick={handleSubmit}
      className="bg-green-500 text-white px-4 py-2 rounded self-start"
    >
      Submit Program
    </button>
  );
};

export default SubmitProgram;
