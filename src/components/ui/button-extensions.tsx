
import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { ButtonProps as ShadcnButtonProps } from "@/components/ui/button";
import React from "react";

export interface ButtonProps extends ShadcnButtonProps {
  loading?: boolean;
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ loading, children, disabled, className, ...props }, ref) => {
  return (
    <ShadcnButton
      ref={ref}
      disabled={loading || disabled}
      className={className}
      {...props}
    >
      {loading ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          {typeof children === 'string' ? children : 'Carregando...'}
        </>
      ) : (
        children
      )}
    </ShadcnButton>
  );
});

Button.displayName = "Button";
