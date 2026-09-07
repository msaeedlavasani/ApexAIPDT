import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const HandoffState = Object.freeze({ DISCOVERED:'DISCOVERED', ADMITTED:'ADMITTED', EXECUTING:'EXECUTING', VERIFYING:'VERIFYING', CLOSED:'CLOSED', REJECTED:'REJECTED' });

export class AutonomousHandoff {
  constructor({ storageDir, discover, review, execute, verify, recertify }) {
    this.storageDir=storageDir; this.file=join(storageDir,'handoff-state.json');
    this.discover=discover; this.review=review; this.execute=execute; this.verify=verify; this.recertify=recertify;
  }
  persist(state) { mkdirSync(this.storageDir,{recursive:true}); writeFileSync(this.file,JSON.stringify(state,null,2)+'\n'); return state; }
  load() { return existsSync(this.file) ? JSON.parse(readFileSync(this.file,'utf8')) : null; }
  async run() {
    let state=this.load();
    if (!state) { const candidate=await this.discover(); if (!candidate) return { outcome:'NO_WORK' }; state=this.persist({ candidate, state:HandoffState.DISCOVERED, revision:0 }); }
    if (state.state===HandoffState.DISCOVERED) { const review=await this.review(state.candidate); if (!review.admissible) { state.state=HandoffState.REJECTED; state.review=review; return this.persist({ ...state, revision:state.revision+1 }); } state.state=HandoffState.ADMITTED; state.review=review; this.persist({ ...state, revision:state.revision+1 }); }
    if (state.state===HandoffState.ADMITTED || state.state===HandoffState.EXECUTING) { state.state=HandoffState.EXECUTING; this.persist({ ...state, revision:state.revision+1 }); state.result=await this.execute(state.candidate); state.state=HandoffState.VERIFYING; this.persist({ ...state, revision:state.revision+1 }); }
    if (state.state===HandoffState.VERIFYING) { state.verification=await this.verify(state.candidate,state.result); if (!state.verification.passed) return this.persist({ ...state, revision:state.revision+1 }); state.state=HandoffState.CLOSED; this.persist({ ...state, revision:state.revision+1 }); return { ...state, recertification:await this.recertify() }; }
    return state;
  }
}
