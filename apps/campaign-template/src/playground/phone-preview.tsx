import React from "react";
import ReactDOM from "react-dom/client";
import { useStore } from "../integrations/store";
import { RuntimePage } from "../runtime/app";
import { createPreviewRuntimeState } from "./preview-state";

function installPreviewStore() {
  useStore.getState().setRuntimeState(createPreviewRuntimeState());
}

export function renderPhonePreview() {
  installPreviewStore();
  const root = ReactDOM.createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <RuntimePage />
    </React.StrictMode>,
  );
}
