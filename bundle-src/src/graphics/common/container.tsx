export function GraphicContainer({
  zIndex = 0,
  children,
}: {
  zIndex?: number;
  children: JSX.Element | JSX.Element[];
}) {
  const styles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    height: "100%",
    width: "100%",
    zIndex: zIndex,
  };
  return (
    <div style={styles} className="titleSafe">
      {children}
    </div>
  );
}
