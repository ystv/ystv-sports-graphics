import { AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export function GraphicContainer({
  zIndex = 0,
  children,
}: {
  zIndex?: number;
  children: ReactNode;
}) {
  const styles: React.CSSProperties = {
    position: "absolute",
    zIndex: zIndex,
  };
  return (
    <div style={styles} className="titleSafe">
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  );
}
