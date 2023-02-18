import { Button as DesktopButton } from './desktop';
import { withButtonMobile } from '../_mobile/Button_mobile';

export * from './desktop';
export const Button = withButtonMobile(DesktopButton);
