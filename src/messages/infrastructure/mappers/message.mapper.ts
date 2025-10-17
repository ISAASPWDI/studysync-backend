
import { Message as MessageDomain } from '../../domain/entities/message.entity';
import { MessageDocument } from '../schemas/message.schema';


export class MessageMapper {
  static toDomain(doc: MessageDocument): MessageDomain {
    return new MessageDomain(
      doc._id.toString(),
      doc.chatId.toString(),
      doc.senderId.toString(),
      doc.content,
      doc.type as any,
      doc.status as any,
      doc.createdAt,
      doc.updatedAt,
      doc.isEdited,
      doc.isDeleted,
      doc.replyTo?.toString(),
      doc.metadata,
    );
  }
}