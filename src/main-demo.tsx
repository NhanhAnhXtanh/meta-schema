import React from "react";
import { createRoot } from "react-dom/client";
import "./webcomponent/react-bridge";

function Demo() {

  return (

    <react-widget></react-widget>

  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
