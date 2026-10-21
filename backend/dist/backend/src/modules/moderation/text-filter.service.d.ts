import { ModerationService } from './moderation.service';
export declare class TextFilterService {
    private readonly moderation;
    constructor(moderation: ModerationService);
    isClean(text: string): boolean;
    assertClean(text: string): void;
    inspect(text: string): import("./moderation.service").TextVerdict;
}
