"use client";

import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

/**
 * إدارة حالة الإشعارات المنبثقة (Toast) على مستوى المشروع كامل.
 * نمط مبسّط مستوحى من مكتبة react-hot-toast: مخزن حالة عام خارج React
 * + hook للاشتراك فيه، بحيث toast() يمكن استدعاؤها من أي مكان (حتى خارج مكوّن).
 */

const TOAST_LIMIT = 3;
const DEFAULT_TOAST_DURATION = 4500;
const ERROR_TOAST_DURATION = 6500;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

let memoryState: { toasts: ToasterToast[] } = { toasts: [] };
const listeners: Array<(state: typeof memoryState) => void> = [];

function dispatch(newState: typeof memoryState) {
  memoryState = newState;
  listeners.forEach((listener) => listener(memoryState));
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();
  const duration = props.duration ?? (props.variant === "error" ? ERROR_TOAST_DURATION : DEFAULT_TOAST_DURATION);

  const dismiss = () =>
    dispatch({ toasts: memoryState.toasts.filter((t) => t.id !== id) });

  dispatch({
    toasts: [{ ...props, duration, id }, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  });

  setTimeout(dismiss, duration);

  return { id, dismiss };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { ...state, toast };
}

export { useToast, toast };
