export type MessageType = 'text' | 'image' | 'file' | 'location' | 'voice';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export class Message {
  constructor(
    public readonly id: string,
    public chatId: string,
    public senderId: string,
    public content: string,
    public type: MessageType,
    public status: MessageStatus,
    public createdAt: Date,
    public updatedAt: Date,
    public isEdited: boolean = false,
    public isDeleted: boolean = false,
    public replyTo?: string,
    public metadata?: Record<string, any>,
  ) {}
}