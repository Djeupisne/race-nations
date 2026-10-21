export type PaymentState = 'CREATED' | 'PROVIDER_PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export declare function isPaymentTerminal(state: PaymentState): boolean;
export declare function allowedPaymentTransitions(from: PaymentState): readonly PaymentState[];
export declare function canPaymentTransition(from: PaymentState, to: PaymentState): boolean;
export declare function assertPaymentTransition(from: PaymentState, to: PaymentState): void;
