export function GraphicContainer({
  zIndex = 0,
  children,
}: {
  zIndex?: number;
  children: JSX.Element | JSX.Element[];
}) {
  const styles: React.CSSProperties = {
    zIndex: zIndex,
  };
  return (
    <div style={styles} className="titleSafe">
      {children}
    </div>
  );
}
