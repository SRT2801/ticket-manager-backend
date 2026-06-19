import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum';

export interface AdminSeedConfig {
  email: string;
  password: string;
}

export async function seedAdmin(userRepository: any): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
  
  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed...');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = userRepository.create({
    email: adminEmail,
    password: hashedPassword,
    name: 'Administrator',
    role: UserRole.ADMIN,
  });

  await userRepository.save(admin);
  console.log(`Admin user created: ${adminEmail}`);
}
