export class MatchHelpers {
  static buildPagination(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  static getOtherUser(match: any, userId: string) {
    if (match.user1._id.toString() === userId) {
      return match.user2;
    }
    return match.user1;
  }

  static isUserOnline(lastSeenAt?: Date): boolean {
    if (!lastSeenAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeenAt) > fiveMinutesAgo;
  }
}