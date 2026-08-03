import { UserResponseDto } from '../../users/dto/user-response.dto';

export type AuthLoginResponseDto = {
  accessToken: string;
  user: UserResponseDto;
};
