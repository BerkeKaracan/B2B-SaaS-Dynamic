import { useEffect, RefObject, useState } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";

export function useCanvasNavigation(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const { zoom, panX, panY, setZoom, setPan } = useCanvasStore();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const zoomDelta = e.deltaY < 0 ? 10 : -10;
        const currentZoom = useCanvasStore.getState().zoom;
        const newZoom = Math.min(Math.max(currentZoom + zoomDelta, 10), 400);

        setZoom(newZoom);
      } else {
        const currentPanX = useCanvasStore.getState().panX;
        const currentPanY = useCanvasStore.getState().panY;
        setPan(currentPanX - e.deltaX, currentPanY - e.deltaY);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [setZoom, setPan]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan(e.clientX - panStart.x, e.clientY - panStart.y);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isPanning, panStart, setPan]);

  const startPan = (clientX: number, clientY: number) => {
    setIsPanning(true);
    setPanStart({ x: clientX - panX, y: clientY - panY });
  };

  return { startPan };
}
