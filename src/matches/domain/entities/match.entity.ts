export type MatchStatus = 'pending' | 'accepted' | 'rejected';

export class Match {
  constructor(
    public readonly id: string,
    public user1: string,
    public user2: string,
    public status: MatchStatus,
    public matchScore: number,
    public initiatedBy: string,
    public createdAt: Date,
    public updatedAt: Date,
    public chatId?: string,
  ) {}
}