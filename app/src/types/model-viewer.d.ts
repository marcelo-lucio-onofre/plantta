// Ambient JSX typing for the <model-viewer> web component (@google/model-viewer).
// It's a custom element, not a React component, so TSX doesn't know its props
// or that it's a valid tag without this declaration.
import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "ar-placement"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string | number;
        "shadow-softness"?: string | number;
        exposure?: string | number;
        "environment-image"?: string;
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "interaction" | "manual";
      };
    }
  }
}
