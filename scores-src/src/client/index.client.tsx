import { createRoot } from "react-dom/client";
import { App } from "./App";
import "dayjs/locale/en-gb";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(<App />);
