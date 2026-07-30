import type { Transition, Variants } from "framer-motion";
import {
  motionDuration,
  motionEase,
  motionOffset,
  motionScale,
} from "./tokens";

export const springTransition: Transition = {
  duration: motionDuration.slow,
  ease: motionEase.spring,
};

export const standardTransition: Transition = {
  duration: motionDuration.normal,
  ease: motionEase.standard,
};

export const fastTransition: Transition = {
  duration: motionDuration.fast,
  ease: motionEase.standard,
};

export const pageTransition: Transition = {
  duration: motionDuration.page,
  ease: motionEase.spring,
};

/** Primary interactive press — buttons */
export const pressAnimation = {
  whileTap: { scale: motionScale.press },
  transition: fastTransition,
};

/** Card lift on hover/press */
export const cardMotion = {
  whileHover: { y: motionOffset.cardLift },
  whileTap: { scale: motionScale.press },
  transition: standardTransition,
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: standardTransition,
  },
  exit: {
    opacity: 0,
    transition: { duration: motionDuration.fast, ease: motionEase.exit },
  },
};

export const fadeSlideVariants: Variants = {
  hidden: { opacity: 0, y: motionOffset.pageSlide },
  visible: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -motionOffset.pageSlide,
    transition: { duration: motionDuration.fast, ease: motionEase.exit },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: { duration: motionDuration.fast, ease: motionEase.exit },
  },
};

export const sheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: springTransition,
  },
  exit: {
    y: "100%",
    transition: { duration: motionDuration.normal, ease: motionEase.exit },
  },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: motionDuration.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: motionDuration.fast, ease: motionEase.exit },
  },
};

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.995 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { duration: motionDuration.fast, ease: motionEase.exit },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...standardTransition,
      delay: index * 0.04,
    },
  }),
};
