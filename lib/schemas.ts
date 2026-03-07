import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]{3,16}$/, 'Никнейм должен быть от 3 до 16 символов (только A-Z, 0-9, _)'),
  email: z.string().email('Некорректный email').max(255),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов').max(128),
  token: z.string().min(1, 'Captcha required'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Никнейм обязателен').max(255),
  password: z.string().min(1, 'Пароль обязателен').max(128),
  token: z.string().min(1, 'Captcha required'),
});

export const settingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  serverIp: z.string().regex(/^[a-zA-Z0-9.-]+$/, 'Invalid IP/Hostname').max(255).optional().nullable(),
  serverPort: z.coerce.number().int().min(1).max(65535).optional(),
  rconPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  rconPassword: z.string().max(255).optional().nullable(),
});
