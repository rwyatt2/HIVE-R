import { AgentState } from "../lib/state.js";
export declare const routerNode: (state: typeof AgentState.State) => Promise<{
    next: string;
    turnCount?: never;
} | {
    next: string;
    turnCount: number;
}>;
export { HIVE_MEMBERS } from "../lib/prompts.js";
//# sourceMappingURL=router.d.ts.map