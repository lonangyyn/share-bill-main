import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Mật khẩu mới không được trùng mật khẩu hiện tại",
    path: ["newPassword"],
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;