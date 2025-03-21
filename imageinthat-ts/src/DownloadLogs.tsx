import { FunctionTask, useConfiguration } from "@hcikit/react";

export let DownloadLogs: FunctionTask<{ message: string; title: string }> = ({
  message,
  title,
}) => {
  const config = useConfiguration();
  return (
    <div style={{ gridArea: "task" }}>
      <div
        style={{
          padding: "20px",
          margin: "0 auto",
          maxWidth: "600px",
          textAlign: "center",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>{title}</h2>
        <p>{message}</p>
        <a
          download={`${config.participant || "log"}.json`}
          href={`data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(config)
          )}`}
        >
          Download experiment log
        </a>
      </div>
    </div>
  );
};
