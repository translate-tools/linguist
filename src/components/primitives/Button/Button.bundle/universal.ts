import { withButtonMobile } from '../_mobile/Button_mobile';
import { Button as DesktopButton } from './desktop';

export * from './desktop';
export const Button = withButtonMobile(DesktopButton);
