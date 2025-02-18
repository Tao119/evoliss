import React, {
  useState,
  useEffect,
  ReactElement,
  JSXElementConstructor,
} from "react";
import dynamic from "next/dynamic";
import loadingAnimation from "@/assets/json/loading-animation.json";

const Animation = dynamic(() => import("lottie-react"), { ssr: false });

export interface AnimationContextType {
  isVisible: boolean;
  options: any;
  startAnimation: (animationData?: any) => void;
  endAnimation: () => void;
  View: ReactElement<any, string | JSXElementConstructor<any>> | undefined;
}

const useAnimation = (): AnimationContextType => {
  const [options, setOptions] = useState({
    loop: true,
    autoplay: false,
    animationData: null,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [AnimationComponent, setAnimationComponent] = useState<ReactElement>();

  useEffect(() => {
    if (isVisible && options.animationData) {
      const props = {
        ...options,
        animationData: options.animationData,
        loop: true,
        autoplay: true,
      };
      // Ensure only setting ReactElement or null here
      setAnimationComponent(<Animation {...props} />);
    } else {
      setAnimationComponent(undefined); // Correctly passing null when not visible
    }
  }, [isVisible, options]);

  const startAnimation = (animationData?: any) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      animationData: animationData ?? loadingAnimation,
    }));
    setIsVisible(true);
  };

  const endAnimation = () => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      animationData: null,
    }));
    setIsVisible(false);
  };

  return {
    isVisible,
    options,
    startAnimation,
    endAnimation,
    View: AnimationComponent,
  };
};

export default useAnimation;
