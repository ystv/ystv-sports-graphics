import { useState, useRef, useEffect } from "react";

export function useTime() {
  const [val, setVal] = useState(() => new Date().valueOf());
  const intervalRef = useRef<number>();
  useEffect(() => {
    function update() {
      setVal(new Date().valueOf());
    }
    intervalRef.current = window.setInterval(update, 200);
    return () => window.clearInterval(intervalRef.current);
  }, []);
  return val;
}
