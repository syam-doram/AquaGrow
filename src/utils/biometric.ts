import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

export const checkBiometric = async (): Promise<boolean> => {
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (e) {
    console.error('Biometric checking failed', e);
    return false;
  }
};

export const setBiometric = async (id: string, password: string): Promise<boolean> => {
  try {
    const available = await checkBiometric();
    if (!available) return false;

    await NativeBiometric.setCredentials({
      username: id,
      password: password,
      server: 'aquagrow.app',
    });
    return true;
  } catch (e) {
    console.error('Biometric set failed', e);
    return false;
  }
};

export const getBiometric = async (id: string): Promise<string | null> => {
  try {
    const available = await checkBiometric();
    if (!available) return null;

    const credentials = await NativeBiometric.getCredentials({
      server: 'aquagrow.app',
    });
    
    if (credentials && credentials.username === id) {
      return credentials.password;
    }
    return null;
  } catch (e) {
    console.error('Biometric auth failed', e);
    return null;
  }
};

export const deleteBiometric = async (): Promise<boolean> => {
  try {
    await NativeBiometric.deleteCredentials({
      server: 'aquagrow.app',
    });
    return true;
  } catch (e) {
    console.error('Biometric deletion failed', e);
    return false;
  }
};
