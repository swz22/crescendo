import { useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { reorderQueue, reorderPlaylistTracks } from "../redux/features/playerSlice";

export const useDragDrop = (activeContext) => {
  const dispatch = useDispatch();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.innerHTML);

    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = "0.8";
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.clientX - e.target.getBoundingClientRect().left, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragEnter = useCallback(
    (e, index) => {
      e.preventDefault();
      dragCounter.current++;

      // Don't show indicator at the position immediately below
      if (draggedIndex !== null && index === draggedIndex + 1) {
        return;
      }

      if (index !== draggedIndex) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleDragLeave = useCallback((e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e, index) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounter.current = 0;
      setDragOverIndex(null);

      if (draggedIndex === null) {
        setIsDragging(false);
        setDraggedIndex(null);
        return;
      }

      // Don't do anything if dropping in same position
      if (draggedIndex === index) {
        setIsDragging(false);
        setDraggedIndex(null);
        return;
      }

      let targetIndex = index;

      if (draggedIndex < index) {
        targetIndex = index - 1;
      }

      if (activeContext === "queue") {
        dispatch(reorderQueue({ oldIndex: draggedIndex, newIndex: targetIndex }));
      } else if (activeContext.startsWith("playlist_")) {
        dispatch(
          reorderPlaylistTracks({
            playlistId: activeContext,
            oldIndex: draggedIndex,
            newIndex: targetIndex,
          })
        );
      }

      setIsDragging(false);
      setDraggedIndex(null);
    },
    [draggedIndex, activeContext, dispatch]
  );

  const handleDragEnd = useCallback(() => {
    dragCounter.current = 0;
    setIsDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleTouchStart = useCallback((e, index) => {
    const touch = e.touches[0];
    const element = e.currentTarget;

    const longPressTimer = setTimeout(() => {
      setDraggedIndex(index);
      setIsDragging(true);
      element.style.opacity = "0.5";

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);

    element.dataset.longPressTimer = longPressTimer;
    element.dataset.startY = touch.clientY;
    element.dataset.startX = touch.clientX;
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      const touch = e.touches[0];
      const element = e.currentTarget;
      const startY = parseInt(element.dataset.startY || "0");
      const startX = parseInt(element.dataset.startX || "0");

      // Cancel long press if moved too much
      if (Math.abs(touch.clientY - startY) > 10 || Math.abs(touch.clientX - startX) > 10) {
        const timer = element.dataset.longPressTimer;
        if (timer) {
          clearTimeout(parseInt(timer));
          delete element.dataset.longPressTimer;
        }
      }

      if (isDragging) {
        e.preventDefault();

        // Find element under touch point
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementBelow) {
          const trackElement = elementBelow.closest("[data-track-index]");
          if (trackElement) {
            const index = parseInt(trackElement.dataset.trackIndex);
            if (index !== draggedIndex && index !== dragOverIndex) {
              setDragOverIndex(index);
            }
          }
        }
      }
    },
    [isDragging, draggedIndex, dragOverIndex]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      const element = e.currentTarget;
      const timer = element.dataset.longPressTimer;

      if (timer) {
        clearTimeout(parseInt(timer));
        delete element.dataset.longPressTimer;
      }

      element.style.opacity = "";

      if (isDragging && dragOverIndex !== null && draggedIndex !== null) {
        if (draggedIndex !== dragOverIndex) {
          let targetIndex = dragOverIndex;

          if (draggedIndex < dragOverIndex) {
            targetIndex = dragOverIndex - 1;
          }

          if (activeContext === "queue") {
            dispatch(reorderQueue({ oldIndex: draggedIndex, newIndex: targetIndex }));
          } else if (activeContext.startsWith("playlist_")) {
            dispatch(
              reorderPlaylistTracks({
                playlistId: activeContext,
                oldIndex: draggedIndex,
                newIndex: targetIndex,
              })
            );
          }
        }
      }

      setIsDragging(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [isDragging, draggedIndex, dragOverIndex, activeContext, dispatch]
  );

  return {
    draggedIndex,
    dragOverIndex,
    isDragging,
    handleDragStart,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
