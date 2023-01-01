import { AnimatePresence } from "framer-motion";
import { HTMLProps, ReactNode } from "react";

export function GraphicContainer(
  props: {
    zIndex?: number;
    children: ReactNode;
  } & HTMLProps<HTMLDivElement>
) {
  const { zIndex, children, ...rest } = props;
  const styles: React.CSSProperties = {
    position: "absolute",
    zIndex: zIndex,
  };
  return (
    <div style={styles} className="titleSafe" {...props}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  );
}
