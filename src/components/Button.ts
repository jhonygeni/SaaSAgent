
// This file imports and re-exports the Button component from button-extensions.tsx
// to maintain backward compatibility with components using Button directly

import { Button as ButtonComponent } from './ui/button-extensions';
export const Button = ButtonComponent;
export default Button;
