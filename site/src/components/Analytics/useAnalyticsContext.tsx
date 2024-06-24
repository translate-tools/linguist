import { createContext, useContext } from 'react';

export type IAnalyticsContext = {
	trackEvent: (eventName: string, props: Record<string, string>) => void;
};

export const analyticsContext = createContext<IAnalyticsContext>(null as any);

export const useAnalyticsContext = () => {
	const context = useContext(analyticsContext);
	if (context === null)
		throw new Error(
			'Analytics context is not available. Make sure component is wrapped with AnalyticsProvider',
		);

	return context;
};
