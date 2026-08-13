import { Account, NotificationChannel } from '@prisma/client';

export type UserResponseDto = Pick<
  Account,
  'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'
> & {
  notificationChannel: NotificationChannel | null;
  phoneNumber: string | null;
};
