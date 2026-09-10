import type { Account, NotificationChannel } from '@prisma/client';
import type { SellerProfileResponseDto } from './seller-profile-response.dto';

export type UserResponseDto = Pick<
  Account,
  'id' | 'email' | 'role' | 'isActive' | 'createdAt' | 'updatedAt'
> & {
  notificationChannel: NotificationChannel | null;
  phoneNumber: string | null;
  sellerProfile: SellerProfileResponseDto | null;
};
