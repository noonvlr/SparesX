export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  mobile: string;
  countryCode: string;
  address?: string;
  pinCode?: string;
  city: string;
  state: string;
  whatsappNumber?: string;
  profilePicture?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt?: string;
}
