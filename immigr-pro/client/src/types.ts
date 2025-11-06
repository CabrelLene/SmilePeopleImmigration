export type User = { id:string; email:string; fullName:string; role:"user"|"admin"; verified:boolean };
export type AuthResponse = { token:string; user:User };
export type AnswerStep = { key:string; data:any };
export type EvalResult = { program:string; score:number; breakdown:any; budget:number };
