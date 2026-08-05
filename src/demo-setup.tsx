import { createRoot } from "react-dom/client";

import "./styles/global.css";
import { Setup } from "@/components/setup";

createRoot(document.getElementById("root")!).render(<Setup />);
